/**
 * Ultra-Clean Interactive Spatial Neural & Similarity Graph Canvas
 * Features:
 * - Dynamic Node Expansion/Collapse (click (+) / (-) on nodes)
 * - Drag & Pin (nodes stay exactly where dragged)
 * - Strict Anti-Collision & Repulsion (nodes never overlap or cluster messily)
 * - Text Pill Backgrounds (labels are 100% crisp and readable over links)
 * - Variable Spacing & Force Controls
 * - Dynamic Link Transparency (opacity proportional to similarity)
 * - Pulsing Contrast Lines & Synapse Particle Streams
 */

class GraphRenderer {
  constructor(canvasId, docManager, similarityEngine, onNodeSelect) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.docManager = docManager;
    this.similarityEngine = similarityEngine;
    this.onNodeSelect = onNodeSelect;

    this.nodes = [];
    this.links = [];
    this.contrasts = [];
    this.particles = [];
    this.nodeMap = new Map();

    // Expansion tracking: which nodes are currently expanded in the graph
    this.expandedNodeIds = new Set();
    this.expansionLevel = 'level2'; // 'chapters' | 'level2' | 'all'

    // Spacing & Physics multipliers
    this.spacingMultiplier = 1.6;
    this.physicsRunning = true;
    this.chargeStrength = 3200;

    // Viewport transforms
    this.scale = 0.85;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.isPanning = false;
    this.dragNode = null;
    this.hoverNode = null;
    this.selectedNode = null;
    this.startX = 0;
    this.startY = 0;
    this.dragMoved = false;

    // Filters
    this.showAutomatedLinks = true;
    this.showContrasts = true;
    this.minSimilarityThreshold = 0.25;
    this.animId = null;

    if (this.canvas) {
      this.initEvents();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.width = w;
    this.height = h;
  }

  setExpansionLevel(level) {
    this.expansionLevel = level;
    this.expandedNodeIds.clear();
    const activeTree = this.docManager.getActiveTree();
    if (!activeTree) return;

    if (level === 'chapters') {
      // Only root is expanded
      this.expandedNodeIds.add(activeTree.id);
      if (activeTree.children) {
        activeTree.children.forEach(c => {
          if (c.docId === 'universe' || c.type === 'root') {
            this.expandedNodeIds.add(c.id);
          }
        });
      }
    } else if (level === 'level2') {
      // Root and chapters expanded (shows sections)
      this.expandedNodeIds.add(activeTree.id);
      const expandUpToSections = (n, depth) => {
        if (depth <= 2) {
          this.expandedNodeIds.add(n.id);
          if (n.children) n.children.forEach(c => expandUpToSections(c, depth + 1));
        }
      };
      expandUpToSections(activeTree, 0);
    } else if (level === 'all') {
      // Expand everything
      const expandAll = (n) => {
        this.expandedNodeIds.add(n.id);
        if (n.children) n.children.forEach(expandAll);
      };
      expandAll(activeTree);
    }

    this.initGraphData();
  }

  toggleNodeExpansion(nodeId) {
    if (this.expandedNodeIds.has(nodeId)) {
      // Collapse this node and all its descendants
      const collapseRecursive = (id) => {
        this.expandedNodeIds.delete(id);
        const raw = this.docManager.getNodeById(id);
        if (raw && raw.children) {
          raw.children.forEach(c => collapseRecursive(c.id));
        }
      };
      collapseRecursive(nodeId);
    } else {
      // Expand this node
      this.expandedNodeIds.add(nodeId);
    }
    this.initGraphData();
  }

  initGraphData() {
    const oldPositions = new Map();
    this.nodes.forEach(n => {
      oldPositions.set(n.id, { x: n.x, y: n.y, pinned: n.pinned });
    });

    this.nodes = [];
    this.links = [];
    this.contrasts = [];
    this.particles = [];
    this.nodeMap.clear();

    const activeTree = this.docManager.getActiveTree();
    if (!activeTree) return;

    // Set default initial expanded nodes if empty
    if (this.expandedNodeIds.size === 0) {
      this.setExpansionLevel(this.expansionLevel);
      return;
    }

    // 1. Traverse and build only currently expanded visible nodes
    let chapterIndex = 0;
    const totalChapters = activeTree.children ? activeTree.children.length : 1;

    const buildVisibleGraph = (node, parent, angleHint, distHint) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = this.expandedNodeIds.has(node.id);

      let radius = 24;
      let color = node.docColor || '#00d4ff';
      if (node.type === 'root') { radius = 38; color = '#38bdf8'; }
      else if (node.type === 'chapter') { radius = 30; color = '#818cf8'; }
      else if (node.type === 'section') { radius = 22; color = '#34d399'; }
      else if (node.type === 'point') { radius = 16; color = '#f472b6'; }

      let x, y, pinned = false;
      const old = oldPositions.get(node.id);
      if (old) {
        x = old.x;
        y = old.y;
        pinned = old.pinned;
      } else if (parent) {
        // Spawn around parent with radial layout
        const angle = angleHint !== undefined ? angleHint : Math.random() * Math.PI * 2;
        const dist = distHint || (node.type === 'chapter' ? 280 : 160) * this.spacingMultiplier;
        x = parent.x + Math.cos(angle) * dist;
        y = parent.y + Math.sin(angle) * dist;
      } else {
        x = 0;
        y = 0;
        pinned = true; // Pin root in center by default
      }

      const graphNode = {
        id: node.id,
        title: node.title,
        type: node.type,
        summary: node.summary,
        full_text: node.full_text,
        researchers: node.researchers || [],
        tags: node.tags || [],
        docId: node.docId || 'hp',
        docTitle: node.docTitle,
        docColor: node.docColor,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: radius,
        baseColor: color,
        hasChildren: hasChildren,
        isExpanded: isExpanded,
        childCount: hasChildren ? node.children.length : 0,
        pinned: pinned,
        rawNode: node
      };

      this.nodes.push(graphNode);
      this.nodeMap.set(node.id, graphNode);

      // Hierarchical Link to Parent
      if (parent) {
        let restDist = (node.type === 'chapter' ? 260 : (node.type === 'section' ? 170 : 120)) * this.spacingMultiplier;
        this.links.push({
          sourceId: parent.id,
          targetId: node.id,
          source: parent,
          target: graphNode,
          type: 'hierarchy',
          weight: 0.9,
          alpha: 0.45,
          restDistance: restDist,
          color: color
        });
      }

      // Recursively include children if expanded
      if (hasChildren && isExpanded) {
        const numChildren = node.children.length;
        node.children.forEach((child, idx) => {
          let childAngle;
          if (node.type === 'root') {
            childAngle = (idx / numChildren) * Math.PI * 2;
          } else {
            const baseAngle = parent ? Math.atan2(graphNode.y - parent.y, graphNode.x - parent.x) : 0;
            const spread = Math.PI * 0.85;
            childAngle = baseAngle - (spread / 2) + (idx / Math.max(1, numChildren - 1)) * spread;
          }
          buildVisibleGraph(child, graphNode, childAngle, (node.type === 'chapter' ? 190 : 130) * this.spacingMultiplier);
        });
      }
    };

    buildVisibleGraph(activeTree, null);

    // 2. Add Curated Cross-links (only between currently visible nodes)
    const crossLinks = this.docManager.getAllCrossLinks();
    crossLinks.forEach(cl => {
      const src = this.nodeMap.get(cl.source);
      const tgt = this.nodeMap.get(cl.target);
      if (src && tgt) {
        const sim = cl.weight || 0.85;
        const alpha = this.similarityEngine.similarityToAlpha(sim);
        const restDist = (this.similarityEngine.similarityToRestDistance(sim) + 80) * this.spacingMultiplier;
        this.links.push({
          sourceId: cl.source,
          targetId: cl.target,
          source: src,
          target: tgt,
          type: 'curated_cross',
          relation: cl.relation,
          weight: sim,
          alpha: alpha,
          restDistance: restDist,
          color: '#38bdf8',
          description: cl.description
        });
      }
    });

    // 3. Add Automated Similarity Bridges (above threshold and visible)
    if (this.showAutomatedLinks) {
      const autoLinks = this.similarityEngine.discoverAutomatedLinks(this.minSimilarityThreshold);
      autoLinks.forEach(al => {
        const src = this.nodeMap.get(al.source);
        const tgt = this.nodeMap.get(al.target);
        if (src && tgt) {
          this.links.push({
            sourceId: al.source,
            targetId: al.target,
            source: src,
            target: tgt,
            type: al.isCrossDoc ? 'cross_doc_similarity' : 'intra_doc_similarity',
            relation: al.relation,
            weight: al.weight,
            alpha: al.alpha,
            restDistance: (al.restDistance + 100) * this.spacingMultiplier,
            color: al.isCrossDoc ? '#a855f7' : '#00d4ff',
            description: al.description
          });
        }
      });
    }

    // 4. Add Conceptual Contrasts (visible only)
    if (this.showContrasts) {
      const contrastsData = this.docManager.getAllContrasts();
      contrastsData.forEach(c => {
        const src = this.nodeMap.get(c.nodeA);
        const tgt = this.nodeMap.get(c.nodeB);
        if (src && tgt) {
          this.contrasts.push({
            source: src,
            target: tgt,
            title: c.contrast_title,
            dimension: c.dimension,
            description: c.description,
            comparison_table: c.comparison_table,
            color: '#f59e0b',
            restDistance: 320 * this.spacingMultiplier
          });
        }
      });
    }

    // 5. Seed Synapse Particles along active links
    this.links.forEach(l => {
      if (l.weight >= 0.4) {
        this.particles.push({
          link: l,
          progress: Math.random(),
          speed: 0.004 + (l.weight * 0.006),
          size: 2.5 + (l.weight * 2),
          color: l.color || '#38bdf8'
        });
      }
    });

    this.startSimulation();
  }

  startSimulation() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      if (this.physicsRunning) {
        this.updatePhysics();
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    const nodeCount = this.nodes.length;
    if (nodeCount === 0) return;

    // 1. Charge Repulsion (Strong anti-cluster force)
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        // Repulsion range
        const maxRepelDist = 650 * this.spacingMultiplier;
        if (dist < maxRepelDist) {
          const force = (this.chargeStrength * this.spacingMultiplier) / (distSq + 200);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!n1.pinned && n1 !== this.dragNode) { n1.vx -= fx; n1.vy -= fy; }
          if (!n2.pinned && n2 !== this.dragNode) { n2.vx += fx; n2.vy += fy; }
        }

        // Hard Collision Avoidance: Circles must never penetrate or overlap!
        const minDist = n1.radius + n2.radius + 50;
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;

          if (!n1.pinned && n1 !== this.dragNode) { n1.x -= ox; n1.y -= oy; }
          if (!n2.pinned && n2 !== this.dragNode) { n2.x += ox; n2.y += oy; }
        }
      }
    }

    // 2. Spring Forces on Links (Rest distance inversely proportional to similarity!)
    this.links.forEach(l => {
      const n1 = l.source;
      const n2 = l.target;
      if (!n1 || !n2) return;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - l.restDistance;
      const k = 0.018 * (l.weight || 0.5);

      const fx = (dx / dist) * (displacement * k);
      const fy = (dy / dist) * (displacement * k);

      if (!n1.pinned && n1 !== this.dragNode) { n1.vx += fx; n1.vy += fy; }
      if (!n2.pinned && n2 !== this.dragNode) { n2.vx -= fx; n2.vy -= fy; }
    });

    // 3. Contrast Forces
    this.contrasts.forEach(c => {
      const n1 = c.source;
      const n2 = c.target;
      if (!n1 || !n2) return;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - c.restDistance;
      const fx = (dx / dist) * (displacement * 0.008);
      const fy = (dy / dist) * (displacement * 0.008);
      if (!n1.pinned && n1 !== this.dragNode) { n1.vx += fx; n1.vy += fy; }
      if (!n2.pinned && n2 !== this.dragNode) { n2.vx += fx; n2.vy += fy; }
    });

    // 4. Center Soft Gravity & Velocity Dampening
    this.nodes.forEach(n => {
      if (n.pinned || n === this.dragNode) {
        n.vx = 0;
        n.vy = 0;
        return;
      }

      // Soft gravity pull toward origin to prevent infinite drift
      n.vx -= n.x * 0.0006;
      n.vy -= n.y * 0.0006;

      // Friction / Dampening
      n.vx *= 0.84;
      n.vy *= 0.84;

      n.x += n.vx;
      n.y += n.vy;
    });

    // 5. Update Synapse Particles
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1.0) p.progress = 0.0;
    });
  }

  draw() {
    if (!this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply zoom & pan translation
    ctx.scale(dpr, dpr);
    ctx.translate(this.width / 2 + this.offsetX, this.height / 2 + this.offsetY);
    ctx.scale(this.scale, this.scale);

    // 1. Draw Links with Transparency based on Similarity
    this.links.forEach(l => {
      const n1 = l.source;
      const n2 = l.target;
      if (!n1 || !n2) return;

      const isConnectedToSelected = this.selectedNode && (this.selectedNode.id === n1.id || this.selectedNode.id === n2.id);
      const isConnectedToHover = this.hoverNode && (this.hoverNode.id === n1.id || this.hoverNode.id === n2.id);

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);

      let alpha = l.alpha;
      let width = 1.5 + (l.weight * 2.5);

      if (isConnectedToSelected || isConnectedToHover) {
        alpha = Math.min(1.0, alpha + 0.45);
        width += 2.0;
        ctx.strokeStyle = '#38bdf8';
      } else {
        ctx.strokeStyle = l.color || '#38bdf8';
      }

      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // 2. Draw Contrast Lines (Jagged / Pulsing Dash)
    this.contrasts.forEach(c => {
      const n1 = c.source;
      const n2 = c.target;
      if (!n1 || !n2) return;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      // Draw contrast icon badge in middle of line
      const midX = (n1.x + n2.x) / 2;
      const midY = (n1.y + n2.y) / 2;
      ctx.beginPath();
      ctx.arc(midX, midY, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', midX, midY);

      ctx.restore();
    });

    // 3. Draw Synapse Particles
    this.particles.forEach(p => {
      const n1 = p.link.source;
      const n2 = p.link.target;
      if (!n1 || !n2) return;

      const px = n1.x + (n2.x - n1.x) * p.progress;
      const py = n1.y + (n2.y - n1.y) * p.progress;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Nodes and Crisp Label Pills
    this.nodes.forEach(n => {
      const isSelected = this.selectedNode && this.selectedNode.id === n.id;
      const isHover = this.hoverNode && this.hoverNode.id === n.id;

      ctx.save();

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#00d4ff' : (isHover ? '#38bdf8' : n.baseColor);
      ctx.shadowColor = isSelected ? '#00d4ff' : (isHover ? '#38bdf8' : n.baseColor);
      ctx.shadowBlur = isSelected ? 26 : (isHover ? 18 : 10);
      ctx.fill();

      // White/Glowing border ring
      ctx.strokeStyle = isSelected ? '#ffffff' : (n.pinned ? '#f59e0b' : 'rgba(255, 255, 255, 0.4)');
      ctx.lineWidth = isSelected ? 3.5 : (n.pinned ? 2.5 : 1.5);
      ctx.stroke();

      // If node has children: Draw Expand/Collapse Indicator Badge on top of node!
      if (n.hasChildren) {
        ctx.beginPath();
        ctx.arc(n.x + n.radius * 0.7, n.y - n.radius * 0.7, 10, 0, Math.PI * 2);
        ctx.fillStyle = n.isExpanded ? '#ef4444' : '#10b981';
        ctx.shadowBlur = 6;
        ctx.shadowColor = n.isExpanded ? '#ef4444' : '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(n.isExpanded ? '−' : '+', n.x + n.radius * 0.7, n.y - n.radius * 0.7);
      }

      // Draw Pinned Indicator Icon (if pinned by user)
      if (n.pinned && n.type !== 'root') {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📌', n.x - n.radius * 0.7, n.y - n.radius * 0.7);
      }

      // Draw Node Label with Dark Pill Background (to guarantee 100% legibility!)
      const shortTitle = n.title.length > 28 ? n.title.substring(0, 26) + '...' : n.title;
      const fontSize = Math.max(11, Math.min(14, n.radius * 0.55));
      ctx.font = `600 ${fontSize}px 'Vazirmatn', sans-serif`;

      const textMetrics = ctx.measureText(shortTitle);
      const textWidth = textMetrics.width;
      const pillHeight = fontSize + 10;
      const pillWidth = textWidth + 16;
      const pillX = n.x - pillWidth / 2;
      const pillY = n.y + n.radius + 8;

      // Rounded pill background
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 6);
      ctx.fillStyle = isSelected ? 'rgba(14, 165, 233, 0.95)' : (isHover ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.88)');
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#38bdf8' : (isHover ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label Text
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortTitle, n.x, pillY + pillHeight / 2);

      // Draw Child Count Pill if collapsed with children
      if (n.hasChildren && !n.isExpanded) {
        const countText = `+${n.childCount} شاخه`;
        ctx.font = `bold 10px 'Vazirmatn', sans-serif`;
        const countMetrics = ctx.measureText(countText);
        const countPillW = countMetrics.width + 10;
        const countPillY = pillY + pillHeight + 4;

        ctx.beginPath();
        ctx.roundRect(n.x - countPillW / 2, countPillY, countPillW, 16, 4);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.fillText(countText, n.x, countPillY + 8);
      }

      ctx.restore();
    });

    ctx.restore();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(clickX, clickY);

      this.dragMoved = false;
      const clicked = this.getNodeAt(worldPos.x, worldPos.y);

      if (clicked) {
        this.isDragging = true;
        this.dragNode = clicked;
        this.selectedNode = clicked;
        this.startX = worldPos.x;
        this.startY = worldPos.y;
      } else {
        this.isPanning = true;
        this.startX = clickX - this.offsetX;
        this.startY = clickY - this.offsetY;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(mouseX, mouseY);

      if (this.isDragging && this.dragNode) {
        const dx = worldPos.x - this.startX;
        const dy = worldPos.y - this.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this.dragMoved = true;
        }
        this.dragNode.x = worldPos.x;
        this.dragNode.y = worldPos.y;
        this.dragNode.vx = 0;
        this.dragNode.vy = 0;
        this.dragNode.pinned = true; // Pin node to user's dropped location!
      } else if (this.isPanning) {
        this.offsetX = mouseX - this.startX;
        this.offsetY = mouseY - this.startY;
      } else {
        const hovered = this.getNodeAt(worldPos.x, worldPos.y);
        if (this.hoverNode !== hovered) {
          this.hoverNode = hovered;
          this.canvas.style.cursor = hovered ? 'pointer' : 'grab';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging && this.dragNode) {
        // If it was a quick click without dragging, toggle node expansion or select node
        if (!this.dragMoved) {
          if (this.dragNode.hasChildren) {
            this.toggleNodeExpansion(this.dragNode.id);
          }
          if (typeof this.onNodeSelect === 'function') {
            this.onNodeSelect(this.dragNode.rawNode);
          }
        }
      }
      this.isDragging = false;
      this.isPanning = false;
      this.dragNode = null;
      if (this.canvas) this.canvas.style.cursor = 'default';
    });

    // Double click to open Inspector
    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const worldPos = this.screenToWorld(clickX, clickY);
      const clicked = this.getNodeAt(worldPos.x, worldPos.y);
      if (clicked && typeof this.onNodeSelect === 'function') {
        this.onNodeSelect(clicked.rawNode);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      this.scale = Math.min(3.0, Math.max(0.15, this.scale * zoomFactor));
    }, { passive: false });
  }

  screenToWorld(sx, sy) {
    const cx = this.width / 2 + this.offsetX;
    const cy = this.height / 2 + this.offsetY;
    return {
      x: (sx - cx) / this.scale,
      y: (sy - cy) / this.scale
    };
  }

  getNodeAt(wx, wy) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const dx = wx - n.x;
      const dy = wy - n.y;
      // Hit test includes the node body and label pill
      if (dx * dx + dy * dy <= (n.radius + 10) * (n.radius + 10)) {
        return n;
      }
      if (Math.abs(dx) <= 90 && dy >= n.radius && dy <= n.radius + 35) {
        return n;
      }
    }
    return null;
  }

  focusNode(nodeId) {
    // Ensure node is expanded and visible in graph
    let current = this.docManager.getNodeById(nodeId);
    while (current && current.parentId) {
      this.expandedNodeIds.add(current.parentId);
      current = this.docManager.getNodeById(current.parentId);
    }
    this.initGraphData();

    setTimeout(() => {
      const n = this.nodeMap.get(nodeId);
      if (n) {
        this.selectedNode = n;
        this.offsetX = -n.x * this.scale;
        this.offsetY = -n.y * this.scale;
      }
    }, 50);
  }

  unpinAllNodes() {
    this.nodes.forEach(n => {
      if (n.type !== 'root') n.pinned = false;
    });
    this.physicsRunning = true;
  }

  setSpacingMultiplier(multiplier) {
    this.spacingMultiplier = Math.max(0.8, Math.min(3.5, multiplier));
    this.initGraphData();
  }

  togglePhysics() {
    this.physicsRunning = !this.physicsRunning;
    return this.physicsRunning;
  }

  resetView() {
    this.scale = 0.85;
    this.offsetX = 0;
    this.offsetY = 0;
    this.selectedNode = null;
    this.unpinAllNodes();
    this.initGraphData();
  }
}

window.GraphRenderer = GraphRenderer;
