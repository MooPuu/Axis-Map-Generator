// Axis Map Generator - Main Workstation Controller
// Made By Mahdi Kareem © 2026

import { MapEngine } from './map-engine.js';
import { MapRenderer } from './map-renderer.js';
import { ExportManager } from './export-manager.js';
import { injectIcons } from './icons.js';

class AxisApp {
  constructor() {
    this.canvas = document.getElementById('mapCanvas');
    this.viewport = document.getElementById('canvasViewport');
    this.engine = new MapEngine(320, 200);
    this.renderer = new MapRenderer(this.canvas);
    this.exporter = new ExportManager(this.engine, this.renderer);

    // Pan & Zoom Transform State
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    // Sculpt Tool Mode: 'none' | 'raise' | 'lower' | 'smooth'
    this.sculptMode = 'none';
    this.isSculpting = false;
    this.brushRadius = 35;
    this.brushStrength = 0.5;

    // In-Canvas Label Dragging & Editing
    this.activeDragLabel = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasMovedDrag = false;
    this.editingLabel = null;

    // Placement Mode for "+ Add..." Tool
    this.placementMode = null; // 'capital' | 'town' | 'castle' | 'poi' | 'label' | 'mountain' | 'tree'

    // Lottie Players
    this.lottiePlayers = {
      aiLogo: null,
      loadingDots: null,
      successCheck: null
    };

    // Undo Stack
    this.historyStack = [];
    this.maxHistory = 10;
  }

  async init() {
    // 1. Inject Duotone SVG Icons
    injectIcons();

    // 2. Initialize Lottie Animations
    await this.initLottieAnimations();

    // 3. Set Initial Canvas Dimensions (1920x1080 FHD default)
    this.setResolution(1920, 1080);

    // 4. Setup Event Listeners
    this.setupUIEvents();
    this.setupViewportEvents();
    this.setupInteractiveLabelEvents();
    this.setupAddToolEvents();
    this.setupRegionInspectorEvents();

    // 5. Initial Map Generation
    await this.triggerGeneration();
  }

  // Load Lottie JSON animations safely with fetch and direct fallback
  async initLottieAnimations() {
    if (typeof lottie === 'undefined') {
      console.warn('Lottie library not loaded, skipping animations');
      return;
    }

    const loadAnim = async (containerId, path, loop = true, autoplay = true) => {
      const container = document.getElementById(containerId);
      if (!container) return null;
      try {
        const res = await fetch(path);
        if (res.ok) {
          const data = await res.json();
          return lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop,
            autoplay,
            animationData: data
          });
        }
      } catch (e) {
        console.warn(`Fetch fallback for ${path}:`, e);
      }
      return lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop,
        autoplay,
        path
      });
    };

    try {
      this.lottiePlayers.aiLogo = await loadAnim('aiLogoContainer', 'assets/lottie/ai_logo.json', true, true);
      this.lottiePlayers.loadingDots = await loadAnim('loadingDotsContainer', 'assets/lottie/loading_dots.json', true, true);
      this.lottiePlayers.successCheck = await loadAnim('successCheckContainer', 'assets/lottie/success_check.json', false, false);
    } catch (err) {
      console.error('Error initializing Lottie animations:', err);
    }
  }

  // Set Resolution Preset
  setResolution(width, height) {
    this.renderer.setSize(width, height);
    const badge = document.getElementById('resBadge');
    if (badge) badge.textContent = `${width} × ${height}`;
    this.resetViewport();
  }

  // Reset Pan & Zoom
  resetViewport() {
    const vpRect = this.viewport.getBoundingClientRect();
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

    const padding = 60;
    const scaleX = (vpRect.width - padding) / cWidth;
    const scaleY = (vpRect.height - padding) / cHeight;
    this.zoom = Math.min(1.0, Math.min(scaleX, scaleY));
    this.panX = (vpRect.width - cWidth * this.zoom) / 2;
    this.panY = (vpRect.height - cHeight * this.zoom) / 2;

    this.applyTransform();
  }

  applyTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  // Save State to History Stack
  pushHistory() {
    if (this.historyStack.length >= this.maxHistory) {
      this.historyStack.shift();
    }
    this.historyStack.push({
      heightmap: new Float32Array(this.engine.heightmap),
      labels: JSON.parse(JSON.stringify(this.engine.labels)),
      settlements: JSON.parse(JSON.stringify(this.engine.settlements))
    });
  }

  undo() {
    if (this.historyStack.length > 0) {
      const prev = this.historyStack.pop();
      this.engine.heightmap.set(prev.heightmap);
      this.engine.labels = prev.labels;
      this.engine.settlements = prev.settlements;
      this.engine.classifyBiomes();
      this.renderer.render(this.engine);
      this.showSuccessToast('Action Undone');
    }
  }

  // Show / Hide Loading Overlay
  async showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('active');
      if (this.lottiePlayers.loadingDots) {
        this.lottiePlayers.loadingDots.goToAndPlay(0, true);
      }
    }
    await new Promise(r => setTimeout(r, 650));
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  // Show Success Toast with Lottie Animation
  showSuccessToast(message = 'Map Exported Successfully!') {
    const toast = document.getElementById('successToast');
    const msgEl = document.getElementById('successToastMsg');
    if (msgEl) msgEl.textContent = message;

    if (toast) {
      toast.classList.add('active');
      if (this.lottiePlayers.successCheck) {
        this.lottiePlayers.successCheck.goToAndPlay(0, true);
      }
      setTimeout(() => {
        toast.classList.remove('active');
      }, 3000);
    }
  }

  // Procedural Generation Trigger
  async triggerGeneration() {
    try {
      await this.showLoading();

      // Read parameter values from UI controls
      const seedInput = document.getElementById('seedInput');
      const seed = seedInput && seedInput.value !== '' ? parseInt(seedInput.value, 10) : Math.floor(Math.random() * 9999999);
      if (seedInput) seedInput.value = seed;

      this.engine.worldName = document.getElementById('worldNameInput')?.value || 'Dwalbarrul';
      this.engine.titlePrefix = document.getElementById('titlePrefixInput')?.value || 'The Land of';
      this.engine.archetype = document.getElementById('archetypeSelect')?.value || 'continents';

      this.engine.riverDensity = parseFloat(document.getElementById('riverSlider')?.value || 1.0);
      this.engine.mountainDensity = parseFloat(document.getElementById('mountainSlider')?.value || 1.0);
      this.engine.forestDensity = parseFloat(document.getElementById('forestSlider')?.value || 1.0);

      this.engine.seaLevel = parseFloat(document.getElementById('seaLevelSlider')?.value || 0.44);
      this.engine.roughness = parseFloat(document.getElementById('roughnessSlider')?.value || 0.52);
      this.engine.continentalness = parseFloat(document.getElementById('continentalnessSlider')?.value || 0.62);
      this.engine.temperatureBias = parseFloat(document.getElementById('tempSlider')?.value || 0.5);
      this.engine.rainfallBias = parseFloat(document.getElementById('rainSlider')?.value || 0.5);

      // Save state for undo
      this.pushHistory();

      // Run Engine Simulation
      this.engine.generate(seed);

      // Update World Name in input if generated
      const worldInput = document.getElementById('worldNameInput');
      if (worldInput) worldInput.value = this.engine.worldName;

      // Update Footer Telemetry
      const statW = document.getElementById('statWorld'); if (statW) statW.textContent = this.engine.worldName;
      const statS = document.getElementById('statSeed'); if (statS) statS.textContent = seed;
      const statR = document.getElementById('statRealms'); if (statR) statR.textContent = this.engine.realms.length;
      const statRiv = document.getElementById('statRivers'); if (statRiv) statRiv.textContent = this.engine.rivers.length;
      const statSet = document.getElementById('statSettlements'); if (statSet) statSet.textContent = this.engine.settlements.length;
      const statM = document.getElementById('statMountains'); if (statM) statM.textContent = this.engine.mountains.length;
      const statT = document.getElementById('statTrees'); if (statT) statT.textContent = this.engine.trees.length;

      // Render Canvas
      this.renderer.render(this.engine);

      // Ensure map is centered in viewport on generation
      this.resetViewport();
    } catch (err) {
      console.error('Error during generation:', err);
    } finally {
      this.hideLoading();
    }
  }

  // Setup UI Control Listeners
  setupUIEvents() {
    // Generate Button with AI Lottie
    document.getElementById('generateBtn')?.addEventListener('click', () => {
      this.triggerGeneration();
    });

    // Randomize Seed (Dice button)
    document.getElementById('randomSeedBtn')?.addEventListener('click', () => {
      const newSeed = Math.floor(Math.random() * 9999999);
      document.getElementById('seedInput').value = newSeed;
      this.triggerGeneration();
    });

    // World Name & Title Prefix Live Updates
    document.getElementById('worldNameInput')?.addEventListener('input', (e) => {
      this.engine.worldName = e.target.value;
      document.getElementById('statWorld').textContent = e.target.value;
      this.renderer.render(this.engine);
    });

    document.getElementById('titlePrefixInput')?.addEventListener('input', (e) => {
      this.engine.titlePrefix = e.target.value;
      this.renderer.render(this.engine);
    });

    // Archetype Select
    document.getElementById('archetypeSelect')?.addEventListener('change', (e) => {
      this.engine.archetype = e.target.value;
      this.triggerGeneration();
    });

    // Density Sliders (Rivers, Mountains, Forests)
    document.getElementById('riverSlider')?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      document.getElementById('riverVal').textContent = `${Math.round(v * 100)}%`;
      this.engine.riverDensity = v;
      const prng = this.engine.createPRNG(this.engine.seed + 101);
      this.engine.simulateRiversAndLakes(prng);
      this.renderer.render(this.engine);
    });

    document.getElementById('mountainSlider')?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      document.getElementById('mountainVal').textContent = `${Math.round(v * 100)}%`;
      this.engine.mountainDensity = v;
      const prng = this.engine.createPRNG(this.engine.seed + 202);
      this.engine.generateMountains(prng);
      this.renderer.render(this.engine);
    });

    document.getElementById('forestSlider')?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      document.getElementById('forestVal').textContent = `${Math.round(v * 100)}%`;
      this.engine.forestDensity = v;
      const prng = this.engine.createPRNG(this.engine.seed + 303);
      this.engine.generateForests(prng);
      this.renderer.render(this.engine);
    });

    // Realtime Sliders
    const sliders = [
      { id: 'seaLevelSlider', key: 'seaLevel', valId: 'seaLevelVal' },
      { id: 'roughnessSlider', key: 'roughness', valId: 'roughnessVal' },
      { id: 'continentalnessSlider', key: 'continentalness', valId: 'continentalnessVal' },
      { id: 'tempSlider', key: 'temperatureBias', valId: 'tempVal' },
      { id: 'rainSlider', key: 'rainfallBias', valId: 'rainVal' }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const valEl = document.getElementById(s.valId);
      if (el) {
        el.addEventListener('input', (e) => {
          const v = parseFloat(e.target.value);
          if (valEl) valEl.textContent = v.toFixed(2);
          this.engine[s.key] = v;
        });
        el.addEventListener('change', () => {
          this.triggerGeneration();
        });
      }
    });

    // 13 Style Selector Cards
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.renderer.currentStyle = card.getAttribute('data-style');
        this.renderer.render(this.engine);
      });
    });

    // Layer Toggles (Diamond Checkboxes)
    const layerKeys = [
      'elevation', 'biomes', 'settlements', 'realms', 'relief',
      'forests', 'rivers', 'water', 'roads', 'pois',
      'titleBanner', 'compassRose', 'scaleBar', 'borderFrame'
    ];
    layerKeys.forEach(k => {
      const toggle = document.getElementById(`layer_${k}`);
      if (toggle) {
        toggle.checked = this.renderer.layers[k];
        toggle.addEventListener('change', (e) => {
          this.renderer.layers[k] = e.target.checked;
          this.renderer.render(this.engine);
        });
      }
    });

    // Grid Type & Opacity Controls
    document.getElementById('gridTypeSelect')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'none') {
        this.renderer.layers.grid = false;
      } else {
        this.renderer.layers.grid = true;
        this.renderer.layers.gridType = val;
      }
      this.renderer.render(this.engine);
    });

    document.getElementById('gridOpacitySelect')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'white') {
        this.renderer.layers.gridOpacity = 0.22;
      } else {
        this.renderer.layers.gridOpacity = parseFloat(val);
      }
      this.renderer.render(this.engine);
    });

    // Typography & Label Controls
    document.getElementById('fontSizeSlider')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const valEl = document.getElementById('fontSizeVal');
      if (valEl) valEl.textContent = `${val}px`;
      this.renderer.labelFontSize = val;
      this.renderer.render(this.engine);
    });

    document.getElementById('labelFilterSelect')?.addEventListener('change', (e) => {
      this.renderer.labelFilter = e.target.value;
      this.renderer.render(this.engine);
    });

    document.getElementById('rerollNamesBtn')?.addEventListener('click', () => {
      const prng = this.engine.mulberry32(Math.floor(Math.random() * 9999999));
      this.engine.labels = [];
      for (const s of this.engine.settlements) {
        s.name = this.engine.generateFantasyName(prng, s.type);
        this.engine.labels.push({ id: s.id, x: s.x, y: s.y - 5, text: s.name, type: s.type });
      }
      for (const r of this.engine.realms) {
        this.engine.labels.push({ id: `lbl_${r.id}`, x: r.x, y: r.y - 12, text: r.fullName, type: 'realm', color: r.color });
      }
      this.renderer.render(this.engine);
    });

    // Resolution Presets
    document.getElementById('resolutionSelect')?.addEventListener('change', (e) => {
      const [w, h] = e.target.value.split('x').map(Number);
      this.setResolution(w, h);
      this.renderer.render(this.engine);
    });

    // Sculpt Tool Buttons
    document.querySelectorAll('.sculpt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sculpt-btn').forEach(b => b.classList.remove('active'));
        const mode = btn.getAttribute('data-mode');
        if (this.sculptMode === mode) {
          this.sculptMode = 'none';
        } else {
          this.sculptMode = mode;
          btn.classList.add('active');
        }
        this.viewport.style.cursor = this.sculptMode === 'none' ? 'grab' : 'crosshair';
      });
    });

    // Sculpt Brush Radius & Strength
    document.getElementById('brushRadiusSlider')?.addEventListener('input', (e) => {
      this.brushRadius = parseInt(e.target.value, 10);
      document.getElementById('brushRadiusVal').textContent = `${this.brushRadius}px`;
    });
    document.getElementById('brushStrengthSlider')?.addEventListener('input', (e) => {
      this.brushStrength = parseFloat(e.target.value);
      document.getElementById('brushStrengthVal').textContent = this.brushStrength.toFixed(2);
    });

    // Floating Viewport Tools
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
      this.zoom = Math.min(4.5, this.zoom * 1.25);
      this.applyTransform();
    });
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
      this.zoom = Math.max(0.2, this.zoom / 1.25);
      this.applyTransform();
    });
    document.getElementById('resetViewBtn')?.addEventListener('click', () => {
      this.resetViewport();
    });
    document.getElementById('undoBtn')?.addEventListener('click', () => {
      this.undo();
    });

    // Export Action Strip Buttons
    document.getElementById('stripPngBtn')?.addEventListener('click', async () => {
      const res = await this.exporter.exportPNG();
      if (res && res.success) this.showSuccessToast('High-Res PNG Saved!');
    });
    document.getElementById('stripSvgBtn')?.addEventListener('click', async () => {
      const res = await this.exporter.exportSVG();
      if (res && res.success) this.showSuccessToast('Vector SVG Saved!');
    });

    // Overview Export Button
    document.getElementById('exportOverviewBtn')?.addEventListener('click', async () => {
      const resStr = document.getElementById('exportResSelect')?.value || '4800x3200';
      const [w, h] = resStr.split('x').map(Number);
      const res = await this.exporter.exportPNG(w, h);
      if (res && res.success) this.showSuccessToast(`${w}×${h} Map Exported!`);
    });

    // Heightmap Export
    document.getElementById('exportHeightmapBtn')?.addEventListener('click', async () => {
      const res = await this.exporter.exportHeightmap(2048, 2048);
      if (res && res.success) this.showSuccessToast('2K Heightmap Exported for 3D/Blender!');
    });

    // Project Persistence
    document.getElementById('saveProjectBtn')?.addEventListener('click', async () => {
      const res = await this.exporter.saveProject();
      if (res && res.success) this.showSuccessToast('Axis Project Saved!');
    });
    document.getElementById('loadProjectBtn')?.addEventListener('click', async () => {
      const res = await this.exporter.loadProject();
      if (res && res.success) this.showSuccessToast('Project Loaded!');
    });

    // About Modal Listeners
    const aboutModal = document.getElementById('aboutModal');
    const openAbout = () => aboutModal?.classList.add('active');
    const closeAbout = () => aboutModal?.classList.remove('active');

    document.getElementById('aboutBtn')?.addEventListener('click', openAbout);
    document.getElementById('closeAboutBtn')?.addEventListener('click', closeAbout);
    document.getElementById('closeAboutBtn2')?.addEventListener('click', closeAbout);
    aboutModal?.addEventListener('click', (e) => {
      if (e.target === aboutModal) closeAbout();
    });

    // Window Resize
    window.addEventListener('resize', () => {
      this.resetViewport();
    });
  }

  // Setup In-Canvas Interactive Label Dragging & In-Place Renaming
  setupInteractiveLabelEvents() {
    const canvas = this.canvas;
    const vp = this.viewport;
    const modal = document.getElementById('labelEditModal');
    const input = document.getElementById('labelEditInput');
    const saveBtn = document.getElementById('labelSaveBtn');
    const cancelBtn = document.getElementById('labelCancelBtn');
    const deleteBtn = document.getElementById('labelDeleteBtn');
    const notice = document.getElementById('interactionNotice');

    // Find label or banner at canvas coordinates
    const findLabelAt = (cx, cy) => {
      const scaleX = canvas.width / this.engine.width;
      const scaleY = canvas.height / this.engine.height;

      for (let i = this.engine.labels.length - 1; i >= 0; i--) {
        const lbl = this.engine.labels[i];
        const lx = lbl.x * scaleX;
        const ly = lbl.y * scaleY;
        const dist = Math.hypot(cx - lx, cy - ly);
        if (dist < 24) return lbl;
      }
      return null;
    };

    canvas.addEventListener('mousedown', (e) => {
      if (this.sculptMode !== 'none' || this.placementMode !== null) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / this.zoom;
      const canvasY = (e.clientY - rect.top) / this.zoom;

      const hitLabel = findLabelAt(canvasX, canvasY);
      if (hitLabel) {
        this.activeDragLabel = hitLabel;
        this.dragStartX = canvasX;
        this.dragStartY = canvasY;
        this.hasMovedDrag = false;
        vp.style.cursor = 'move';
        e.stopPropagation();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.activeDragLabel) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / this.zoom;
      const canvasY = (e.clientY - rect.top) / this.zoom;

      const scaleX = canvas.width / this.engine.width;
      const scaleY = canvas.height / this.engine.height;

      if (Math.hypot(canvasX - this.dragStartX, canvasY - this.dragStartY) > 4) {
        this.hasMovedDrag = true;
        this.activeDragLabel.x = Math.max(5, Math.min(this.engine.width - 5, canvasX / scaleX));
        this.activeDragLabel.y = Math.max(5, Math.min(this.engine.height - 5, canvasY / scaleY));
        this.renderer.render(this.engine);
        if (notice) notice.textContent = `Moved "${this.activeDragLabel.text}" — drag to reposition, click to edit.`;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.activeDragLabel) return;

      if (!this.hasMovedDrag) {
        // Click to Edit!
        this.editingLabel = this.activeDragLabel;
        modal.style.display = 'flex';
        modal.style.left = `${Math.min(window.innerWidth - 260, Math.max(20, e.clientX - 120))}px`;
        modal.style.top = `${Math.min(window.innerHeight - 150, Math.max(20, e.clientY - 40))}px`;
        input.value = this.editingLabel.text;
        input.focus();
        input.select();
      }

      this.activeDragLabel = null;
      vp.style.cursor = this.sculptMode === 'none' ? 'grab' : 'crosshair';
    });

    // Save Edit
    saveBtn?.addEventListener('click', () => {
      if (this.editingLabel && input.value.trim() !== '') {
        this.editingLabel.text = input.value.trim();
        this.renderer.render(this.engine);
        if (notice) notice.textContent = `Updated name to "${this.editingLabel.text}"`;
      }
      modal.style.display = 'none';
      this.editingLabel = null;
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn?.click();
      if (e.key === 'Escape') cancelBtn?.click();
    });

    cancelBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
      this.editingLabel = null;
    });

    deleteBtn?.addEventListener('click', () => {
      if (this.editingLabel) {
        this.engine.labels = this.engine.labels.filter(l => l !== this.editingLabel);
        this.renderer.render(this.engine);
      }
      modal.style.display = 'none';
      this.editingLabel = null;
    });
  }

  // Setup "+ Add..." Dropdown Menu & Placement Mode
  setupAddToolEvents() {
    const dropdownBtn = document.getElementById('addDropdownBtn');
    const dropdownMenu = document.getElementById('addDropdownMenu');
    const notice = document.getElementById('interactionNotice');

    dropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('active');
    });

    window.addEventListener('click', () => {
      dropdownMenu?.classList.remove('active');
    });

    document.querySelectorAll('.add-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = item.getAttribute('data-add');
        this.placementMode = type;
        dropdownMenu?.classList.remove('active');
        this.viewport.style.cursor = 'crosshair';
        if (notice) notice.textContent = `Placement Mode: Click anywhere on the map to place a new ${type.toUpperCase()}`;
      });
    });

    // Canvas click to place item
    this.canvas.addEventListener('click', (e) => {
      if (!this.placementMode) return;

      const rect = this.canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / this.zoom;
      const canvasY = (e.clientY - rect.top) / this.zoom;

      const scaleX = this.canvas.width / this.engine.width;
      const scaleY = this.canvas.height / this.engine.height;
      const cellX = Math.round(canvasX / scaleX);
      const cellY = Math.round(canvasY / scaleY);

      const prng = this.engine.createPRNG(Date.now());
      const newName = this.engine.generateFantasyName(prng, this.placementMode);

      if (this.placementMode === 'mountain') {
        this.engine.mountains.push({
          x: cellX, y: cellY, width: 24, height: 26, seed: Math.random()
        });
        this.engine.mountains.sort((a, b) => a.y - b.y);
      } else if (this.placementMode === 'tree') {
        for (let i = 0; i < 6; i++) {
          this.engine.trees.push({
            x: cellX + (Math.random() - 0.5) * 6,
            y: cellY + (Math.random() - 0.5) * 6,
            type: Math.random() > 0.5 ? 'deciduous' : 'pine',
            size: 8 + Math.random() * 4
          });
        }
        this.engine.trees.sort((a, b) => a.y - b.y);
      } else {
        // Settlement, POI or Custom Label
        const id = `user_${Date.now()}`;
        this.engine.labels.push({
          id, x: cellX, y: cellY, text: newName, type: this.placementMode, size: 12
        });
        if (this.placementMode === 'capital' || this.placementMode === 'town' || this.placementMode === 'castle') {
          this.engine.settlements.push({
            id, x: cellX, y: cellY, name: newName, type: this.placementMode, realmName: 'Frontier'
          });
        }
      }

      this.renderer.render(this.engine);
      this.showSuccessToast(`Placed ${this.placementMode} at X:${cellX} Y:${cellY}`);
      this.placementMode = null;
      this.viewport.style.cursor = 'grab';
      if (notice) notice.textContent = 'Scroll to zoom • Drag to pan • Click name to edit • Drag name to move';
    });
  }

  // Setup Region Detail Inspector View (from reference image)
  setupRegionInspectorEvents() {
    const inspectBtn = document.getElementById('inspectRegionBtn');
    const modal = document.getElementById('regionModal');
    const closeBtn = document.getElementById('closeRegionBtn');
    const rCanvas = document.getElementById('regionCanvas');
    const mCanvas = document.getElementById('regionMinimap');
    const titleEl = document.getElementById('regionModalTitle');
    const poiContainer = document.getElementById('regionPoiContainer');
    const exportBtn = document.getElementById('exportRegionPngBtn');

    const openInspector = (regionIndex = 0) => {
      if (!this.engine.realms.length) return;
      const realm = this.engine.realms[regionIndex % this.engine.realms.length];
      if (titleEl) titleEl.textContent = `${realm.fullName} Regional View`;

      modal?.classList.add('active');

      // Draw Region Magnified View (3x zoom on realm capital sector)
      if (rCanvas) {
        const rctx = rCanvas.getContext('2d');
        rctx.clearRect(0, 0, rCanvas.width, rCanvas.height);

        const ew = this.engine.width;
        const eh = this.engine.height;
        const sectorSize = 40; // 40x40 cells around realm capital
        const minX = Math.max(0, realm.x - sectorSize / 2);
        const minY = Math.max(0, realm.y - sectorSize / 2);

        // Render base magnified terrain on region canvas
        const img = rctx.createImageData(sectorSize, sectorSize);
        for (let dy = 0; dy < sectorSize; dy++) {
          for (let dx = 0; dx < sectorSize; dx++) {
            const gx = Math.min(ew - 1, Math.floor(minX + dx));
            const gy = Math.min(eh - 1, Math.floor(minY + dy));
            const idx = gy * ew + gx;
            const pIdx = (dy * sectorSize + dx) * 4;
            const elev = this.engine.heightmap[idx];
            const biome = this.engine.biomes[idx];
            const isWater = elev <= this.engine.seaLevel;

            const [r, g, b] = this.renderer.getColorForCell(this.renderer.currentStyle, elev, biome, this.engine.seaLevel, isWater);
            img.data[pIdx] = r;
            img.data[pIdx + 1] = g;
            img.data[pIdx + 2] = b;
            img.data[pIdx + 3] = 255;
          }
        }

        const tempC = document.createElement('canvas');
        tempC.width = sectorSize;
        tempC.height = sectorSize;
        tempC.getContext('2d').putImageData(img, 0, 0);

        rctx.imageSmoothingEnabled = true;
        rctx.drawImage(tempC, 0, 0, rCanvas.width, rCanvas.height);

        // Draw Capital Fortification in center
        const cx = rCanvas.width * 0.5;
        const cy = rCanvas.height * 0.5;
        rctx.beginPath();
        rctx.arc(cx, cy, 14, 0, Math.PI * 2);
        rctx.fillStyle = realm.color || '#f59e0b';
        rctx.fill();
        rctx.strokeStyle = '#ffffff';
        rctx.lineWidth = 3;
        rctx.stroke();

        rctx.font = 'bold 16px "Cinzel", serif';
        rctx.fillStyle = '#ffffff';
        rctx.textAlign = 'center';
        rctx.shadowColor = 'rgba(0,0,0,0.8)';
        rctx.shadowBlur = 6;
        rctx.fillText(realm.capitalName, cx, cy + 28);
      }

      // Draw Minimap on #regionMinimap
      if (mCanvas) {
        const mctx = mCanvas.getContext('2d');
        mctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        mctx.drawImage(this.canvas, 0, 0, mCanvas.width, mCanvas.height);

        // Draw golden bounding box of region
        const scaleX = mCanvas.width / this.engine.width;
        const scaleY = mCanvas.height / this.engine.height;
        mctx.strokeStyle = '#fbbf24';
        mctx.lineWidth = 2;
        mctx.strokeRect((realm.x - 20) * scaleX, (realm.y - 20) * scaleY, 40 * scaleX, 40 * scaleY);
      }

      // Populate Landmarks
      if (poiContainer) {
        poiContainer.innerHTML = `
          <div class="region-poi-item">🏰 <b>${realm.capitalName}</b> (Realm Capital)</div>
          <div class="region-poi-item">⚔️ <b>${realm.fullName}</b> Territory</div>
          <div class="region-poi-item">🌲 Local Groves & Wildwood</div>
          <div class="region-poi-item">⛰️ Spine of Peaks & Passes</div>
        `;
      }
    };

    inspectBtn?.addEventListener('click', () => openInspector(0));
    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    exportBtn?.addEventListener('click', () => {
      if (rCanvas) {
        const a = document.createElement('a');
        a.href = rCanvas.toDataURL('image/png');
        a.download = `AxisRegion_${Date.now()}.png`;
        a.click();
        this.showSuccessToast('Region PNG Exported!');
      }
    });
  }

  // Pan, Zoom and Sculpt Viewport Interactions
  setupViewportEvents() {
    const vp = this.viewport;
    const canvas = this.canvas;

    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newZoom = Math.max(0.15, Math.min(6.0, this.zoom * zoomFactor));

      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;

      this.applyTransform();
    }, { passive: false });

    vp.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && (e.spaceKey || this.sculptMode === 'none'))) {
        this.isPanning = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        vp.style.cursor = 'grabbing';
      } else if (e.button === 0 && this.sculptMode !== 'none') {
        this.isSculpting = true;
        this.pushHistory();
        this.handleSculptAtMouse(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      // Coordinate & Biome HUD Readout
      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        const gx = Math.floor(normX * this.engine.width);
        const gy = Math.floor(normY * this.engine.height);
        const idx = gy * this.engine.width + gx;
        const elev = this.engine.heightmap[idx];
        const biomeId = this.engine.biomes[idx];
        const biomeNames = [
          'Deep Ocean', 'Shallow Sea', 'Coastal Estuary', 'Open Plains',
          'Lush Grassland', 'Golden Savanna', 'Dense Forest', 'Arid Desert',
          'Wetlands / Marsh', 'Rugged Hills', 'High Mountain', 'Cold Tundra'
        ];
        const biomeName = biomeNames[biomeId] || 'Territory';

        const coordHud = document.getElementById('coordBadge');
        if (coordHud) {
          coordHud.textContent = `X:${gx} Y:${gy} | Elev:${(elev * 100).toFixed(0)}% | ${biomeName}`;
        }
      }

      if (this.isPanning) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.applyTransform();
      } else if (this.isSculpting && this.sculptMode !== 'none') {
        this.handleSculptAtMouse(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        vp.style.cursor = this.sculptMode === 'none' ? 'grab' : 'crosshair';
      }
      if (this.isSculpting) {
        this.isSculpting = false;
        this.renderer.render(this.engine);
      }
    });
  }

  handleSculptAtMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
      this.engine.applySculpt(normX, normY, this.brushRadius, this.brushStrength, this.sculptMode);
      this.renderer.render(this.engine);
    }
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new AxisApp();
  app.init();
});
