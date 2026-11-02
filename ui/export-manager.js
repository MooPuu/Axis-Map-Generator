// Axis Map Generator - Export Pipeline & Persistence
// Made By Mahdi Kareem © 2026

export class ExportManager {
  constructor(engine, renderer) {
    this.engine = engine;
    this.renderer = renderer;
  }

  // Check if running inside native Tauri environment
  isTauri() {
    return window.__TAURI__ !== undefined && window.__TAURI__.core !== undefined;
  }

  // Invoke Tauri command safely
  async invokeTauri(cmd, args) {
    if (this.isTauri()) {
      return await window.__TAURI__.core.invoke(cmd, args);
    }
    return null;
  }

  // Browser Fallback File Download
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // 1. Export High-Resolution PNG
  async exportPNG(customWidth, customHeight) {
    const w = customWidth || this.renderer.canvas.width;
    const h = customHeight || this.renderer.canvas.height;

    // Render onto an offscreen canvas at specified resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;

    const tempRenderer = new (this.renderer.constructor)(exportCanvas);
    tempRenderer.currentStyle = this.renderer.currentStyle;
    tempRenderer.layers = { ...this.renderer.layers };
    tempRenderer.labelFontSize = this.renderer.labelFontSize;
    tempRenderer.labelFilter = this.renderer.labelFilter;
    tempRenderer.render(this.engine);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const filename = `AxisMap_${this.engine.worldName || this.engine.archetype}_${this.engine.seed}.png`;

    if (this.isTauri()) {
      const res = await this.invokeTauri('dialog_save_file', {
        options: {
          title: 'Export Map Image',
          default_path: filename,
          filters: [{ name: 'PNG Image', extensions: ['png'] }]
        }
      });
      if (res && res.filePath) {
        // Convert base64 to byte array
        const base64Data = dataUrl.split(',')[1];
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        await this.invokeTauri('fs_write_file', { path: res.filePath, data: Array.from(bytes) });
        return { success: true, path: res.filePath };
      }
      return { canceled: true };
    } else {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      this.downloadBlob(blob, filename);
      return { success: true, path: filename };
    }
  }

  // 2. Export 16-bit Heightmap PNG (for Blender / Unreal Engine / Unity)
  async exportHeightmap(width = 1024, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const ew = this.engine.width;
    const eh = this.engine.height;

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      const ey = Math.min(eh - 1, Math.floor(ny * eh));
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ex = Math.min(ew - 1, Math.floor(nx * ew));
        const elev = this.engine.heightmap[ey * ew + ex];
        const val = Math.floor(elev * 255);

        const idx = (y * width + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `AxisHeightmap_${this.engine.seed}.png`;

    if (this.isTauri()) {
      const res = await this.invokeTauri('dialog_save_file', {
        options: {
          title: 'Export Heightmap PNG',
          default_path: filename,
          filters: [{ name: 'Heightmap PNG', extensions: ['png'] }]
        }
      });
      if (res && res.filePath) {
        const base64Data = dataUrl.split(',')[1];
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        await this.invokeTauri('fs_write_file', { path: res.filePath, data: Array.from(bytes) });
        return { success: true, path: res.filePath };
      }
      return { canceled: true };
    } else {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      this.downloadBlob(blob, filename);
      return { success: true, path: filename };
    }
  }

  // 3. Export SVG Vector Map
  async exportSVG() {
    const w = this.renderer.canvas.width;
    const h = this.renderer.canvas.height;
    const scaleX = w / this.engine.width;
    const scaleY = h / this.engine.height;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`;
    svg += `  <style>\n    .river { fill: none; stroke: #38bdf8; stroke-linecap: round; stroke-linejoin: round; }\n    .road { fill: none; stroke: #a3a3a3; stroke-dasharray: 4,4; stroke-width: 1.5; }\n    .label { font-family: 'Cinzel', serif; font-size: 12px; fill: #ffffff; text-anchor: middle; }\n  </style>\n`;
    svg += `  <!-- Background -->\n  <rect width="${w}" height="${h}" fill="#111827"/>\n`;

    // Rivers
    svg += `  <g id="rivers">\n`;
    for (const r of this.engine.rivers) {
      if (r.points.length < 2) continue;
      let d = `M ${r.points[0][0] * scaleX} ${r.points[0][1] * scaleY}`;
      for (let i = 1; i < r.points.length; i++) {
        d += ` L ${r.points[i][0] * scaleX} ${r.points[i][1] * scaleY}`;
      }
      svg += `    <path d="${d}" class="river" stroke-width="${r.width * scaleX}"/>\n`;
    }
    svg += `  </g>\n`;

    // Roads
    svg += `  <g id="roads">\n`;
    for (const road of this.engine.roads) {
      svg += `    <line x1="${road.from[0] * scaleX}" y1="${road.from[1] * scaleY}" x2="${road.to[0] * scaleX}" y2="${road.to[1] * scaleY}" class="road"/>\n`;
    }
    svg += `  </g>\n`;

    // Settlements
    svg += `  <g id="settlements">\n`;
    for (const s of this.engine.settlements) {
      svg += `    <circle cx="${s.x * scaleX}" cy="${s.y * scaleY}" r="4" fill="#f43f5e"/>\n`;
    }
    svg += `  </g>\n`;

    // Labels
    svg += `  <g id="labels">\n`;
    for (const lbl of this.engine.labels) {
      svg += `    <text x="${lbl.x * scaleX}" y="${lbl.y * scaleY}" class="label">${lbl.text}</text>\n`;
    }
    svg += `  </g>\n`;
    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `AxisMap_${this.engine.seed}.svg`;

    if (this.isTauri()) {
      const res = await this.invokeTauri('dialog_save_file', {
        options: {
          title: 'Export SVG Vector Map',
          default_path: filename,
          filters: [{ name: 'SVG Vector', extensions: ['svg'] }]
        }
      });
      if (res && res.filePath) {
        const encoder = new TextEncoder();
        await this.invokeTauri('fs_write_file', { path: res.filePath, data: Array.from(encoder.encode(svg)) });
        return { success: true, path: res.filePath };
      }
      return { canceled: true };
    } else {
      this.downloadBlob(blob, filename);
      return { success: true, path: filename };
    }
  }

  // 4. Save Project File (.axis)
  async saveProject() {
    const projectData = {
      app: 'Axis Map Generator',
      version: '2.0.0',
      author: 'Made By Mahdi Kareem © 2026',
      date: new Date().toISOString(),
      config: {
        width: this.engine.width,
        height: this.engine.height,
        seed: this.engine.seed,
        archetype: this.engine.archetype,
        seaLevel: this.engine.seaLevel,
        roughness: this.engine.roughness,
        continentalness: this.engine.continentalness,
        mountainDensity: this.engine.mountainDensity,
        temperatureBias: this.engine.temperatureBias,
        rainfallBias: this.engine.rainfallBias
      },
      layers: this.renderer.layers,
      currentStyle: this.renderer.currentStyle,
      heightmap: Array.from(this.engine.heightmap),
      settlements: this.engine.settlements,
      roads: this.engine.roads,
      labels: this.engine.labels
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    const filename = `MapProject_${this.engine.seed}.axis`;

    if (this.isTauri()) {
      const res = await this.invokeTauri('dialog_save_file', {
        options: {
          title: 'Save Axis Map Project',
          default_path: filename,
          filters: [{ name: 'Axis Map Project', extensions: ['axis', 'json'] }]
        }
      });
      if (res && res.filePath) {
        const encoder = new TextEncoder();
        await this.invokeTauri('fs_write_file', { path: res.filePath, data: Array.from(encoder.encode(jsonStr)) });
        return { success: true, path: res.filePath };
      }
      return { canceled: true };
    } else {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      this.downloadBlob(blob, filename);
      return { success: true, path: filename };
    }
  }

  // 5. Open Project File (.axis)
  async loadProject() {
    if (this.isTauri()) {
      const res = await this.invokeTauri('dialog_open_file', {
        options: {
          title: 'Open Axis Map Project',
          filters: [{ name: 'Axis Project', extensions: ['axis', 'json'] }]
        }
      });
      if (res && res.filePaths && res.filePaths.length > 0) {
        const bytes = await this.invokeTauri('fs_read_file', { path: res.filePaths[0] });
        const decoder = new TextDecoder();
        const json = JSON.parse(decoder.decode(new Uint8Array(bytes)));
        this.applyProjectData(json);
        return { success: true, path: res.filePaths[0] };
      }
      return { canceled: true };
    } else {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.axis,.json';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return resolve({ canceled: true });
          const text = await file.text();
          const json = JSON.parse(text);
          this.applyProjectData(json);
          resolve({ success: true, path: file.name });
        };
        input.click();
      });
    }
  }

  // Restore State from loaded project data
  applyProjectData(data) {
    if (!data.config) return;
    this.engine.width = data.config.width || 240;
    this.engine.height = data.config.height || 150;
    this.engine.seed = data.config.seed;
    this.engine.archetype = data.config.archetype;
    this.engine.seaLevel = data.config.seaLevel;
    this.engine.roughness = data.config.roughness;
    this.engine.continentalness = data.config.continentalness;
    this.engine.mountainDensity = data.config.mountainDensity;
    this.engine.temperatureBias = data.config.temperatureBias;
    this.engine.rainfallBias = data.config.rainfallBias;

    if (data.heightmap) {
      this.engine.heightmap = new Float32Array(data.heightmap);
    }
    if (data.settlements) this.engine.settlements = data.settlements;
    if (data.roads) this.engine.roads = data.roads;
    if (data.labels) this.engine.labels = data.labels;

    if (data.layers) this.renderer.layers = data.layers;
    if (data.currentStyle) {
      this.renderer.currentStyle = data.currentStyle;
      document.querySelectorAll('.style-card').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-style') === data.currentStyle);
      });
    }

    // Sync UI Sliders & Inputs
    const seedEl = document.getElementById('seedInput');
    if (seedEl) seedEl.value = this.engine.seed;
    const archEl = document.getElementById('archetypeSelect');
    if (archEl) archEl.value = this.engine.archetype;

    const syncSlider = (id, valId, val) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(valId);
      if (el) el.value = val;
      if (valEl) valEl.textContent = Number(val).toFixed(2);
    };

    syncSlider('seaLevelSlider', 'seaLevelVal', this.engine.seaLevel);
    syncSlider('roughnessSlider', 'roughnessVal', this.engine.roughness);
    syncSlider('continentalnessSlider', 'continentalnessVal', this.engine.continentalness);
    syncSlider('mountainSlider', 'mountainVal', this.engine.mountainDensity);
    syncSlider('tempSlider', 'tempVal', this.engine.temperatureBias);
    syncSlider('rainSlider', 'rainVal', this.engine.rainfallBias);

    // Sync Layer Checkboxes
    if (data.layers) {
      for (const [key, val] of Object.entries(data.layers)) {
        const chk = document.getElementById(`layer_${key}`);
        if (chk) chk.checked = val;
      }
    }

    // Sync Stats
    const statSeed = document.getElementById('statSeed');
    if (statSeed) statSeed.textContent = this.engine.seed;
    const statRiv = document.getElementById('statRivers');
    if (statRiv) statRiv.textContent = this.engine.rivers.length;
    const statSet = document.getElementById('statSettlements');
    if (statSet) statSet.textContent = this.engine.settlements.length;

    this.engine.classifyBiomes();
    this.renderer.render(this.engine);
  }
}
