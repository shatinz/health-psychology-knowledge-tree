#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Consolidated Knowledge Tree Builder for Child Psychopathology
Creates clean, balanced main topic branches with full verbatim text in descriptions,
detailed points indexed internally for dynamic question generation, and exam forecast weights.
"""

import fitz
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"C:\Users\PC\Downloads\Eitaa Desktop\روانشناسی مرضی کودک.pdf"
doc = fitz.open(pdf_path)

def clean_persian_token(t):
    t = re.sub(r'\s+([،\.\:\؛\؟\)])', r'\1', t)
    t = re.sub(r'(\()\s+', r'\1', t)
    t = re.sub(r'\s+', ' ', t)
    
    # Common broken Persian prefixes/suffixes in PDFs
    t = re.sub(r'می\s*\.\s*شود', 'می‌شود', t)
    t = re.sub(r'می\s*\.\s*دهد', 'می‌دهد', t)
    t = re.sub(r'می\s*\.\s*گیرد', 'می‌گیرد', t)
    t = re.sub(r'می\s*\.\s*کنند', 'می‌کنند', t)
    t = re.sub(r'می\s*\.\s*یافت', 'می‌یافت', t)
    t = re.sub(r'می\s*\.\s*باشد', 'می‌باشد', t)
    t = re.sub(r'می\s*\.\s*داند', 'می‌داند', t)
    t = re.sub(r'می\s*\.\s*دانند', 'می‌دانند', t)
    t = re.sub(r'می\s*\.\s*پردازد', 'می‌پردازد', t)
    t = re.sub(r'می\s*\.\s*توان', 'می‌توان', t)
    t = re.sub(r'می\s*\.\s*گردد', 'می‌گردد', t)
    t = re.sub(r'می\s*\.\s*نامند', 'می‌نامند', t)
    t = re.sub(r'می\s*\.\s*نامد', 'می‌نامد', t)
    t = re.sub(r'می\s*\.\s*آورد', 'می‌آورد', t)
    t = re.sub(r'می\s*\.\s*آموزد', 'می‌آموزد', t)
    t = re.sub(r'می\s*\.\s*آید', 'می‌آید', t)
    t = re.sub(r'می\s*\.\s*ماند', 'می‌ماند', t)
    t = re.sub(r'می\s*\.\s*نمایند', 'می‌نمایند', t)
    t = re.sub(r'می\s*\.\s*نماید', 'می‌نماید', t)
    t = re.sub(r'می\s*\.\s*خواند', 'می‌خواند', t)
    t = re.sub(r'می\s*\.\s*نویسد', 'می‌نویسد', t)
    t = re.sub(r'می\s*\.\s*گویند', 'می‌گویند', t)
    t = re.sub(r'می\s*\.\s*گوید', 'می‌گوید', t)
    t = re.sub(r'می\s*\.\s*رسد', 'می‌رسد', t)
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
    t = re.sub(r'پشت\s*\.\s*سر\s*\.\s*هم', 'پشت‌سرهم', t)
    t = re.sub(r'بزرگ\s*\.\s*سالی', 'بزرگسالی', t)
    t = re.sub(r'کودک\s*\.\s*کشی', 'کودک‌کشی', t)
    t = re.sub(r'یتیم\s*\.\s*خانه', 'یتیم‌خانه', t)
    t = re.sub(r'نا\s*\.\s*بهنجار', 'نابهنجار', t)
    t = re.sub(r'ناهماهنگ\s*\.\s*ی', 'ناهماهنگی', t)
    t = re.sub(r'شایع\s*\.\s*تر', 'شایع‌تر', t)
    t = re.sub(r'سریع\s*\.\s*تر', 'سریع‌تر', t)
    t = re.sub(r'\bباال\b', 'بالا', t)
    t = re.sub(r'\bباالیی\b', 'بالایی', t)
    t = re.sub(r'\bباالتر\b', 'بالاتر', t)
    t = re.sub(r'\bخالصه\b', 'خلاصه', t)
    t = re.sub(r'\bاصطالحا\b', 'اصطلاحاً', t)
    t = re.sub(r'\bاصطالح\b', 'اصطلاح', t)
    t = re.sub(r'\bاصطالحات\b', 'اصطلاحات', t)
    t = re.sub(r'\bاصالح\b', 'اصلاح', t)
    t = re.sub(r'\bاصالحات\b', 'اصلاحات', t)
    t = re.sub(r'\bد\s+ر\b', 'در', t)
    t = re.sub(r'عفونت\s*ها', 'عفونت‌ها', t)
    t = re.sub(r'نشانه\s*ها', 'نشانه‌ها', t)
    t = re.sub(r'بیماری\s*ها', 'بیماری‌ها', t)
    t = re.sub(r'کودکان\s*ی', 'کودکانی', t)
    t = re.sub(r'عالئم', 'علائم', t)
    t = re.sub(r'مالک\s*ها', 'ملاک‌ها', t)
    t = re.sub(r'مالک', 'ملاک', t)
    t = re.sub(r'همساالن', 'همسالان', t)
    t = re.sub(r'اختالالت', 'اختلالات', t)
    t = re.sub(r'اختالل', 'اختلال', t)
    t = re.sub(r'مشکالت', 'مشکلات', t)
    t = re.sub(r'مشکل\s*ها', 'مشکل‌ها', t)
    t = re.sub(r'تالش', 'تلاش', t)
    t = re.sub(r'مبتال', 'مبتلا', t)
    t = re.sub(r'مبتالیان', 'مبتلایان', t)
    t = re.sub(r'سالمت', 'سلامت', t)
    t = re.sub(r'اطالعات', 'اطلاعات', t)
    t = re.sub(r'کالسیک', 'کلاسیک', t)
    t = re.sub(r'کالم', 'کلام', t)
    t = re.sub(r'کالمی', 'کلامی', t)
    t = re.sub(r'اخالقی', 'اخلاقی', t)
    t = re.sub(r'سندرم\s*های', 'سندرم‌های', t)
    t = re.sub(r'سندروم\s*های', 'سندروم‌های', t)
    t = re.sub(r'سندرم', 'سندروم', t)
    t = re.sub(r'در\s*خودماندگی', 'درخودماندگی', t)
    t = re.sub(r'بیش\s*فعالی', 'بیش‌فعالی', t)
    t = re.sub(r'کم\s*توجهی', 'کم‌توجهی', t)
    t = re.sub(r'خود\s*ارضایی', 'خودارضایی', t)
    t = re.sub(r'مدرسه\s*گریزی', 'مدرسه‌گریزی', t)
    t = re.sub(r'بد\s*رفتاری', 'بدرفتاری', t)
    t = re.sub(r'سو\s*ء\s*استفاده', 'سوءاستفاده', t)
    t = re.sub(r'سو\s*ء\s*مصرف', 'سوءمصرف', t)
    t = re.sub(r'سو\s*ء\s*تغذیه', 'سوءتغذیه', t)
    t = re.sub(r'روان\s*پریشی', 'روان‌پریشی', t)
    t = re.sub(r'روان\s*نژندی', 'روان‌نژندی', t)
    t = re.sub(r'روان\s*پویایی', 'روان‌پویایی', t)
    t = re.sub(r'روان\s*کاوی', 'روان‌کاوی', t)
    t = re.sub(r'غدد\s*درون\s*ریز', 'غدد درون‌ریز', t)
    t = re.sub(r'درون\s*فکنی', 'درون‌فکنی', t)
    t = re.sub(r'برون\s*فکنی', 'برون‌فکنی', t)
    t = re.sub(r'خویشتن\s*داری', 'خویشتن‌داری', t)
    t = re.sub(r'مشکل\s*آفرین', 'مشکل‌آفرین', t)
    t = re.sub(r'پس\s*خوراند', 'پس‌خوراند', t)
    t = re.sub(r'کم\s*رویی', 'کم‌رویی', t)
    t = re.sub(r'کم\s*حرف', 'کم‌حرف', t)
    t = re.sub(r'عزت\s*نفس', 'عزت‌نفس', t)
    t = re.sub(r'اعتماد\s*به\s*نفس', 'اعتمادبه‌نفس', t)
    t = re.sub(r'درون\s*ساخت', 'درون‌ساخت', t)
    t = re.sub(r'برون\s*ساخت', 'برون‌ساخت', t)
    t = re.sub(r'خود\s*پنداره', 'خودپنداره', t)
    t = re.sub(r'شیر\s*خوارگی', 'شیرخوارگی', t)
    t = re.sub(r'شیر\s*خواری', 'شیرخواری', t)
    t = re.sub(r'پیش\s*دبستان', 'پیش‌دبستان', t)
    t = re.sub(r'دوچرخه\s*سواری', 'دوچرخه‌سواری', t)
    t = re.sub(r'لباس\s*پوشیدن', 'لباس‌پوشیدن', t)
    t = re.sub(r'رمز\s*گشایی', 'رمزگشایی', t)
    t = re.sub(r'جمله\s*سازی', 'جمله‌سازی', t)
    t = re.sub(r'واج\s*شناسی', 'واج‌شناسی', t)
    t = re.sub(r'واج\s*شناختی', 'واج‌شناختی', t)
    t = re.sub(r'هرزه\s*خواری', 'هرزه‌خواری', t)
    t = re.sub(r'شب\s*ادراری', 'شب‌ادراری', t)
    t = re.sub(r'هشدار\s*دهنده', 'هشداردهنده', t)
    t = re.sub(r'از\s*هم\s*پاشیدگی', 'ازهم‌پاشیدگی', t)
    t = re.sub(r'مقابله\s*جویانه', 'مقابله‌جویانه', t)
    t = re.sub(r'مقابله\s*ای', 'مقابله‌ای', t)
    
    return t.strip()

def parse_page_blocks(page_text):
    lines = [l.strip() for l in page_text.split('\n') if l.strip()]
    if lines and re.match(r'^\d+$', lines[0]):
        lines = lines[1:]
        
    items = []
    curr = []
    is_bullet = False
    
    for l in lines:
        if l in ['✓', '', '✔', '•']:
            if curr:
                items.append({'text': clean_persian_token(' '.join(curr)), 'is_bullet': is_bullet})
                curr = []
            is_bullet = True
            continue
            
        is_h = bool(re.match(r'^(فصل\s+[^\n]+|:\s*فصل|:\s*[^\n]+|[1-9\u06F1-\u06F9]+[\.\:\-]|[الف-ی]\))', l))
        if is_h and curr and not is_bullet:
            items.append({'text': clean_persian_token(' '.join(curr)), 'is_bullet': is_bullet})
            curr = [l]
            is_bullet = False
        else:
            curr.append(l)
            
    if curr:
        items.append({'text': clean_persian_token(' '.join(curr)), 'is_bullet': is_bullet})
        
    return [it for it in items if it['text']]

STRICT_RESEARCHERS = [
    (r'\bتوماس\s+فیر\b', 'توماس فیر (Thomas Phaer)'),
    (r'\bبنیامین\s+راش\b', 'بنیامین راش (Benjamin Rush)'),
    (r'\b(استنلی\s+هال|استنلی‌هال)\b', 'استنلی هال (G. Stanley Hall)'),
    (r'\bآلفرد\s+بینه\b', 'آلفرد بینه (Alfred Binet)'),
    (r'\bلوئیس\s+ترمن\b', 'لوئیس ترمن (Lewis Terman)'),
    (r'\b(لایتنر\s+ویتمر|ویتمر)\b', 'لایتنر ویتمر (Lightner Witmer)'),
    (r'\bویلیام\s+هلی\b', 'ویلیام هلی (William Healy)'),
    (r'\bآدولف\s+مایر\b', 'آدولف مایر (Adolf Meyer)'),
    (r'\b(ادوارد\s+سکواین|ادوارد\s+سگوین|سگوین)\b', 'ادوارد سگوین (Édouard Séguin)'),
    (r'\bآنا\s+فروید\b', 'آنا فروید (Anna Freud)'),
    (r'\b(زیگموند\s+فروید|فروید)\b', 'زیگموند فروید (Sigmund Freud)'),
    (r'\b(آلفرد\s+آدلر|آدلر)\b', 'آلفرد آدلر (Alfred Adler)'),
    (r'\b(کارن\s+هورنای|هورنای)\b', 'کارن هورنای (Karen Horney)'),
    (r'\b(دالارد\s+و\s+میلر|دالارد)\b', 'جان دالارد و نیل میلر (Dollard & Miller)'),
    (r'\b(آلبرت\s+بندورا|بندورا)\b', 'آلبرت بندورا (Albert Bandura)'),
    (r'\b(جولیان\s+راتر|راتر)\b', 'جولیان راتر (Julian Rotter)'),
    (r'\bآلبرت\s+الیس\b', 'آلبرت الیس (Albert Ellis)'),
    (r'\b(توماس\s+ایکن‌باخ|توماس\s+ایکن\s+باخ|ایکن‌باخ|ایکن\s+باخ)\b', 'توماس ایکن‌باخ (Thomas Achenbach)'),
    (r'\b(ژان\s+پیاژه|پیاژه)\b', 'ژان پیاژه (Jean Piaget)'),
    (r'\b(تئودور\s+هلر|سندروم\s+هلر|سندرم\s+هلر)\b', 'تئودور هلر (Theodor Heller)'),
    (r'\b(هانس\s+آسپرگر|سندروم\s+آسپرگر|سندرم\s+آسپرگر|آسپرگر)\b', 'هانس آسپرگر (Hans Asperger)'),
    (r'\b(لئو\s+کانر|کانر)\b', 'لئو کانر (Leo Kanner)'),
    (r'\b(آندریاس\s+رت|سندروم\s+رت|سندرم\s+رت|اختلال\s+رت)\b', 'آندریاس رت (Andreas Rett)'),
    (r'\bجان\s+لاک\b', 'جان لاک (John Locke)'),
    (r'\b(ژان\s+ژاک\s+روسو|روسو)\b', 'ژان ژاک روسو (Jean-Jacques Rousseau)'),
    (r'\b(مارتین\s+سلیگمن|سلیگمن)\b', 'مارتین سلیگمن (Martin Seligman)'),
    (r'\bآرون\s+بک\b', 'آرون بک (Aaron Beck)'),
    (r'\b(هیلدا\s+بروچ|بروچ)\b', 'هیلدا بروچ (Hilde Bruch)')
]

def extract_node_meta(text):
    researchers = []
    has_anna = bool(re.search(r'\bآنا\s+فروید\b', text))
    
    for pattern, name in STRICT_RESEARCHERS:
        if name == 'زیگموند فروید (Sigmund Freud)' and has_anna:
            if not re.search(r'\bزیگموند\s+فروید\b', text) and not re.search(r'(?<!آنا\s)فروید', text):
                continue
        if re.search(pattern, text):
            if name not in researchers:
                researchers.append(name)
            
    tags = []
    if "تشخیص افتراقی" in text or "متمایز" in text or "افتراق" in text:
        tags.append("تشخیص افتراقی")
    if "ملاک" in text or "معیار" in text or "DSM" in text or "ICD" in text:
        tags.append("ملاک‌های تشخیصی")
    if "درمان" in text or "مداخله" in text or "دارو" in text or "رفتاردرمانی" in text:
        tags.append("روش‌های درمانی")
    if "شیوع" in text or "همه‌گیر" in text or "درصد" in text or "%" in text:
        tags.append("همه‌گیرشناسی و شیوع")
    if "سبب‌شناسی" in text or "علت" in text or "ژنتیک" in text or "زیست" in text:
        tags.append("سبب‌شناسی و علل")
    if "سیر و پیش‌آگهی" in text or "پیش‌آگهی" in text:
        tags.append("سیر و پیش‌آگهی")
    if "ابتلای همزمان" in text or "همبودی" in text:
        tags.append("ابتلای همزمان (همبودی)")
        
    diff_diag = []
    diag_crit = []
    clin_ex = []
    
    if "تشخیص افتراقی" in text or "متمایز" in text or "افتراق" in text:
        diff_diag.append(text)
    if "ملاک" in text or "معیار" in text or "ویژگی‌های بالینی" in text or "نشانگان" in text:
        diag_crit.append(text)
    if "برای مثال" in text or "نظیر" in text or "مانند" in text or "از قبیل" in text or "نمونه" in text:
        clin_ex.append(text)
        
    return {
        "researchers": researchers,
        "tags": tags,
        "differential_diagnosis": diff_diag if diff_diag else None,
        "diagnostic_criteria": diag_crit if diag_crit else None,
        "clinical_examples": clin_ex if clin_ex else None
    }

# Read all 60 pages
pages = []
for p_idx in range(len(doc)):
    blocks = parse_page_blocks(doc[p_idx].get_text())
    pages.append({'page_num': p_idx + 1, 'blocks': blocks})

# Consolidated Topic Specifications with Exam-Forecast Weights
CONSOLIDATED_SECTIONS = [
    # --- فصل اول: تاریخچه و الگوها (صفحات ۲ تا ۵) ---
    {
        "id": "cpd_ch1_sec1",
        "chapterId": "cpd_ch1",
        "chapterTitle": "فصل اول: تاریخچه و الگوهای روانشناسی مرضی کودک",
        "title": "۱. سیر تاریخی روانشناسی مرضی کودک و پیشگامان بالینی",
        "summary": "سیر تحول تاریخی طب اطفال و روانپزشکی کودک از توماس فیر تا تأسیس اولین کلینیک‌ها",
        "pages": (2, 3),
        "exam_weight": "standard",
        "forecast_probability": 60,
        "required_quiz_count": 4
    },
    {
        "id": "cpd_ch1_sec2",
        "chapterId": "cpd_ch1",
        "chapterTitle": "فصل اول: تاریخچه و الگوهای روانشناسی مرضی کودک",
        "title": "۲. مفاهیم بهنجاری، نابهنجاری و الگوهای شناختی-رفتاری",
        "summary": "معیارهای بهنجاری و الگوهای روان‌پویایی (فروید، آدلر، هورنای) و یادگیری (بندورا، راتر، الیس)",
        "pages": (3, 5),
        "exam_weight": "standard",
        "forecast_probability": 65,
        "required_quiz_count": 4
    },

    # --- فصل دوم: سنجش و ارزیابی (صفحات ۶ تا ۸) ---
    {
        "id": "cpd_ch2_sec1",
        "chapterId": "cpd_ch2",
        "chapterTitle": "فصل دوم: سنجش و ارزیابی اختلال‌های روانی کودکان",
        "title": "۱. مصاحبه بالینی، ابعاد ارزیابی و مشاهده رفتار کودک",
        "summary": "فنون مصاحبه، سنجش عزت‌نفس و معاینه وضعیت روانی (MSE)",
        "pages": (6, 7),
        "exam_weight": "high",
        "forecast_probability": 85,
        "required_quiz_count": 6
    },
    {
        "id": "cpd_ch2_sec2",
        "chapterId": "cpd_ch2",
        "chapterTitle": "فصل دوم: سنجش و ارزیابی اختلال‌های روانی کودکان",
        "title": "۲. طبقه‌بندی ایکن‌باخ (درون‌ساخت و برون‌ساخت)، روان‌آزمایی و نظام‌های DSM/ICD",
        "summary": "تحلیل عاملی ایکن‌باخ (۱۹۶۶)، معیارهای آنا فروید، روان‌آزمایی و فرم‌های DSM و ICD",
        "pages": (7, 8),
        "exam_weight": "high",
        "forecast_probability": 90,
        "required_quiz_count": 6
    },

    # --- فصل سوم: مهارت‌های حرکتی (صفحات ۹ تا ۱۰) ---
    {
        "id": "cpd_ch3_sec1",
        "chapterId": "cpd_ch3",
        "chapterTitle": "فصل سوم: اختلالات مهارت‌های حرکتی – اختلال رشد هماهنگی",
        "title": "۱. اختلال رشد هماهنگی (DCD) - رشد حرکتی، همه‌گیرشناسی و همبودی",
        "summary": "مراحل رشد حرکتی پیاژه، شیوع در سنین ۵ تا ۱۱ سال و همبودی با ADHD و یادگیری",
        "pages": (9, 9),
        "exam_weight": "standard",
        "forecast_probability": 55,
        "required_quiz_count": 3
    },
    {
        "id": "cpd_ch3_sec2",
        "chapterId": "cpd_ch3",
        "chapterTitle": "فصل سوم: اختلالات مهارت‌های حرکتی – اختلال رشد هماهنگی",
        "title": "۲. سبب‌شناسی، ویژگی‌های بالینی، تشخیص افتراقی و درمان DCD",
        "summary": "علل دوران پیش از تولد، افتراق از فلج مغزی و مداخلات یکپارچگی حسی-حرکتی",
        "pages": (9, 10),
        "exam_weight": "standard",
        "forecast_probability": 60,
        "required_quiz_count": 3
    },

    # --- فصل چهارم: اختلالات ارتباطی (صفحات ۱۱ تا ۱۷) ---
    {
        "id": "cpd_ch4_sec1",
        "chapterId": "cpd_ch4",
        "chapterTitle": "فصل چهارم: اختلالات ارتباطی",
        "title": "۱. اختلال در زبان بیانی و اختلال مختلط زبان دریافتی-بیانی",
        "summary": "ویژگی‌های بالینی، فرضیه نقص روندی، افتراق از اتیسم و پیش‌آگهی",
        "pages": (11, 14),
        "exam_weight": "medium",
        "forecast_probability": 70,
        "required_quiz_count": 5
    },
    {
        "id": "cpd_ch4_sec2",
        "chapterId": "cpd_ch4",
        "chapterTitle": "فصل چهارم: اختلالات ارتباطی",
        "title": "۲. اختلال واج‌شناختی و لکنت زبان",
        "summary": "ملاک‌های تشخیصی DSM برای لکنت زبان، شیوع، سبب‌شناسی و گفتاردرمانی",
        "pages": (14, 17),
        "exam_weight": "medium",
        "forecast_probability": 72,
        "required_quiz_count": 5
    },

    # --- فصل هفتم: تغذیه و خوردن (صفحات ۱۸ تا ۲۸) ---
    {
        "id": "cpd_ch7_sec1",
        "chapterId": "cpd_ch7",
        "chapterTitle": "فصل هفتم: اختلالات تغذیه و خوردن",
        "title": "۱. اختلال هرزه‌خواری (پیکا) و اختلال نشخوار",
        "summary": "خوردن مواد غیرخوراکی، افتراق نشخوار از استفراغ معمولی و درمان با بیزاری خفیف",
        "pages": (18, 21),
        "exam_weight": "medium",
        "forecast_probability": 75,
        "required_quiz_count": 5
    },
    {
        "id": "cpd_ch7_sec2",
        "chapterId": "cpd_ch7",
        "chapterTitle": "فصل هفتم: اختلالات تغذیه و خوردن",
        "title": "۲. اختلال تغذیه‌ای نوزادی و بی‌اشتهایی روانی (Anorexia Nervosa)",
        "summary": "ملاک‌های تشخیصی آنورکسیا، تبیین هیلدا بروچ و الگوهای خانوادگی",
        "pages": (21, 25),
        "exam_weight": "high",
        "forecast_probability": 84,
        "required_quiz_count": 6
    },
    {
        "id": "cpd_ch7_sec3",
        "chapterId": "cpd_ch7",
        "chapterTitle": "فصل هفتم: اختلالات تغذیه و خوردن",
        "title": "۳. پرخوری عصبی (Bulimia)، پرخوری دوره‌ای و اختلال خوردن نامعین (EDNOS)",
        "summary": "دوره‌های پرخوری و رفتارهای جبرانی، افتراق از آنورکسیا و درمان‌های شناختی-رفتاری",
        "pages": (26, 28),
        "exam_weight": "medium",
        "forecast_probability": 76,
        "required_quiz_count": 5
    },

    # --- فصل نهم: نارسایی‌های یادگیری (صفحات ۲۹ تا ۳۷) ---
    {
        "id": "cpd_ch9_sec1",
        "chapterId": "cpd_ch9",
        "chapterTitle": "فصل نهم: نارسایی‌های یادگیری",
        "title": "۱. نارسایی خواندن (دیسلکسی) و اختلال بیان نوشتاری (دیسگرافیا)",
        "summary": "پردازش واج‌شناختی، رمزگشایی نویسه‌ها، نابهنجاری‌های نیمکره چپ مغز و شیوع",
        "pages": (29, 32),
        "exam_weight": "high",
        "forecast_probability": 85,
        "required_quiz_count": 6
    },
    {
        "id": "cpd_ch9_sec2",
        "chapterId": "cpd_ch9",
        "chapterTitle": "فصل نهم: نارسایی‌های یادگیری",
        "title": "۲. نارسایی ویژه در یادگیری ریاضی (دیسکلکولیا) و راهبردهای مداخله آموزشی",
        "summary": "ملاک‌های تشخیصی محاسبه، عوامل ۳ گانه آموزش ریاضی و درمان نارسایی‌های یادگیری",
        "pages": (32, 37),
        "exam_weight": "medium",
        "forecast_probability": 75,
        "required_quiz_count": 5
    },

    # --- فصل یازدهم: اختلالات دفع (صفحات ۳۸ تا ۴۱) ---
    {
        "id": "cpd_ch11_sec1",
        "chapterId": "cpd_ch11",
        "chapterTitle": "فصل یازدهم: اختلالات دفع",
        "title": "۱. بی‌اختیاری ادراری (انورزیس/شب‌ادراری) - ملاک‌ها، شیوع و علل",
        "summary": "حداقل سن ۵ سال، شیوع در پسران، ظرفیت مثانه و استرس‌های رشدی",
        "pages": (38, 39),
        "exam_weight": "medium",
        "forecast_probability": 78,
        "required_quiz_count": 5
    },
    {
        "id": "cpd_ch11_sec2",
        "chapterId": "cpd_ch11",
        "chapterTitle": "فصل یازدهم: اختلالات دفع",
        "title": "۲. بی‌اختیاری مدفوع (انکوپرزیس) و پروتکل‌های درمانی شرطی‌سازی",
        "summary": "انکوپرزیس اولیه و ثانویه، دستگاه زنگ و تشکچه ماورر (Bell & Pad) و رفتاردرمانی",
        "pages": (39, 41),
        "exam_weight": "medium",
        "forecast_probability": 78,
        "required_quiz_count": 5
    },

    # --- فصل دوازدهم: اختلالات فراگیر رشد (صفحات ۴۲ تا ۵۲) ---
    {
        "id": "cpd_ch12_sec1",
        "chapterId": "cpd_ch12",
        "chapterTitle": "فصل دوازدهم: اختلالات فراگیر مربوط به رشد (PDD)",
        "title": "۱. اختلال درخودماندگی (اتیسم کلاسیک کانر) - تاریخچه، نشانه‌شناسی و علل",
        "summary": "لئو کانر (۱۹۴۳)، تثبیت بر یکنواختی، سندروم X شکننده، اختلالات حسی و ویتامین‌های گروه B",
        "pages": (42, 47),
        "exam_weight": "high",
        "forecast_probability": 94,
        "required_quiz_count": 8
    },
    {
        "id": "cpd_ch12_sec2",
        "chapterId": "cpd_ch12",
        "chapterTitle": "فصل دوازدهم: اختلالات فراگیر مربوط به رشد (PDD)",
        "title": "۲. سندروم رت (Rett) و اختلال ازهم‌پاشیدگی دوران کودکی (سندروم هلر)",
        "summary": "جهش ژنتیکی دختران در رت، حرکات قالبی شستن دست، تئودور هلر (۱۹۰۸) و پس‌رفت ۲ سال رشد طبیعی",
        "pages": (48, 49),
        "exam_weight": "high",
        "forecast_probability": 92,
        "required_quiz_count": 8
    },
    {
        "id": "cpd_ch12_sec3",
        "chapterId": "cpd_ch12",
        "chapterTitle": "فصل دوازدهم: اختلالات فراگیر مربوط به رشد (PDD)",
        "title": "۳. سندروم آسپرگر و اختلال فراگیر رشد نامعین (PDD-NOS)",
        "summary": "هوش طبیعی و زبان بدون تاخیر آسپرگر، نقایص تعامل اجتماعی و درمان‌های توانبخشی",
        "pages": (50, 52),
        "exam_weight": "high",
        "forecast_probability": 90,
        "required_quiz_count": 7
    },

    # --- فصل سیزدهم: کمبود توجه و رفتار مخرب (صفحات ۵۳ تا ۶۰) ---
    {
        "id": "cpd_ch13_sec1",
        "chapterId": "cpd_ch13",
        "chapterTitle": "فصل سیزدهم: اختلالات کمبود توجه و رفتار مخرب",
        "title": "۱. اختلال نقص توجه/بیش‌فعالی (ADHD) - زیرانواع، شیوع و درمان",
        "summary": "نارسایی توجه، بیش‌فعالی و تکانشگری، دارودرمانی با متیل‌فنیدات/ریتالین و مدیریت رفتار",
        "pages": (53, 55),
        "exam_weight": "high",
        "forecast_probability": 92,
        "required_quiz_count": 8
    },
    {
        "id": "cpd_ch13_sec2",
        "chapterId": "cpd_ch13",
        "chapterTitle": "فصل سیزدهم: اختلالات کمبود توجه و رفتار مخرب",
        "title": "۲. اختلال سلوک (Conduct Disorder) و اختلال نافرمانی مقابله‌جویانه (ODD)",
        "summary": "نقض حقوق دیگران در سلوک، لجبازی در ODD، عوامل پویایی خانواده و پروتکل‌های مداخله",
        "pages": (56, 60),
        "exam_weight": "high",
        "forecast_probability": 90,
        "required_quiz_count": 8
    }
]

# Build consolidated tree
chapter_map = {}
for sec_def in CONSOLIDATED_SECTIONS:
    ch_id = sec_def["chapterId"]
    ch_title = sec_def["chapterTitle"]
    if ch_id not in chapter_map:
        chapter_map[ch_id] = {
            "id": ch_id,
            "title": ch_title,
            "type": "chapter",
            "summary": f"سرفصل‌های جامع {ch_title}",
            "children": []
        }
    
    # Collect all detailed points for this section
    p_start, p_end = sec_def["pages"]
    detailed_points = []
    paragraphs = []
    section_researchers = set()
    section_tags = set()
    
    for p_num in range(p_start, p_end + 1):
        p_data = next((p for p in pages if p["page_num"] == p_num), None)
        if p_data:
            for b in p_data["blocks"]:
                t = b["text"]
                meta = extract_node_meta(t)
                for r in meta["researchers"]:
                    section_researchers.add(r)
                for tg in meta["tags"]:
                    section_tags.add(tg)
                
                point_obj = {
                    "text": t,
                    "page": p_num,
                    "researchers": meta["researchers"] if meta["researchers"] else None,
                    "tags": meta["tags"] if meta["tags"] else None,
                    "differential_diagnosis": meta["differential_diagnosis"],
                    "diagnostic_criteria": meta["diagnostic_criteria"],
                    "clinical_examples": meta["clinical_examples"]
                }
                point_obj = {k: v for k, v in point_obj.items() if v is not None}
                detailed_points.append(point_obj)
                
                # Format into paragraph with bullet marker
                bullet_prefix = "• " if b["is_bullet"] else ""
                paragraphs.append(f"{bullet_prefix}{t}")

    # Build full verbatim text block
    full_text_block = f"📄 مرجع: صفحات {p_start} تا {p_end} کتاب\n\n" + "\n\n".join(paragraphs)

    sec_node = {
        "id": sec_def["id"],
        "title": sec_def["title"],
        "type": "section",
        "summary": sec_def["summary"],
        "pages": f"صفحات {p_start} تا {p_end}",
        "exam_weight": sec_def["exam_weight"],
        "forecast_probability": sec_def["forecast_probability"],
        "required_quiz_count": sec_def["required_quiz_count"],
        "researchers": list(section_researchers) if section_researchers else None,
        "tags": list(section_tags) if section_tags else None,
        "full_text": full_text_block,
        "detailed_points": detailed_points
    }
    sec_node = {k: v for k, v in sec_node.items() if v is not None}
    chapter_map[ch_id]["children"].append(sec_node)

all_chapters = list(chapter_map.values())

consolidated_dataset = {
    "id": "doc_child_psychopathology",
    "title": "خلاصه کتاب روانشناسی مرضی کودک",
    "author": "حمید کمرزرین، محمد اورکی، انسیه بابایی، مهناز علی‌اکبری",
    "metadata": {
        "pages": 60,
        "language": "fa",
        "category": "روانشناسی بالینی و مرضی کودک",
        "description": "ساختار تمیز، هدفمند و استاندارد ۹ فصل روانشناسی مرضی کودک همراه با متن ۱۰۰٪ کامل و کلمه‌به‌کلمه کتاب در توضیحات هر سرفصل، وزن‌دهی پیش‌بینی آزمون (Exam Forecast)، و نقاط داده تفصیلی برای آزمون‌های تسلط ۹۰٪",
        "color": "#f59e0b",
        "badge": "ساختار استاندارد + متن کامل"
    },
    "tree": {
        "id": "cpd_root",
        "title": "روانشناسی مرضی کودک (کمرزرین، اورکی و همکاران)",
        "type": "root",
        "summary": "ساختار تمیز و استاندارد ۹ فصل با اوزان پیش‌بینی آزمون و متن کامل",
        "children": all_chapters
    }
}

js_content = "/**\n"
js_content += " * Dataset: روانشناسی مرضی کودک (حمید کمرزرین، محمد اورکی، انسیه بابایی، مهناز علی‌اکبری)\n"
js_content += " * Consolidated Clean Tree Hierarchy with 100% Verbatim Full-Text Descriptions\n"
js_content += " * Includes Exam-Forecast Weights and Indexed Detailed Points for 90% Mastery Exams\n"
js_content += " */\n\n"
js_content += "window.DOC_CHILD_PSYCHOPATHOLOGY = "
js_content += json.dumps(consolidated_dataset, ensure_ascii=False, indent=2)
js_content += ";\n"

with open("js/data-child-psychopathology.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Successfully generated clean consolidated js/data-child-psychopathology.js!")
print(f"Total chapters: {len(all_chapters)}")
print(f"Total main section branches: {sum(len(c['children']) for c in all_chapters)}")
total_detailed_points = sum(len(s.get("detailed_points", [])) for c in all_chapters for s in c["children"])
print(f"Total detailed points preserved for question generation: {total_detailed_points}")
total_chars = sum(len(s.get("full_text", "")) for c in all_chapters for s in c["children"])
print(f"Total text characters in descriptions: {total_chars:,}")
