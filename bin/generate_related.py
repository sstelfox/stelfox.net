#!/usr/bin/env -S uv run -qs

# /// script
# dependencies = [
#   "numpy==2.4.4",
#   "pyyaml==6.0.3",
#   "sentence-transformers==5.3.0",
# ]
# ///

"""Generate related content data for Hugo based on semantic similarity.

Uses sentence-transformers to compute embeddings for all content pages, then
cosine similarity to find related pages. Embeddings are cached locally to avoid
recomputation on subsequent runs when content hasn't changed.

All non-draft, public content pages are included in the similarity corpus. The
output maps every page's content path to its most similar neighbors. Which pages
actually display related content is controlled by the Hugo templates, not this
script.
"""

import hashlib
import json
import os
import re

import numpy as np
import yaml

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONTENT_DIR = os.path.join(PROJECT_DIR, "content")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "data", "related.json")
CACHE_DIR = os.path.join(PROJECT_DIR, ".cache", "embeddings")

EMBEDDING_MODEL = "all-mpnet-base-v2"
SIMILARITY_CUTOFF = 0.35
MAX_RELATED = 3

# Files that should never be included in the corpus (no meaningful content)
EXCLUDED_FILENAMES = {"search.md", "design_reference.md"}


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


def collect_pages():
    """Walk all content and collect every publishable page."""
    pages = []

    for root, _dirs, files in os.walk(CONTENT_DIR):
        for fname in files:
            if not fname.endswith(".md"):
                continue
            if fname in EXCLUDED_FILENAMES:
                continue

            filepath = os.path.join(root, fname)

            # Skip section-level _index.md (list pages, not content).
            # Bundle _index.md files deeper in the tree are real content.
            if fname == "_index.md":
                depth = os.path.relpath(root, CONTENT_DIR).count(os.sep)
                if depth <= 0:
                    continue

            with open(filepath, "r", encoding="utf-8") as f:
                raw = f.read()

            fm, body = parse_frontmatter(raw)

            if fm.get("draft", False):
                continue
            if fm.get("public") is False:
                continue

            title = fm.get("title", "")
            content_path = os.path.relpath(filepath, CONTENT_DIR)
            prose = extract_prose(body)
            embed_text = f"{title}. {prose}" if prose else title

            pages.append({
                "content_path": content_path,
                "embed_text": embed_text,
                "hash": content_hash(raw),
            })

    return pages


def load_cached_embeddings():
    """Load cached embeddings if available."""
    cache_file = os.path.join(CACHE_DIR, "embeddings.npz")
    meta_file = os.path.join(CACHE_DIR, "meta.json")

    if not os.path.exists(cache_file) or not os.path.exists(meta_file):
        return None, None

    with open(meta_file, "r") as f:
        meta = json.load(f)

    data = np.load(cache_file)
    return meta, data["embeddings"]


def save_cached_embeddings(meta, embeddings):
    """Save embeddings to cache."""
    os.makedirs(CACHE_DIR, exist_ok=True)

    np.savez_compressed(os.path.join(CACHE_DIR, "embeddings.npz"), embeddings=embeddings)
    with open(os.path.join(CACHE_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)


def compute_embeddings(pages):
    """Compute embeddings, using cache where possible."""
    cached_meta, cached_embeddings = load_cached_embeddings()

    cached_lookup = {}
    if cached_meta and cached_embeddings is not None:
        if cached_meta.get("model") == EMBEDDING_MODEL:
            for i, entry in enumerate(cached_meta.get("pages", [])):
                key = (entry["content_path"], entry["hash"])
                cached_lookup[key] = cached_embeddings[i]

    to_embed = []
    to_embed_indices = []
    embeddings = [None] * len(pages)

    for i, page in enumerate(pages):
        key = (page["content_path"], page["hash"])
        if key in cached_lookup:
            embeddings[i] = cached_lookup[key]
        else:
            to_embed.append(page["embed_text"])
            to_embed_indices.append(i)

    cache_hits = len(pages) - len(to_embed)
    print(f"Embedding cache: {cache_hits} hits, {len(to_embed)} to compute")

    if to_embed:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(EMBEDDING_MODEL)
        new_embeddings = model.encode(to_embed, show_progress_bar=len(to_embed) > 20)

        for idx, emb in zip(to_embed_indices, new_embeddings):
            embeddings[idx] = emb

    embeddings = np.array(embeddings)

    meta = {
        "model": EMBEDDING_MODEL,
        "pages": [{"content_path": p["content_path"], "hash": p["hash"]} for p in pages],
    }
    save_cached_embeddings(meta, embeddings)

    return embeddings


def compute_related(pages, embeddings):
    """Compute cosine similarity and select related pages for every page."""
    from sklearn.metrics.pairwise import cosine_similarity

    sim_matrix = cosine_similarity(embeddings)
    related = {}

    for i, page in enumerate(pages):
        scores = []
        for j in range(len(pages)):
            if i == j:
                continue
            scores.append((float(sim_matrix[i][j]), pages[j]["content_path"]))

        scores.sort(reverse=True)

        selected = []
        for score, path in scores[:MAX_RELATED]:
            if score >= SIMILARITY_CUTOFF:
                selected.append({"path": path, "score": round(score * 100)})

        if selected:
            related[page["content_path"]] = selected

    return related


def main():
    pages = collect_pages()
    print(f"Collected {len(pages)} pages")

    embeddings = compute_embeddings(pages)
    related = compute_related(pages, embeddings)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(related, f, indent=2, sort_keys=True)

    counts = [len(v) for v in related.values()]
    print(f"Wrote {len(related)} entries to {os.path.relpath(OUTPUT_PATH)}")
    print(f"  1+ related: {sum(1 for c in counts if c >= 1)}")
    print(f"  2+ related: {sum(1 for c in counts if c >= 2)}")
    print(f"  3  related: {sum(1 for c in counts if c >= 3)}")


if __name__ == "__main__":
    main()
