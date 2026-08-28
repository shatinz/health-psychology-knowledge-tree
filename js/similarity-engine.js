/**
 * Similarity & Distance Engine
 * Computes semantic proximity, line transparency, spatial force distances, and cross-doc diffs.
 */

class SimilarityEngine {
  constructor(docManager) {
    this.docManager = docManager;
    // Persian stop words for accurate token extraction
    this.stopWords = new Set([
      "از", "به", "با", "در", "بر", "برای", "که", "این", "آن", "است", "شد", "شده", "می‌شود",
      "می‌گردد", "بود", "بوده", "یک", "دو", "سه", "چهار", "یا", "تا", "نیز", "هم", "همچنین",
      "خود", "دیگر", "سایر", "بین", "رویکرد", "دارای", "عنوان", "صورت", "نظیر", "مانند", "طبق",
      "توسط", "مورد", "باشد", "شود", "و", "اما", "اگر", "چون", "همه", "نوع", "باعث", "گردد"
    ]);
  }

  tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();
    const clean = text
      .toLowerCase()
      .replace(/[،؛.:؛!؟()\[\]{}«»\-_\/\\"'*#+=\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = clean.split(" ");
    const tokenSet = new Set();
    for (const w of words) {
      if (w.length > 2 && !this.stopWords.has(w)) {
        tokenSet.add(w);
      }
    }
    return tokenSet;
  }

  getNodeTokens(node) {
    const combinedText = [
      node.title || "",
      node.summary || "",
      node.full_text || "",
      (node.tags || []).join(" "),
      (node.researchers || []).join(" "),
      (node.physiological_pathways || []).join(" ")
    ].join(" ");

    return this.tokenize(combinedText);
  }

  computeJaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  computeTagBonus(nodeA, nodeB) {
    const tagsA = new Set(nodeA.tags || []);
    const tagsB = new Set(nodeB.tags || []);
    if (!tagsA.size || !tagsB.size) return 0;
    let common = 0;
    for (const t of tagsA) {
      if (tagsB.has(t)) common++;
    }
    return common > 0 ? common / Math.max(tagsA.size, tagsB.size) : 0;
  }

  computeResearcherBonus(nodeA, nodeB) {
    const resA = new Set(nodeA.researchers || []);
    const resB = new Set(nodeB.researchers || []);
    if (!resA.size || !resB.size) return 0;
    for (const r of resA) {
      if (resB.has(r)) return 0.35; // strong bonus if same researcher
    }
    return 0;
  }

  /**
   * Computes holistic similarity score in range [0.0, 1.0] between two nodes.
   */
  computeSimilarity(nodeA, nodeB) {
    if (!nodeA || !nodeB || nodeA.id === nodeB.id) return 0;

    const tokensA = this.getNodeTokens(nodeA);
    const tokensB = this.getNodeTokens(nodeB);
    const textSim = this.computeJaccardSimilarity(tokensA, tokensB);
    const tagSim = this.computeTagBonus(nodeA, nodeB);
    const resSim = this.computeResearcherBonus(nodeA, nodeB);

    // Weighted composite score
    let score = (textSim * 0.50) + (tagSim * 0.30) + (resSim * 0.20);
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Converts a similarity score to line transparency (alpha) between 0.12 and 0.95.
   */
  similarityToAlpha(similarityScore) {
    const clamped = Math.max(0, Math.min(1, similarityScore));
    return 0.15 + (clamped * 0.80);
  }

  /**
   * Converts a similarity score to spring rest length (spatial distance).
   * High similarity -> short distance (attracted close together).
   * Low similarity -> long distance (pushed far apart).
   */
  similarityToRestDistance(similarityScore) {
    const clamped = Math.max(0, Math.min(1, similarityScore));
    return Math.max(60, 360 * (1.05 - clamped));
  }

  /**
   * Discovers automated cross-document and cross-chapter similarity links
   * above a minimum threshold (default 0.18).
   */
  discoverAutomatedLinks(minThreshold = 0.18) {
    const allNodes = Array.from(this.docManager.nodeIndex.values()).filter(
      n => n.type !== "root" && n.type !== "chapter"
    );

    const automatedLinks = [];

    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i];
        const nodeB = allNodes[j];

        // Do not auto-link direct parent-child (tree already shows that)
        if (nodeA.parentId === nodeB.id || nodeB.parentId === nodeA.id) continue;

        const sim = this.computeSimilarity(nodeA, nodeB);
        if (sim >= minThreshold) {
          const isCrossDoc = nodeA.docId !== nodeB.docId;
          automatedLinks.push({
            source: nodeA.id,
            target: nodeB.id,
            weight: sim,
            isCrossDoc: isCrossDoc,
            alpha: this.similarityToAlpha(sim),
            restDistance: this.similarityToRestDistance(sim),
            relation: isCrossDoc ? `تشابه بین‌سندی (${Math.round(sim * 100)}٪)` : `همبستگی مفهومی (${Math.round(sim * 100)}٪)`,
            description: `همپوشانی مفهومی و کلیدواژه‌ای میان "${nodeA.title}" و "${nodeB.title}" با ضریب تقارب ${Math.round(sim * 100)}٪`
          });
        }
      }
    }

    return automatedLinks;
  }

  /**
   * Generates a detailed Side-by-Side Diff comparison between any two nodes.
   */
  generateNodeDiff(nodeA, nodeB) {
    if (!nodeA || !nodeB) return null;

    const tokensA = this.getNodeTokens(nodeA);
    const tokensB = this.getNodeTokens(nodeB);

    const sharedTokens = [];
    const uniqueTokensA = [];
    const uniqueTokensB = [];

    for (const t of tokensA) {
      if (tokensB.has(t)) sharedTokens.push(t);
      else uniqueTokensA.push(t);
    }
    for (const t of tokensB) {
      if (!tokensA.has(t)) uniqueTokensB.push(t);
    }

    const similarity = this.computeSimilarity(nodeA, nodeB);

    return {
      nodeA: {
        id: nodeA.id,
        title: nodeA.title,
        docTitle: nodeA.docTitle || "سند نامشخص",
        docColor: nodeA.docColor || "#38bdf8",
        full_text: nodeA.full_text || nodeA.summary || "بدون متن تشریحی",
        researchers: nodeA.researchers || [],
        tags: nodeA.tags || [],
        uniqueTokens: uniqueTokensA.slice(0, 15)
      },
      nodeB: {
        id: nodeB.id,
        title: nodeB.title,
        docTitle: nodeB.docTitle || "سند نامشخص",
        docColor: nodeB.docColor || "#a855f7",
        full_text: nodeB.full_text || nodeB.summary || "بدون متن تشریحی",
        researchers: nodeB.researchers || [],
        tags: nodeB.tags || [],
        uniqueTokens: uniqueTokensB.slice(0, 15)
      },
      similarityScore: similarity,
      similarityPercent: Math.round(similarity * 100),
      visualAlpha: this.similarityToAlpha(similarity),
      restDistance: this.similarityToRestDistance(similarity),
      sharedKeywords: sharedTokens.slice(0, 20),
      isCrossDoc: nodeA.docId !== nodeB.docId
    };
  }
}

window.similarityEngine = new SimilarityEngine(window.docManager);
