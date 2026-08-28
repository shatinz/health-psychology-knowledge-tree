#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Universal PDF Knowledge Tree Ingestion CLI (OmniTree Ingest)
Converts any PDF book or document into an OmniTree-compliant Knowledge Tree JSON.

Usage:
    python ingest_pdf.py "C:\\path\\to\\document.pdf" --title "عنوان کتاب" --author "نویسنده"
"""

import sys
import os
import re
import json
import argparse

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF is required. Please install it with: pip install pymupdf")
    sys.exit(1)

def extract_pdf_structure(pdf_path, title=None, author=None, doc_id=None, color="#f59e0b"):
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return None

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"Opened PDF: {pdf_path} ({total_pages} pages)")

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    final_id = doc_id or f"doc_{re.sub(r'[^a-zA-Z0-9_]', '_', base_name.lower())}"
    final_title = title or base_name
    final_author = author or "نویسنده ناشناس"

    # Chapter patterns in Persian / English
    chapter_pattern = re.compile(r'^(فصل\s+[اولدومسه‌چهارمپنجششمهفتمهشتمنهمدهمیازدهمدوازدهمسیزدهمچهاردهم۱-۹\d]+|chapter\s+\d+|part\s+\d+)', re.IGNORECASE)

    chapters = []
    current_chapter = None
    current_section = None

    for page_idx in range(total_pages):
        text = doc[page_idx].get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        for line in lines:
            # Check for chapter header
            if chapter_pattern.search(line) and len(line) < 80:
                if current_section and current_chapter:
                    current_chapter["children"].append(current_section)
                    current_section = None
                if current_chapter:
                    chapters.append(current_chapter)

                ch_id = f"{final_id}_ch{len(chapters) + 1}"
                current_chapter = {
                    "id": ch_id,
                    "title": line.replace(":", "").strip(),
                    "type": "chapter",
                    "summary": f"مباحث و مفاهیم {line}",
                    "children": []
                }
                continue

            # Check for section header (numbers or bullet prefixes)
            sec_match = re.match(r'^(\d+[\.\-]|[\u2713\u25cf\u25aa\u2022]\s*|\:\s*)([^\n]+)', line)
            if sec_match and len(line) < 100:
                if current_chapter is None:
                    ch_id = f"{final_id}_ch1"
                    current_chapter = {
                        "id": ch_id,
                        "title": "فصل اول: مبانی و کلیات",
                        "type": "chapter",
                        "summary": "مباحث آغازین سند",
                        "children": []
                    }

                if current_section:
                    current_chapter["children"].append(current_section)

                sec_title = line.strip(" :.-✓•▪")
                current_section = {
                    "id": f"{current_chapter['id']}_sec{len(current_chapter['children']) + 1}",
                    "title": sec_title if len(sec_title) > 3 else f"بخش {len(current_chapter['children']) + 1}",
                    "type": "section",
                    "summary": sec_title,
                    "full_text": "",
                    "children": []
                }
            else:
                # Content line
                if current_section:
                    current_section["full_text"] += line + " "
                elif current_chapter:
                    if not current_chapter.get("full_text"):
                        current_chapter["full_text"] = ""
                    current_chapter["full_text"] += line + " "

    # Clean up last section and chapter
    if current_section and current_chapter:
        current_chapter["children"].append(current_section)
    if current_chapter:
        chapters.append(current_chapter)

    # Fallback if no chapters detected
    if not chapters:
        chapters.append({
            "id": f"{final_id}_ch1",
            "title": "فصل اول: محتوای جامع سند",
            "type": "chapter",
            "summary": "ساختار استخراج‌شده از سند",
            "full_text": "محتوای استخراج‌شده از فایل PDF",
            "children": []
        })

    doc_data = {
        "id": final_id,
        "title": final_title,
        "author": final_author,
        "metadata": {
            "pages": total_pages,
            "language": "fa",
            "category": "سند تخصصی",
            "description": f"استخراج خودکار از فایل {os.path.basename(pdf_path)}",
            "color": color,
            "badge": "سند افزوده‌شده"
        },
        "tree": {
            "id": f"{final_id}_root",
            "title": final_title,
            "type": "root",
            "summary": f"درخت دانش استخراج‌شده از {final_title}",
            "children": chapters
        },
        "cross_links": [],
        "contrasts": []
    }

    return doc_data

def main():
    parser = argparse.ArgumentParser(description="OmniTree PDF Ingestion Tool")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--title", help="Document Title", default=None)
    parser.add_argument("--author", help="Author name", default=None)
    parser.add_argument("--out", help="Output JSON path", default=None)
    parser.add_argument("--color", help="HEX Accent Color", default="#f59e0b")

    args = parser.parse_args()

    doc_data = extract_pdf_structure(args.pdf_path, title=args.title, author=args.author, color=args.color)
    if not doc_data:
        sys.exit(1)

    out_path = args.out or f"{doc_data['id']}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated OmniTree JSON: {out_path}")
    print(f"Total chapters: {len(doc_data['tree']['children'])}")

if __name__ == "__main__":
    main()
