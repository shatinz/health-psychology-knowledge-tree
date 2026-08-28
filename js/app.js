/**
 * Master Application Controller (OmniTree UI)
 * Coordinates Tree, Graph, Diff Matrix, Document Hub, and Search Engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  const docManager = window.docManager;
  const similarityEngine = window.similarityEngine;
  const searchEngine = window.searchEngine;

  let activeView = 'tree'; // 'tree' | 'graph' | 'matrix' | 'doc_hub'
  let treeRenderer = null;
  let graphRenderer = null;

  // DOM Elements
  const viewTreeBtn = document.getElementById('btn-view-tree');
  const viewGraphBtn = document.getElementById('btn-view-graph');
  const viewMatrixBtn = document.getElementById('btn-view-matrix');
  const viewTheoristsBtn = document.getElementById('btn-view-theorists');
  const viewDocHubBtn = document.getElementById('btn-view-dochub');

  const viewTreeContainer = document.getElementById('view-tree');
  const viewGraphContainer = document.getElementById('view-graph');
  const viewMatrixContainer = document.getElementById('view-matrix');
  const viewTheoristsContainer = document.getElementById('view-theorists');
  const viewDocHubContainer = document.getElementById('view-dochub');

  const docSelector = document.getElementById('doc-selector');
  const searchInput = document.getElementById('main-search-input');
  const searchResultsDropdown = document.getElementById('search-results-dropdown');
  const filterPillsContainer = document.getElementById('filter-pills');

  const inspectorDrawer = document.getElementById('inspector-drawer');
  const inspectorBackdrop = document.getElementById('inspector-backdrop');
  const btnCloseInspector = document.getElementById('btn-close-inspector');
  const inspectorContent = document.getElementById('inspector-content');

  function closeInspector() {
    inspectorDrawer?.classList.remove('is-open');
    inspectorBackdrop?.classList.remove('is-open');
  }

  btnCloseInspector?.addEventListener('click', closeInspector);
  inspectorBackdrop?.addEventListener('click', closeInspector);

  const diffModal = document.getElementById('diff-modal');
  const btnCloseDiffModal = document.getElementById('btn-close-diff-modal');
  const diffModalContent = document.getElementById('diff-modal-body');

  const theoristModal = document.getElementById('theorist-modal');
  const btnCloseTheoristModal = document.getElementById('btn-close-theorist-modal');
  const theoristModalBody = document.getElementById('theorist-modal-body');
  const theoristModalName = document.getElementById('theorist-modal-name');
  const theoristModalField = document.getElementById('theorist-modal-field');

  function closeTheoristModal() {
    theoristModal?.classList.add('hidden');
  }

  const btnToggleHeaders = document.getElementById('btn-toggle-headers');
  const btnRevealHeaders = document.getElementById('btn-reveal-headers');

  function toggleZenMode() {
    const isCollapsed = document.body.classList.toggle('headers-collapsed');
    if (btnRevealHeaders) {
      if (isCollapsed) btnRevealHeaders.classList.remove('hidden');
      else btnRevealHeaders.classList.add('hidden');
    }
    if (activeView === 'graph' && graphRenderer) {
      setTimeout(() => graphRenderer.resize(), 50);
    }
  }

  btnToggleHeaders?.addEventListener('click', toggleZenMode);
  btnRevealHeaders?.addEventListener('click', toggleZenMode);

  // Graph Overlay Panels Minimize / Restore
  const graphControlsPanel = document.getElementById('graph-controls-panel');
  const btnMinimizeControls = document.getElementById('btn-minimize-controls');
  const btnRestoreControls = document.getElementById('btn-restore-controls');

  const graphLegendPanel = document.getElementById('graph-legend-panel');
  const btnMinimizeLegend = document.getElementById('btn-minimize-legend');
  const btnRestoreLegend = document.getElementById('btn-restore-legend');

  btnMinimizeControls?.addEventListener('click', () => {
    graphControlsPanel?.classList.add('hidden');
    btnRestoreControls?.classList.remove('hidden');
  });

  btnRestoreControls?.addEventListener('click', () => {
    graphControlsPanel?.classList.remove('hidden');
    btnRestoreControls?.classList.add('hidden');
  });

  btnMinimizeLegend?.addEventListener('click', () => {
    graphLegendPanel?.classList.add('hidden');
    btnRestoreLegend?.classList.remove('hidden');
  });

  btnRestoreLegend?.addEventListener('click', () => {
    graphLegendPanel?.classList.remove('hidden');
    btnRestoreLegend?.classList.add('hidden');
  });

  // Close drawer and modals on ESC key, and toggle Zen with 'f'
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (theoristModal && !theoristModal.classList.contains('hidden')) {
        closeTheoristModal();
      } else if (diffModal && !diffModal.classList.contains('hidden')) {
        diffModal.classList.add('hidden');
      } else if (inspectorDrawer && inspectorDrawer.classList.contains('is-open')) {
        closeInspector();
      } else if (document.body.classList.contains('headers-collapsed')) {
        toggleZenMode();
      }
    } else if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      toggleZenMode();
    }
  });

  const btnExpandAll = document.getElementById('btn-expand-all');
  const btnCollapseAll = document.getElementById('btn-collapse-all');
  const btnResetGraph = document.getElementById('btn-reset-graph');
  const hudTotalNodes = document.getElementById('hud-total-nodes');
  const hudActiveDoc = document.getElementById('hud-active-doc');
  const hudLinksCount = document.getElementById('hud-links-count');

  // Initialize Renderers
  function handleNodeSelection(node) {
    if (!node) return;
    openInspector(node);
  }

  treeRenderer = new window.TreeRenderer('tree-canvas-container', docManager, handleNodeSelection);
  graphRenderer = new window.GraphRenderer('neural-graph-canvas', docManager, similarityEngine, handleNodeSelection);

  // Initialize Document Selector
  function updateDocSelector() {
    if (!docSelector) return;
    const docs = docManager.listDocuments();
    docSelector.innerHTML = '<option value="all">🌐 جهان چندسندی (همه اسناد یکپارچه)</option>';
    docs.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `📖 ${d.title} (${d.nodeCount} گره)`;
      docSelector.appendChild(opt);
    });
    docSelector.value = docManager.activeDocId;
  }

  function updateHUD() {
    const activeTree = docManager.getActiveTree();
    const count = docManager.countNodes(activeTree);
    if (hudTotalNodes) hudTotalNodes.textContent = count;
    if (hudActiveDoc) {
      if (docManager.activeDocId === 'all') {
        hudActiveDoc.textContent = `${docManager.documents.size} سند فعال`;
      } else {
        const doc = docManager.documents.get(docManager.activeDocId);
        hudActiveDoc.textContent = doc ? doc.title : 'سند نامشخص';
      }
    }
    const links = docManager.getAllCrossLinks();
    if (hudLinksCount) hudLinksCount.textContent = links.length;
  }

  // Switch View
  function switchView(viewName) {
    activeView = viewName;
    [viewTreeBtn, viewGraphBtn, viewMatrixBtn, viewDocHubBtn].forEach(b => b?.classList.remove('active'));
    [viewTreeContainer, viewGraphContainer, viewMatrixContainer, viewDocHubContainer].forEach(c => c?.classList.add('hidden'));

    if (viewName === 'tree') {
      viewTreeBtn?.classList.add('active');
      viewTreeContainer?.classList.remove('hidden');
      treeRenderer.render();
    } else if (viewName === 'graph') {
      viewGraphBtn?.classList.add('active');
      viewGraphContainer?.classList.remove('hidden');
      graphRenderer.resize();
      graphRenderer.initGraphData();
    } else if (viewName === 'matrix') {
      viewMatrixBtn?.classList.add('active');
      viewMatrixContainer?.classList.remove('hidden');
      renderMatrixView();
    } else if (viewName === 'theorists') {
      viewTheoristsBtn?.classList.add('active');
      viewTheoristsContainer?.classList.remove('hidden');
      renderTheoristsView();
    } else if (viewName === 'doc_hub') {
      viewDocHubBtn?.classList.add('active');
      viewDocHubContainer?.classList.remove('hidden');
      renderDocHubView();
    }
  }

  // Event Listeners for Views
  viewTreeBtn?.addEventListener('click', () => switchView('tree'));
  viewGraphBtn?.addEventListener('click', () => switchView('graph'));
  viewMatrixBtn?.addEventListener('click', () => switchView('matrix'));
  viewTheoristsBtn?.addEventListener('click', () => switchView('theorists'));
  viewDocHubBtn?.addEventListener('click', () => switchView('doc_hub'));

  docSelector?.addEventListener('change', (e) => {
    docManager.setActiveDocument(e.target.value);
    updateHUD();
    if (activeView === 'tree') treeRenderer.render();
    if (activeView === 'graph') graphRenderer.initGraphData();
    if (activeView === 'matrix') renderMatrixView();
    if (activeView === 'theorists') renderTheoristsView();
  });

  btnExpandAll?.addEventListener('click', () => treeRenderer.expandAll());
  btnCollapseAll?.addEventListener('click', () => treeRenderer.collapseToChapters());
  btnResetGraph?.addEventListener('click', () => graphRenderer.resetView());

  // Graph Floating Toolbar Controls
  const graphLevelSelect = document.getElementById('graph-level-select');
  const graphSpacingSlider = document.getElementById('graph-spacing-slider');
  const btnTogglePhysics = document.getElementById('btn-graph-toggle-physics');
  const btnUnpinAll = document.getElementById('btn-graph-unpin-all');
  const physicsIcon = document.getElementById('physics-icon');
  const physicsText = document.getElementById('physics-text');

  graphLevelSelect?.addEventListener('change', (e) => {
    graphRenderer.setExpansionLevel(e.target.value);
  });

  graphSpacingSlider?.addEventListener('input', (e) => {
    graphRenderer.setSpacingMultiplier(parseFloat(e.target.value));
  });

  btnTogglePhysics?.addEventListener('click', () => {
    const isRunning = graphRenderer.togglePhysics();
    if (physicsIcon) physicsIcon.textContent = isRunning ? '⏸️' : '▶️';
    if (physicsText) physicsText.textContent = isRunning ? 'توقف فیزیک' : 'ادامه فیزیک';
  });

  btnUnpinAll?.addEventListener('click', () => {
    graphRenderer.unpinAllNodes();
  });

  // Search Engine Integration
  function performSearch() {
    const q = searchInput?.value || '';
    if (!q.trim()) {
      if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');
      treeRenderer.setHighlights([]);
      return;
    }

    const results = searchEngine.search(q, { docId: docManager.activeDocId });
    renderSearchResults(results);
    const nodeIds = results.map(r => r.node.id);
    treeRenderer.setHighlights(nodeIds);
  }

  searchInput?.addEventListener('input', performSearch);

  function renderSearchResults(results) {
    if (!searchResultsDropdown) return;
    searchResultsDropdown.innerHTML = '';

    if (results.length === 0) {
      searchResultsDropdown.innerHTML = '<div class="p-3 text-sm text-gray-400">موردی یافت نشد.</div>';
      searchResultsDropdown.classList.remove('hidden');
      return;
    }

    results.slice(0, 8).forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sky-400">${res.node.title}</span>
          <span class="text-xs text-gray-400">${res.matches.join(', ')}</span>
        </div>
        <div class="text-xs text-gray-300 truncate mt-1">${res.node.summary || res.node.full_text || ''}</div>
      `;
      item.onclick = () => {
        searchResultsDropdown.classList.add('hidden');
        if (activeView === 'tree') {
          treeRenderer.scrollToNode(res.node.id);
        } else if (activeView === 'graph') {
          graphRenderer.focusNode(res.node.id);
        }
        openInspector(res.node);
      };
      searchResultsDropdown.appendChild(item);
    });

    searchResultsDropdown.classList.remove('hidden');
  }

  // Inspector Drawer Handler
  function openInspector(node) {
    if (!inspectorDrawer || !inspectorContent) return;

    const fullNode = docManager.getNodeById(node.id) || node;
    const isDocUniverse = docManager.activeDocId === 'all';

    let researchersHtml = '';
    if (fullNode.researchers && fullNode.researchers.length > 0) {
      researchersHtml = `
        <div class="mt-4">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">پژوهشگران و نظریه‌پردازان:</h4>
          <div class="flex flex-wrap gap-1.5">
            ${fullNode.researchers.map(r => `
              <span class="badge badge-researcher cursor-pointer hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30 transition" onclick="window.omniApp.openTheoristModal('${r.replace(/'/g, "\\'")}')" title="مشاهده شناسنامه و نظریات کامل ${r}">
                👤 ${r} ↗
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    let pathwaysHtml = '';
    if (fullNode.physiological_pathways && fullNode.physiological_pathways.length > 0) {
      pathwaysHtml = `
        <div class="mt-4">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">مسیرها و هورمون‌های فیزیولوژیک:</h4>
          <div class="flex flex-wrap gap-1.5">
            ${fullNode.physiological_pathways.map(p => `<span class="badge badge-bio">🧬 ${p}</span>`).join('')}
          </div>
        </div>
      `;
    }

    let diffDiagHtml = '';
    if (fullNode.differential_diagnosis && fullNode.differential_diagnosis.length > 0) {
      diffDiagHtml = `
        <div class="mt-4 p-4 rounded-xl bg-rose-950/25 border border-rose-500/35 space-y-2">
          <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔍</span> ملاک‌های تشخیص افتراقی (Differential Diagnosis):
          </h4>
          <div class="space-y-1.5 text-xs text-rose-100">
            ${fullNode.differential_diagnosis.map(d => `
              <div class="flex items-start gap-1.5 p-2 rounded bg-black/40 border border-rose-800/30">
                <span class="text-rose-400 font-bold">•</span>
                <div>${d}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let diagCriteriaHtml = '';
    if (fullNode.diagnostic_criteria && fullNode.diagnostic_criteria.length > 0) {
      diagCriteriaHtml = `
        <div class="mt-4 p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/35 space-y-2">
          <h4 class="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>📋</span> ملاک‌ها و ویژگی‌های تشخیصی (Diagnostic Features):
          </h4>
          <div class="space-y-1.5 text-xs text-indigo-100">
            ${fullNode.diagnostic_criteria.map(c => `
              <div class="flex items-start gap-1.5 p-2 rounded bg-black/40 border border-indigo-800/30">
                <span class="text-indigo-400 font-bold">✔</span>
                <div>${c}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let examplesHtml = '';
    if (fullNode.clinical_examples && fullNode.clinical_examples.length > 0) {
      examplesHtml = `
        <div class="mt-4 p-4 rounded-xl bg-amber-950/25 border border-amber-500/35 space-y-2">
          <h4 class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>💡</span> نمونه‌های عینی و مصادیق مطرح‌شده در کتاب (Clinical Examples):
          </h4>
          <div class="space-y-1.5 text-xs text-amber-100">
            ${fullNode.clinical_examples.map(ex => `
              <div class="flex items-start gap-1.5 p-2 rounded bg-black/40 border border-amber-800/30">
                <span class="text-amber-400 font-bold">📌</span>
                <div>${ex}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let tagsHtml = '';
    if (fullNode.tags && fullNode.tags.length > 0) {
      tagsHtml = `
        <div class="mt-4">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">برچسب‌های موضوعی:</h4>
          <div class="flex flex-wrap gap-1.5">
            ${fullNode.tags.map(t => `<span class="node-tag-pill">#${t}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Find cross links for this node
    const allLinks = docManager.getAllCrossLinks();
    const relatedLinks = allLinks.filter(l => l.source === fullNode.id || l.target === fullNode.id);
    let linksHtml = '';
    if (relatedLinks.length > 0) {
      linksHtml = `
        <div class="mt-5 p-3 rounded-lg bg-sky-950/30 border border-sky-800/40">
          <h4 class="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-2">🔗 پیوندها و اتصالات مفهومی مرتبط (${relatedLinks.length}):</h4>
          <div class="space-y-2">
            ${relatedLinks.map(l => {
              const otherId = l.source === fullNode.id ? l.target : l.source;
              const otherNode = docManager.getNodeById(otherId);
              return `
                <div class="text-xs p-2 rounded bg-black/40 border border-sky-700/30 cursor-pointer hover:border-sky-400 transition" onclick="window.omniApp.navigateToNode('${otherId}')">
                  <div class="font-semibold text-sky-300">${l.relation}</div>
                  <div class="text-gray-300 mt-1">${l.description}</div>
                  <div class="text-[10px] text-gray-400 mt-1">مقصد: ${otherNode ? otherNode.title : otherId}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Find contrasts for this node
    const allContrasts = docManager.getAllContrasts();
    const relatedContrasts = allContrasts.filter(c => c.nodeA === fullNode.id || c.nodeB === fullNode.id);
    let contrastsHtml = '';
    if (relatedContrasts.length > 0) {
      contrastsHtml = `
        <div class="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
          <h4 class="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">⚡ تضادها و تمایزات نظری (${relatedContrasts.length}):</h4>
          <div class="space-y-2">
            ${relatedContrasts.map((c, idx) => `
              <div class="text-xs p-2 rounded bg-black/40 border border-amber-700/30">
                <div class="font-semibold text-amber-300">${c.contrast_title}</div>
                <div class="text-gray-300 mt-1">${c.description}</div>
                <button class="mt-2 text-[11px] px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/40" onclick="window.omniApp.showContrastModal(${idx})">
                  مشاهده ماتریس مقایسه دو دیدگاه
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    inspectorContent.innerHTML = `
      <div class="p-5 space-y-4">
        <div class="border-b border-gray-800 pb-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="badge" style="background:${fullNode.docColor || '#00d4ff'}22; color:${fullNode.docColor || '#00d4ff'}; border:1px solid ${fullNode.docColor || '#00d4ff'}66;">
              ${fullNode.docTitle || 'روانشناسی سلامت'}
            </span>
            <span class="text-xs text-gray-400">${fullNode.type}</span>
          </div>
          <h2 class="text-lg font-bold text-white leading-snug">${fullNode.title}</h2>
          ${fullNode.parentTitle ? `<p class="text-xs text-gray-400 mt-1">شاخه والد: ${fullNode.parentTitle}</p>` : ''}
        </div>

        <div class="prose prose-invert max-w-none text-sm text-gray-200 leading-relaxed space-y-3">
          ${(fullNode.full_text || fullNode.summary || '').split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')}
        </div>

        ${diffDiagHtml}
        ${diagCriteriaHtml}
        ${examplesHtml}
        ${researchersHtml}
        ${pathwaysHtml}
        ${tagsHtml}
        ${linksHtml}
        ${contrastsHtml}
      </div>
    `;

    inspectorDrawer?.classList.add('is-open');
    inspectorBackdrop?.classList.add('is-open');
  }

  // Matrix View Renderer
  function renderMatrixView() {
    if (!viewMatrixContainer) return;
    const contrasts = docManager.getAllContrasts();
    const autoLinks = similarityEngine.discoverAutomatedLinks(0.25);

    let contrastsCardsHtml = contrasts.map((c, i) => `
      <div class="contrast-card glass-panel p-5 rounded-xl border border-amber-500/30 hover:border-amber-400/60 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#fbbf24; border:1px solid rgba(245, 158, 11, 0.4);">⚡ تضاد و تقابل نظری</span>
          <span class="text-xs text-gray-400">${c.dimension}</span>
        </div>
        <h3 class="text-base font-bold text-white mb-2">${c.contrast_title}</h3>
        <p class="text-xs text-gray-300 leading-relaxed mb-4">${c.description}</p>
        
        ${c.comparison_table ? `
          <div class="overflow-x-auto rounded-lg border border-gray-800 mb-3">
            <table class="w-full text-xs text-right text-gray-300">
              <thead class="bg-gray-900/80 text-gray-400">
                <tr>
                  <th class="p-2 border-b border-gray-800">مؤلفه / بعد</th>
                  <th class="p-2 border-b border-gray-800 text-sky-400">دیدگاه اول</th>
                  <th class="p-2 border-b border-gray-800 text-purple-400">دیدگاه دوم</th>
                </tr>
              </thead>
              <tbody>
                ${c.comparison_table.map(row => `
                  <tr class="border-b border-gray-800/50 hover:bg-white/5">
                    <td class="p-2 font-medium text-gray-300">${row.feature}</td>
                    <td class="p-2 text-sky-200">${row.sideA}</td>
                    <td class="p-2 text-purple-200">${row.sideB}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `).join('');

    let similaritiesHtml = autoLinks.slice(0, 12).map(l => {
      const nodeA = docManager.getNodeById(l.source);
      const nodeB = docManager.getNodeById(l.target);
      if (!nodeA || !nodeB) return '';
      return `
        <div class="similarity-card glass-panel p-4 rounded-xl border border-sky-500/30 hover:border-sky-400 transition">
          <div class="flex items-center justify-between mb-2">
            <span class="badge badge-bio">همبستگی: ${Math.round(l.weight * 100)}٪</span>
            <span class="text-xs text-gray-400">شفافیت بصری: ${(l.alpha * 100).toFixed(0)}٪</span>
          </div>
          <div class="flex items-center gap-2 text-xs font-semibold text-white my-2">
            <span class="text-sky-400 truncate">${nodeA.title}</span>
            <span class="text-gray-500">⇄</span>
            <span class="text-purple-400 truncate">${nodeB.title}</span>
          </div>
          <p class="text-xs text-gray-300 mt-1">${l.description}</p>
          <button class="mt-3 text-xs text-sky-400 hover:text-sky-300 underline" onclick="window.omniApp.compareNodes('${nodeA.id}', '${nodeB.id}')">
            مقایسه عمیق ساید‌بای‌ساید (Side-by-Side Diff)
          </button>
        </div>
      `;
    }).join('');

    viewMatrixContainer.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h2 class="text-xl font-bold text-white mb-1">ماتریس تضادها، تقابل‌ها و پیوندهای چندسندی</h2>
          <p class="text-xs text-gray-400">تحلیل بصری تفاوت‌های مکاتب و پیوندهای ارگانیک بین فصول و اسناد مختلف</p>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">⚡ تضادهای بنیادین نظری و فلسفی (${contrasts.length})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${contrastsCardsHtml}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-4">🔗 پل‌های تشابه و همگرایی خودکار بین مفاهیم</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${similaritiesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Document Hub View Renderer
  function renderDocHubView() {
    if (!viewDocHubContainer) return;
    const docs = docManager.listDocuments();

    viewDocHubContainer.innerHTML = `
      <div class="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 class="text-xl font-bold text-white mb-1">مرکز مدیریت اسناد و پایگاه دانش چندسندی</h2>
          <p class="text-xs text-gray-400">بارگذاری PDFهای جدید، خروجی گرفتن و مدیریت درخت‌های دانش</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${docs.map(d => `
            <div class="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="badge" style="background:${d.metadata?.color || '#00d4ff'}22; color:${d.metadata?.color || '#00d4ff'}; border:1px solid ${d.metadata?.color || '#00d4ff'}66;">
                    ${d.metadata?.badge || 'سند'}
                  </span>
                  <span class="text-xs text-gray-400">${d.metadata?.pages || 0} صفحه</span>
                </div>
                <h3 class="text-base font-bold text-white mb-1">${d.title}</h3>
                <p class="text-xs text-gray-400 mb-2">نویسنده / تدوین: ${d.author}</p>
                <p class="text-xs text-gray-300">${d.metadata?.description || ''}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                <span class="text-sky-400 font-semibold">${d.nodeCount} گره دانش</span>
                <button class="px-3 py-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded border border-sky-500/40" onclick="window.omniApp.selectDoc('${d.id}')">
                  مشاهده انحصاری این سند
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="glass-panel p-6 rounded-xl border border-dashed border-gray-700 text-center space-y-4">
          <div class="text-4xl">📥</div>
          <h3 class="text-base font-bold text-white">افزودن سند یا کتاب جدید به درخت دانش</h3>
          <p class="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
            شما می‌توانید ساختار استخراج‌شده از هر کتاب یا PDF دیگر را در قالب استاندارد JSON بارگذاری نمایید تا فوراً به جهان دانش افزوده شده و فواصل و تضادهای آن به صورت خودکار محاسبه شود.
          </p>
          <div class="flex justify-center gap-3">
            <input type="file" id="json-file-input" accept=".json" class="hidden" />
            <button class="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg" onclick="document.getElementById('json-file-input').click()">
              انتخاب و بارگذاری فایل JSON سند جدید
            </button>
            <button class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold border border-gray-700" onclick="window.omniApp.exportUniverse()">
              دانلود کل پایگاه دانش (JSON)
            </button>
          </div>
        </div>
      </div>
    `;

    const fileInput = document.getElementById('json-file-input');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = docManager.importJSONString(event.target.result);
        alert(result.message);
        if (result.success) {
          updateDocSelector();
          updateHUD();
          renderDocHubView();
        }
      };
      reader.readAsText(file);
    });
  }

  // Theorists Encyclopedia View Renderer
  function renderTheoristsView() {
    if (!viewTheoristsContainer || !window.theoristEngine) return;
    const theorists = window.theoristEngine.getAllTheoristsList();

    viewTheoristsContainer.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>👥</span> دانشنامه و شناسنامه جامع نظریه‌پردازان و دانشمندان
            </h2>
            <p class="text-xs text-gray-400 mt-1">
              نمایه کامل ${theorists.length} پژوهشگر، فیزیولوژیست و نظریه‌پرداز با متن کامل و دست‌نخورده نظریات مطرح‌شده در کتاب‌ها
            </p>
          </div>
          <!-- Quick Search in Theorists -->
          <div class="relative w-72">
            <input 
              type="text" 
              id="theorist-search-input" 
              placeholder="جستجو در نام دانشمند یا مکتب..." 
              class="w-full bg-slate-900 border border-white/20 focus:border-purple-400 text-xs text-white px-3 py-2 rounded-xl focus:outline-none transition shadow-inner"
            />
          </div>
        </div>

        <!-- Theorist Cards Grid -->
        <div id="theorists-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${renderTheoristCards(theorists)}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('theorist-search-input');
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = theorists.filter(t => 
        t.rawName.toLowerCase().includes(q) || 
        t.cleanName.toLowerCase().includes(q) ||
        Array.from(t.docs).some(d => d.toLowerCase().includes(q))
      );
      const grid = document.getElementById('theorists-grid');
      if (grid) grid.innerHTML = renderTheoristCards(filtered);
    });
  }

  function renderTheoristCards(list) {
    if (!list.length) {
      return `<div class="col-span-full p-8 text-center text-gray-400">نظریه‌پردازی با این مشخصات یافت نشد.</div>`;
    }
    return list.map(t => {
      const dossier = window.theoristEngine.getTheoristDossier(t.rawName);
      const p = dossier.profile;
      const docsArray = Array.from(t.docs);

      return `
        <div class="glass-panel p-5 rounded-xl border border-purple-500/20 hover:border-purple-400/60 transition flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-purple-950/40" onclick="window.omniApp.openTheoristModal('${t.rawName.replace(/'/g, "\\'")}')">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge badge-researcher">👤 ${t.rawName}</span>
              <span class="text-xs text-purple-400 font-semibold">${t.nodeCount} مبحث در کتاب</span>
            </div>
            <h4 class="text-sm font-bold text-white mt-1 mb-1">${p.title || t.cleanName}</h4>
            <p class="text-xs text-purple-300/80 mb-2">${p.school || p.field || 'روانشناسی و علوم اعصاب'}</p>
            <p class="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-3">${p.coreConcept || p.bio || ''}</p>
          </div>
          <div class="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <div class="flex flex-wrap gap-1">
              ${docsArray.map(d => `<span class="badge badge-doc text-[10px]">${d}</span>`).join('')}
            </div>
            <span class="text-purple-400 font-semibold hover:underline">مشاهده شناسنامه و نظریات ➔</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Dedicated Theorist Full-Text Dossier Modal
  function showTheoristModal(theoristName) {
    if (!window.theoristEngine || !theoristModal || !theoristModalBody) return;
    const dossier = window.theoristEngine.getTheoristDossier(theoristName);
    const p = dossier.profile;

    if (theoristModalName) theoristModalName.textContent = dossier.name;
    if (theoristModalField) theoristModalField.textContent = `${p.school || ''} • ${p.field || ''}`;

    let quoteHtml = '';
    if (p.famousQuote) {
      quoteHtml = `
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-purple-200 text-xs italic flex items-center gap-2">
          <span class="text-xl">💬</span>
          <div>«${p.famousQuote}»</div>
        </div>
      `;
    }

    let bioPathwaysHtml = '';
    if (dossier.bioPathways.length > 0 || (p.keyMechanisms && p.keyMechanisms.length > 0)) {
      const mechanisms = p.keyMechanisms || dossier.bioPathways;
      bioPathwaysHtml = `
        <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🧬</span> مسیرهای فیزیولوژیک، هورمون‌ها و مکانیسم‌های بیولوژیک مرتبط:
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-100">
            ${mechanisms.map(m => `
              <div class="flex items-start gap-1.5 p-1.5 rounded bg-black/30 border border-emerald-800/30">
                <span class="text-emerald-400">•</span>
                <span>${m}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Complete Unabridged Theories Full-Text from the Book
    let theoriesFullTextHtml = dossier.nodes.map((node, index) => {
      const full = node.full_text || node.summary || 'متن تفصیلی موجود نیست.';
      return `
        <div class="p-5 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 shadow-inner hover:border-purple-400/50 transition">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xs">${index + 1}</span>
              <h4 class="text-sm font-bold text-white">${node.title}</h4>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" style="background:${node.docColor || '#00d4ff'}22; color:${node.docColor || '#00d4ff'}; border:1px solid ${node.docColor || '#00d4ff'}66;">
                ${node.docTitle || 'روانشناسی سلامت'}
              </span>
              <button class="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded border border-cyan-500/40 text-xs font-semibold flex items-center gap-1" onclick="window.omniApp.navigateToNodeFromModal('${node.id}')">
                <span>📍</span> پرش به این بخش در درخت / گراف
              </button>
            </div>
          </div>

          <div class="prose prose-invert max-w-none text-xs text-gray-200 leading-relaxed space-y-2">
            ${full.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`).join('')}
          </div>

          ${node.tags && node.tags.length ? `
            <div class="flex flex-wrap gap-1.5 pt-2 border-t border-gray-900">
              ${node.tags.map(t => `<span class="node-tag-pill">#${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Theoretical Contrasts involving this Theorist
    let contrastsHtml = '';
    if (dossier.relatedContrasts.length > 0) {
      contrastsHtml = `
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚡</span> مناظرات، تقابل‌ها و تضادهای نظری (${dossier.relatedContrasts.length}):
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${dossier.relatedContrasts.map(c => `
              <div class="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div class="text-xs font-bold text-amber-300">${c.contrast_title}</div>
                <div class="text-[11px] text-gray-300">${c.description}</div>
                ${c.comparison_table ? `
                  <div class="overflow-x-auto rounded border border-gray-800 mt-2">
                    <table class="w-full text-[11px] text-right text-gray-300">
                      <thead class="bg-gray-900 text-gray-400">
                        <tr>
                          <th class="p-1.5 border-b border-gray-800">مؤلفه</th>
                          <th class="p-1.5 border-b border-gray-800 text-sky-400">دیدگاه اول</th>
                          <th class="p-1.5 border-b border-gray-800 text-purple-400">دیدگاه دوم</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${c.comparison_table.map(row => `
                          <tr class="border-b border-gray-800/50">
                            <td class="p-1.5 font-medium text-gray-300">${row.feature}</td>
                            <td class="p-1.5 text-sky-200">${row.sideA}</td>
                            <td class="p-1.5 text-purple-200">${row.sideB}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    theoristModalBody.innerHTML = `
      <!-- Bio Profile Overview -->
      <div class="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 border border-purple-500/30 space-y-3">
        <div class="flex items-center justify-between">
          <span class="badge badge-researcher text-xs">👤 ${dossier.name}</span>
          <span class="text-xs text-gray-400">${dossier.nodeCount} مبحث تخصصی در کتاب‌ها</span>
        </div>
        <h3 class="text-base font-bold text-white">${p.title || dossier.name}</h3>
        <p class="text-xs text-gray-300 leading-relaxed">${p.bio || ''}</p>
        ${quoteHtml}
      </div>

      ${bioPathwaysHtml}

      <!-- Full-Text Theories Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-2">
          <h4 class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📖</span> شرح کامل و تفصیلی تمام نظریات در کتاب (${dossier.nodeCount} مبحث):
          </h4>
          <span class="text-[11px] text-gray-400 font-normal">متن کامل بدون تلخیص و حذفیات</span>
        </div>
        <div class="space-y-4">
          ${theoriesFullTextHtml}
        </div>
      </div>

      ${contrastsHtml}
    `;

    theoristModal.classList.remove('hidden');
  }

  // Global helper exposures
  window.omniApp = {
    navigateToNode: (nodeId) => {
      const node = docManager.getNodeById(nodeId);
      if (node) {
        if (activeView === 'tree') treeRenderer.scrollToNode(nodeId);
        else if (activeView === 'graph') graphRenderer.focusNode(nodeId);
        openInspector(node);
      }
    },
    navigateToNodeFromModal: (nodeId) => {
      theoristModal?.classList.add('hidden');
      diffModal?.classList.add('hidden');
      const node = docManager.getNodeById(nodeId);
      if (node) {
        switchView('tree');
        treeRenderer.scrollToNode(nodeId);
        openInspector(node);
      }
    },
    showContrastModal: (contrastIndex) => {
      const contrasts = docManager.getAllContrasts();
      const c = contrasts[contrastIndex];
      if (c) {
        showSideBySideDiff(c.nodeA, c.nodeB);
      }
    },
    compareNodes: (nodeIdA, nodeIdB) => {
      showSideBySideDiff(nodeIdA, nodeIdB);
    },
    openTheoristModal: (theoristName) => {
      showTheoristModal(theoristName);
    },
    selectDoc: (docId) => {
      docManager.setActiveDocument(docId);
      if (docSelector) docSelector.value = docId;
      updateHUD();
      switchView('tree');
    },
    exportUniverse: () => {
      const json = docManager.exportCurrentUniverseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnitree_knowledge_universe_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Initial Load
  updateDocSelector();
  updateHUD();
  switchView('tree');
});

