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
      node.researchers.forEach(r => {
        const resBadge = document.createElement("span");
        resBadge.className = "badge badge-researcher cursor-pointer hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30 transition";
        resBadge.innerHTML = `👤 ${r}`;
        resBadge.title = `کلیک برای مشاهده شناسنامه و تمام نظریات ${r}`;
        resBadge.onclick = (e) => {
          e.stopPropagation();
          if (window.omniApp && typeof window.omniApp.openTheoristModal === 'function') {
            window.omniApp.openTheoristModal(r);
          }
        };
        badgeContainer.appendChild(resBadge);
      });
    }

    if (node.physiological_pathways && node.physiological_pathways.length > 0) {
      const bioBadge = document.createElement("span");
      bioBadge.className = "badge badge-bio";
      bioBadge.innerHTML = `🧬 ${node.physiological_pathways.length} مسیر زیستی`;
      badgeContainer.appendChild(bioBadge);
    }

    if (node.page) {
      const pageBadge = document.createElement("span");
      pageBadge.className = "badge";
      pageBadge.style.background = "rgba(100, 116, 139, 0.2)";
      pageBadge.style.color = "#cbd5e1";
      pageBadge.style.border = "1px solid rgba(100, 116, 139, 0.4)";
      pageBadge.textContent = `📄 ص ${node.page}`;
      badgeContainer.appendChild(pageBadge);
    }

    if (node.pages) {
      const pagesBadge = document.createElement("span");
      pagesBadge.className = "badge";
      pagesBadge.style.background = "rgba(100, 116, 139, 0.2)";
      pagesBadge.style.color = "#cbd5e1";
      pagesBadge.style.border = "1px solid rgba(100, 116, 139, 0.4)";
      pagesBadge.textContent = `📄 ${node.pages}`;
      badgeContainer.appendChild(pagesBadge);
    }

    // Exam Forecast Weight Badge
    if (node.exam_weight) {
      const weightBadge = document.createElement("span");
      weightBadge.className = "badge";
      if (node.exam_weight === 'high') {
        weightBadge.style.background = "rgba(244, 63, 94, 0.15)";
        weightBadge.style.color = "#fda4af";
        weightBadge.style.border = "1px solid rgba(244, 63, 94, 0.35)";
        weightBadge.textContent = `🔴 ضریب ۳ (${node.forecast_probability || 90}٪)`;
      } else if (node.exam_weight === 'medium') {
        weightBadge.style.background = "rgba(245, 158, 11, 0.15)";
        weightBadge.style.color = "#fcd34d";
        weightBadge.style.border = "1px solid rgba(245, 158, 11, 0.35)";
        weightBadge.textContent = `🟠 ضریب ۲ (${node.forecast_probability || 75}٪)`;
      } else {
        weightBadge.style.background = "rgba(234, 179, 8, 0.15)";
        weightBadge.style.color = "#fef08a";
        weightBadge.style.border = "1px solid rgba(234, 179, 8, 0.35)";
        weightBadge.textContent = `🟡 ضریب ۱ (${node.forecast_probability || 60}٪)`;
      }
      badgeContainer.appendChild(weightBadge);
    }

    // Mastery Badge (90%+)
    if (window.omniApp && window.omniApp.quizEngine) {
      if (window.omniApp.quizEngine.isNodeMastered(node.id)) {
        const masterBadge = document.createElement("span");
        masterBadge.className = "badge";
        masterBadge.style.background = "rgba(16, 185, 129, 0.2)";
        masterBadge.style.color = "#6ee7b7";
        masterBadge.style.border = "1px solid rgba(16, 185, 129, 0.4)";
        masterBadge.textContent = "🏆 مسلط‌شده (۹۰٪+)";
        badgeContainer.appendChild(masterBadge);
      } else if (window.omniApp.quizEngine.isExamModeActive && (node.type === 'section' || node.exam_weight)) {
        const lockBadge = document.createElement("span");
        lockBadge.className = "badge";
        lockBadge.style.background = "rgba(245, 158, 11, 0.2)";
        lockBadge.style.color = "#fbbf24";
        lockBadge.style.border = "1px solid rgba(245, 158, 11, 0.4)";
        lockBadge.textContent = "🔒 نیازمند آزمون ۹۰٪";
        badgeContainer.appendChild(lockBadge);
      }
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
