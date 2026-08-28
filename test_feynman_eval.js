const fs = require('fs');

class FeynmanTester {
  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[\u200c\s]+/g, ' ')
      .replace(/[ي]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[،\.\:\؛\؟\!\(\)\[\]\"\'\-\–\—\/\\]/g, ' ')
      .trim();
  }

  extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set([
      'این', 'آن', 'برای', 'است', 'شد', 'شده', 'می', 'در', 'به', 'با', 'که', 'از',
      'یک', 'یا', 'و', 'نیز', 'هم', 'اما', 'اگر', 'چون', 'بین', 'روی', 'زیر', 'پس',
      'پیش', 'دارد', 'دارند', 'بود', 'بودند', 'شود', 'شوند', 'کند', 'کنند', 'باشد',
      'باشند', 'خواهد', 'مورد', 'بخش', 'صورت', 'عنوان', 'دست', 'نوع', 'گروه', 'سال',
      'باید', 'نباید', 'بوده', 'شوند', 'گردد', 'می‌شود', 'می‌باشد', 'می‌کند'
    ]);
    const norm = this.normalizeText(text);
    return norm.split(' ').filter(w => w.length >= 2 && !stopWords.has(w));
  }

  extractTargetConcepts(node) {
    const concepts = [];

    // 1. Topic Subject from Title
    const titleWords = this.extractKeywords(node.title);
    if (titleWords.length > 0) {
      concepts.push({
        category: 'موضوع اصلی سرفصل',
        label: node.title,
        keywords: titleWords
      });
    }

    // 2. Researchers
    if (node.researchers && Array.isArray(node.researchers)) {
      node.researchers.forEach(r => {
        const cleanR = r.replace(/\([^\)]+\)/g, '').trim();
        concepts.push({
          category: 'نظریه‌پرداز / پژوهشگر',
          label: r,
          keywords: this.extractKeywords(cleanR)
        });
      });
    }

    // 3. Clinical Features & Detailed Points
    const points = node.detailed_points || [];
    points.slice(0, 10).forEach((pt) => {
      const words = this.extractKeywords(pt.text);
      if (words.length >= 2) {
        concepts.push({
          category: 'ویژگی بالینی و تشخیصی',
          label: pt.text.length > 50 ? pt.text.substring(0, 45) + '...' : pt.text,
          keywords: words.slice(0, 6)
        });
      }
    });

    // Deduplicate
    const unique = [];
    const seen = new Set();
    concepts.forEach(c => {
      if (!seen.has(c.label)) {
        seen.add(c.label);
        unique.push(c);
      }
    });

    return unique.slice(0, 6);
  }

  evaluate(node, userText) {
    const normUser = this.normalizeText(userText);
    const concepts = this.extractTargetConcepts(node);

    let matched = 0;
    const matchedList = [];
    const missedList = [];

    concepts.forEach(c => {
      let isMatch = false;
      for (const kw of c.keywords) {
        const normKw = this.normalizeText(kw);
        if (normKw.length >= 2 && normUser.includes(normKw)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) {
        matched++;
        matchedList.push(c.label);
      } else {
        missedList.push(c.label);
      }
    });

    const rawCoverage = concepts.length > 0 ? (matched / concepts.length) * 100 : 100;
    const score = Math.min(100, Math.round(rawCoverage));

    return {
      totalConcepts: concepts.length,
      matched,
      score,
      passed: score >= 80,
      matchedList,
      missedList
    };
  }
}

const fileText = fs.readFileSync('./js/data-child-psychopathology.js', 'utf8');
const jsonMatch = fileText.match(/window\.DOC_CHILD_PSYCHOPATHOLOGY\s*=\s*(\{[\s\S]+\});/);
const nodeData = JSON.parse(jsonMatch[1]);
const rettNode = nodeData.tree.children.find(c => c.id === 'cpd_ch12').children.find(s => s.id === 'cpd_ch12_sec2');

const tester = new FeynmanTester();
const explanation = "سندروم رت اختلالی پیش‌رونده و ژنتیکی در دختران است که آندریاس رت آن را توصیف کرد. پس از رشد طبیعی، دور سر کند شده و حرکات قالبی شستن دست‌ها پدیدار می‌شود. همچنین سندروم هلر توسط تئودور هلر توصیف شد و پس از دو سال رشد طبیعی رخ می‌دهد و نیازمند ویتامین و مراقبت است.";

console.log('Result:', JSON.stringify(tester.evaluate(rettNode, explanation), null, 2));
