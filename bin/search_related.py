#!/usr/bin/env -S uv run -qs

# /// script
# dependencies = [
#   "numpy==2.4.4",
#   "sentence-transformers==5.3.0",
#   "qdrant-client>=1.9.0",
# ]
# ///

"""Search a qdrant embedding database populated by generate_related.py.

Encodes a query string with sentence-transformers and finds the most
semantically similar content chunks. By default, results are deduplicated by
page (showing the best-matching section per page). Use --per-section to see
individual chunk matches.
"""

import argparse
import contextlib
import hashlib
import io
import os
import sys

EMBEDDING_MODEL = "all-mpnet-base-v2"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Search markdown content by semantic similarity.",
    )
    parser.add_argument(
        "query",
        help="Search query text",
    )
    parser.add_argument(
        "-n", "--limit",
        type=int,
        default=10,
        help="Number of results to return (default: 10)",
    )
    parser.add_argument(
        "--content-dir",
        default=None,
        help="Content directory (used to derive the collection name; default: content/ in project root)",
    )
    parser.add_argument(
        "--cache-dir",
        default=None,
        help="Qdrant database directory",
    )
    parser.add_argument(
        "--per-section",
        action="store_true",
        help="Show individual chunk matches without deduplicating by page",
    )

    args = parser.parse_args()

    if args.content_dir is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        args.content_dir = os.path.join(project_dir, "content")
        if args.cache_dir is None:
            args.cache_dir = os.path.join(project_dir, ".cache", "qdrant")
    else:
        args.content_dir = os.path.abspath(args.content_dir)
        if args.cache_dir is None:
            args.cache_dir = os.path.join(args.content_dir, ".cache", "qdrant")

    if not os.path.isdir(args.cache_dir):
        print(
            f"Error: qdrant database not found at {args.cache_dir}\n"
            "Run generate_related.py first to populate it.",
            file=sys.stderr,
        )
        sys.exit(1)

    return args


def collection_name_for(content_dir):
    """Derive a stable qdrant collection name from the content directory."""
    digest = hashlib.sha256(os.path.abspath(content_dir).encode()).hexdigest()[:12]
    return f"content_{digest}"


def main():
    args = parse_args()

    with (
        contextlib.redirect_stdout(io.StringIO()),
        contextlib.redirect_stderr(io.StringIO()),
    ):
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(EMBEDDING_MODEL)

    query_vector = model.encode(args.query).tolist()

    from qdrant_client import QdrantClient
    from qdrant_client.models import FieldCondition, Filter, MatchValue

    client = QdrantClient(path=args.cache_dir)
    collection = collection_name_for(args.content_dir)

    existing = {c.name for c in client.get_collections().collections}
    if collection not in existing:
        print(
            f"Error: collection not found for {args.content_dir}\n"
            "Run generate_related.py first to populate it.",
            file=sys.stderr,
        )
        client.close()
        sys.exit(1)

    # Overfetch to account for dedup and sentinel filtering
    fetch_limit = args.limit * 5 if not args.per_section else args.limit + 10

    results = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=fetch_limit,
        with_payload=True,
        query_filter=Filter(
            must_not=[FieldCondition(key="sentinel", match=MatchValue(value=True))]
        ),
    )

    if args.per_section:
        entries = []
        for pt in results.points[:args.limit]:
            entries.append({
                "path": pt.payload["content_path"],
                "section": pt.payload.get("section_title", ""),
                "score": round(pt.score * 100),
            })
    else:
        seen = {}
        for pt in results.points:
            path = pt.payload["content_path"]
            score = round(pt.score * 100)
            section = pt.payload.get("section_title", "")
            if path not in seen or score > seen[path]["score"]:
                seen[path] = {"path": path, "section": section, "score": score}
            if len(seen) >= args.limit:
                break
        entries = sorted(seen.values(), key=lambda x: x["score"], reverse=True)

    if not entries:
        print("No results found.")
        client.close()
        return

    max_section = max(len(e["section"]) for e in entries) if entries else 7
    max_section = max(max_section, 7)
    max_path = max(len(e["path"]) for e in entries) if entries else 4
    max_path = max(max_path, 4)

    header = f"{'Score':>5}  {'Section':<{max_section}}  {'Path':<{max_path}}"
    sep = f"{'─' * 5}  {'─' * max_section}  {'─' * max_path}"
    print(header)
    print(sep)
    for e in entries:
        section = e["section"] if e["section"] else "(intro)"
        print(f"{e['score']:>5}  {section:<{max_section}}  {e['path']:<{max_path}}")

    client.close()


if __name__ == "__main__":
    main()
