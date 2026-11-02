// Axis Map Generator - Procedural Cartographic Simulation Engine
// Made By Mahdi Kareem © 2026

export class MapEngine {
  constructor(width = 320, height = 200) {
    this.width = width;
    this.height = height;

    // Configurable Parameters
    this.seed = Math.floor(Math.random() * 9999999);
    this.archetype = 'continents'; // 'continents', 'continent', 'island', 'archipelago', 'pangaea', 'shattered', 'ring'
    this.seaLevel = 0.44;
    this.roughness = 0.52;
    this.continentalness = 0.62;
    this.mountainDensity = 1.0;
    this.riverDensity = 1.0;
    this.forestDensity = 1.0;
    this.temperatureBias = 0.5;
    this.rainfallBias = 0.5;

    // World & Title Settings (from reference UI)
    this.worldName = 'Dwalbarrul';
    this.titlePrefix = 'The Land of';

    // Grid data structures
    this.heightmap = new Float32Array(this.width * this.height);
    this.temperature = new Float32Array(this.width * this.height);
    this.moisture = new Float32Array(this.width * this.height);
    this.biomes = new Uint8Array(this.width * this.height);

    // Cartographic features
    this.realms = []; // [{ id, name, title, color, capitalName, capitalPos: [x,y] }]
    this.rivers = []; // [{ points: [[x,y], ...], width }]
    this.lakes = []; // [{ x, y, rx, ry, rotation }]
    this.mountains = []; // [{ x, y, width, height, seed }]
    this.foothills = []; // [{ x, y, size }]
    this.trees = []; // [{ x, y, type: 'deciduous'|'pine', size }]
    this.settlements = []; // [{ id, x, y, name, type: 'capital'|'town'|'castle', realmId, realmName, color }]
    this.pois = []; // [{ id, x, y, name, type: 'ruins'|'shrine'|'mausoleum'|'tower' }]
    this.roads = []; // [{ from: [x,y], to: [x,y] }]
    this.labels = []; // [{ id, x, y, text, type: 'capital'|'town'|'realm'|'ocean'|'poi', color, size }]
    this.customItems = []; // User-placed stamps via "+ Add..."
  }

  get mapTitle() {
    return `${this.titlePrefix.trim()} ${this.worldName.trim()}`.trim();
  }

  // Mulberry32 Seeded PRNG
  createPRNG(seed) {
    let s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  mulberry32(seed) {
    return this.createPRNG(seed);
  }

  // 2D Perlin / Gradient Noise Implementation
  initNoise(prng) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      permMod12[i] = perm[i] % 12;
    }

    const grad3 = [
      [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
      [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
      [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
    ];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }

    return function noise2D(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);

      const u = fade(xf);
      const v = fade(yf);

      const gi00 = permMod12[X + perm[Y]];
      const gi01 = permMod12[X + perm[Y + 1]];
      const gi10 = permMod12[X + 1 + perm[Y]];
      const gi11 = permMod12[X + 1 + perm[Y + 1]];

      const g00 = grad3[gi00];
      const g01 = grad3[gi01];
      const g10 = grad3[gi10];
      const g11 = grad3[gi11];

      const n00 = g00[0] * xf + g00[1] * yf;
      const n10 = g10[0] * (xf - 1) + g10[1] * yf;
      const n01 = g01[0] * xf + g01[1] * (yf - 1);
      const n11 = g11[0] * (xf - 1) + g11[1] * (yf - 1);

      const nx0 = lerp(n00, n10, u);
      const nx1 = lerp(n01, n11, u);

      return lerp(nx0, nx1, v);
    };
  }

  // Multi-Octave Fractal Brownian Motion (FBM)
  fbm(noise, x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }

  // Rigid Multifractal for Mountain Ridges
  ridgedNoise(noise, x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1.0;
    let weight = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      let v = 1.0 - Math.abs(noise(x * frequency, y * frequency));
      v = v * v * weight;
      weight = Math.max(0.0, Math.min(1.0, v * 2.0));
      total += v * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }

  // Master Procedural Generation Pipeline
  generate(seed = this.seed) {
    this.seed = seed;
    const prng = this.createPRNG(this.seed);
    const noise = this.initNoise(prng);
    const noise2 = this.initNoise(prng);

    const w = this.width;
    const h = this.height;

    // Generate World Name if not customized
    if (!this.worldName || this.worldName === 'Dwalbarrul' || this.worldName.startsWith('World_')) {
      const worldNames = ['Dwalbarrul', 'Fenwyn', 'Aethelgard', 'Drakenshire', 'Valmora', 'Oakhaven', 'Corvallis', 'Kaeldor', 'Brynheim', 'Zulmarath'];
      this.worldName = worldNames[Math.floor(prng() * worldNames.length)];
    }

    // 1. Compute Base Heightmap & Archetype Radial / Coastal Mask
    for (let y = 0; y < h; y++) {
      const ny = y / h; // 0 to 1
      const dy = (ny - 0.5) * 2; // -1 to 1

      for (let x = 0; x < w; x++) {
        const nx = x / w; // 0 to 1
        const dx = (nx - 0.5) * 2; // -1 to 1
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        let mask = 1.0;

        // Archetype geometry influence
        if (this.archetype === 'continents' || this.archetype === 'world') {
          // Multiple organic continents separated by oceans
          const wobble = Math.sin(dx * 4.0 + dy * 3.0) * 0.12 + Math.cos(dx * 2.5 - dy * 3.5) * 0.1;
          mask = Math.max(0, 1.08 - Math.pow(distFromCenter + wobble, 1.9));
        } else if (this.archetype === 'continent') {
          // Single focused epic fantasy continent with bays, gulfs, fjords
          const angle = Math.atan2(dy, dx);
          const wobble = Math.sin(angle * 3.5 + distFromCenter * 3.0) * 0.2 + Math.cos(angle * 5.0) * 0.14;
          mask = Math.max(0, 1.25 - Math.pow(distFromCenter + wobble, 1.7));
        } else if (this.archetype === 'island') {
          // Solitary fantasy island with deep surrounding waters
          mask = Math.max(0, 1.05 - Math.pow(distFromCenter, 1.6));
        } else if (this.archetype === 'archipelago') {
          mask = Math.max(0, 0.90 - Math.pow(distFromCenter, 2.6));
        } else if (this.archetype === 'pangaea') {
          mask = Math.max(0, 1.2 - Math.pow(distFromCenter, 1.8));
        } else if (this.archetype === 'shattered') {
          mask = Math.max(0, 0.95 - Math.pow(distFromCenter, 2.0));
        } else if (this.archetype === 'ring') {
          const ringDist = Math.abs(distFromCenter - 0.55);
          mask = Math.max(0, 1.0 - ringDist * 2.5);
        }

        // Fractal elevation
        const baseElevation = (this.fbm(noise, x, y, 6, this.roughness, 2.05, 0.018) + 1) * 0.5;
        const mountainElevation = this.ridgedNoise(noise2, x + 500, y + 500, 5, 0.5, 2.1, 0.032);

        // Blend base with mountain ridging
        const mBias = Math.max(0.1, this.mountainDensity * 0.45);
        let elevation = baseElevation * (1 - mBias) + mountainElevation * mBias;

        // Apply continental mask & bias
        elevation = (elevation * 0.72 + this.continentalness * 0.28) * mask;

        // Sea level adjustment
        elevation = elevation - (this.seaLevel - 0.44) * 0.78;
        elevation = Math.max(0.0, Math.min(1.0, elevation));

        this.heightmap[y * w + x] = elevation;

        // 2. Temperature simulation
        const latitudeFactor = 1.0 - Math.abs(dy);
        const tempNoise = noise(x * 0.03, y * 0.03) * 0.15;
        let temp = latitudeFactor * 0.75 + tempNoise + (this.temperatureBias - 0.5) * 0.5;
        if (elevation > this.seaLevel) {
          temp -= (elevation - this.seaLevel) * 0.6;
        }
        this.temperature[y * w + x] = Math.max(0.0, Math.min(1.0, temp));

        // 3. Moisture simulation
        const moistNoise = (this.fbm(noise2, x + 100, y + 100, 4, 0.5, 2.0, 0.022) + 1) * 0.5;
        let moistureVal = moistNoise * 0.72 + (this.rainfallBias - 0.5) * 0.4;
        this.moisture[y * w + x] = Math.max(0.0, Math.min(1.0, moistureVal));
      }
    }

    // 4. Biome Classification matching the 10 Cartographic Legend Types
    this.classifyBiomes();

    // 5. River & Inland Lake Simulation
    this.simulateRiversAndLakes(prng);

    // 6. Mountain Peaks & Foothill Mounds
    this.generateMountains(prng);

    // 7. Forests & Tree Clusters
    this.generateForests(prng);

    // 8. Realms, Dynasties, Settlements & POIs
    this.generateWorldEntities(prng);

    return this;
  }

  // Biome Classifier matching Legend:
  // 0: Deep Ocean, 1: Shallow Ocean, 2: Coastal Estuary, 3: Plains, 4: Grassland, 5: Savanna,
  // 6: Forest, 7: Desert, 8: Wetlands, 9: Hills, 10: Mountains, 11: Tundra
  classifyBiomes() {
    const w = this.width;
    const h = this.height;
    for (let i = 0; i < w * h; i++) {
      const e = this.heightmap[i];
      const t = this.temperature[i];
      const m = this.moisture[i];

      if (e < this.seaLevel * 0.6) {
        this.biomes[i] = 0; // Deep Ocean
      } else if (e < this.seaLevel * 0.88) {
        this.biomes[i] = 1; // Shallow Ocean / Gulf
      } else if (e < this.seaLevel) {
        this.biomes[i] = 2; // Coastal Waters / Reef
      } else if (e > 0.78) {
        this.biomes[i] = 10; // High Mountain Peak
      } else if (e > 0.64) {
        this.biomes[i] = 9; // Hills / Rugged Foothills
      } else if (t < 0.26) {
        this.biomes[i] = 11; // Tundra / Frost Wastes
      } else if (m < 0.22 && t > 0.55) {
        this.biomes[i] = 7; // Arid Desert & Dunes
      } else if (m > 0.68 && e < this.seaLevel + 0.08) {
        this.biomes[i] = 8; // Wetlands / Marsh / Swamp
      } else if (m > 0.45 && t > 0.28) {
        this.biomes[i] = 6; // Dense Forest & Woods
      } else if (m < 0.38 && t > 0.50) {
        this.biomes[i] = 5; // Golden Savanna
      } else if (m > 0.32) {
        this.biomes[i] = 4; // Lush Grassland
      } else {
        this.biomes[i] = 3; // Open Plains
      }
    }
  }

  // Hydrology: Rivers & Lakes
  simulateRiversAndLakes(prng) {
    this.rivers = [];
    this.lakes = [];
    const w = this.width;
    const h = this.height;

    const baseCount = Math.floor((14 + prng() * 12) * Math.max(0.1, this.riverDensity));

    for (let r = 0; r < baseCount; r++) {
      let sx = 0, sy = 0, found = false;
      for (let attempt = 0; attempt < 70; attempt++) {
        const tx = Math.floor(prng() * w);
        const ty = Math.floor(prng() * h);
        const elev = this.heightmap[ty * w + tx];
        if (elev > 0.62) {
          sx = tx; sy = ty; found = true; break;
        }
      }

      if (!found) continue;

      const path = [[sx, sy]];
      let cx = sx;
      let cy = sy;
      let steps = 0;

      while (steps < 280) {
        steps++;
        let bestX = cx;
        let bestY = cy;
        let lowestElev = this.heightmap[cy * w + cx];

        const neighbors = [
          [-1, 0], [1, 0], [0, -1], [0, 1],
          [-1, -1], [1, -1], [-1, 1], [1, 1]
        ];

        for (const [dx, dy] of neighbors) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const e = this.heightmap[ny * w + nx];
            if (e < lowestElev) {
              lowestElev = e;
              bestX = nx;
              bestY = ny;
            }
          }
        }

        if (bestX === cx && bestY === cy) break;
        cx = bestX;
        cy = bestY;
        path.push([cx, cy]);

        // Form an inland lake in low basins along river path
        if (steps > 16 && steps % 32 === 0 && lowestElev > this.seaLevel + 0.03 && lowestElev < 0.58 && this.lakes.length < 6) {
          this.lakes.push({
            x: cx,
            y: cy,
            rx: 4 + prng() * 5,
            ry: 3 + prng() * 4,
            rotation: prng() * Math.PI
          });
        }

        if (lowestElev <= this.seaLevel) {
          break; // Reached ocean
        }
      }

      if (path.length >= 8) {
        this.rivers.push({
          points: path,
          width: Math.min(3.6, 1.1 + (path.length / 55))
        });
      }
    }
  }

  // Mountain Cordilleras & Foothills (Delicate, Compact Cartographic Chains)
  generateMountains(prng) {
    this.mountains = [];
    this.foothills = [];
    const w = this.width;
    const h = this.height;

    const density = Math.max(0.1, this.mountainDensity);
    const step = 4; // Spaced traversal for natural ridgelines

    for (let y = 6; y < h - 6; y += step) {
      for (let x = 6; x < w - 6; x += step) {
        const idx = y * w + x;
        const elev = this.heightmap[idx];

        // High Alpine Mountain Summits (elev > 0.68)
        if (elev > 0.68 && prng() < 0.68 * density) {
          const isSummit = elev > 0.74;
          const peakHeight = isSummit
            ? Math.round(16 + (elev - 0.74) * 22)
            : Math.round(12 + (elev - 0.68) * 16);
          const peakWidth = Math.round(peakHeight * (1.18 + (prng() - 0.5) * 0.2));
          const spineOffset = (prng() - 0.5) * 3;

          this.mountains.push({
            x: x + (prng() - 0.5) * 2,
            y: y + (prng() - 0.5) * 2,
            width: peakWidth,
            height: peakHeight,
            spineOffset,
            elevation: elev,
            snowCap: isSummit,
            seed: prng()
          });

          // Occasional compact sister peak along the crest
          if (isSummit && prng() < 0.40 * density) {
            const subOffset = (prng() > 0.5 ? 1 : -1) * (2.5 + prng() * 1.5);
            const subX = Math.max(6, Math.min(w - 6, x + subOffset));
            const subY = Math.max(6, Math.min(h - 6, y + (prng() - 0.5) * 1.5));
            const subElev = this.heightmap[Math.floor(subY) * w + Math.floor(subX)];

            if (subElev > 0.64) {
              const subH = Math.round(peakHeight * 0.72);
              this.mountains.push({
                x: subX,
                y: subY,
                width: Math.round(subH * 1.15),
                height: subH,
                spineOffset: (prng() - 0.5) * 2,
                elevation: subElev,
                snowCap: false,
                seed: prng()
              });
            }
          }
        } else if (elev > 0.62 && elev <= 0.68 && prng() < 0.40 * density) {
          // Secondary Ridge Peaks
          const peakHeight = Math.round(10 + (elev - 0.62) * 14);
          const peakWidth = Math.round(peakHeight * 1.15);
          this.mountains.push({
            x: x + (prng() - 0.5) * 2,
            y: y + (prng() - 0.5) * 2,
            width: peakWidth,
            height: peakHeight,
            spineOffset: (prng() - 0.5) * 2,
            elevation: elev,
            snowCap: false,
            seed: prng()
          });
        } else if (elev >= 0.56 && elev <= 0.62 && prng() < 0.22 * density) {
          // Small foothill mounds around mountain skirts
          this.foothills.push({
            x: x + (prng() - 0.5) * 3,
            y: y + (prng() - 0.5) * 2,
            size: 4 + prng() * 3,
            seed: prng()
          });
        }
      }
    }

    // Sort strictly North-to-South so southern peaks occlude northern slopes realistically
    this.mountains.sort((a, b) => a.y - b.y || a.x - b.x);
    this.foothills.sort((a, b) => a.y - b.y);
  }

  // Forest & Tree Groves (Delicate, Compact Woodlands in Forest Biomes Only)
  generateForests(prng) {
    this.trees = [];
    const w = this.width;
    const h = this.height;

    const density = Math.max(0.1, this.forestDensity);
    const step = 3; // Natural woodland clustering

    for (let y = 6; y < h - 6; y += step) {
      for (let x = 6; x < w - 6; x += step) {
        const idx = y * w + x;
        const elev = this.heightmap[idx];
        const biome = this.biomes[idx];

        // Only place trees in habitable valleys, not mountains or open plains
        if (elev > this.seaLevel + 0.04 && elev < 0.64) {
          let treeProb = 0;
          let treeType = 'deciduous';

          if (biome === 6) { // Dense Forest
            treeProb = 0.52 * density;
            treeType = 'deciduous';
          } else if (biome === 11) { // Tundra / Taiga evergreen fringe
            treeProb = 0.24 * density;
            treeType = 'pine';
          } else if (biome === 8) { // Wetlands
            treeProb = 0.18 * density;
            treeType = 'deciduous';
          }

          if (prng() < treeProb) {
            this.trees.push({
              x: x + (prng() - 0.5) * 1.8,
              y: y + (prng() - 0.5) * 1.8,
              type: treeType,
              size: 6 + prng() * 3
            });
          }
        }
      }
    }

    this.trees.sort((a, b) => a.y - b.y);
  }

  // World Entities: Multi-Realm Political Territories, Heraldic Capitals & POIs
  generateWorldEntities(prng) {
    this.realms = [];
    this.settlements = [];
    this.pois = [];
    this.roads = [];
    this.labels = [];

    const w = this.width;
    const h = this.height;

    // 8 Archetypal Fantasy Factions with distinct heraldic colors (from reference images)
    const factionTemplates = [
      { prefix: 'Zhuldahn', type: 'Dynasty', color: '#f59e0b', capital: 'Zhuld' },
      { prefix: 'Xantentol', type: 'Great Duchy', color: '#eab308', capital: 'Xantentol' },
      { prefix: 'Zoquitec', type: 'Principality', color: '#ef4444', capital: 'Zoquitec' },
      { prefix: 'Maakkul', type: 'High Realm', color: '#3b82f6', capital: 'Thkokrag' },
      { prefix: 'Iathiegthelor', type: 'Silver Dominion', color: '#8b5cf6', capital: 'Silva Themar' },
      { prefix: 'Skulez', type: 'Wastes', color: '#ec4899', capital: 'Irontoof' },
      { prefix: 'Boar', type: 'Shires', color: '#f97316', capital: 'Egcyrrg' },
      { prefix: 'Spongar', type: 'Dynasty', color: '#10b981', capital: 'Spongar' }
    ];

    // Find habitable land points
    const candidates = [];
    for (let y = 14; y < h - 14; y += 4) {
      for (let x = 14; x < w - 14; x += 4) {
        const elev = this.heightmap[y * w + x];
        if (elev > this.seaLevel + 0.04 && elev < 0.65) {
          candidates.push({ x, y, elev });
        }
      }
    }

    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = temp;
    }

    // Select 5-7 spaced capital locations for realms
    const realmCount = Math.min(factionTemplates.length, Math.max(4, Math.floor(candidates.length / 15)));
    const selectedCapitals = [];
    for (const c of candidates) {
      let tooClose = false;
      for (const s of selectedCapitals) {
        if (Math.hypot(c.x - s.x, c.y - s.y) < 38) { tooClose = true; break; }
      }
      if (!tooClose) {
        selectedCapitals.push(c);
        if (selectedCapitals.length >= realmCount) break;
      }
    }

    let idCounter = 1;

    // Create Realms & Capitals
    selectedCapitals.forEach((cap, i) => {
      const t = factionTemplates[i % factionTemplates.length];
      const fullName = t.type ? `${t.type} of ${t.prefix}` : t.prefix;
      const realm = {
        id: `realm_${i + 1}`,
        name: t.prefix,
        fullName: fullName,
        color: t.color,
        capitalName: t.capital,
        x: cap.x,
        y: cap.y
      };
      this.realms.push(realm);

      // Capital settlement
      const capId = `settlement_${idCounter++}`;
      this.settlements.push({
        id: capId,
        x: cap.x,
        y: cap.y,
        name: t.capital,
        type: 'capital',
        realmId: realm.id,
        realmName: realm.fullName,
        color: realm.color
      });

      // Capital Label with heraldic realm title above it
      this.labels.push({
        id: `lbl_realm_${i + 1}`,
        x: cap.x,
        y: cap.y - 12,
        text: realm.fullName,
        type: 'realm',
        color: realm.color,
        size: 13
      });

      this.labels.push({
        id: `lbl_${capId}`,
        x: cap.x,
        y: cap.y + 7,
        text: t.capital,
        type: 'capital',
        color: '#ffffff',
        size: 11
      });
    });

    // Add secondary towns and castles
    const townCandidates = candidates.filter(c => {
      return !selectedCapitals.some(cap => Math.hypot(c.x - cap.x, c.y - cap.y) < 18);
    });

    const townCount = Math.min(10, Math.floor(townCandidates.length / 4));
    for (let i = 0; i < townCount; i++) {
      const tPos = townCandidates[i];
      if (!tPos) break;

      // Assign nearest realm
      let nearestRealm = this.realms[0];
      let minD = Infinity;
      for (const r of this.realms) {
        const d = Math.hypot(tPos.x - r.x, tPos.y - r.y);
        if (d < minD) { minD = d; nearestRealm = r; }
      }

      const isCastle = i % 3 === 0;
      const type = isCastle ? 'castle' : 'town';
      const townName = this.generateFantasyName(prng, type);
      const sId = `settlement_${idCounter++}`;

      this.settlements.push({
        id: sId,
        x: tPos.x,
        y: tPos.y,
        name: townName,
        type: type,
        realmId: nearestRealm ? nearestRealm.id : null,
        realmName: nearestRealm ? nearestRealm.fullName : '',
        color: nearestRealm ? nearestRealm.color : '#e2e8f0'
      });

      this.labels.push({
        id: `lbl_${sId}`,
        x: tPos.x,
        y: tPos.y - 5,
        text: townName,
        type: type,
        color: '#f8fafc',
        size: 10
      });
    }

    // Points of Interest (POIs) - as seen in reference image ("The Nether Mausoleum", etc.)
    const poiNames = [
      'The Nether Mausoleum', 'Tower of Whispers', 'Sunken Obelisk',
      'Dragoncrest Spire', 'Ancient Vault', 'Forgotten Megalith'
    ];
    for (let i = 0; i < 3; i++) {
      const pPos = candidates[candidates.length - 1 - i];
      if (pPos) {
        const pId = `poi_${idCounter++}`;
        const pName = poiNames[i % poiNames.length];
        this.pois.push({
          id: pId,
          x: pPos.x,
          y: pPos.y,
          name: pName,
          type: 'mausoleum'
        });

        this.labels.push({
          id: `lbl_${pId}`,
          x: pPos.x,
          y: pPos.y - 5,
          text: pName,
          type: 'poi',
          color: '#fbbf24',
          size: 9.5
        });
      }
    }

    // Named Oceans, Seas, Gulfs, Trenches (authentic cartographic water labeling)
    const seaFeatures = [
      { text: "Corpse's Sea", x: 0.58, y: 0.12 },
      { text: 'Sea of Ember', x: 0.82, y: 0.12 },
      { text: "Shark's Gulf", x: 0.54, y: 0.33 },
      { text: "Leviathan's Trench", x: 0.28, y: 0.40 },
      { text: 'Maelstrom of Legends', x: 0.44, y: 0.52 },
      { text: 'Emerald Bay', x: 0.54, y: 0.53 },
      { text: "Giant's Expanse", x: 0.78, y: 0.68 },
      { text: 'The Savage Ocean', x: 0.12, y: 0.78 },
      { text: 'Ocean of Ruin', x: 0.08, y: 0.36 }
    ];

    seaFeatures.forEach(sf => {
      const cx = Math.floor(w * sf.x);
      const cy = Math.floor(h * sf.y);
      if (this.heightmap[cy * w + cx] <= this.seaLevel) {
        this.labels.push({
          id: `ocean_${idCounter++}`,
          x: cx,
          y: cy,
          text: sf.text,
          type: 'ocean',
          color: 'rgba(56, 189, 248, 0.75)',
          size: 14
        });
      }
    });

    // Trade Roads connecting settlements
    for (let i = 0; i < this.settlements.length; i++) {
      let nearest = null;
      let minDist = Infinity;
      for (let j = 0; j < this.settlements.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(this.settlements[i].x - this.settlements[j].x, this.settlements[i].y - this.settlements[j].y);
        if (d < minDist && d < 80) {
          minDist = d;
          nearest = this.settlements[j];
        }
      }
      if (nearest) {
        this.roads.push({
          from: [this.settlements[i].x, this.settlements[i].y],
          to: [nearest.x, nearest.y]
        });
      }
    }
  }

  // Fantasy Name Generator
  generateFantasyName(prng, type = 'town') {
    const prefixes = ['Ald', 'Val', 'Cor', 'Bryn', 'Kael', 'Drak', 'Elm', 'Fen', 'Gry', 'Ith', 'Mor', 'Nid', 'Oakh', 'Riven', 'Syl', 'Thal', 'Vael', 'Zeph', 'Ash', 'Sol', 'Star', 'Winter', 'Draca', 'Zar', 'Therla', 'Hol', 'Caster'];
    const roots = ['dor', 'gard', 'wick', 'mere', 'dale', 'port', 'haven', 'crest', 'fell', 'forge', 'reach', 'hold', 'keep', 'wood', 'moor', 'veil', 'spire', 'fall', 'gate', 'caster'];
    const p = prefixes[Math.floor(prng() * prefixes.length)];
    const r = roots[Math.floor(prng() * roots.length)];
    return p + r;
  }

  // Interactive Terrain Sculpt Brush
  applySculpt(normX, normY, radiusPx, strength = 0.5, mode = 'raise') {
    const w = this.width;
    const h = this.height;
    const cx = Math.floor(normX * w);
    const cy = Math.floor(normY * h);
    const rad = Math.max(2, Math.floor((radiusPx / 800) * w));

    for (let y = Math.max(0, cy - rad); y <= Math.min(h - 1, cy + rad); y++) {
      for (let x = Math.max(0, cx - rad); x <= Math.min(w - 1, cx + rad); x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= rad) {
          const falloff = Math.cos((dist / rad) * (Math.PI / 2));
          const idx = y * w + x;
          const delta = strength * 0.08 * falloff;

          if (mode === 'raise') {
            this.heightmap[idx] = Math.min(1.0, this.heightmap[idx] + delta);
          } else if (mode === 'lower') {
            this.heightmap[idx] = Math.max(0.0, this.heightmap[idx] - delta);
          } else if (mode === 'smooth') {
            let sum = this.heightmap[idx];
            let count = 1;
            if (x > 0) { sum += this.heightmap[y * w + (x - 1)]; count++; }
            if (x < w - 1) { sum += this.heightmap[y * w + (x + 1)]; count++; }
            if (y > 0) { sum += this.heightmap[(y - 1) * w + x]; count++; }
            if (y < h - 1) { sum += this.heightmap[(y + 1) * w + x]; count++; }
            const avg = sum / count;
            this.heightmap[idx] = this.heightmap[idx] * (1 - delta) + avg * delta;
          }
        }
      }
    }

    this.classifyBiomes();
  }
}
