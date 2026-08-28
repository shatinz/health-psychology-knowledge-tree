/**
 * Multi-Faceted Real-Time Search Engine
 * Supports Persian normalization, field-weighted scoring, and multi-tag filtering.
 */

class SearchEngine {
  constructor(docManager) {
    this.docManager = docManager;
  }

  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "") // remove arabic diacritics
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[\u200C\u200B]/g, " ") // replace zero-width non-joiners with space for search
      .replace(/\s+/g, " ")
      .trim();
  }

  search(query, filters = {}) {
    const rawQuery = this.normalizeText(query);
    const results = [];
    const allNodes = Array.from(this.docManager.nodeIndex.values());

    const { docId, tag, researcher, bioOnly } = filters;

    for (const node of allNodes) {
      // 1. Apply Document filter
      if (docId && docId !== 'all' && node.docId !== docId) {
        continue;
      }

      // 2. Apply Bio only filter
      if (bioOnly && (!node.physiological_pathways || node.physiological_pathways.length === 0)) {
        continue;
      }

      // 3. Apply Researcher filter
      if (researcher && (!node.researchers || !node.researchers.some(r => this.normalizeText(r).includes(this.normalizeText(researcher))))) {
        continue;
      }

      // 4. Apply Tag filter
      if (tag && (!node.tags || !node.tags.some(t => this.normalizeText(t).includes(this.normalizeText(tag))))) {
        continue;
      }

      // If no query string, include all matching filter nodes
      if (!rawQuery) {
        results.push({ node, score: 1.0, matches: [] });
        continue;
      }

      // Score matching
      let score = 0;
      const matches = [];

      const normTitle = this.normalizeText(node.title);
      const normSummary = this.normalizeText(node.summary);
      const normFull = this.normalizeText(node.full_text);
      const normResearchers = (node.researchers || []).map(r => this.normalizeText(r)).join(' ');
      const normTags = (node.tags || []).map(t => this.normalizeText(t)).join(' ');

      if (normTitle.includes(rawQuery)) {
        score += 10;
        matches.push('عنوان');
      }
      if (normResearchers.includes(rawQuery)) {
        score += 8;
        matches.push('پژوهشگر');
      }
      if (normTags.includes(rawQuery)) {
        score += 6;
        matches.push('برچسب');
      }
      if (normSummary.includes(rawQuery)) {
        score += 4;
        matches.push('خلاصه');
      }
      if (normFull.includes(rawQuery)) {
        score += 2;
        matches.push('متن کامل');
      }

      if (score > 0) {
        results.push({ node, score, matches });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  extractAllDistinctResearchers() {
    const researchers = new Set();
    for (const node of this.docManager.nodeIndex.values()) {
      if (node.researchers) {
        node.researchers.forEach(r => researchers.add(r));
      }
    }
    return Array.from(researchers).sort();
  }

  extractAllDistinctTags() {
    const tags = new Set();
    for (const node of this.docManager.nodeIndex.values()) {
      if (node.tags) {
        node.tags.forEach(t => tags.add(t));
      }
    }
    return Array.from(tags).sort();
  }
}

window.searchEngine = new SearchEngine(window.docManager);
