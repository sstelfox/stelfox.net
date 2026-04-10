#!/usr/bin/env python3
"""Verify every tag used in content has metadata defined in data/tags.yaml."""

import subprocess
import sys
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def get_defined_tags():
    """Load tags defined in data/tags.yaml."""
    with open(ROOT / "data" / "tags.yaml") as f:
        data = yaml.safe_load(f)

    tags = data.get("tags", {})
    categories = set(data.get("categories", []))

    errors = []
    for name, meta in tags.items():
        cat = meta.get("category")
        if cat not in categories:
            errors.append(f"  tag '{name}' references unknown category '{cat}'")
        if not meta.get("description"):
            errors.append(f"  tag '{name}' is missing a description")

    return set(tags.keys()), categories, errors


def get_content_tags():
    """Extract all tags actually used in content by building the site."""
    result = subprocess.run(
        ["hugo", "list", "all"],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )

    if result.returncode != 0:
        print(f"Failed to run hugo list all: {result.stderr}", file=sys.stderr)
        sys.exit(2)

    # Hugo's tag output comes from the built site. Instead, read the public/tags
    # directory which has one subdirectory per tag after a build.
    tags_dir = ROOT / "public" / "tags"
    if not tags_dir.exists():
        # Fall back to building
        subprocess.run(["hugo", "--quiet"], cwd=ROOT, check=True)

    if not tags_dir.exists():
        print("Could not find public/tags/ after build", file=sys.stderr)
        sys.exit(2)

    return {
        p.name
        for p in tags_dir.iterdir()
        if p.is_dir()
    }


def main():
    defined, categories, validation_errors = get_defined_tags()
    content = get_content_tags()

    missing_metadata = sorted(content - defined)
    stale_metadata = sorted(defined - content)

    ok = True

    if validation_errors:
        ok = False
        print("Tag metadata validation errors:")
        for e in validation_errors:
            print(e)

    if missing_metadata:
        ok = False
        print("Tags used in content but missing from data/tags.yaml:")
        for tag in missing_metadata:
            print(f"  {tag}")

    if stale_metadata:
        # Warning only, not a failure
        print("Tags defined in data/tags.yaml but not used in any content:")
        for tag in stale_metadata:
            print(f"  {tag}")

    if not ok:
        sys.exit(1)

    print(f"All {len(content)} content tags have metadata defined.")


if __name__ == "__main__":
    main()
