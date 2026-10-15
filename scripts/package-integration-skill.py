#!/usr/bin/env python3
"""Bundle the integration skill with a snapshot of its canonical API reference."""

import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import zipfile


ROOT = Path(__file__).resolve().parents[1]
NAME = "sportshub-events-integration"
SKILL = ROOT / "docs/integrations/skills" / NAME / "SKILL.md"
REFERENCE = ROOT / "sportshub-blogs-docs/content/docs/integrations/partner-events.md"
BUNDLED_REFERENCE = SKILL.parent / "references/api.md"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / ".tmp" / f"{NAME}.zip")
    args = parser.parse_args()
    if args.output.suffix != ".zip":
        parser.error("--output must be a .zip file")

    skill = SKILL.read_bytes()
    reference = REFERENCE.read_bytes()
    header = reference.decode("utf-8").split("---", 2)[1]
    metadata = {}
    for field in ("contractVersion", "lastmod", "canonicalURL"):
        match = re.search(rf"^{field}:\s*([^\n]+)$", header, re.MULTILINE)
        if not match:
            raise ValueError(f"Canonical API reference is missing {field}")
        metadata[field] = match.group(1).strip().strip("\"'")
    updated = date.fromisoformat(metadata["lastmod"])
    files = {"SKILL.md": skill, "references/api.md": reference}
    manifest = {
        "name": NAME,
        "contractVersion": int(metadata["contractVersion"]),
        "referenceUpdated": updated.isoformat(),
        "referenceURL": metadata["canonicalURL"],
        "sha256": {name: hashlib.sha256(data).hexdigest() for name, data in files.items()},
    }
    files["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")

    BUNDLED_REFERENCE.parent.mkdir(parents=True, exist_ok=True)
    BUNDLED_REFERENCE.write_bytes(reference)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(".zip.tmp")
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in files.items():
                member = zipfile.ZipInfo(f"{NAME}/{name}", (updated.year, updated.month, updated.day, 0, 0, 0))
                member.compress_type = zipfile.ZIP_DEFLATED
                member.external_attr = 0o100644 << 16
                archive.writestr(member, data)
        temporary.replace(args.output)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Created {args.output} ({len(files)} files)")


if __name__ == "__main__":
    main()
