#!/usr/bin/env -S uv run -qs

# /// script
# dependencies = [
#   "numpy==2.4.4",
#   "pyyaml==6.0.3",
#   "sentence-transformers==5.3.0",
#   "qdrant-client>=1.9.0",
# ]
# ///

"""Generate related content data based on semantic similarity.

Chunks markdown documents by section, computes embeddings with
sentence-transformers, and stores them in an embedded qdrant vector database.
Generates a related.json mapping each page to its most similar neighbors,
deduplicating across chunks so each page appears at most once.

When run without arguments from within the Hugo site, it behaves as the build
pipeline expects: scanning content/, writing to data/related.json, and
filtering by Hugo frontmatter conventions (draft, public). When pointed at an
arbitrary markdown directory (e.g. an Obsidian vault), output and cache default
to paths inside that directory.
"""

import argparse
import contextlib
import hashlib
import io
import json
import os
import re
import sys
import uuid

import numpy as np
import yaml

EMBEDDING_MODEL = "all-mpnet-base-v2"
EMBEDDING_DIM = 768
DEFAULT_SIMILARITY_CUTOFF = 0.40
DEFAULT_MAX_RELATED = 3
MIN_CHUNK_CHARS = 20


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate related content data based on semantic similarity.",
    )
    parser.add_argument(
        "content_dir",
        nargs="?",
        default=None,
        help="Directory of markdown files to process (default: content/ in project root)",
    )
    parser.add_argument(
        "-o", "--output",
        default=None,
        help="Output JSON path",
    )
    parser.add_argument(
        "--cache-dir",
        default=None,
        help="Qdrant database directory",
    )
    parser.add_argument(
        "--no-frontmatter-filter",
        action="store_true",
        help="Skip Hugo-style draft/public filtering",
    )
    parser.add_argument(
        "--similarity-cutoff",
        type=float,
        default=DEFAULT_SIMILARITY_CUTOFF,
        help=f"Minimum similarity score 0.0-1.0 (default: {DEFAULT_SIMILARITY_CUTOFF})",
    )
    parser.add_argument(
        "--max-related",
        type=int,
        default=DEFAULT_MAX_RELATED,
        help=f"Maximum related entries per page (default: {DEFAULT_MAX_RELATED})",
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Force full re-embedding (drops and recreates the collection)",
    )

    args = parser.parse_args()

    if args.content_dir is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        args.content_dir = os.path.join(project_dir, "content")
        if args.output is None:
            args.output = os.path.join(project_dir, "data", "related.json")
        if args.cache_dir is None:
            args.cache_dir = os.path.join(project_dir, ".cache", "qdrant")
    else:
        args.content_dir = os.path.abspath(args.content_dir)
        if args.output is None:
            args.output = os.path.join(args.content_dir, "related.json")
        if args.cache_dir is None:
            args.cache_dir = os.path.join(args.content_dir, ".cache", "qdrant")

    if not os.path.isdir(args.content_dir):
        print(f"Error: content directory does not exist: {args.content_dir}", file=sys.stderr)
        sys.exit(1)

    return args


def parse_frontmatter(text):
    """Extract YAML frontmatter and body from markdown text."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
    if not match:
        return {}, text
    try:
        fm = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, match.group(2)


def extract_prose(text):
    """Extract meaningful prose from markdown, stripping code and syntax."""
    text = re.sub(r"```[^\n]*\n[\s\S]*?```", " ", text)
    text = re.sub(r"(?m)^(?:    |\t).+$", " ", text)
    text = re.sub(r"`[^`]+`", " ", text)
    text = re.sub(r"\{\{[<%].*?[%>]\}\}", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"(?<!\w)/[\w./-]+", " ", text)
    text = re.sub(r"\b[0-9a-f]{8,}\b", " ", text)
    text = re.sub(r"(?m)^#+\s*", "", text)
    text = re.sub(r"\*{1,3}|_{1,3}", "", text)
    text = re.sub(r"(?m)^>\s*", "", text)
    text = re.sub(r"(?m)^[\s]*[-*+]\s+", "", text)
    text = re.sub(r"(?m)^[\s]*\d+\.\s+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def content_hash(text):
    """Compute a hash of content for cache invalidation."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def chunk_by_sections(body_text):
    """Split markdown body into sections on h1/h2 boundaries.

    Respects fenced code block boundaries so headers inside code blocks are
    not treated as section breaks. h3+ content stays within its parent section.
    """
    sections = []
    current_title = ""
    current_lines = []
    in_fence = False

    for line in body_text.splitlines():
        stripped = line.strip()

        if stripped.startswith("```"):
            in_fence = not in_fence
            current_lines.append(line)
            continue

        if not in_fence and re.match(r"^#{1,2}\s+", stripped):
            if current_lines or sections:
                sections.append({
                    "section_title": current_title,
                    "section_index": len(sections),
                    "text": "\n".join(current_lines),
                })
            current_title = re.sub(r"^#{1,2}\s+", "", stripped)
            current_lines = []
        else:
            current_lines.append(line)

    sections.append({
        "section_title": current_title,
        "section_index": len(sections),
        "text": "\n".join(current_lines),
    })

    return sections


def collect_pages(content_dir, filter_frontmatter=True):
    """Walk content_dir and collect every publishable page with raw content."""
    pages = []

    for root, _dirs, files in os.walk(content_dir):
        for fname in files:
            if not fname.endswith(".md"):
                continue

            filepath = os.path.join(root, fname)

            if filter_frontmatter and fname == "_index.md":
                depth = os.path.relpath(root, content_dir).count(os.sep)
                if depth <= 0:
                    continue

            with open(filepath, "r", encoding="utf-8") as f:
                raw = f.read()

            fm, body = parse_frontmatter(raw)

            if filter_frontmatter:
                if fm.get("draft", False):
                    continue
                if fm.get("public") is False:
                    continue
                if fm.get("searchable") is False:
                    continue

            content_path = os.path.relpath(filepath, content_dir)
            tags = fm.get("tags", [])
            if not isinstance(tags, list):
                tags = []

            pages.append({
                "content_path": content_path,
                "doc_title": fm.get("title", ""),
                "tags": tags,
                "body": body,
                "hash": content_hash(raw),
            })

    return pages


def collection_name_for(content_dir):
    """Derive a stable qdrant collection name from the content directory."""
    digest = hashlib.sha256(os.path.abspath(content_dir).encode()).hexdigest()[:12]
    return f"content_{digest}"


def init_qdrant(cache_dir, collection_name, rebuild=False):
    """Initialize qdrant client and ensure the collection exists."""
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams

    os.makedirs(cache_dir, exist_ok=True)
    client = QdrantClient(path=cache_dir)

    existing = {c.name for c in client.get_collections().collections}

    if rebuild and collection_name in existing:
        client.delete_collection(collection_name)
        existing.discard(collection_name)

    if collection_name not in existing:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )

    return client


def point_id_for(content_path, section_index):
    """Generate a deterministic UUID for a chunk."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{content_path}::{section_index}"))


def sync_embeddings(pages, client, collection_name):
    """Sync page chunks into qdrant, skipping unchanged files.

    Returns the total number of chunks in the collection after sync.
    """
    from qdrant_client.models import FieldCondition, Filter, MatchValue

    current_paths = {p["content_path"] for p in pages}

    cached_hashes = {}
    offset = None
    while True:
        results = client.scroll(
            collection_name=collection_name,
            scroll_filter=None,
            limit=500,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        points, next_offset = results
        for pt in points:
            path = pt.payload.get("content_path", "")
            h = pt.payload.get("content_hash", "")
            if path not in cached_hashes:
                cached_hashes[path] = h
        if next_offset is None:
            break
        offset = next_offset

    stale_paths = set(cached_hashes.keys()) - current_paths
    for path in stale_paths:
        client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[FieldCondition(key="content_path", match=MatchValue(value=path))]
            ),
        )

    to_embed_pages = []
    cache_hits = 0
    for page in pages:
        if cached_hashes.get(page["content_path"]) == page["hash"]:
            cache_hits += 1
        else:
            to_embed_pages.append(page)

    print(f"Embedding cache: {cache_hits} hits, {len(to_embed_pages)} pages to process")

    if not to_embed_pages:
        total = sum(
            1 for pt in _scroll_all(client, collection_name)
            if not pt.payload.get("sentinel")
        )
        return total

    with (
        contextlib.redirect_stdout(io.StringIO()),
        contextlib.redirect_stderr(io.StringIO()),
    ):
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(EMBEDDING_MODEL)

    for page in to_embed_pages:
        client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[FieldCondition(
                    key="content_path",
                    match=MatchValue(value=page["content_path"]),
                )]
            ),
        )

        sections = chunk_by_sections(page["body"])
        texts = []
        valid_sections = []

        for sec in sections:
            prose = extract_prose(sec["text"])
            if len(prose) < MIN_CHUNK_CHARS:
                continue

            title = page["doc_title"]
            if sec["section_title"]:
                embed_text = f"{title} - {sec['section_title']}. {prose}"
            else:
                embed_text = f"{title}. {prose}" if prose else title

            texts.append(embed_text)
            valid_sections.append(sec)

        from qdrant_client.models import PointStruct

        if not texts:
            # Store a sentinel so we remember this page has no embeddable content
            sentinel_id = point_id_for(page["content_path"], -1)
            client.upsert(collection_name=collection_name, points=[PointStruct(
                id=sentinel_id,
                vector=[0.0] * EMBEDDING_DIM,
                payload={
                    "content_path": page["content_path"],
                    "section_title": "",
                    "section_index": -1,
                    "content_hash": page["hash"],
                    "doc_title": page["doc_title"],
                    "tags": page["tags"],
                    "sentinel": True,
                },
            )])
            continue

        embeddings = model.encode(texts, show_progress_bar=False)

        points = []
        for sec, emb in zip(valid_sections, embeddings):
            pid = point_id_for(page["content_path"], sec["section_index"])
            points.append(PointStruct(
                id=pid,
                vector=emb.tolist(),
                payload={
                    "content_path": page["content_path"],
                    "section_title": sec["section_title"],
                    "section_index": sec["section_index"],
                    "content_hash": page["hash"],
                    "doc_title": page["doc_title"],
                    "tags": page["tags"],
                },
            ))

        client.upsert(collection_name=collection_name, points=points)

    total = sum(
        1 for pt in _scroll_all(client, collection_name)
        if not pt.payload.get("sentinel")
    )
    return total


def _scroll_all(client, collection_name, with_vectors=False):
    """Yield all points from a qdrant collection."""
    offset = None
    while True:
        points, next_offset = client.scroll(
            collection_name=collection_name,
            limit=500,
            offset=offset,
            with_payload=True,
            with_vectors=with_vectors,
        )
        yield from points
        if next_offset is None:
            break
        offset = next_offset


def compute_related(client, collection_name, similarity_cutoff, max_related):
    """Compute related pages from chunk-level embeddings with page dedup."""
    all_points = [
        pt for pt in _scroll_all(client, collection_name, with_vectors=True)
        if not pt.payload.get("sentinel")
    ]

    if not all_points:
        return {}

    vectors = np.array([pt.vector for pt in all_points])
    paths = [pt.payload["content_path"] for pt in all_points]

    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    normalized = vectors / norms
    sim_matrix = normalized @ normalized.T

    page_chunks = {}
    for i, path in enumerate(paths):
        page_chunks.setdefault(path, []).append(i)

    unique_paths = list(page_chunks.keys())

    related = {}
    for src_path in unique_paths:
        src_indices = page_chunks[src_path]
        best_scores = {}

        for tgt_path in unique_paths:
            if tgt_path == src_path:
                continue

            tgt_indices = page_chunks[tgt_path]
            max_score = float(sim_matrix[np.ix_(src_indices, tgt_indices)].max())

            if max_score >= similarity_cutoff:
                best_scores[tgt_path] = max_score

        sorted_targets = sorted(best_scores.items(), key=lambda x: x[1], reverse=True)
        selected = [
            {"path": path, "score": round(score * 100)}
            for path, score in sorted_targets[:max_related]
        ]

        if selected:
            related[src_path] = selected

    return related


def main():
    args = parse_args()

    pages = collect_pages(args.content_dir,
                          filter_frontmatter=not args.no_frontmatter_filter)
    print(f"Collected {len(pages)} pages")

    collection = collection_name_for(args.content_dir)
    client = init_qdrant(args.cache_dir, collection, rebuild=args.rebuild)

    total_chunks = sync_embeddings(pages, client, collection)
    print(f"Qdrant collection: {total_chunks} chunks across {len(pages)} pages")

    related = compute_related(client, collection,
                              similarity_cutoff=args.similarity_cutoff,
                              max_related=args.max_related)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(related, f, indent=2, sort_keys=True)

    counts = [len(v) for v in related.values()]
    print(f"Wrote {len(related)} entries to {args.output}")
    print(f"  1+ related: {sum(1 for c in counts if c >= 1)}")
    print(f"  2+ related: {sum(1 for c in counts if c >= 2)}")
    print(f"  3  related: {sum(1 for c in counts if c >= 3)}")

    client.close()


if __name__ == "__main__":
    main()
