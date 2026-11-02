// Axis Map Generator - Multi-Style Cartographic Renderer
// Made By Mahdi Kareem © 2026

export class MapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.currentStyle = 'parchment'; // Default

    // Layer Visibility
    this.layers = {
      water: true,
      elevation: true,
      hillshading: true,
      biomes: true,
      coastlines: true,
      lakes: true,
      rivers: true,
      relief: true, // Mountains & Foothills
      forests: true, // Tree clusters
      borders: true,
      realms: true, // Realm banners & dynasty badges
      settlements: true,
      pois: true, // Points of Interest
      roads: true,
      labels: true,
      titleBanner: true, // The Realms of ... ribbon banner
      scaleBar: true, // Distance scale bar (0 - 1000 km)
      compassRose: true, // Nautical windrose
      borderFrame: true, // Ornate border
      grid: false,
      gridType: 'hex', // 'hex' | 'square'
      gridSize: 32,
      gridOpacity: 0.18,
      vignette: true
    };

    // Label typography control
    this.labelFontSize = 13;
    this.labelFilter = 'all'; // 'all' | 'capitals' | 'settlements' | 'oceans'

    // Color Palettes for all 13 cartographic themes
    this.palettes = {
      // 1. Classic Fantasy Parchment (The signature Tolkien style from reference)
      parchment: {
        oceanDeep: '#5c8096', oceanShallow: '#8bb0c4', oceanCoast: '#cbe3ee', sandRim: '#e8dcba',
        landLow: '#f2ecd9', landMid: '#e8dfc5', landHigh: '#dacfad', mountainPeak: '#ebdccb',
        plains: '#e7dec3', grassland: '#d5dec0', forest: '#8fa876', savanna: '#dfd4a7',
        desert: '#e8d59e', wetlands: '#a8bfa1', hills: '#d4c7a5', tundra: '#e2e7e9',
        riverColor: '#467694', riverBorder: '#1c2430', borderLine: '#8a3c2a', roadLine: '#7c5e43',
        labelColor: '#1c150e', textColor: '#1a140e', frameColor: '#453828',
        inkColor: '#1e2633', mountainHighlight: '#faf8f2', mountainShadow: 'rgba(54, 43, 29, 0.52)',
        mountainHatch: '#241c14', treeCanopyWash: 'rgba(105, 145, 80, 0.35)',
        treeLeaf: '#6a9c46', treeShadow: '#33541f', treeTrunk: '#523c2a',
        bannerBg: '#f7f2e4', bannerBorder: '#4a3824', bannerRibbon: '#3e2e1c'
      },
      // 2. Atlas Topographic Relief
      atlas: {
        oceanDeep: '#163252', oceanMid: '#244872', oceanShallow: '#386a94', oceanCoast: '#5994bc', sandRim: '#eedfb8',
        landLow: '#a7c957', landMid: '#6a994e', landHigh: '#bc6c25', mountainPeak: '#ffffff',
        plains: '#ccd5ae', grassland: '#a7c957', forest: '#386641', savanna: '#e9d8a6',
        desert: '#f4a261', wetlands: '#52796f', hills: '#b08968', tundra: '#cad2c5',
        riverColor: '#1d3557', riverBorder: '#0b1622', borderLine: '#e63946', roadLine: '#495057',
        labelColor: '#0f172a', textColor: '#020617', frameColor: '#1e293b',
        inkColor: '#0f172a', mountainHighlight: '#f8fafc', mountainShadow: 'rgba(15, 23, 42, 0.60)',
        mountainHatch: '#0f172a', treeCanopyWash: 'rgba(45, 106, 79, 0.38)',
        treeLeaf: '#2d6a4f', treeShadow: '#1b4332', treeTrunk: '#4a3b32',
        bannerBg: '#f8fafc', bannerBorder: '#1e293b', bannerRibbon: '#0f172a'
      },
      // 3. Minimal Ink Line Art
      minimal_ink: {
        oceanDeep: '#ffffff', oceanShallow: '#ffffff', oceanCoast: '#ffffff', sandRim: '#ffffff',
        landLow: '#ffffff', landMid: '#ffffff', landHigh: '#ffffff', mountainPeak: '#ffffff',
        plains: '#ffffff', grassland: '#ffffff', forest: '#ffffff', savanna: '#ffffff',
        desert: '#ffffff', wetlands: '#ffffff', hills: '#ffffff', tundra: '#ffffff',
        riverColor: '#111827', riverBorder: '#000000', borderLine: '#374151', roadLine: '#6b7280',
        labelColor: '#111827', textColor: '#000000', frameColor: '#111827',
        inkColor: '#111827', mountainHighlight: '#ffffff', mountainShadow: 'rgba(17, 24, 39, 0.65)',
        mountainHatch: '#111827', treeCanopyWash: 'rgba(0, 0, 0, 0.05)',
        treeLeaf: '#ffffff', treeShadow: '#111827', treeTrunk: '#111827',
        bannerBg: '#ffffff', bannerBorder: '#111827', bannerRibbon: '#111827'
      },
      // 4. Watercolor Impressionist
      watercolor: {
        oceanDeep: '#6c95b4', oceanShallow: '#96bfd8', oceanCoast: '#bde0f2', sandRim: '#ede3cd',
        landLow: '#f7f0df', landMid: '#eee3cd', landHigh: '#e1d2b8', mountainPeak: '#f2e8d5',
        plains: '#e8e0cc', grassland: '#c8ddb5', forest: '#7ca871', savanna: '#ead8a7',
        desert: '#edd298', wetlands: '#9ec2a8', hills: '#d5c49f', tundra: '#dde4e8',
        riverColor: '#4f7f9b', riverBorder: '#32586e', borderLine: '#944434', roadLine: '#8a6e55',
        labelColor: '#2b2118', textColor: '#241a12', frameColor: '#4f3c2b',
        inkColor: '#2d2217', mountainHighlight: '#faf6ee', mountainShadow: 'rgba(79, 60, 43, 0.45)',
        mountainHatch: '#34261a', treeCanopyWash: 'rgba(124, 168, 113, 0.35)',
        treeLeaf: '#688e52', treeShadow: '#496839', treeTrunk: '#614d3a',
        bannerBg: '#faf5e8', bannerBorder: '#5c4632', bannerRibbon: '#4a3726'
      },
      // 5. Verdant Lush Realm
      verdant: {
        oceanDeep: '#1d4d7a', oceanShallow: '#337096', oceanCoast: '#5da9e9', sandRim: '#e6f4df',
        landLow: '#d8f3dc', landMid: '#b7e4c7', landHigh: '#95d5b2', mountainPeak: '#e8f5e9',
        plains: '#c7f9cc', grassland: '#80ed99', forest: '#38b000', savanna: '#d8e2dc',
        desert: '#f0e68c', wetlands: '#57cc99', hills: '#74c69d', tundra: '#e0e1dd',
        riverColor: '#1d4e89', riverBorder: '#0b2545', borderLine: '#c1121f', roadLine: '#5c677d',
        labelColor: '#0b2545', textColor: '#04101e', frameColor: '#134074',
        inkColor: '#134074', mountainHighlight: '#f1faee', mountainShadow: 'rgba(19, 64, 116, 0.48)',
        mountainHatch: '#134074', treeCanopyWash: 'rgba(56, 176, 0, 0.32)',
        treeLeaf: '#2d6a4f', treeShadow: '#1b4332', treeTrunk: '#493829',
        bannerBg: '#ffffff', bannerBorder: '#134074', bannerRibbon: '#0b2545'
      },
      // 6. Photorealistic Satellite
      satellite: {
        oceanDeep: '#0b1d3a', oceanShallow: '#1a4473', oceanCoast: '#2d6a9f', sandRim: '#d1b88e',
        landLow: '#5b8a3c', landMid: '#4b7530', landHigh: '#78876c', mountainPeak: '#f1f5f9',
        plains: '#7fa35b', grassland: '#5b8a3c', forest: '#1e4d2b', savanna: '#a3a85b',
        desert: '#d9ab65', wetlands: '#3b5a45', hills: '#6d755d', tundra: '#8c9684',
        riverColor: '#1e40af', riverBorder: '#172554', borderLine: '#f59e0b', roadLine: '#94a3b8',
        labelColor: '#ffffff', textColor: '#ffffff', frameColor: '#0f172a',
        inkColor: '#0f172a', mountainHighlight: '#cbd5e1', mountainShadow: 'rgba(15, 23, 42, 0.70)',
        mountainHatch: '#0f172a', treeCanopyWash: 'rgba(30, 77, 43, 0.45)',
        treeLeaf: '#14532d', treeShadow: '#052e16', treeTrunk: '#3e2723',
        bannerBg: '#1e293b', bannerBorder: '#38bdf8', bannerRibbon: '#0284c7'
      },
      // 7. Dark Cartography (Midnight Indigo & Cyan Glow)
      dark_cartography: {
        oceanDeep: '#060910', oceanShallow: '#0b1320', oceanCoast: '#142338', sandRim: '#212d40',
        landLow: '#181e2b', landMid: '#1e2638', landHigh: '#273148', mountainPeak: '#384666',
        plains: '#1b2230', grassland: '#1c2936', forest: '#18332a', savanna: '#2b2922',
        desert: '#2d251c', wetlands: '#142b26', hills: '#293245', tundra: '#273442',
        riverColor: '#38bdf8', riverBorder: '#0284c7', borderLine: '#f43f5e', roadLine: '#64748b',
        labelColor: '#f8fafc', textColor: '#ffffff', frameColor: '#334155', glowColor: 'rgba(56, 189, 248, 0.4)',
        inkColor: '#38bdf8', mountainHighlight: '#1e293b', mountainShadow: 'rgba(56, 189, 248, 0.35)',
        mountainHatch: '#38bdf8', treeCanopyWash: 'rgba(16, 185, 129, 0.25)',
        treeLeaf: '#10b981', treeShadow: '#064e3b', treeTrunk: '#475569',
        bannerBg: '#0f172a', bannerBorder: '#38bdf8', bannerRibbon: '#0284c7'
      },
      // 8. Cyberpunk Neon
      cyberpunk: {
        oceanDeep: '#030306', oceanShallow: '#070810', oceanCoast: '#0e1224', sandRim: '#1f1a35',
        landLow: '#101426', landMid: '#171c35', landHigh: '#22294c', mountainPeak: '#351c4d',
        plains: '#12172d', grassland: '#102236', forest: '#092d33', savanna: '#27202b',
        desert: '#2d1525', wetlands: '#0c262e', hills: '#261b3d', tundra: '#1d2238',
        riverColor: '#00f0ff', riverBorder: '#0099ff', borderLine: '#ff007f', roadLine: '#ffe600',
        labelColor: '#00f0ff', textColor: '#ffffff', frameColor: '#ff007f', glowColor: 'rgba(0, 240, 255, 0.65)',
        inkColor: '#ff007f', mountainHighlight: '#22193b', mountainShadow: 'rgba(255, 0, 127, 0.5)',
        mountainHatch: '#00f0ff', treeCanopyWash: 'rgba(0, 245, 212, 0.25)',
        treeLeaf: '#00f5d4', treeShadow: '#007f7f', treeTrunk: '#ff007f',
        bannerBg: '#0a0a14', bannerBorder: '#ff007f', bannerRibbon: '#00f0ff'
      },
      // 9. Sci-Fi Hologram
      hologram: {
        oceanDeep: '#010f18', oceanShallow: '#021c2c', oceanCoast: '#042e45', sandRim: '#094562',
        landLow: '#073e5a', landMid: '#0a4f73', landHigh: '#0d6594', mountainPeak: '#118ab2',
        plains: '#084564', grassland: '#084d69', forest: '#053e52', savanna: '#0b526d',
        desert: '#0e5d77', wetlands: '#064359', hills: '#0f6a8e', tundra: '#0d6380',
        riverColor: '#00f5d4', riverBorder: '#00b4d8', borderLine: '#00b4d8', roadLine: '#06d6a0',
        labelColor: '#00f5d4', textColor: '#e0fbfc', frameColor: '#00b4d8', glowColor: 'rgba(0, 245, 212, 0.5)',
        inkColor: '#00f5d4', mountainHighlight: '#0a4f73', mountainShadow: 'rgba(0, 245, 212, 0.45)',
        mountainHatch: '#00f5d4', treeCanopyWash: 'rgba(6, 214, 160, 0.25)',
        treeLeaf: '#06d6a0', treeShadow: '#028060', treeTrunk: '#00b4d8',
        bannerBg: '#021927', bannerBorder: '#00f5d4', bannerRibbon: '#00b4d8'
      },
      // 10. Antique Pirate & Age of Discovery
      pirate: {
        oceanDeep: '#87704c', oceanShallow: '#ae9568', oceanCoast: '#c7a775', sandRim: '#dfcb9f',
        landLow: '#ebd5a8', landMid: '#dec495', landHigh: '#d0b382', mountainPeak: '#b9986b',
        plains: '#dfc79b', grassland: '#c8ba87', forest: '#7f8a5e', savanna: '#d6c085',
        desert: '#dcbb7a', wetlands: '#97a37e', hills: '#c6a978', tundra: '#d9cfb8',
        riverColor: '#382e22', riverBorder: '#261e16', borderLine: '#8b1e0f', roadLine: '#695139',
        labelColor: '#2b1e11', textColor: '#1c1308', frameColor: '#4a331c',
        inkColor: '#2c1e12', mountainHighlight: '#faeccf', mountainShadow: 'rgba(61, 43, 26, 0.55)',
        mountainHatch: '#2c1e12', treeCanopyWash: 'rgba(127, 138, 94, 0.35)',
        treeLeaf: '#5a6b42', treeShadow: '#3d4a2b', treeTrunk: '#4a331c',
        bannerBg: '#f2e2be', bannerBorder: '#4a331c', bannerRibbon: '#8b1e0f'
      },
      // 11. Cozy Pixel Art (Retro RPG)
      pixel: {
        oceanDeep: '#1d4ed8', oceanShallow: '#3b82f6', oceanCoast: '#60a5fa',
        landLow: '#86efac', landMid: '#4ade80', landHigh: '#854d0e', mountainPeak: '#f8fafc',
        plains: '#86efac', grassland: '#22c55e', forest: '#15803d', savanna: '#fde047',
        desert: '#fbbf24', wetlands: '#14b8a6', hills: '#a16207', tundra: '#e2e8f0',
        riverColor: '#93c5fd', riverBorder: '#1d4ed8', borderLine: '#ef4444', roadLine: '#d97706',
        labelColor: '#ffffff', textColor: '#ffffff', frameColor: '#1e293b',
        inkColor: '#1e293b', mountainFill: '#a16207', mountainShadow: '#713f12',
        treeLeaf: '#16a34a', treeShadow: '#14532d', treeTrunk: '#78350f',
        bannerBg: '#1e293b', bannerBorder: '#fbbf24', bannerRibbon: '#ef4444'
      },
      // 12. Steampunk Brass & Gear
      steampunk: {
        oceanDeep: '#16120e', oceanShallow: '#251e18', oceanCoast: '#362a20',
        landLow: '#4d3b2c', landMid: '#634b35', landHigh: '#825f3f', mountainPeak: '#a87a4c',
        plains: '#574332', grassland: '#555437', forest: '#39462b', savanna: '#665134',
        desert: '#785b37', wetlands: '#38453c', hills: '#775739', tundra: '#5e5a56',
        riverColor: '#0ea5e9', riverBorder: '#0369a1', borderLine: '#b87333', roadLine: '#d4af37',
        labelColor: '#e5c07b', textColor: '#f3e5ab', frameColor: '#b87333', gearColor: '#d4af37',
        inkColor: '#b87333', mountainFill: '#6b5139', mountainShadow: 'rgba(212, 175, 55, 0.4)',
        treeLeaf: '#606c38', treeShadow: '#283618', treeTrunk: '#d4af37',
        bannerBg: '#2a221b', bannerBorder: '#d4af37', bannerRibbon: '#b87333'
      },
      // 13. Blueprint & Draftsman
      blueprint: {
        oceanDeep: '#06152b', oceanShallow: '#0a2344', oceanCoast: '#0e315d',
        landLow: '#123e75', landMid: '#164b8c', landHigh: '#1b5aa5', mountainPeak: '#2069bf',
        plains: '#13427d', grassland: '#144685', forest: '#0f386c', savanna: '#184f93',
        desert: '#1b559c', wetlands: '#113c71', hills: '#1c5da7', tundra: '#1e63b2',
        riverColor: '#7dd3fc', riverBorder: '#38bdf8', borderLine: '#ffffff', roadLine: '#38bdf8',
        labelColor: '#ffffff', textColor: '#f0f9ff', frameColor: '#38bdf8', gridColor: 'rgba(56, 189, 248, 0.22)',
        inkColor: '#f0f9ff', mountainFill: '#164b8c', mountainShadow: 'rgba(125, 211, 252, 0.5)',
        treeLeaf: '#38bdf8', treeShadow: '#0284c7', treeTrunk: '#ffffff',
        bannerBg: '#092142', bannerBorder: '#38bdf8', bannerRibbon: '#7dd3fc'
      }
    };
  }

  setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // Master Render Loop
  render(engine) {
    if (!engine) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Base Terrain & Biomes
    this.renderTerrain(engine, w, h);

    // 2. Coastline Inks & Concentric Wave Ripple Rings (Signature hand-drawn nautical look)
    if (this.layers.coastlines && this.layers.water) {
      this.renderCoastlines(engine, w, h);
    }

    // 3. Inland Lakes & Basins
    if (this.layers.lakes && this.layers.water) {
      this.renderLakes(engine, w, h);
    }

    // 4. Meandering Rivers
    if (this.layers.rivers) {
      this.renderRivers(engine, w, h);
    }

    // 5. Foothill Mounds
    if (this.layers.relief) {
      this.renderFoothills(engine, w, h);
    }

    // 6. Isometric Mountain Peaks
    if (this.layers.relief) {
      this.renderMountains(engine, w, h);
    }

    // 7. Hand-Drawn Forest & Tree Groves
    if (this.layers.forests) {
      this.renderForests(engine, w, h);
    }

    // 8. Trade Roads
    if (this.layers.roads) {
      this.renderRoads(engine, w, h);
    }

    // 9. Settlements & Heraldic Fortifications
    if (this.layers.settlements) {
      this.renderSettlements(engine, w, h);
    }

    // 10. Points of Interest (POIs)
    if (this.layers.pois) {
      this.renderPOIs(engine, w, h);
    }

    // 11. Coordinate / Hex Grid
    if (this.layers.grid || this.currentStyle === 'blueprint' || this.currentStyle === 'hologram') {
      this.renderGrid(w, h);
    }

    // 12. Cartographic Labels, Realm Dynasties & Ocean Names
    if (this.layers.labels) {
      this.renderLabels(engine, w, h);
    }

    // 13. Heraldic Title Banner (e.g. "The Land of Dwalbarrul" / "THE REALMS OF FENWYN")
    if (this.layers.titleBanner) {
      this.renderTitleBanner(engine, w, h);
    }

    // 14. Distance Scale Bar (e.g. 0 - 1000 km)
    if (this.layers.scaleBar) {
      this.renderScaleBar(w, h);
    }

    // 15. Nautical Compass Rose
    if (this.layers.compassRose) {
      this.renderCompassRose(w, h, this.currentStyle);
    }

    // 16. Ornate Border Frame
    if (this.layers.borderFrame) {
      this.renderBorderFrame(w, h, this.currentStyle);
    }

    // 17. Atmospheric Vignette
    if (this.layers.vignette) {
      this.renderVignette(w, h, this.currentStyle);
    }
  }

  // Marching Squares Isoline / Contour Segment Extractor
  extractContourSegments(heightmap, ew, eh, threshold) {
    const segments = [];
    for (let y = 0; y < eh - 1; y++) {
      for (let x = 0; x < ew - 1; x++) {
        const v0 = heightmap[y * ew + x];
        const v1 = heightmap[y * ew + (x + 1)];
        const v2 = heightmap[(y + 1) * ew + (x + 1)];
        const v3 = heightmap[(y + 1) * ew + x];

        const b0 = v0 >= threshold ? 1 : 0;
        const b1 = v1 >= threshold ? 2 : 0;
        const b2 = v2 >= threshold ? 4 : 0;
        const b3 = v3 >= threshold ? 8 : 0;
        const code = b0 | b1 | b2 | b3;

        if (code === 0 || code === 15) continue;

        // Linear interpolation for sub-pixel accuracy
        const top = [x + (threshold - v0) / ((v1 - v0) || 0.0001), y];
        const right = [x + 1, y + (threshold - v1) / ((v2 - v1) || 0.0001)];
        const bottom = [x + (threshold - v3) / ((v2 - v3) || 0.0001), y + 1];
        const left = [x, y + (threshold - v0) / ((v3 - v0) || 0.0001)];

        switch (code) {
          case 1: segments.push([left, top]); break;
          case 2: segments.push([top, right]); break;
          case 3: segments.push([left, right]); break;
          case 4: segments.push([right, bottom]); break;
          case 5: segments.push([left, top]); segments.push([right, bottom]); break;
          case 6: segments.push([top, bottom]); break;
          case 7: segments.push([left, bottom]); break;
          case 8: segments.push([bottom, left]); break;
          case 9: segments.push([top, bottom]); break;
          case 10: segments.push([top, right]); segments.push([bottom, left]); break;
          case 11: segments.push([right, bottom]); break;
          case 12: segments.push([left, right]); break;
          case 13: segments.push([top, right]); break;
          case 14: segments.push([left, top]); break;
        }
      }
    }
    return segments;
  }

  // 1. Render Terrain Base Pixels, Bathymetry & Shaded Relief
  renderTerrain(engine, w, h) {
    const ew = engine.width;
    const eh = engine.height;
    const imgData = this.ctx.createImageData(ew, eh);
    const data = imgData.data;

    const style = this.currentStyle;
    const seaLevel = engine.seaLevel;

    // Fast distance-to-land for water bathymetry & beach rim
    const isLand = new Uint8Array(ew * eh);
    for (let i = 0; i < ew * eh; i++) {
      if (engine.heightmap[i] > seaLevel) isLand[i] = 1;
    }

    const shelfDist = new Uint8Array(ew * eh);
    const isBeach = new Uint8Array(ew * eh);

    for (let y = 0; y < eh; y++) {
      for (let x = 0; x < ew; x++) {
        const idx = y * ew + x;
        if (isLand[idx]) {
          // Check 4-neighbors for water
          if (
            (x > 0 && !isLand[idx - 1]) ||
            (x < ew - 1 && !isLand[idx + 1]) ||
            (y > 0 && !isLand[idx - ew]) ||
            (y < eh - 1 && !isLand[idx + ew])
          ) {
            isBeach[idx] = 1;
          }
        } else {
          // Water cell: check distance to land
          let minDist = 99;
          for (let dy = -3; dy <= 3; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= eh) continue;
            for (let dx = -3; dx <= 3; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= ew) continue;
              if (isLand[ny * ew + nx]) {
                const d = Math.abs(dx) + Math.abs(dy);
                if (d < minDist) minDist = d;
              }
            }
          }
          shelfDist[idx] = minDist;
        }
      }
    }

    // Hillshading vector (Azimuth 315° NW, Altitude 45°)
    const lx = -0.7071, ly = -0.7071, lz = 1.0;
    const lLen = Math.hypot(lx, ly, lz);
    const nlx = lx / lLen, nly = ly / lLen, nlz = lz / lLen;

    for (let y = 0; y < eh; y++) {
      for (let x = 0; x < ew; x++) {
        const idx = y * ew + x;
        const pIdx = idx * 4;

        const elev = engine.heightmap[idx];
        const biome = this.layers.biomes ? engine.biomes[idx] : 3;
        const isWater = elev <= seaLevel;

        if (!this.layers.water && isWater) {
          data[pIdx] = 16; data[pIdx + 1] = 20; data[pIdx + 2] = 28; data[pIdx + 3] = 255;
          continue;
        }

        let shade = 1.0;
        if (this.layers.hillshading && !isWater && style !== 'minimal_ink' && style !== 'blueprint') {
          const x0 = x > 0 ? engine.heightmap[y * ew + (x - 1)] : elev;
          const x1 = x < ew - 1 ? engine.heightmap[y * ew + (x + 1)] : elev;
          const y0 = y > 0 ? engine.heightmap[(y - 1) * ew + x] : elev;
          const y1 = y < eh - 1 ? engine.heightmap[(y + 1) * ew + x] : elev;

          const dx = (x1 - x0) * 8.0;
          const dy = (y1 - y0) * 8.0;
          const dz = 1.0;
          const nLen = Math.hypot(dx, dy, dz);
          const dot = (dx * nlx + dy * nly + dz * nlz) / nLen;
          shade = 0.82 + Math.max(0.0, dot) * 0.36;
        }

        const [r, g, b] = this.getColorForCell(style, elev, biome, seaLevel, isWater, shelfDist[idx], isBeach[idx]);
        data[pIdx] = Math.min(255, Math.floor(r * shade));
        data[pIdx + 1] = Math.min(255, Math.floor(g * shade));
        data[pIdx + 2] = Math.min(255, Math.floor(b * shade));
        data[pIdx + 3] = 255;
      }
    }

    // Draw terrain to offscreen canvas and scale up with smoothing
    const offCanvas = document.createElement('canvas');
    offCanvas.width = ew;
    offCanvas.height = eh;
    offCanvas.getContext('2d').putImageData(imgData, 0, 0);

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = (style !== 'pixel');
    this.ctx.drawImage(offCanvas, 0, 0, w, h);
    this.ctx.restore();
  }

  // Palette lookup for each cell with coastal bathymetry and sand rim
  getColorForCell(style, elev, biome, seaLevel, isWater, shelfDist = 99, isBeach = 0) {
    const p = this.palettes[style] || this.palettes.parchment;

    if (style === 'minimal_ink') {
      return [255, 255, 255];
    }

    if (isWater) {
      if (shelfDist <= 2) return this.hexToRgb(p.oceanCoast);
      if (shelfDist <= 4) return this.hexToRgb(p.oceanShallow);
      return this.hexToRgb(p.oceanDeep);
    }

    // Coastal sandy beach rim on land edge
    if (isBeach && style !== 'satellite' && style !== 'minimal_ink') {
      return this.hexToRgb(p.sandRim || '#e8dcba');
    }

    // 10 Legend Biomes
    switch (biome) {
      case 7: return this.hexToRgb(p.desert || '#e8d59e');
      case 4: return this.hexToRgb(p.grassland || '#d5dec0');
      case 10: return this.hexToRgb(p.mountainPeak || '#ebdccb');
      case 6: return this.hexToRgb(p.forest || '#8fa876');
      case 9: return this.hexToRgb(p.hills || '#d4c7a5');
      case 3: return this.hexToRgb(p.plains || '#e7dec3');
      case 5: return this.hexToRgb(p.savanna || '#dfd4a7');
      case 8: return this.hexToRgb(p.wetlands || '#a8bfa1');
      case 11: return this.hexToRgb(p.tundra || '#e2e7e9');
      default: return this.hexToRgb(p.landLow || '#f2ecd9');
    }
  }

  // 2. Continuous Vector Coastlines & Concentric Wave Ripple Contours
  renderCoastlines(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const ew = engine.width;
    const eh = engine.height;
    const scaleX = w / ew;
    const scaleY = h / eh;
    const seaLevel = engine.seaLevel;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawSegments = (segments) => {
      ctx.beginPath();
      for (const seg of segments) {
        ctx.moveTo(seg[0][0] * scaleX, seg[0][1] * scaleY);
        ctx.lineTo(seg[1][0] * scaleX, seg[1][1] * scaleY);
      }
      ctx.stroke();
    };

    // Concentric shallow water wave ripples (depth echoes)
    if (style === 'parchment' || style === 'pirate' || style === 'watercolor' || style === 'verdant' || style === 'atlas') {
      const outerSegments = this.extractContourSegments(engine.heightmap, ew, eh, seaLevel - 0.026);
      ctx.strokeStyle = style === 'dark_cartography' || style === 'cyberpunk'
        ? 'rgba(56, 189, 248, 0.18)'
        : 'rgba(40, 65, 85, 0.18)';
      ctx.lineWidth = Math.max(0.8, 1.0 * (w / 1920));
      drawSegments(outerSegments);

      const midSegments = this.extractContourSegments(engine.heightmap, ew, eh, seaLevel - 0.012);
      ctx.strokeStyle = style === 'dark_cartography' || style === 'cyberpunk'
        ? 'rgba(56, 189, 248, 0.32)'
        : 'rgba(40, 65, 85, 0.32)';
      ctx.lineWidth = Math.max(1.0, 1.3 * (w / 1920));
      drawSegments(midSegments);

      const surfSegments = this.extractContourSegments(engine.heightmap, ew, eh, seaLevel - 0.003);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = Math.max(1.0, 1.4 * (w / 1920));
      drawSegments(surfSegments);

      const beachSegments = this.extractContourSegments(engine.heightmap, ew, eh, seaLevel + 0.008);
      ctx.strokeStyle = p.sandRim || '#cfbf94';
      ctx.lineWidth = Math.max(0.8, 1.1 * (w / 1920));
      drawSegments(beachSegments);
    }

    // PRIMARY CRISP VECTOR COASTLINE OUTLINE (Bold Dark Charcoal Ink)
    const coastSegments = this.extractContourSegments(engine.heightmap, ew, eh, seaLevel);
    ctx.strokeStyle = p.inkColor || '#1e2633';
    ctx.lineWidth = style === 'pixel' ? 3.0 : Math.max(1.8, 2.4 * (w / 1920));
    drawSegments(coastSegments);

    ctx.restore();
  }

  // 3. Inland Lakes & Water Basins with Defined Outlines
  renderLakes(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;

    ctx.save();
    for (const lake of engine.lakes) {
      const lx = lake.x * scaleX;
      const ly = lake.y * scaleY;
      const rx = lake.rx * scaleX;
      const ry = lake.ry * scaleY;

      // Lake Water Body Fill
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx, ry, lake.rotation, 0, Math.PI * 2);
      ctx.fillStyle = p.oceanShallow || '#8eb4ca';
      ctx.fill();

      // Sharp Ink Shoreline Outline
      ctx.strokeStyle = p.inkColor || '#1e2633';
      ctx.lineWidth = Math.max(1.4, 2.0 * (w / 1920));
      ctx.stroke();

      // Inner Wave Ripple Highlight
      ctx.beginPath();
      ctx.ellipse(lx, ly, Math.max(1, rx - 3 * (w / 1920)), Math.max(1, ry - 2 * (h / 1080)), lake.rotation, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Meandering Rivers with Dark Outlines & Water Core
  renderRivers(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Pass 1: Crisp Dark Ink Outer Outline
    for (const river of engine.rivers) {
      if (river.points.length < 2) continue;
      const baseW = Math.max(1.6, river.width * scaleX * 0.58);
      ctx.strokeStyle = p.inkColor || '#1e2633';
      ctx.lineWidth = baseW + 2.2;

      ctx.beginPath();
      ctx.moveTo(river.points[0][0] * scaleX, river.points[0][1] * scaleY);
      for (let i = 1; i < river.points.length; i++) {
        const xc = (river.points[i - 1][0] + river.points[i][0]) / 2 * scaleX;
        const yc = (river.points[i - 1][1] + river.points[i][1]) / 2 * scaleY;
        ctx.quadraticCurveTo(river.points[i - 1][0] * scaleX, river.points[i - 1][1] * scaleY, xc, yc);
      }
      ctx.stroke();
    }

    // Pass 2: Vivid River Water Core
    for (const river of engine.rivers) {
      if (river.points.length < 2) continue;
      const baseW = Math.max(1.4, river.width * scaleX * 0.58);
      ctx.strokeStyle = p.riverColor || '#467694';
      ctx.lineWidth = baseW;

      ctx.beginPath();
      ctx.moveTo(river.points[0][0] * scaleX, river.points[0][1] * scaleY);
      for (let i = 1; i < river.points.length; i++) {
        const xc = (river.points[i - 1][0] + river.points[i][0]) / 2 * scaleX;
        const yc = (river.points[i - 1][1] + river.points[i][1]) / 2 * scaleY;
        ctx.quadraticCurveTo(river.points[i - 1][0] * scaleX, river.points[i - 1][1] * scaleY, xc, yc);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. Layered Miniature Foothill Hummocks (Delicate, Compact)
  renderFoothills(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;
    const resScale = Math.max(0.75, Math.min(1.4, w / 1920));

    ctx.save();
    for (const f of engine.foothills) {
      const fx = f.x * scaleX;
      const fy = f.y * scaleY;
      // Miniature hummock: 3px to 5.5px on screen
      const sz = Math.max(3.0, (f.size || 5) * 0.75 * resScale);

      // Base solid fill
      ctx.beginPath();
      ctx.arc(fx, fy + sz * 0.3, sz, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = p.plains || '#e5dcc7';
      ctx.fill();

      // Right-side shadow crescent
      ctx.beginPath();
      ctx.arc(fx, fy + sz * 0.3, sz, Math.PI * 1.5, 0);
      ctx.lineTo(fx, fy + sz * 0.3);
      ctx.closePath();
      ctx.fillStyle = p.mountainShadow || 'rgba(50, 62, 75, 0.35)';
      ctx.fill();

      // Ink outline
      ctx.strokeStyle = p.inkColor || '#1e2633';
      ctx.lineWidth = Math.max(0.7, 0.9 * resScale);
      ctx.beginPath();
      ctx.arc(fx, fy + sz * 0.3, sz, Math.PI * 0.95, Math.PI * 0.05);
      ctx.stroke();

      // Inner ridge arc
      ctx.beginPath();
      ctx.arc(fx + sz * 0.15, fy + sz * 0.3, sz * 0.55, Math.PI * 1.15, Math.PI * 1.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. Isometric Mountain Cordilleras (Delicate, Compact Tolkien Ridges)
  renderMountains(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;
    const resScale = Math.max(0.75, Math.min(1.4, w / 1920));

    ctx.save();
    for (const m of engine.mountains) {
      const mx = m.x * scaleX;
      const my = m.y * scaleY;

      // Small, delicate mountain peak sizes: height 10-18px, width 12-22px
      const mw = Math.max(12.0, (m.width || 16) * 0.9 * resScale);
      const mh = Math.max(10.0, (m.height || 14) * 0.9 * resScale);

      const topX = mx;
      const topY = my - mh;
      const leftX = mx - mw * 0.52;
      const leftY = my + mh * 0.08;
      const rightX = mx + mw * 0.52;
      const rightY = my + mh * 0.08;
      const footX = mx + (m.spineOffset || 0) * resScale;
      const footY = my + mh * 0.16;
      const midRidgeX = topX + (footX - topX) * 0.5 + (m.seed - 0.5) * 2.5 * resScale;
      const midRidgeY = topY + mh * 0.55;

      // 1. Solid Base / Left Face (Sunlit slope - NW light)
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(footX, footY);
      ctx.lineTo(midRidgeX, midRidgeY);
      ctx.closePath();
      ctx.fillStyle = p.mountainHighlight || '#faf8f2';
      ctx.fill();

      // 2. Right Face (Shadow slope - SE shadow)
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(midRidgeX, midRidgeY);
      ctx.lineTo(footX, footY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fillStyle = p.mountainShadow || 'rgba(50, 62, 75, 0.55)';
      ctx.fill();

      // 3. Hand-Engraved Hatching Lines across Shadow Face
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(midRidgeX, midRidgeY);
      ctx.lineTo(footX, footY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.clip(); // Clip strictly within shadow face

      ctx.strokeStyle = p.mountainHatch || p.inkColor || '#1e2633';
      ctx.lineWidth = Math.max(0.6, 0.8 * resScale);
      const hatchCount = Math.max(2, Math.round(mh / 4.5));
      for (let i = 1; i <= hatchCount; i++) {
        const t = i / (hatchCount + 1);
        const sy = topY + (footY - topY) * t;
        const sx = topX + (footX - topX) * t;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + mw * 0.45, sy + mh * 0.18);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Snowcap for summits (elev > 0.74)
      if (m.snowCap && mh > 14) {
        const scH = mh * 0.28;
        const scLeftX = topX + (leftX - topX) * 0.28;
        const scLeftY = topY + scH;
        const scRightX = topX + (rightX - topX) * 0.28;
        const scRightY = topY + scH;
        const scSpineX = topX + (midRidgeX - topX) * 0.5;
        const scSpineY = topY + scH * 1.1;

        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(scLeftX, scLeftY);
        ctx.lineTo(topX - mw * 0.04, scLeftY - scH * 0.2);
        ctx.lineTo(scSpineX, scSpineY);
        ctx.lineTo(topX + mw * 0.05, scRightY - scH * 0.2);
        ctx.lineTo(scRightX, scRightY);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = p.inkColor || '#1e2633';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // 5. Crisp Dark Charcoal Outlines & Central Ridge Spine
      ctx.strokeStyle = p.inkColor || '#1e2633';
      ctx.lineWidth = Math.max(0.9, 1.25 * resScale);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Perimeter outline
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(topX, topY);
      ctx.lineTo(rightX, rightY);
      ctx.lineTo(footX, footY);
      ctx.closePath();
      ctx.stroke();

      // Central Ridge Spine
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(midRidgeX, midRidgeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7. Hand-Drawn Forest & Tree Groves (Delicate, Compact Cartographic Sprites)
  renderForests(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;
    const resScale = Math.max(0.75, Math.min(1.4, w / 1920));

    ctx.save();

    // Pass 1: Subtle small grove shadow immediately under tree clumps (NOT giant bubbles!)
    ctx.fillStyle = p.treeCanopyWash || 'rgba(105, 145, 80, 0.20)';
    for (const tree of engine.trees) {
      const tx = tree.x * scaleX;
      const ty = tree.y * scaleY;
      const r = Math.max(3.5, ((tree.size || 7) * 0.6) * resScale);
      ctx.beginPath();
      ctx.arc(tx, ty - r * 0.3, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pass 2: Illustrated miniature tree sprites with crisp dark ink outlines
    for (const tree of engine.trees) {
      const tx = tree.x * scaleX;
      const ty = tree.y * scaleY;
      // Compact tree size: 6px to 9.5px on screen
      const sz = Math.max(5.5, (tree.size || 7) * 0.95 * resScale);

      // Tree Trunk
      ctx.fillStyle = p.treeTrunk || '#523c2a';
      ctx.strokeStyle = p.inkColor || '#1e2633';
      ctx.lineWidth = 0.5;
      ctx.fillRect(tx - 0.6, ty - sz * 0.22, 1.2, sz * 0.32);

      if (tree.type === 'pine') {
        // Miniature 3-tiered conical evergreen fir
        const tiers = [
          { yOff: sz * 1.0, wRat: 0.35, hRat: 0.40 },
          { yOff: sz * 0.7, wRat: 0.48, hRat: 0.42 },
          { yOff: sz * 0.4, wRat: 0.60, hRat: 0.45 }
        ];

        tiers.forEach((t, i) => {
          const by = ty - t.yOff;
          const bw = sz * t.wRat;
          const bh = sz * t.hRat;

          // Foliage Fill
          ctx.beginPath();
          ctx.moveTo(tx, by);
          ctx.lineTo(tx - bw, by + bh);
          ctx.lineTo(tx + bw, by + bh);
          ctx.closePath();
          ctx.fillStyle = (i === 0) ? '#4a7c36' : (i === 1 ? '#3a6628' : '#2b501c');
          ctx.fill();

          // Right shadow
          ctx.beginPath();
          ctx.moveTo(tx, by);
          ctx.lineTo(tx, by + bh);
          ctx.lineTo(tx + bw, by + bh);
          ctx.closePath();
          ctx.fillStyle = 'rgba(20, 40, 15, 0.45)';
          ctx.fill();

          // Dark ink outline
          ctx.strokeStyle = p.inkColor || '#1a2b16';
          ctx.lineWidth = Math.max(0.6, 0.8 * resScale);
          ctx.stroke();
        });
      } else {
        // Miniature Deciduous Oak (clean circular foliage)
        const rMain = sz * 0.38; // 2.5px to 3.8px radius
        const cy = ty - sz * 0.55;

        // Base canopy fill
        ctx.beginPath();
        ctx.arc(tx, cy, rMain, 0, Math.PI * 2);
        ctx.fillStyle = p.treeLeaf || '#6a9c46';
        ctx.fill();

        // Left highlight lobe
        ctx.beginPath();
        ctx.arc(tx - rMain * 0.3, cy - rMain * 0.2, rMain * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#84be57';
        ctx.fill();

        // Right shadow lobe
        ctx.beginPath();
        ctx.arc(tx + rMain * 0.3, cy + rMain * 0.2, rMain * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = p.treeShadow || '#385d22';
        ctx.fill();

        // Crisp dark charcoal ink outline around canopy
        ctx.strokeStyle = p.inkColor || '#1a2b16';
        ctx.lineWidth = Math.max(0.6, 0.85 * resScale);
        ctx.beginPath();
        ctx.arc(tx, cy, rMain, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 8. Trade Roads
  renderRoads(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;

    ctx.save();
    ctx.strokeStyle = p.roadLine || '#7c5e43';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]); // Dashed trade route

    for (const road of engine.roads) {
      ctx.beginPath();
      ctx.moveTo(road.from[0] * scaleX, road.from[1] * scaleY);
      ctx.lineTo(road.to[0] * scaleX, road.to[1] * scaleY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 9. Illustrated Heraldic Settlements & Fortifications
  renderSettlements(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;

    ctx.save();
    for (const s of engine.settlements) {
      const sx = s.x * scaleX;
      const sy = s.y * scaleY;

      if (s.type === 'capital') {
        // Delicate Miniature Heraldic Citadel / Fortress (Matching fantasy atlas)
        const scale = Math.max(0.7, Math.min(1.2, w / 1920));
        const tw = 3.5 * scale;
        const th = 7.5 * scale;
        const kw = 6 * scale;
        const kh = 5.5 * scale;

        // Base Curtain Wall
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = p.inkColor || '#1e2633';
        ctx.lineWidth = 1.2 * scale;
        ctx.fillRect(sx - kw * 0.5, sy - kh * 0.5, kw, kh);
        ctx.strokeRect(sx - kw * 0.5, sy - kh * 0.5, kw, kh);

        // Arched Gatehouse
        ctx.fillStyle = p.inkColor || '#1e2633';
        ctx.beginPath();
        ctx.arc(sx, sy + kh * 0.1, 1.4 * scale, Math.PI, 0);
        ctx.lineTo(sx + 1.4 * scale, sy + kh * 0.5);
        ctx.lineTo(sx - 1.4 * scale, sy + kh * 0.5);
        ctx.closePath();
        ctx.fill();

        // Left Tower
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(sx - kw * 0.5 - tw * 0.7, sy - th * 0.5, tw, th);
        ctx.strokeRect(sx - kw * 0.5 - tw * 0.7, sy - th * 0.5, tw, th);

        // Left Tower Conical Roof (Realm Heraldic Color)
        ctx.beginPath();
        ctx.moveTo(sx - kw * 0.5 - tw * 0.2, sy - th * 0.5 - 4.5 * scale);
        ctx.lineTo(sx - kw * 0.5 - tw * 0.7 - 1.0 * scale, sy - th * 0.5);
        ctx.lineTo(sx - kw * 0.5 + tw * 0.3 + 1.0 * scale, sy - th * 0.5);
        ctx.closePath();
        ctx.fillStyle = s.color || '#f59e0b';
        ctx.fill();
        ctx.stroke();

        // Right Tower
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(sx + kw * 0.5 - tw * 0.3, sy - th * 0.5, tw, th);
        ctx.strokeRect(sx + kw * 0.5 - tw * 0.3, sy - th * 0.5, tw, th);

        // Right Tower Conical Roof
        ctx.beginPath();
        ctx.moveTo(sx + kw * 0.5 + tw * 0.2, sy - th * 0.5 - 4.5 * scale);
        ctx.lineTo(sx + kw * 0.5 - tw * 0.3 - 1.0 * scale, sy - th * 0.5);
        ctx.lineTo(sx + kw * 0.5 + tw * 0.7 + 1.0 * scale, sy - th * 0.5);
        ctx.closePath();
        ctx.fillStyle = s.color || '#f59e0b';
        ctx.fill();
        ctx.stroke();

        // Flying Realm Pennant Flag on Right Tower
        ctx.beginPath();
        ctx.moveTo(sx + kw * 0.5 + tw * 0.2, sy - th * 0.5 - 4.5 * scale);
        ctx.lineTo(sx + kw * 0.5 + tw * 0.2 + 5.5 * scale, sy - th * 0.5 - 7 * scale);
        ctx.lineTo(sx + kw * 0.5 + tw * 0.2, sy - th * 0.5 - 9.5 * scale);
        ctx.closePath();
        ctx.fillStyle = s.color || '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = p.inkColor || '#1e2633';
        ctx.lineWidth = 0.8 * scale;
        ctx.stroke();
      } else if (s.type === 'castle') {
        // Stronghold Keep
        const scale = Math.max(0.7, Math.min(1.2, w / 1920));
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = p.inkColor || '#1e2633';
        ctx.lineWidth = 1.1 * scale;
        ctx.fillRect(sx - 3.5 * scale, sy - 4.5 * scale, 7 * scale, 9 * scale);
        ctx.strokeRect(sx - 3.5 * scale, sy - 4.5 * scale, 7 * scale, 9 * scale);

        // Battlements
        ctx.fillStyle = p.inkColor || '#1e2633';
        ctx.fillRect(sx - 4.5 * scale, sy - 6 * scale, 9 * scale, 2.0 * scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1.0 * scale, sy - 0.5 * scale, 2 * scale, 3.5 * scale);
      } else {
        // Town / Village (Delicate dot marker)
        const scale = Math.max(0.7, Math.min(1.2, w / 1920));
        ctx.beginPath();
        ctx.arc(sx, sy, 3.0 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = p.inkColor || '#1e2633';
        ctx.lineWidth = 1.4 * scale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // Red town center
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 10. Distinct Points of Interest (POIs)
  renderPOIs(engine, w, h) {
    const ctx = this.ctx;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;
    const scale = Math.max(0.7, Math.min(1.2, w / 1920));

    ctx.save();
    for (const poi of engine.pois) {
      const px = poi.x * scaleX;
      const py = poi.y * scaleY;
      const name = (poi.name || '').toLowerCase();

      if (name.includes('mausoleum') || name.includes('crypt') || name.includes('tomb')) {
        // Nether Mausoleum / Crypt Icon (Dome with arched portal)
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.arc(px, py - 1.5 * scale, 3.5 * scale, Math.PI, 0);
        ctx.lineTo(px + 3.5 * scale, py + 3.0 * scale);
        ctx.lineTo(px - 3.5 * scale, py + 3.0 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark portal
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 1.0 * scale, py, 2.0 * scale, 3.0 * scale);
      } else if (name.includes('ruin') || name.includes('pillar')) {
        // Ancient Ruins (Broken classical pillars)
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.9 * scale;
        ctx.fillRect(px - 3 * scale, py - 3 * scale, 1.8 * scale, 6 * scale);
        ctx.strokeRect(px - 3 * scale, py - 3 * scale, 1.8 * scale, 6 * scale);
        ctx.fillRect(px + 1.2 * scale, py - 0.8 * scale, 1.8 * scale, 3.8 * scale);
        ctx.strokeRect(px + 1.2 * scale, py - 0.8 * scale, 1.8 * scale, 3.8 * scale);
      } else {
        // Red/Amber marker diamond
        ctx.beginPath();
        ctx.moveTo(px, py - 4.5 * scale);
        ctx.lineTo(px + 3.5 * scale, py);
        ctx.lineTo(px, py + 4.5 * scale);
        ctx.lineTo(px - 3.5 * scale, py);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1 * scale;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 11. Coordinate / Hex Grid
  renderGrid(w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const size = this.layers.gridSize || 36;
    const opacity = this.layers.gridOpacity || 0.18;

    ctx.save();
    ctx.strokeStyle = style === 'dark_cartography' || style === 'cyberpunk'
      ? `rgba(56, 189, 248, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`;
    ctx.lineWidth = 0.8;

    if (this.layers.gridType === 'square') {
      for (let x = 0; x <= w; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    } else {
      // Hexagonal Grid
      const r = size * 0.58;
      const hStep = Math.sqrt(3) * r;
      for (let y = 0; y < h + r; y += hStep) {
        for (let x = 0; x < w + r; x += r * 3) {
          for (let row = 0; row < 2; row++) {
            const hx = x + (row === 1 ? r * 1.5 : 0);
            const hy = y + (row === 1 ? hStep / 2 : 0);
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI / 3) * a;
              const px = hx + r * Math.cos(angle);
              const py = hy + r * Math.sin(angle);
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  // 12. Cartographic Labels & Realm Dynasties
  renderLabels(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const scaleX = w / engine.width;
    const scaleY = h / engine.height;
    const p = this.palettes[style] || this.palettes.parchment;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const resScale = Math.max(0.75, Math.min(1.8, w / 1920));
    const baseSize = Math.max(8, Math.round((this.labelFontSize || 13) * resScale));

    for (const lbl of engine.labels) {
      if (this.labelFilter === 'capitals' && lbl.type !== 'capital') continue;
      if (this.labelFilter === 'settlements' && lbl.type === 'ocean') continue;
      if (this.labelFilter === 'oceans' && lbl.type !== 'ocean') continue;

      const lx = lbl.x * scaleX;
      const ly = lbl.y * scaleY;

      if (lbl.type === 'realm') {
        // Realm / Dynasty heraldic colored text with white/dark halo
        const fontSize = Math.max(11, Math.round(baseSize * 1.25));
        ctx.font = `bold ${fontSize}px "Cinzel Decorative", "Cinzel", "Georgia", serif`;
        ctx.letterSpacing = '3px';

        // High-contrast halo stroke
        ctx.strokeStyle = (style === 'dark_cartography' || style === 'cyberpunk')
          ? 'rgba(0, 0, 0, 0.88)'
          : 'rgba(255, 255, 255, 0.90)';
        ctx.lineWidth = 3.5;
        ctx.strokeText(lbl.text, lx, ly);

        ctx.fillStyle = lbl.color || p.labelColor;
        ctx.fillText(lbl.text, lx, ly);
      } else if (lbl.type === 'capital') {
        const fontSize = Math.max(10, Math.round(baseSize * 1.08));
        ctx.font = `600 ${fontSize}px "Cinzel", "Georgia", serif`;
        ctx.letterSpacing = '1px';

        ctx.strokeStyle = (style === 'dark_cartography' || style === 'cyberpunk')
          ? 'rgba(0, 0, 0, 0.85)'
          : 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = 3.0;
        ctx.strokeText(lbl.text, lx, ly);

        ctx.fillStyle = p.labelColor;
        ctx.fillText(lbl.text, lx, ly);
      } else if (lbl.type === 'ocean') {
        // Ocean / Trench / Sea labels: elegant italic serif with tracking
        const fontSize = Math.max(12, Math.round(baseSize * 1.35));
        ctx.font = `italic 600 ${fontSize}px "Cinzel", "Georgia", serif`;
        ctx.letterSpacing = '4px';
        ctx.fillStyle = style === 'dark_cartography' || style === 'cyberpunk'
          ? 'rgba(56, 189, 248, 0.70)'
          : (style === 'minimal_ink' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(38, 62, 80, 0.65)');
        ctx.fillText(lbl.text, lx, ly);
      } else if (lbl.type === 'poi') {
        const fontSize = Math.max(8, Math.round(baseSize * 0.88));
        ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
        ctx.strokeStyle = (style === 'dark_cartography' || style === 'cyberpunk') ? '#000000' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeText(lbl.text, lx, ly);
        ctx.fillStyle = '#d97706';
        ctx.fillText(lbl.text, lx, ly);
      } else {
        // Town / Castle
        const fontSize = Math.max(8, Math.round(baseSize * 0.92));
        ctx.font = `500 ${fontSize}px "Cinzel", serif`;
        ctx.strokeStyle = (style === 'dark_cartography' || style === 'cyberpunk') ? '#000000' : 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(lbl.text, lx, ly);
        ctx.fillStyle = p.labelColor;
        ctx.fillText(lbl.text, lx, ly);
      }
    }
    ctx.restore();
  }

  // 13. Heraldic Title Banner (e.g. "The Land of Dwalbarrul" / "THE REALMS OF FENWYN")
  renderTitleBanner(engine, w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;

    const titleText = engine.mapTitle || 'THE REALMS OF FENWYN';
    const scale = Math.max(0.75, Math.min(1.5, w / 1920));
    const bannerW = Math.max(340, Math.min(520, titleText.length * 15)) * scale;
    const bannerH = 46 * scale;
    const cx = w * 0.5;
    const cy = 48 * scale;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Banner Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Center Ribbon Plaque
    ctx.fillStyle = p.bannerBg || '#f7f2e4';
    ctx.strokeStyle = p.bannerBorder || '#4a3824';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.rect(cx - bannerW * 0.5, cy - bannerH * 0.5, bannerW, bannerH);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow for stroke
    ctx.stroke();

    // Inner gold/ink border
    ctx.strokeStyle = p.bannerBorder || '#4a3824';
    ctx.lineWidth = 0.8 * scale;
    ctx.strokeRect(cx - bannerW * 0.5 + 4 * scale, cy - bannerH * 0.5 + 4 * scale, bannerW - 8 * scale, bannerH - 8 * scale);

    // Left Folded Ribbon Tail
    const rw = 28 * scale;
    ctx.fillStyle = p.bannerBg || '#f7f2e4';
    ctx.strokeStyle = p.bannerBorder || '#4a3824';
    ctx.lineWidth = 1.6 * scale;

    // Left fishtail
    ctx.beginPath();
    ctx.moveTo(cx - bannerW * 0.5, cy - bannerH * 0.35);
    ctx.lineTo(cx - bannerW * 0.5 - rw, cy - bannerH * 0.45);
    ctx.lineTo(cx - bannerW * 0.5 - rw + 10 * scale, cy);
    ctx.lineTo(cx - bannerW * 0.5 - rw, cy + bannerH * 0.45);
    ctx.lineTo(cx - bannerW * 0.5, cy + bannerH * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right fishtail
    ctx.beginPath();
    ctx.moveTo(cx + bannerW * 0.5, cy - bannerH * 0.35);
    ctx.lineTo(cx + bannerW * 0.5 + rw, cy - bannerH * 0.45);
    ctx.lineTo(cx + bannerW * 0.5 + rw - 10 * scale, cy);
    ctx.lineTo(cx + bannerW * 0.5 + rw, cy + bannerH * 0.45);
    ctx.lineTo(cx + bannerW * 0.5, cy + bannerH * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Title Typography inside banner
    const titleFontSize = Math.round(18 * scale);
    ctx.font = `bold ${titleFontSize}px "Cinzel Decorative", "Cinzel", serif`;
    ctx.fillStyle = p.textColor || '#1a140e';
    ctx.fillText(titleText, cx, cy);

    ctx.restore();
  }

  // 14. Distance Scale Bar (e.g. 0  250  500  1000 km)
  renderScaleBar(w, h) {
    const ctx = this.ctx;
    const style = this.currentStyle;
    const p = this.palettes[style] || this.palettes.parchment;

    const scale = Math.max(0.75, Math.min(1.4, w / 1920));
    const bx = 42 * scale;
    const by = h - 38 * scale;
    const barW = 160 * scale;
    const barH = 5 * scale;

    ctx.save();
    // Background shadow
    ctx.fillStyle = p.inkColor || '#1e1610';
    ctx.strokeStyle = p.inkColor || '#1e1610';
    ctx.lineWidth = 1.4 * scale;

    // 4 Alternating Scale Blocks
    const segW = barW / 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = (i % 2 === 0) ? (p.inkColor || '#1e1610') : '#ffffff';
      ctx.fillRect(bx + i * segW, by, segW, barH);
      ctx.strokeRect(bx + i * segW, by, segW, barH);
    }

    // Tick Marks & Distance Labels
    const labels = ['0', '250', '500', '1000 km'];
    ctx.font = `600 ${Math.round(10 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = p.textColor || '#1e1610';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    ctx.fillText(labels[0], bx, by - 3 * scale);
    ctx.fillText(labels[1], bx + segW, by - 3 * scale);
    ctx.fillText(labels[2], bx + segW * 2, by - 3 * scale);
    ctx.fillText(labels[3], bx + barW, by - 3 * scale);

    ctx.restore();
  }

  // 15. Nautical Compass Rose
  renderCompassRose(w, h, style) {
    const ctx = this.ctx;
    const p = this.palettes[style] || this.palettes.parchment;
    const rx = w - 75;
    const ry = 75;
    const r = 38;

    ctx.save();
    ctx.translate(rx, ry);

    // Outer compass ring
    ctx.strokeStyle = p.frameColor || '#453828';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // 8-Point Windrose Star
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i - Math.PI / 2;
      const len = r * 0.95;
      const wSide = r * 0.22;

      ctx.fillStyle = p.inkColor || '#272018';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle + Math.PI / 4) * wSide, Math.sin(angle + Math.PI / 4) * wSide);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e8dfc5';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle - Math.PI / 4) * wSide, Math.sin(angle - Math.PI / 4) * wSide);
      ctx.closePath();
      ctx.fill();
    }

    // Cardinal Points (N, E, S, W)
    ctx.font = 'bold 12px "Cinzel", serif';
    ctx.fillStyle = p.inkColor || '#272018';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -r - 9);
    ctx.fillText('S', 0, r + 9);
    ctx.fillText('E', r + 9, 0);
    ctx.fillText('W', -r - 9, 0);

    ctx.restore();
  }

  // 16. Ornate Border Frame
  renderBorderFrame(w, h, style) {
    const ctx = this.ctx;
    const p = this.palettes[style] || this.palettes.parchment;
    const m = 18;

    ctx.save();
    ctx.strokeStyle = p.frameColor || '#453828';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);

    ctx.lineWidth = 1.0;
    ctx.strokeRect(m + 5, m + 5, w - (m + 5) * 2, h - (m + 5) * 2);

    // Corner Ornaments
    const corners = [[m, m], [w - m, m], [m, h - m], [w - m, h - m]];
    for (const [cx, cy] of corners) {
      ctx.fillStyle = p.frameColor || '#453828';
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
    }
    ctx.restore();
  }

  // 17. Atmospheric Vignette
  renderVignette(w, h, style) {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.45, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.52);

    if (style === 'dark_cartography' || style === 'cyberpunk') {
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    } else {
      grad.addColorStop(0, 'rgba(54, 43, 29, 0)');
      grad.addColorStop(1, 'rgba(54, 43, 29, 0.28)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Helper: Hex color to RGB array
  hexToRgb(hex) {
    if (!hex) return [235, 230, 215];
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
}
