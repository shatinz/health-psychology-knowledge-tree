/**
 * Document Manager: OmniDoc Registry & Normalizer
 * Manages multiple documents, active modes, tree merging, and dynamic document imports.
 */

class DocumentManager {
  constructor() {
    this.documents = new Map();
    this.activeDocId = "all"; // 'all' or specific document ID
    this.nodeIndex = new Map(); // id -> node details with doc metadata
    this.onDocumentsChanged = null;

    // Register built-in default documents
    if (window.DOC_HEALTH_PSYCHOLOGY) {
      this.registerDocument(window.DOC_HEALTH_PSYCHOLOGY);
    }
    if (window.DOC_CLINICAL_PSYCHOSOMATICS) {
      this.registerDocument(window.DOC_CLINICAL_PSYCHOSOMATICS);
    }
  }

  registerDocument(doc) {
    if (!doc || !doc.id || !doc.tree) {
      console.error("Invalid document schema:", doc);
      return false;
    }
    this.documents.set(doc.id, doc);
    this.rebuildNodeIndex();
    if (typeof this.onDocumentsChanged === 'function') {
      this.onDocumentsChanged(this.listDocuments());
    }
    return true;
  }

  removeDocument(docId) {
    if (this.documents.has(docId)) {
      this.documents.delete(docId);
      if (this.activeDocId === docId) {
        this.activeDocId = "all";
      }
      this.rebuildNodeIndex();
      if (typeof this.onDocumentsChanged === 'function') {
        this.onDocumentsChanged(this.listDocuments());
      }
      return true;
    }
    return false;
  }

  listDocuments() {
    return Array.from(this.documents.values()).map(d => ({
      id: d.id,
      title: d.title,
      author: d.author,
      metadata: d.metadata,
      nodeCount: this.countNodes(d.tree)
    }));
  }

  countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children && Array.isArray(node.children)) {
      for (const c of node.children) {
        count += this.countNodes(c);
      }
    }
    return count;
  }

  setActiveDocument(docId) {
    if (docId === "all" || this.documents.has(docId)) {
      this.activeDocId = docId;
      return true;
    }
    return false;
  }

  getActiveTree() {
    if (this.activeDocId === "all") {
      // Create unified multi-document root
      const docs = Array.from(this.documents.values());
      if (docs.length === 1) {
        return docs[0].tree;
      }
      return {
        id: "universe_root",
        title: "جهان دانش چندسندی (Multi-Document Universe)",
        type: "root",
        summary: `مجموعه یکپارچه ${docs.length} سند و منبع علمی با پیوندهای بین‌سندی`,
        docId: "universe",
        children: docs.map(d => ({
          ...d.tree,
          docId: d.id,
          docTitle: d.title,
          docColor: d.metadata?.color || "#38bdf8"
        }))
      };
    }

    const doc = this.documents.get(this.activeDocId);
    return doc ? doc.tree : null;
  }

  getAllCrossLinks() {
    let links = [];
    for (const doc of this.documents.values()) {
      if (doc.cross_links && Array.isArray(doc.cross_links)) {
        links.push(...doc.cross_links.map(l => ({ ...l, originDoc: doc.id })));
      }
    }
    return links;
  }

  getAllContrasts() {
    let contrasts = [];
    for (const doc of this.documents.values()) {
      if (doc.contrasts && Array.isArray(doc.contrasts)) {
        contrasts.push(...doc.contrasts.map(c => ({ ...c, originDoc: doc.id })));
      }
    }
    return contrasts;
  }

  rebuildNodeIndex() {
    this.nodeIndex.clear();
    for (const doc of this.documents.values()) {
      this.indexNodeRecursive(doc.tree, null, 0, doc);
    }
  }

  indexNodeRecursive(node, parent, depth, doc) {
    if (!node || !node.id) return;
    const item = {
      ...node,
      parentId: parent ? parent.id : null,
      parentTitle: parent ? parent.title : null,
      depth: depth,
      docId: doc.id,
      docTitle: doc.title,
      docColor: doc.metadata?.color || "#38bdf8"
    };
    this.nodeIndex.set(node.id, item);

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.indexNodeRecursive(child, node, depth + 1, doc);
      }
    }
  }

  getNodeById(nodeId) {
    return this.nodeIndex.get(nodeId);
  }

  exportCurrentUniverseJSON() {
    const data = {
      exported_at: new Date().toISOString(),
      active_document_id: this.activeDocId,
      documents: Array.from(this.documents.values())
    };
    return JSON.stringify(data, null, 2);
  }

  importJSONString(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.documents && Array.isArray(parsed.documents)) {
        let count = 0;
        for (const doc of parsed.documents) {
          if (this.registerDocument(doc)) count++;
        }
        return { success: true, message: `${count} سند با موفقیت بارگذاری شد.` };
      } else if (parsed.id && parsed.tree) {
        this.registerDocument(parsed);
        return { success: true, message: `سند "${parsed.title || parsed.id}" با موفقیت بارگذاری شد.` };
      }
      return { success: false, message: "فرمت JSON با ساختار استاندارد سند همخوانی ندارد." };
    } catch (e) {
      return { success: false, message: "خطا در خواندن فایل JSON: " + e.message };
    }
  }
}

window.docManager = new DocumentManager();
