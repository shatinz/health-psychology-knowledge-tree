/**
 * Interactive Knowledge Tree Renderer
 * Renders hierarchical multi-level collapsible knowledge trees with branch lines, node badges, and search highlighting.
 */

class TreeRenderer {
  constructor(containerId, docManager, onNodeSelect) {
    this.container = document.getElementById(containerId);
    this.docManager = docManager;
    this.onNodeSelect = onNodeSelect;
    this.collapsedNodes = new Set(); // set of node IDs that are collapsed
    this.highlightedNodeIds = new Set();
    this.selectedNodeId = null;
  }

  render() {
    if (!this.container) return;
    const tree = this.docManager.getActiveTree();
    if (!tree) {
      this.container.innerHTML = `<div class="p-8 text-center text-gray-400">سندی برای نمایش یافت نشد.</div>`;
      return;
    }

    this.container.innerHTML = "";
    const treeWrapper = document.createElement("div");
    treeWrapper.className = "tree-root-container";
    treeWrapper.appendChild(this.buildNodeElement(tree, 0));
    this.container.appendChild(treeWrapper);
  }

  buildNodeElement(node, depth) {
    const isCollapsed = this.collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHighlighted = this.highlightedNodeIds.has(node.id);
    const isSelected = this.selectedNodeId === node.id;

    const nodeWrapper = document.createElement("div");
    nodeWrapper.className = `tree-node-wrapper depth-${depth}`;
    nodeWrapper.dataset.nodeId = node.id;

    // Node Card
    const nodeCard = document.createElement("div");
    nodeCard.className = `tree-node-card node-type-${node.type} ${isHighlighted ? 'node-highlight' : ''} ${isSelected ? 'node-selected' : ''}`;
    nodeCard.style.setProperty('--doc-accent', node.docColor || '#00d4ff');

    // Header row: Expand toggle + Type Icon + Title + Badges
    const headerRow = document.createElement("div");
    headerRow.className = "node-header-row";

    // Toggle button for nodes with children
    if (hasChildren) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = `node-toggle-btn ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`;
      toggleBtn.innerHTML = isCollapsed ? '▶' : '▼';
      toggleBtn.title = isCollapsed ? 'باز کردن زیرشاخه‌ها' : 'بستن زیرشاخه‌ها';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggleCollapse(node.id);
      };
      headerRow.appendChild(toggleBtn);
    } else {
      const leafBullet = document.createElement("span");
      leafBullet.className = "node-leaf-bullet";
      leafBullet.innerHTML = "•";
      headerRow.appendChild(leafBullet);
    }

    // Title
    const titleSpan = document.createElement("span");
    titleSpan.className = "node-title";
    titleSpan.textContent = node.title;
    headerRow.appendChild(titleSpan);

    // Badges: Researchers, Type, Doc
    const badgeContainer = document.createElement("div");
    badgeContainer.className = "node-badges-container";

    if (node.docTitle && node.docId !== 'universe') {
      const docBadge = document.createElement("span");
      docBadge.className = "badge badge-doc";
      docBadge.style.backgroundColor = `${node.docColor || '#00d4ff'}22`;
      docBadge.style.borderColor = `${node.docColor || '#00d4ff'}66`;
      docBadge.style.color = node.docColor || '#00d4ff';
      docBadge.textContent = node.docTitle;
      badgeContainer.appendChild(docBadge);
    }

    if (node.researchers && node.researchers.length > 0) {
      const resBadge = document.createElement("span");
      resBadge.className = "badge badge-researcher";
      resBadge.innerHTML = `👤 ${node.researchers.join(", ")}`;
      badgeContainer.appendChild(resBadge);
    }

    if (node.physiological_pathways && node.physiological_pathways.length > 0) {
      const bioBadge = document.createElement("span");
      bioBadge.className = "badge badge-bio";
      bioBadge.innerHTML = `🧬 ${node.physiological_pathways.length} مسیر زیستی`;
      badgeContainer.appendChild(bioBadge);
    }

    if (hasChildren) {
      const countBadge = document.createElement("span");
      countBadge.className = "badge badge-count";
      countBadge.textContent = `${node.children.length} زیرشاخه`;
      badgeContainer.appendChild(countBadge);
    }

    headerRow.appendChild(badgeContainer);
    nodeCard.appendChild(headerRow);

    // Summary or Preview Text (if available)
    if (node.summary || node.full_text) {
      const textPreview = document.createElement("div");
      textPreview.className = "node-text-preview";
      const rawText = node.full_text || node.summary;
      textPreview.textContent = rawText.length > 220 ? rawText.substring(0, 220) + "..." : rawText;
      nodeCard.appendChild(textPreview);
    }

    // Node Tags (if any)
    if (node.tags && node.tags.length > 0) {
      const tagsRow = document.createElement("div");
      tagsRow.className = "node-tags-row";
      node.tags.forEach(tag => {
        const tagPill = document.createElement("span");
        tagPill.className = "node-tag-pill";
        tagPill.textContent = `#${tag}`;
        tagsRow.appendChild(tagPill);
      });
      nodeCard.appendChild(tagsRow);
    }

    // Click handler to select and inspect
    nodeCard.onclick = () => {
      this.selectedNodeId = node.id;
      this.render(); // update selection highlight
      if (typeof this.onNodeSelect === 'function') {
        this.onNodeSelect(node);
      }
    };

    nodeWrapper.appendChild(nodeCard);

    // Children Container
    if (hasChildren && !isCollapsed) {
      const childrenWrapper = document.createElement("div");
      childrenWrapper.className = "tree-children-container";
      node.children.forEach(child => {
        childrenWrapper.appendChild(this.buildNodeElement(child, depth + 1));
      });
      nodeWrapper.appendChild(childrenWrapper);
    }

    return nodeWrapper;
  }

  toggleCollapse(nodeId) {
    if (this.collapsedNodes.has(nodeId)) {
      this.collapsedNodes.delete(nodeId);
    } else {
      this.collapsedNodes.add(nodeId);
    }
    this.render();
  }

  expandAll() {
    this.collapsedNodes.clear();
    this.render();
  }

  collapseToChapters() {
    this.collapsedNodes.clear();
    const tree = this.docManager.getActiveTree();
    if (!tree) return;

    // Collect all section and lower node IDs
    const collectSubnodes = (n) => {
      if (n.type === "chapter" || n.type === "section") {
        this.collapsedNodes.add(n.id);
      }
      if (n.children) {
        n.children.forEach(collectSubnodes);
      }
    };
    collectSubnodes(tree);
    this.render();
  }

  setHighlights(nodeIds) {
    this.highlightedNodeIds = new Set(nodeIds);
    // Ensure parent path is uncollapsed for highlighted nodes
    nodeIds.forEach(id => {
      let current = this.docManager.getNodeById(id);
      while (current && current.parentId) {
        this.collapsedNodes.delete(current.parentId);
        current = this.docManager.getNodeById(current.parentId);
      }
    });
    this.render();
  }

  scrollToNode(nodeId) {
    this.selectedNodeId = nodeId;
    // Uncollapse all parents
    let current = this.docManager.getNodeById(nodeId);
    while (current && current.parentId) {
      this.collapsedNodes.delete(current.parentId);
      current = this.docManager.getNodeById(current.parentId);
    }
    this.render();

    setTimeout(() => {
      const el = this.container.querySelector(`[data-node-id="${nodeId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector(".tree-node-card")?.classList.add("node-pulse");
      }
    }, 100);
  }
}

window.TreeRenderer = TreeRenderer;
