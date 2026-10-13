"""Publish visually verified corrected Word documents without losing originals.

The exported PDFs must have been rendered and reviewed before running this.
Checks the pre-edit backup and rejects unexpected changes to originals.
"""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile
import json
import shutil
import xml.etree.ElementTree as ET
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
NAMES = ["Petty Cash App - Database Schema", "Petty Cash Request System - Project Overview", "Configuration document"]
EXPECTED = {
    NAMES[0]: ["Currency (Simple)", "hr_othercategory", "hr_postingkey", "Everyone starts at zero"],
    NAMES[1]: ["hr_cashtransaction", "Cash Returned", "Cash posting is disabled", "Tenant work pending"],
    NAMES[2]: ["Historical Table Permissions", "Webapi/hr_departments/", "Petty Cash Accounts", "hr_postingkey"]
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def normalize(text):
    return "".join(character.lower() for character in text if character.isalnum())


def main():
    manifest = {"verification_date": "2026-10-12", "render_method": "User Office PDF export, bundled Poppler rasterization, all pages visually inspected", "documents": []}
    # Validate ALL targets before replacing any of them.
    for name in NAMES:
        original = ROOT / (name + ".docx")
        backup = ROOT / "documentation" / "backups" / "2026-10-12" / original.name
        corrected = ROOT / "documentation" / "corrected" / original.name
        pdf = corrected.with_suffix(".pdf")
        if digest(original) not in [digest(backup), digest(corrected)]:
            raise RuntimeError(f"Original changed since backup; preserve/reconcile edits first: {name}")
        if pdf.stat().st_mtime < corrected.stat().st_mtime:
            raise RuntimeError(f"PDF is older than corrected DOCX: {name}")
        with ZipFile(corrected) as archive:
            body = ET.fromstring(archive.read("word/document.xml"))
            text = " ".join(element.text or "" for element in body.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"))
            assert "word/comments.xml" in archive.namelist(), "Correction comments must be preserved"
        reader = PdfReader(pdf)
        pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        for expected in EXPECTED[name]:
            if normalize(expected) not in normalize(text) or normalize(expected) not in normalize(pdf_text):
                raise RuntimeError(f"A required correction is missing from the DOCX or exported PDF: {name}: {expected}")
        images = list((ROOT / "documentation" / "qa" / "manual-export" / name).glob("page-*.png"))
        if len(images) != len(reader.pages):
            raise RuntimeError(f"Rendered page count mismatch: {name}")
        manifest["documents"].append({"name": original.name, "pages_reviewed": len(reader.pages),
            "backup_sha256": digest(backup), "corrected_sha256": digest(corrected), "pdf_sha256": digest(pdf)})
    for name in NAMES:
        original = ROOT / (name + ".docx")
        corrected = ROOT / "documentation" / "corrected" / original.name
        if digest(original) != digest(corrected):
            shutil.copy2(corrected, original)
        assert digest(original) == digest(corrected)
        print("Finalized", original.name)
    # A generated QA manifest, not a hand-authored project file.
    manifest_path = ROOT / "documentation" / "qa" / "word-verification.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Verification manifest:", manifest_path)


if __name__ == "__main__":
    main()
