#!/usr/bin/env -S uv run -qs

# /// script
# dependencies = [
#   "scikit-learn",
#   "pyyaml",
# ]
# ///

"""Generate related content data for Hugo based on TF-IDF content similarity."""

import json
import os
import re
import sys

import yaml
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CONTENT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "content")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "related.json")

SECTIONS = ["blog", "notes", "projects"]
# Sections whose pages should display related content (as opposed to just being
# linkable targets)
DISPLAY_SECTIONS = {"blog", "notes"}
SIMILARITY_CUTOFF = 0.1
MIN_RELATED = 3
MAX_RELATED = 5
TAG_BONUS_PER_TAG = 0.05
TAG_BONUS_CAP = 0.15


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


def clean_body(text):
    """Strip code blocks and markdown syntax to get plain-ish text."""
    # Remove fenced code blocks
    text = re.sub(r"```[\s\S]*?```", " ", text)
    # Remove inline code
    text = re.sub(r"`[^`]+`", " ", text)
    # Remove markdown images
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    # Convert markdown links to just their text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Remove Hugo shortcodes
    text = re.sub(r"{{[<%].*?[%>]}}", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_section_index(filepath, section_dir):
    """Check if a file is a section-level _index.md (should be skipped)."""
    return filepath == os.path.join(section_dir, "_index.md")


def content_path_for_hugo(filepath):
    """Compute the content path that Hugo uses for .File.Path.

    For _index.md in bundles, Hugo uses the directory path.
    For regular .md files, Hugo uses the file path.
    Both are relative to the content directory.
    """
    rel = os.path.relpath(filepath, CONTENT_DIR)
    return rel


def collect_pages():
    """Walk content directories and collect page data."""
    pages = []

    for section in SECTIONS:
        section_dir = os.path.join(CONTENT_DIR, section)
        if not os.path.isdir(section_dir):
            continue

        for root, _dirs, files in os.walk(section_dir):
            for fname in files:
                if not fname.endswith(".md"):
                    continue

                filepath = os.path.join(root, fname)

                if is_section_index(filepath, section_dir):
                    continue

                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()

                fm, body = parse_frontmatter(text)

                # Skip drafts and non-public pages
                if fm.get("draft", False):
                    continue
                if fm.get("public") is False:
                    continue

                title = fm.get("title", "")
                tags = fm.get("tags", []) or []
                content_path = content_path_for_hugo(filepath)

                # Build document text with title weighting
                cleaned = clean_body(body)
                doc_text = f"{title} {title} {title} {cleaned}"

                # Determine if this is a leaf page (content that should
                # display related links) vs a branch/index page. Only leaf
                # pages in display sections get related content shown.
                is_leaf = fname != "_index.md"
                shows_related = section in DISPLAY_SECTIONS and is_leaf

                pages.append({
                    "content_path": content_path,
                    "title": title,
                    "tags": [t.lower() for t in tags],
                    "doc_text": doc_text,
                    "shows_related": shows_related,
                })

    return pages


def compute_related(pages):
    """Compute TF-IDF similarity and select related pages."""
    if len(pages) < 2:
        return {}

    corpus = [p["doc_text"] for p in pages]

    vectorizer = TfidfVectorizer(
        max_df=0.7,
        min_df=2,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True,
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    sim_matrix = cosine_similarity(tfidf_matrix)

    related = {}

    for i, page in enumerate(pages):
        # Only generate related entries for pages that should display them
        if not page["shows_related"]:
            continue

        scores = []
        for j, other in enumerate(pages):
            if i == j:
                continue

            score = float(sim_matrix[i][j])

            # Tag overlap bonus
            shared_tags = set(page["tags"]) & set(other["tags"])
            if shared_tags:
                bonus = min(len(shared_tags) * TAG_BONUS_PER_TAG, TAG_BONUS_CAP)
                score += bonus

            scores.append((score, other["content_path"]))

        scores.sort(reverse=True)

        # Always take top 3, then include 4th/5th if above cutoff
        selected = []
        for rank, (score, path) in enumerate(scores):
            if rank < MIN_RELATED:
                selected.append(path)
            elif rank < MAX_RELATED and score >= SIMILARITY_CUTOFF:
                selected.append(path)
            else:
                break

        related[page["content_path"]] = selected

    return related


def main():
    pages = collect_pages()
    print(f"Collected {len(pages)} pages from {', '.join(SECTIONS)}")

    related = compute_related(pages)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(related, f, indent=2, sort_keys=True)

    # Stats
    counts = [len(v) for v in related.values()]
    with_3_plus = sum(1 for c in counts if c >= 3)
    print(f"Wrote {len(related)} entries to {os.path.relpath(OUTPUT_PATH)}")
    print(f"Pages with 3+ related: {with_3_plus}/{len(related)}")
    print(f"Pages with 4+ related: {sum(1 for c in counts if c >= 4)}/{len(related)}")
    print(f"Pages with 5 related: {sum(1 for c in counts if c >= 5)}/{len(related)}")


if __name__ == "__main__":
    main()
