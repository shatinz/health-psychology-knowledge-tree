/**
 * Interactive Spatial Neural & Similarity Graph Canvas
 * Implements force-directed physics, similarity-distance encoding, variable alpha transparency,
 * particle flows along synapses, and visual contrast lines.
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

    // Viewport transforms
    this.scale = 0.9;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.isPanning = false;
    this.dragNode = null;
    this.hoverNode = null;
    this.selectedNode = null;
    this.startX = 0;
    this.startY = 0;

    // Filters
    this.showAutomatedLinks = true;
    this.showContrasts = true;
    this.minSimilarityThreshold = 0.20;
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

  initGraphData() {
    this.nodes = [];
    this.links = [];
    this.contrasts = [];
    this.particles = [];
    this.nodeMap.clear();

    const activeTree = this.docManager.getActiveTree();
    if (!activeTree) return;

    // 1. Flatten all active nodes
    const flatten = (node, parent) => {
      let radius = 22;
      let color = node.docColor || '#00d4ff';
      if (node.type === 'root') { radius = 32; color = '#38bdf8'; }
      else if (node.type === 'chapter') { radius = 26; color = '#818cf8'; }
      else if (node.type === 'section') { radius = 18; color = '#34d399'; }
      else if (node.type === 'point') { radius = 13; color = '#f472b6'; }

      // Initial random or clustered position
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 300;

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
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: radius,
        baseColor: color,
        rawNode: node
      };

      this.nodes.push(graphNode);
      this.nodeMap.set(node.id, graphNode);

      // Hierarchical backbone link
      if (parent) {
        this.links.push({
          sourceId: parent.id,
          targetId: node.id,
          source: parent,
          target: graphNode,
          type: 'hierarchy',
          weight: 0.8,
          alpha: 0.35,
          restDistance: node.type === 'chapter' ? 160 : 85,
          color: color
        });
      }

      if (node.children) {
        node.children.forEach(c => flatten(c, graphNode));
      }
    };

    flatten(activeTree, null);

    // 2. Add Curated Cross-links
    const crossLinks = this.docManager.getAllCrossLinks();
    crossLinks.forEach(cl => {
      const src = this.nodeMap.get(cl.source);
      const tgt = this.nodeMap.get(cl.target);
      if (src && tgt) {
        const sim = cl.weight || 0.85;
        const alpha = this.similarityEngine.similarityToAlpha(sim);
        const restDist = this.similarityEngine.similarityToRestDistance(sim);
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

    // 3. Add Automated Similarity Bridges
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
            restDistance: al.restDistance,
            color: al.isCrossDoc ? '#a855f7' : '#00d4ff',
            description: al.description
          });
        }
      });
    }

    // 4. Add Conceptual Contrasts (Opposing Views)
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
            restDistance: 240
          });
        }
      });
    }

    // 5. Seed streaming synapse particles
    this.links.forEach(l => {
      if (l.weight >= 0.5) {
        this.particles.push({
          link: l,
          progress: Math.random(),
          speed: 0.005 + (l.weight * 0.008),
          size: 2 + (l.weight * 2),
          color: l.color || '#38bdf8'
        });
      }
    });

    this.startSimulation();
  }

  startSimulation() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.updatePhysics();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  updatePhysics() {
    // 1. Charge Repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 400) {
          const force = (800 / (distSq + 50));
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (n1 !== this.dragNode) { n1.vx -= fx; n1.vy -= fy; }
          if (n2 !== this.dragNode) { n2.vx += fx; n2.vy += fy; }
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
      const k = 0.025 * (l.weight || 0.5);

      const fx = (dx / dist) * (displacement * k);
      const fy = (dy / dist) * (displacement * k);

      if (n1 !== this.dragNode) { n1.vx += fx; n1.vy += fy; }
      if (n2 !== this.dragNode) { n2.vx -= fx; n2.vy -= fy; }
    });

    // 3. Contrasts spring forces
    this.contrasts.forEach(c => {
      const n1 = c.source;
      const n2 = c.target;
      if (!n1 || !n2) return;
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - c.restDistance;
      const fx = (dx / dist) * (displacement * 0.012);
      const fy = (dy / dist) * (displacement * 0.012);
      if (n1 !== this.dragNode) { n1.vx += fx; n1.vy += fy; }
      if (n2 !== this.dragNode) { n2.vx -= fx; n2.vy -= fy; }
    });

    // 4. Center Gravity & Velocity Dampening
    this.nodes.forEach(n => {
      if (n === this.dragNode) return;
      // Gravity toward origin
      n.vx -= n.x * 0.0015;
      n.vy -= n.y * 0.0015;

      // Dampening
      n.vx *= 0.88;
      n.vy *= 0.88;

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
      let width = 1.0 + (l.weight * 2.5);

      if (isConnectedToSelected || isConnectedToHover) {
        alpha = Math.min(1.0, alpha + 0.4);
        width += 1.5;
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
      ctx.setLineDash([6, 6]);
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = 0.85;
      ctx.stroke();

      // Draw contrast icon badge in middle of line
      const midX = (n1.x + n2.x) / 2;
      const midY = (n1.y + n2.y) / 2;
      ctx.beginPath();
      ctx.arc(midX, midY, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 10px sans-serif';
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
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Nodes
    this.nodes.forEach(n => {
      const isSelected = this.selectedNode && this.selectedNode.id === n.id;
      const isHover = this.hoverNode && this.hoverNode.id === n.id;

      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

      // Node background & glowing border
      ctx.fillStyle = isSelected ? '#00d4ff' : (isHover ? '#38bdf8' : n.baseColor);
      ctx.shadowColor = isSelected ? '#00d4ff' : (isHover ? '#38bdf8' : n.baseColor);
      ctx.shadowBlur = isSelected ? 22 : (isHover ? 16 : 8);
      ctx.fill();

      // White inner ring
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      // Text label below node
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f8fafc';
      ctx.font = `${Math.max(10, Math.min(13, n.radius * 0.65))}px Vazirmatn, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const shortTitle = n.title.length > 24 ? n.title.substring(0, 22) + '...' : n.title;
      ctx.fillText(shortTitle, n.x, n.y + n.radius + 5);

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

      // Check if clicked a node
      const clicked = this.getNodeAt(worldPos.x, worldPos.y);
      if (clicked) {
        this.isDragging = true;
        this.dragNode = clicked;
        this.selectedNode = clicked;
        if (typeof this.onNodeSelect === 'function') {
          this.onNodeSelect(clicked.rawNode);
        }
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
        this.dragNode.x = worldPos.x;
        this.dragNode.y = worldPos.y;
        this.dragNode.vx = 0;
        this.dragNode.vy = 0;
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
      this.isDragging = false;
      this.isPanning = false;
      this.dragNode = null;
      if (this.canvas) this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale = Math.min(2.5, Math.max(0.25, this.scale * zoomFactor));
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
      if (dx * dx + dy * dy <= n.radius * n.radius) {
        return n;
      }
    }
    return null;
  }

  focusNode(nodeId) {
    const n = this.nodeMap.get(nodeId);
    if (n) {
      this.selectedNode = n;
      this.offsetX = -n.x * this.scale;
      this.offsetY = -n.y * this.scale;
    }
  }

  resetView() {
    this.scale = 0.9;
    this.offsetX = 0;
    this.offsetY = 0;
    this.selectedNode = null;
  }
}

window.GraphRenderer = GraphRenderer;
