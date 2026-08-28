import fitz
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def reconstruct_page_text(raw_text):
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    if lines and re.match(r'^\d+$', lines[0]):
        lines = lines[1:]
    
    blocks = []
    current_block = []
    is_bullet = False
    
    for l in lines:
        if l in ['✓', '', '✔', '•']:
            if current_block:
                blocks.append({'text': ' '.join(current_block), 'is_bullet': is_bullet})
                current_block = []
            is_bullet = True
            continue
            
        if re.match(r'^(فصل\s+[^\n]+|:\s*فصل|:\s*[^\n]+|[1-9\u06F1-\u06F9]+[\.\:\-]|[الف-ی]\))', l):
            if current_block:
                blocks.append({'text': ' '.join(current_block), 'is_bullet': is_bullet})
                current_block = []
            is_bullet = False
            current_block.append(l)
        else:
            current_block.append(l)
            
    if current_block:
        blocks.append({'text': ' '.join(current_block), 'is_bullet': is_bullet})
        
    for b in blocks:
        t = b['text']
        t = re.sub(r'\s+([،\.\:\؛\؟\)])', r'\1', t)
        t = re.sub(r'(\()\s+', r'\1', t)
        t = re.sub(r'\s+', ' ', t)
        t = re.sub(r'می\s*\.\s*شود', 'می‌شود', t)
        t = re.sub(r'می\s*\.\s*دهد', 'می‌دهد', t)
        t = re.sub(r'می\s*\.\s*گیرد', 'می‌گیرد', t)
        t = re.sub(r'می\s*\.\s*کنند', 'می‌کنند', t)
        t = re.sub(r'می\s*\.\s*یافت', 'می‌یافت', t)
        t = re.sub(r'می\s*\.\s*باشد', 'می‌باشد', t)
        t = re.sub(r'می\s*\.\s*داند', 'می‌داند', t)
        t = re.sub(r'می\s*\.\s*پردازد', 'می‌پردازد', t)
        t = re.sub(r'می\s*\.\s*توان', 'می‌توان', t)
        t = re.sub(r'می\s*\.\s*گردد', 'می‌گردد', t)
        t = re.sub(r'می\s*\.\s*دانند', 'می‌دانند', t)
        t = re.sub(r'می\s*\.\s*نامند', 'می‌نامند', t)
        t = re.sub(r'می\s*\.\s*نامد', 'می‌نامد', t)
        t = re.sub(r'می\s*\.\s*آورد', 'می‌آورد', t)
        t = re.sub(r'می\s*\.\s*آموزد', 'می‌آموزد', t)
        t = re.sub(r'می\s*\.\s*آید', 'می‌آید', t)
        t = re.sub(r'می\s*\.\s*ماند', 'می‌ماند', t)
        t = re.sub(r'می\s*\.\s*نماید', 'می‌نماید', t)
        t = re.sub(r'می\s*\.\s*خواند', 'می‌خواند', t)
        t = re.sub(r'می\s*\.\s*نویسد', 'می‌نویسد', t)
        t = re.sub(r'بی\s*\.\s*اشتهایی', 'بی‌اشتهایی', t)
        t = re.sub(r'بی\s*\.\s*اختیاری', 'بی‌اختیاری', t)
        t = re.sub(r'بی\s*\.\s*کفایتی', 'بی‌کفایتی', t)
        t = re.sub(r'پیش\s*\.\s*آگهی', 'پیش‌آگهی', t)
        t = re.sub(r'پیش\s*\.\s*بینی', 'پیش‌بینی', t)
        t = re.sub(r'پیش\s*\.\s*گیری', 'پیش‌گیری', t)
        t = re.sub(r'روان\s*\.\s*پزشک', 'روان‌پزشک', t)
        t = re.sub(r'روان\s*\.\s*شناسی', 'روان‌شناسی', t)
        t = re.sub(r'روان\s*\.\s*درمانی', 'روان‌درمانی', t)
        t = re.sub(r'خود\s*\.\s*ماندگی', 'خودماندگی', t)
        t = re.sub(r'عقب\s*\.\s*مانده', 'عقب‌مانده', t)
        t = re.sub(r'عقب\s*\.\s*ماندگی', 'عقب‌ماندگی', t)
        t = re.sub(r'طبقه\s*\.\s*بندی', 'طبقه‌بندی', t)
        b['text'] = t.strip()
        
    return blocks

doc = fitz.open(r"C:\Users\PC\Downloads\Eitaa Desktop\روانشناسی مرضی کودک.pdf")
print("=== Testing page 8 reconstruction: ===")
blocks = reconstruct_page_text(doc[7].get_text())
for i, b in enumerate(blocks):
    print(f"[{i+1}] (bullet={b['is_bullet']}) {b['text']}")
