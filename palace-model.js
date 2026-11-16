/**
 * BUCKINGHAM PALACE 3D - AUTHENTIC PHOTOREALISTIC ARCHITECTURAL MODEL
 * Faithfully matches the iconic front-gate view of Buckingham Palace:
 * - Monumental Portland stone gatepiers with carved Royal Cartouches and 5-lantern candelabras
 * - Grand arched black & gold Royal Centre Gates with twin gilded Royal Coat of Arms medallions
 * - Sir Aston Webb's 1913 neoclassical Portland stone East Front elevation
 * - Forecourt paving with exterior Portland flagstones and interior red ceremonial tarmac
 * - Marching King's Guards, sentry boxes, Victorian streetlamps, and waving Sovereign flag
 */

window.PalaceModel = (function () {
  'use strict';

  // --- 1. TEXTURE GENERATORS ---
  const Textures = {
    // Portland limestone with natural ashlar coursing
    createStoneTexture: function (isRusticated = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = isRusticated ? '#d9d2c5' : '#e6e1d6';
      ctx.fillRect(0, 0, 1024, 1024);

      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - 2));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 6));
      }
      ctx.putImageData(imgData, 0, 0);

      const rowHeight = isRusticated ? 44 : 58;
      const blockWidth = isRusticated ? 120 : 180;

      for (let y = 0; y < 1024; y += rowHeight) {
        ctx.strokeStyle = 'rgba(110, 100, 90, 0.45)';
        ctx.lineWidth = isRusticated ? 3.5 : 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + 2);
        ctx.lineTo(1024, y + 2);
        ctx.stroke();

        const offset = ((y / rowHeight) % 2) * (blockWidth / 2);
        for (let x = offset; x < 1024; x += blockWidth) {
          ctx.strokeStyle = 'rgba(110, 100, 90, 0.35)';
          ctx.lineWidth = isRusticated ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowHeight);
          ctx.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    },

    // London flagstone paving (foreground sidewalk)
    createFlagstoneTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#b8b1a5';
      ctx.fillRect(0, 0, 1024, 1024);

      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Large flagstone pavers
      ctx.strokeStyle = '#5a554c';
      ctx.lineWidth = 3;
      const stoneH = 128;
      const stoneW = 256;

      for (let y = 0; y < 1024; y += stoneH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();

        const offset = ((y / stoneH) % 2) * (stoneW / 2);
        for (let x = offset; x < 1024; x += stoneW) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + stoneH);
          ctx.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(6, 6);
      return texture;
    },

    // Windows with fine Georgian muntins
    createWindowTexture: function (lit = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#22201e';
      ctx.fillRect(0, 0, 256, 512);

      const margin = 12;
      const innerW = 256 - margin * 2;
      const innerH = 512 - margin * 2;

      if (lit) {
        const grad = ctx.createRadialGradient(128, 280, 20, 128, 280, 200);
        grad.addColorStop(0, '#fff4cc');
        grad.addColorStop(0.35, '#ffd369');
        grad.addColorStop(0.75, '#e09822');
        grad.addColorStop(1, '#663c08');
        ctx.fillStyle = grad;
        ctx.fillRect(margin, margin, innerW, innerH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(128, 220, 28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createLinearGradient(0, 0, 256, 512);
        grad.addColorStop(0, '#506e8b');
        grad.addColorStop(0.4, '#7295b7');
        grad.addColorStop(0.55, '#3b5268');
        grad.addColorStop(1, '#1b2836');
        ctx.fillStyle = grad;
        ctx.fillRect(margin, margin, innerW, innerH);

        // Reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(margin, margin + 40);
        ctx.lineTo(margin + 120, margin);
        ctx.lineTo(256 - margin, 512 - margin - 120);
        ctx.lineTo(256 - margin, 512 - margin);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#f5efe3';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(128, margin);
      ctx.lineTo(128, 512 - margin);
      ctx.stroke();

      const rows = 6;
      for (let r = 1; r < rows; r++) {
        const y = margin + (innerH / rows) * r;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(256 - margin, y);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Gilded Royal Arms Medallion on Gate Leaves (High-res 1024x1024 photorealistic crest)
    createGateCrestTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Outer gold medallion dish
      const gradDisc = ctx.createRadialGradient(512, 512, 100, 512, 512, 500);
      gradDisc.addColorStop(0, '#f9e28c');
      gradDisc.addColorStop(0.6, '#d4af37');
      gradDisc.addColorStop(0.9, '#a8791e');
      gradDisc.addColorStop(1, '#66460b');
      ctx.fillStyle = gradDisc;
      ctx.beginPath();
      ctx.arc(512, 512, 490, 0, Math.PI * 2);
      ctx.fill();

      // Outer gold beaded / acanthus border
      ctx.strokeStyle = '#fff2a8';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(512, 512, 470, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#573d09';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(512, 512, 452, 0, Math.PI * 2);
      ctx.stroke();

      // Beads around perimeter
      const beadCount = 48;
      for (let b = 0; b < beadCount; b++) {
        const ang = (b / beadCount) * Math.PI * 2;
        const bx = 512 + Math.cos(ang) * 452;
        const by = 512 + Math.sin(ang) * 452;
        ctx.fillStyle = '#fff4bd';
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // The Royal Garter Belt Ring (Deep Garter Blue #0e2752)
      const gradGarter = ctx.createRadialGradient(512, 512, 280, 512, 512, 410);
      gradGarter.addColorStop(0, '#0a1d40');
      gradGarter.addColorStop(1, '#0e2d63');
      ctx.fillStyle = gradGarter;
      ctx.beginPath();
      ctx.arc(512, 512, 420, 0, Math.PI * 2);
      ctx.fill();

      // Inner gold boundary of Garter belt
      ctx.fillStyle = '#b88924';
      ctx.beginPath();
      ctx.arc(512, 512, 290, 0, Math.PI * 2);
      ctx.fill();

      // Inner field dish
      const innerDish = ctx.createRadialGradient(512, 512, 40, 512, 512, 285);
      innerDish.addColorStop(0, '#ffd863');
      innerDish.addColorStop(0.7, '#dcae32');
      innerDish.addColorStop(1, '#916812');
      ctx.fillStyle = innerDish;
      ctx.beginPath();
      ctx.arc(512, 512, 285, 0, Math.PI * 2);
      ctx.fill();

      // Garter Motto Lettering simulation in gold along blue ring
      ctx.fillStyle = '#ffea9f';
      ctx.font = 'bold 32px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const mottoText = 'HONI · SOIT · QUI · MAL · Y · PENSE';
      const chars = mottoText.split('');
      const charStep = (Math.PI * 1.5) / chars.length;
      chars.forEach((ch, idx) => {
        const theta = -Math.PI * 0.75 + idx * charStep;
        ctx.save();
        ctx.translate(512, 512);
        ctx.rotate(theta + Math.PI / 2);
        ctx.translate(0, -355);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      // CENTRAL ROYAL COAT OF ARMS RELIEF IN HIGH-GLOSS GOLD
      // 1. Royal Quartered Shield
      const sx = 412, sy = 410, sw = 200, sh = 230;
      ctx.fillStyle = '#780c18'; // England/Scotland red
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sw, sy);
      ctx.lineTo(sx + sw, sy + sh * 0.7);
      ctx.bezierCurveTo(sx + sw, sy + sh, sx + sw / 2, sy + sh + 30, sx + sw / 2, sy + sh + 35);
      ctx.bezierCurveTo(sx + sw / 2, sy + sh + 30, sx, sy + sh, sx, sy + sh * 0.7);
      ctx.closePath();
      ctx.fill();

      // Shield quarter dividers
      ctx.fillStyle = '#ffdf78';
      ctx.fillRect(sx + sw / 2 - 4, sy, 8, sh + 30);
      ctx.fillRect(sx, sy + sh / 2 - 4, sw, 8);

      // Quarter 2: Scotland (Gold background with red lion)
      ctx.fillStyle = '#f2be22';
      ctx.fillRect(sx + sw / 2 + 4, sy + 4, sw / 2 - 8, sh / 2 - 8);
      ctx.fillStyle = '#9e111d';
      ctx.beginPath();
      ctx.arc(sx + sw * 0.75, sy + sh * 0.25, 18, 0, Math.PI * 2);
      ctx.fill();

      // Quarter 3: Ireland (Blue background with gold harp)
      ctx.fillStyle = '#0f3d7a';
      ctx.fillRect(sx + 4, sy + sh / 2 + 4, sw / 2 - 8, sh / 2 - 8);
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(sx + sw * 0.25, sy + sh * 0.75, 16, 0, Math.PI * 2);
      ctx.fill();

      // 2. Imperial St Edward's Crown Surmounting Shield
      ctx.fillStyle = '#ffe27d';
      ctx.beginPath();
      ctx.moveTo(432, 380);
      ctx.lineTo(592, 380);
      ctx.lineTo(610, 310);
      ctx.lineTo(562, 335);
      ctx.lineTo(512, 280);
      ctx.lineTo(462, 335);
      ctx.lineTo(414, 310);
      ctx.closePath();
      ctx.fill();
      // Ermine band
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(430, 375, 164, 16);
      ctx.fillStyle = '#000000';
      for (let e = 445; e < 590; e += 28) {
        ctx.fillRect(e, 379, 6, 8);
      }
      // Orb and cross atop crown
      ctx.fillStyle = '#fff4a3';
      ctx.beginPath();
      ctx.arc(512, 268, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(508, 240, 8, 30);
      ctx.fillRect(498, 248, 28, 7);

      // 3. Dexter Supporter: English Royal Lion Rampant (Left)
      ctx.fillStyle = '#ffd966';
      // Lion torso & hind legs
      ctx.beginPath();
      ctx.ellipse(335, 520, 48, 85, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Head & Crown
      ctx.beginPath();
      ctx.arc(320, 420, 38, 0, Math.PI * 2);
      ctx.fill();
      // Crown on Lion
      ctx.fillStyle = '#fff1a8';
      ctx.fillRect(302, 375, 36, 12);
      ctx.beginPath();
      ctx.moveTo(300, 375);
      ctx.lineTo(340, 375);
      ctx.lineTo(335, 355);
      ctx.lineTo(320, 365);
      ctx.lineTo(305, 355);
      ctx.closePath();
      ctx.fill();
      // Forepaws grasping shield
      ctx.fillStyle = '#ffd966';
      ctx.fillRect(350, 440, 65, 18);
      ctx.fillRect(345, 510, 68, 18);

      // 4. Sinister Supporter: Scottish Unicorn Rampant (Right)
      ctx.fillStyle = '#f0ede6';
      // Unicorn torso & hind legs
      ctx.beginPath();
      ctx.ellipse(689, 520, 48, 85, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Head & Horn
      ctx.beginPath();
      ctx.arc(704, 420, 36, 0, Math.PI * 2);
      ctx.fill();
      // Horn
      ctx.fillStyle = '#ffe082';
      ctx.beginPath();
      ctx.moveTo(714, 395);
      ctx.lineTo(760, 335);
      ctx.lineTo(726, 400);
      ctx.closePath();
      ctx.fill();
      // Forelegs supporting shield
      ctx.fillStyle = '#f0ede6';
      ctx.fillRect(610, 440, 65, 18);
      ctx.fillRect(610, 510, 68, 18);
      // Gold coronet & chain
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(688, 435, 34, 10);
      ctx.beginPath();
      ctx.arc(670, 510, 30, 0, Math.PI);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffd54f';
      ctx.stroke();

      // 5. Motto Ribbon at Base: "DIEU ET MON DROIT"
      ctx.fillStyle = '#1c4273';
      ctx.beginPath();
      ctx.moveTo(330, 690);
      ctx.quadraticCurveTo(512, 725, 694, 690);
      ctx.lineTo(705, 735);
      ctx.quadraticCurveTo(512, 770, 320, 735);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('DIEU ET MON DROIT', 512, 730);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      return texture;
    },

    // Royal Standard Flag
    createRoyalStandardTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#b71226';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillRect(512, 256, 512, 256);

      ctx.fillStyle = '#f5b800';
      ctx.fillRect(512, 0, 512, 256);

      ctx.fillStyle = '#0f3f8c';
      ctx.fillRect(0, 256, 512, 256);

      // Gold Lions
      [{ ox: 60, oy: 40 }, { ox: 572, oy: 296 }].forEach((q) => {
        ctx.fillStyle = '#ffd700';
        for (let row = 0; row < 3; row++) {
          const ly = q.oy + row * 60;
          ctx.beginPath();
          ctx.ellipse(q.ox + 160, ly + 25, 110, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(q.ox + 270, ly + 18, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Scottish Lion
      ctx.fillStyle = '#b71226';
      ctx.beginPath();
      ctx.arc(768, 90, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(752, 100, 36, 90);

      // Irish Harp
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(210, 290);
      ctx.bezierCurveTo(290, 290, 310, 360, 260, 470);
      ctx.lineTo(170, 470);
      ctx.bezierCurveTo(160, 390, 180, 330, 210, 290);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Union Jack Flag
    createUnionJackTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#012169';
      ctx.fillRect(0, 0, 1024, 512);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 100;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1024, 512);
      ctx.moveTo(1024, 0);
      ctx.lineTo(0, 512);
      ctx.stroke();

      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1024, 512);
      ctx.moveTo(1024, 0);
      ctx.lineTo(0, 512);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(432, 0, 160, 512);
      ctx.fillRect(0, 176, 1024, 160);

      ctx.fillStyle = '#c8102e';
      ctx.fillRect(464, 0, 96, 512);
      ctx.fillRect(0, 208, 1024, 96);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Pediment Relief
    createPedimentCoatOfArmsTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#dcd4c5';
      ctx.fillRect(0, 0, 1024, 512);

      ctx.fillStyle = '#c8beaf';
      ctx.beginPath();
      ctx.arc(512, 280, 130, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8a6b28';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.fillStyle = '#8a6b28';
      ctx.beginPath();
      ctx.arc(330, 240, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(320, 270, 42, 80);

      ctx.beginPath();
      ctx.arc(694, 240, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(664, 270, 42, 80);

      ctx.beginPath();
      ctx.moveTo(452, 150);
      ctx.lineTo(572, 150);
      ctx.lineTo(592, 100);
      ctx.lineTo(540, 124);
      ctx.lineTo(512, 84);
      ctx.lineTo(484, 124);
      ctx.lineTo(432, 100);
      ctx.closePath();
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },
  };

  // --- 2. PBR MATERIALS ---
  function initMaterials() {
    const stoneTex = Textures.createStoneTexture(false);
    stoneTex.repeat.set(4, 4);

    const rusticatedStoneTex = Textures.createStoneTexture(true);
    rusticatedStoneTex.repeat.set(6, 2);

    const flagstoneTex = Textures.createFlagstoneTexture();
    const windowDayTex = Textures.createWindowTexture(false);
    const windowNightTex = Textures.createWindowTexture(true);
    const gateCrestTex = Textures.createGateCrestTexture();

    return {
      stone: new THREE.MeshStandardMaterial({
        color: 0xe5dfd4,
        roughness: 0.65,
        metalness: 0.08,
        map: stoneTex,
      }),
      stoneRusticated: new THREE.MeshStandardMaterial({
        color: 0xdcd5c7,
        roughness: 0.78,
        metalness: 0.05,
        map: rusticatedStoneTex,
      }),
      stoneDark: new THREE.MeshStandardMaterial({
        color: 0xa89f92,
        roughness: 0.72,
        metalness: 0.1,
      }),
      stoneMarble: new THREE.MeshStandardMaterial({
        color: 0xfaf6ef,
        roughness: 0.25,
        metalness: 0.18,
      }),
      flagstone: new THREE.MeshStandardMaterial({
        color: 0xc2bbb0,
        roughness: 0.82,
        metalness: 0.05,
        map: flagstoneTex,
      }),
      roofSlate: new THREE.MeshStandardMaterial({
        color: 0x363c46,
        roughness: 0.5,
        metalness: 0.32,
      }),
      roofCopper: new THREE.MeshStandardMaterial({
        color: 0x477868,
        roughness: 0.4,
        metalness: 0.42,
      }),
      goldOrnament: new THREE.MeshStandardMaterial({
        color: 0xfad04a,
        metalness: 0.94,
        roughness: 0.15,
        emissive: 0x4a3400,
        emissiveIntensity: 0.35,
      }),
      gateCrestMat: new THREE.MeshStandardMaterial({
        map: gateCrestTex,
        metalness: 0.88,
        roughness: 0.22,
        emissive: 0x382800,
        emissiveIntensity: 0.25,
      }),
      wroughtIron: new THREE.MeshStandardMaterial({
        color: 0x111214,
        metalness: 0.8,
        roughness: 0.32,
      }),
      windowDay: new THREE.MeshStandardMaterial({
        color: 0xdde8f2,
        roughness: 0.12,
        metalness: 0.52,
        map: windowDayTex,
      }),
      windowNight: new THREE.MeshStandardMaterial({
        color: 0xffe8a3,
        roughness: 0.15,
        metalness: 0.1,
        emissive: 0xffcb52,
        emissiveIntensity: 1.15,
        map: windowNightTex,
      }),
      royalVelvetCrimson: new THREE.MeshStandardMaterial({
        color: 0x8a0b1e,
        roughness: 0.65,
        metalness: 0.15,
      }),
      tarmacForecourt: new THREE.MeshStandardMaterial({
        color: 0x9e4235,
        roughness: 0.86,
        metalness: 0.04,
      }),
      lawnGrass: new THREE.MeshStandardMaterial({
        color: 0x36682c,
        roughness: 0.92,
        metalness: 0.02,
      }),
      lanternGlass: new THREE.MeshStandardMaterial({
        color: 0xfffaea,
        roughness: 0.15,
        metalness: 0.3,
        emissive: 0xffd269,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.92,
      }),
      tunicRed: new THREE.MeshStandardMaterial({
        color: 0xd81424,
        roughness: 0.6,
        metalness: 0.12,
      }),
      bearskinFur: new THREE.MeshStandardMaterial({
        color: 0x0c0c0e,
        roughness: 0.98,
        metalness: 0.02,
      }),
    };
  }

  // --- 3. SCENE BUILDER CLASS ---
  class BuckinghamPalaceBuilder {
    constructor() {
      this.materials = initMaterials();
      this.animatedObjects = [];
      this.interactiveHotspots = [];
      this.windowMeshes = [];
      this.flagMesh = null;
      this.flagMaterial = null;
      this.currentFlagType = 'royal';
      this.nightMode = false;
      this.royalStandardTex = Textures.createRoyalStandardTexture();
      this.unionJackTex = Textures.createUnionJackTexture();

      // Imported 3D Model State
      this.rootGroup = null;
      this.eastFrontGroup = null;
      this.importedModelGroup = null;
      this.importedModel = null;
      this.importedModelLoaded = false;
      this.displayMode = 'procedural'; // 'procedural' or 'imported'
      this.onModelLoadedCallback = null;
    }

    buildEntireScene() {
      const rootGroup = new THREE.Group();
      rootGroup.name = 'BuckinghamPalaceScene';

      // 1. Grounds & Paving (Stone flagstone sidewalk + Forecourt)
      rootGroup.add(this.buildGroundsAndPavement());

      // 2. The Magnificent Gates & Candelabra Piers (Foreground Focus)
      rootGroup.add(this.buildGrandGatesAndCandelabras());

      // 3. Sir Aston Webb's Neoclassical East Front Elevation
      this.eastFrontGroup = this.buildEastFrontPalace();
      rootGroup.add(this.eastFrontGroup);

      // Imported 3D Model Group Container (Google Arts & Culture)
      this.importedModelGroup = new THREE.Group();
      this.importedModelGroup.name = 'ImportedGooglePalaceGroup';
      this.importedModelGroup.visible = false;
      rootGroup.add(this.importedModelGroup);

      // 4. Sentries, Sentry Boxes & Background Park
      rootGroup.add(this.buildSentriesAndPark());

      // 5. Hotspots
      this.setupHotspots();

      this.rootGroup = rootGroup;

      return {
        root: rootGroup,
        animatedObjects: this.animatedObjects,
        hotspots: this.interactiveHotspots,
        builder: this,
      };
    }

    // --- 1. GROUNDS & PAVEMENT ---
    buildGroundsAndPavement() {
      const groundsGroup = new THREE.Group();
      groundsGroup.name = 'Grounds';

      // Base park lawn
      const groundGeo = new THREE.PlaneGeometry(420, 360);
      const groundMesh = new THREE.Mesh(
        groundGeo,
        new THREE.MeshStandardMaterial({ color: 0x34632a, roughness: 0.92 })
      );
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.set(0, -0.05, 0);
      groundMesh.receiveShadow = true;
      groundsGroup.add(groundMesh);

      // Foreground Sidewalk Flagstone Paving (where tourists stand outside gates)
      const flagstoneGeo = new THREE.PlaneGeometry(160, 40);
      const flagstoneMesh = new THREE.Mesh(flagstoneGeo, this.materials.flagstone);
      flagstoneMesh.rotation.x = -Math.PI / 2;
      flagstoneMesh.position.set(0, 0.02, 60);
      flagstoneMesh.receiveShadow = true;
      groundsGroup.add(flagstoneMesh);

      // Red Tarmac Ceremonial Driveway through Gates
      const drivewayGeo = new THREE.BoxGeometry(16, 0.05, 36);
      const drivewayMesh = new THREE.Mesh(drivewayGeo, this.materials.tarmacForecourt);
      drivewayMesh.position.set(0, 0.03, 50);
      drivewayMesh.receiveShadow = true;
      groundsGroup.add(drivewayMesh);

      // Main Forecourt Semicircular Parade Ground (inside gates)
      const forecourtGeo = new THREE.CylinderGeometry(
        46,
        46,
        0.08,
        64,
        1,
        false,
        0,
        Math.PI
      );
      const forecourtMesh = new THREE.Mesh(
        forecourtGeo,
        this.materials.tarmacForecourt
      );
      forecourtMesh.position.set(0, 0.01, 16);
      forecourtMesh.receiveShadow = true;
      groundsGroup.add(forecourtMesh);

      const forecourtRectGeo = new THREE.BoxGeometry(94, 0.08, 16);
      const forecourtRect = new THREE.Mesh(
        forecourtRectGeo,
        this.materials.tarmacForecourt
      );
      forecourtRect.position.set(0, 0.01, 8);
      forecourtRect.receiveShadow = true;
      groundsGroup.add(forecourtRect);

      return groundsGroup;
    }

    // --- 2. THE GRAND GATES & 5-LANTERN CANDELABRA PIERS ---
    buildGrandGatesAndCandelabras() {
      const gatesGroup = new THREE.Group();
      gatesGroup.name = 'GrandRoyalGatesAndPiers';

      const gateZ = 42; // Foreground gate line

      // 2A. TWO MONUMENTAL STONE GATEPIERS WITH CARVED ROYAL CARTOUCHES
      [-7.2, 7.2].forEach((gx) => {
        const mainPier = this.createMonumentalCandelabraPier();
        mainPier.position.set(gx, 0, gateZ);
        gatesGroup.add(mainPier);
      });

      // 2B. THE GRAND ARCHED ROYAL CENTRE DOUBLE GATES
      const centerGate = this.createGrandArchedRoyalGates(14.0, 7.8);
      centerGate.position.set(0, 0, gateZ);
      gatesGroup.add(centerGate);

      // 2C. FLANKING INTERMEDIATE PIERS & RAILING SECTIONS
      [-19.5, 19.5].forEach((px) => {
        const sidePier = this.createIntermediateRailingPier();
        sidePier.position.set(px, 0, gateZ - 2.5);
        gatesGroup.add(sidePier);

        // Flanking spearhead railing panels
        const railWidth = 11.0;
        const railX = px > 0 ? (px + 7.2) / 2 : (px - 7.2) / 2;
        const railing = this.createSpearheadRailingSection(railWidth, 5.0);
        railing.position.set(railX, 0, gateZ - 1.2);
        gatesGroup.add(railing);
      });

      // Outer wings railings stretching outward
      [-36, 36].forEach((rx) => {
        const outerRailing = this.createSpearheadRailingSection(20, 4.8);
        outerRailing.position.set(rx, 0, gateZ - 6.5);
        gatesGroup.add(outerRailing);
      });

      // 2D. BLACK STANCHION BOLLARDS & RAILS IN FOREGROUND (from photo)
      [-10.5, -8.5, 8.5, 10.5].forEach((bx) => {
        const bollardGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.15, 8);
        const bollard = new THREE.Mesh(bollardGeo, this.materials.wroughtIron);
        bollard.position.set(bx, 0.58, gateZ + 2.5);
        gatesGroup.add(bollard);

        const capGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const cap = new THREE.Mesh(capGeo, this.materials.goldOrnament);
        cap.position.set(bx, 1.18, gateZ + 2.5);
        gatesGroup.add(cap);
      });

      // Twin horizontal guardrails connecting stanchions
      [[-10.5, -8.5], [8.5, 10.5]].forEach(([x1, x2]) => {
        const span = Math.abs(x2 - x1);
        const midX = (x1 + x2) / 2;
        [0.48, 0.92].forEach((ry) => {
          const railGeo = new THREE.CylinderGeometry(0.04, 0.04, span, 8);
          railGeo.rotateZ(Math.PI / 2);
          const rail = new THREE.Mesh(railGeo, this.materials.wroughtIron);
          rail.position.set(midX, ry, gateZ + 2.5);
          gatesGroup.add(rail);
        });
      });

      return gatesGroup;
    }

    // Monumental Gate Pier crowned with 5-Lantern Victorian Candelabra
    createMonumentalCandelabraPier() {
      const pierGroup = new THREE.Group();

      // Stone Base Plinth
      const baseGeo = new THREE.BoxGeometry(3.2, 1.4, 3.2);
      const base = new THREE.Mesh(baseGeo, this.materials.stoneDark);
      base.position.y = 0.7;
      pierGroup.add(base);

      // Rusticated Shaft with deep horizontal channels
      const shaftGeo = new THREE.BoxGeometry(2.6, 7.2, 2.6);
      const shaft = new THREE.Mesh(shaftGeo, this.materials.stoneRusticated);
      shaft.position.y = 5.0;
      shaft.castShadow = true;
      pierGroup.add(shaft);

      // Carved Royal Cartouche / Escutcheon on front face (seen prominently in photo)
      const cartoucheGeo = new THREE.BoxGeometry(1.4, 2.2, 0.4);
      const cartouche = new THREE.Mesh(cartoucheGeo, this.materials.stoneMarble);
      cartouche.position.set(0, 5.4, 1.4);
      pierGroup.add(cartouche);

      // Gilded Royal Cypher on cartouche
      const cypherGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
      const cypher = new THREE.Mesh(cypherGeo, this.materials.goldOrnament);
      cypher.position.set(0, 5.6, 1.62);
      pierGroup.add(cypher);

      // Carved Stone Laurel Garlands hanging beneath cartouche
      const garlandGeo = new THREE.TorusGeometry(0.65, 0.1, 8, 16, Math.PI);
      const garland = new THREE.Mesh(garlandGeo, this.materials.stoneMarble);
      garland.rotation.z = Math.PI;
      garland.position.set(0, 4.4, 1.45);
      pierGroup.add(garland);

      // Molded Capital Entablature
      const capGeo = new THREE.BoxGeometry(3.3, 1.0, 3.3);
      const cap = new THREE.Mesh(capGeo, this.materials.stone);
      cap.position.y = 9.1;
      pierGroup.add(cap);

      // --- THE MAGNIFICENT 5-LANTERN VICTORIAN CANDELABRA CLUSTER ---
      const candelabraGroup = new THREE.Group();
      candelabraGroup.position.set(0, 9.6, 0);

      // Heavy Cast Iron Pedestal
      const pedGeo = new THREE.CylinderGeometry(0.4, 0.65, 1.2, 12);
      const ped = new THREE.Mesh(pedGeo, this.materials.wroughtIron);
      ped.position.y = 0.6;
      candelabraGroup.add(ped);

      // Central Pillar
      const centerPillarGeo = new THREE.CylinderGeometry(0.18, 0.24, 2.2, 10);
      const centerPillar = new THREE.Mesh(centerPillarGeo, this.materials.wroughtIron);
      centerPillar.position.y = 2.1;
      candelabraGroup.add(centerPillar);

      // Large Central Hexagonal Lantern
      const centerLantern = this.createVictorianLantern(1.2, 1.8, true);
      centerLantern.position.set(0, 3.6, 0);
      candelabraGroup.add(centerLantern);

      // 4 Branching Scrolled Arms holding side lanterns
      const armAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      armAngles.forEach((ang) => {
        const armGroup = new THREE.Group();
        armGroup.rotation.y = ang;

        // Curved iron scroll branch
        const armCurveGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8);
        armCurveGeo.rotateZ(Math.PI / 4);
        const armMesh = new THREE.Mesh(armCurveGeo, this.materials.wroughtIron);
        armMesh.position.set(0.8, 1.6, 0);
        armGroup.add(armMesh);

        // Gold rosette detail
        const rosetteGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const rosette = new THREE.Mesh(rosetteGeo, this.materials.goldOrnament);
        rosette.position.set(0.5, 1.3, 0);
        armGroup.add(rosette);

        // Branch Lantern
        const branchLantern = this.createVictorianLantern(0.9, 1.4, false);
        branchLantern.position.set(1.4, 2.6, 0);
        armGroup.add(branchLantern);

        candelabraGroup.add(armGroup);
      });

      pierGroup.add(candelabraGroup);

      return pierGroup;
    }

    // Victorian Lantern with Glass & Gold Crown Finial
    createVictorianLantern(width, height, isLarge = false) {
      const lanternGroup = new THREE.Group();

      // Hexagonal Glass Cage
      const glassGeo = new THREE.CylinderGeometry(
        width * 0.5,
        width * 0.35,
        height * 0.6,
        6
      );
      const glass = new THREE.Mesh(glassGeo, this.materials.lanternGlass);
      glass.position.y = height * 0.4;
      lanternGroup.add(glass);

      // Iron frame struts
      const topCapGeo = new THREE.ConeGeometry(width * 0.55, height * 0.35, 6);
      const topCap = new THREE.Mesh(topCapGeo, this.materials.wroughtIron);
      topCap.position.y = height * 0.85;
      lanternGroup.add(topCap);

      const baseCapGeo = new THREE.CylinderGeometry(
        width * 0.36,
        width * 0.2,
        height * 0.2,
        6
      );
      const baseCap = new THREE.Mesh(baseCapGeo, this.materials.wroughtIron);
      baseCap.position.y = height * 0.1;
      lanternGroup.add(baseCap);

      // Gold Crown / Acorn Finial
      const finialGeo = new THREE.SphereGeometry(width * 0.18, 8, 8);
      const finial = new THREE.Mesh(finialGeo, this.materials.goldOrnament);
      finial.position.y = height + 0.15;
      lanternGroup.add(finial);

      return lanternGroup;
    }

    // Grand Arched Royal Gates with Gilded Crests (Open transparent wrought iron matching reference photo)
    createGrandArchedRoyalGates(totalWidth, maxHeight) {
      const gateGroup = new THREE.Group();

      const halfW = totalWidth / 2; // 7.0
      const pierH = 5.2;            // outer hinge height
      const centerH = 7.7;          // inner meeting height

      // Curve formula for top arch
      function getArchY(x) {
        const ratio = Math.min(1, Math.max(0, Math.abs(x) / halfW));
        return centerH - Math.pow(ratio, 1.85) * (centerH - pierH);
      }

      // Build Left Leaf (side = -1) and Right Leaf (side = 1)
      [-1, 1].forEach((side) => {
        const leafGroup = new THREE.Group();
        const xOuter = side * 6.85;
        const xInner = side * 0.06;

        // 1. Vertical Outer Hinge Stile (near stone pier)
        const outerStileH = pierH - 0.2;
        const outerStileGeo = new THREE.BoxGeometry(0.18, outerStileH, 0.18);
        const outerStile = new THREE.Mesh(outerStileGeo, this.materials.wroughtIron);
        outerStile.position.set(xOuter, 0.2 + outerStileH / 2, 0);
        leafGroup.add(outerStile);

        // 2. Vertical Inner Meeting Stile (at center)
        const innerStileH = centerH - 0.2;
        const innerStileGeo = new THREE.BoxGeometry(0.18, innerStileH, 0.18);
        const innerStile = new THREE.Mesh(innerStileGeo, this.materials.wroughtIron);
        innerStile.position.set(xInner, 0.2 + innerStileH / 2, 0);
        leafGroup.add(innerStile);

        // Meeting Stile Finial
        const meetFinialGeo = new THREE.ConeGeometry(0.14, 0.45, 6);
        const meetFinial = new THREE.Mesh(meetFinialGeo, this.materials.goldOrnament);
        meetFinial.position.set(xInner, centerH + 0.25, 0);
        leafGroup.add(meetFinial);

        // 3. Horizontal Bottom Sill Rail
        const leafSpan = Math.abs(xOuter - xInner);
        const midLeafX = (xOuter + xInner) / 2;
        const botRailGeo = new THREE.BoxGeometry(leafSpan, 0.16, 0.16);
        const botRail = new THREE.Mesh(botRailGeo, this.materials.wroughtIron);
        botRail.position.set(midLeafX, 0.35, 0);
        leafGroup.add(botRail);

        // 4. Horizontal Lock Rail Band (Lower and Upper rails)
        const lockRail1Geo = new THREE.BoxGeometry(leafSpan, 0.14, 0.14);
        const lockRail1 = new THREE.Mesh(lockRail1Geo, this.materials.wroughtIron);
        lockRail1.position.set(midLeafX, 2.3, 0);
        leafGroup.add(lockRail1);

        const lockRail2Geo = new THREE.BoxGeometry(leafSpan, 0.14, 0.14);
        const lockRail2 = new THREE.Mesh(lockRail2Geo, this.materials.wroughtIron);
        lockRail2.position.set(midLeafX, 3.7, 0);
        leafGroup.add(lockRail2);

        // Gold rosettes along lock rail frieze
        const friezeCount = 7;
        for (let f = 1; f <= friezeCount; f++) {
          const fx = xInner + (xOuter - xInner) * (f / (friezeCount + 1));
          if (Math.abs(fx - midLeafX) < 1.4) continue; // Space for royal crest medallion
          const rosetteGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 16);
          const rosette = new THREE.Mesh(rosetteGeo, this.materials.goldOrnament);
          rosette.position.set(fx, 3.0, 0);
          leafGroup.add(rosette);
        }

        // 5. Arched Top Curved Rail
        const segments = 16;
        for (let s = 0; s < segments; s++) {
          const t0 = s / segments;
          const t1 = (s + 1) / segments;
          const px0 = xInner + (xOuter - xInner) * t0;
          const px1 = xInner + (xOuter - xInner) * t1;
          const py0 = getArchY(px0);
          const py1 = getArchY(px1);

          const segLen = Math.hypot(px1 - px0, py1 - py0);
          const segAngle = Math.atan2(py1 - py0, px1 - px0);

          const segGeo = new THREE.BoxGeometry(segLen + 0.02, 0.16, 0.16);
          const seg = new THREE.Mesh(segGeo, this.materials.wroughtIron);
          seg.position.set((px0 + px1) / 2, (py0 + py1) / 2, 0);
          seg.rotation.z = segAngle;
          leafGroup.add(seg);
        }

        // 6. Vertical Pickets with Gilded Spearhead Finials
        const picketsCount = 20;
        for (let p = 1; p < picketsCount; p++) {
          const t = p / picketsCount;
          const px = xInner + (xOuter - xInner) * t;
          const pyTop = getArchY(px);
          const pHeight = pyTop - 0.35;

          // Vertical wrought iron picket bar
          const picketGeo = new THREE.CylinderGeometry(0.042, 0.042, pHeight, 6);
          const picket = new THREE.Mesh(picketGeo, this.materials.wroughtIron);
          picket.position.set(px, 0.35 + pHeight / 2, 0);
          leafGroup.add(picket);

          // Gilded collar sphere
          const collarGeo = new THREE.SphereGeometry(0.075, 8, 8);
          const collar = new THREE.Mesh(collarGeo, this.materials.goldOrnament);
          collar.position.set(px, pyTop, 0);
          leafGroup.add(collar);

          // Gilded Spearhead finial extending above arch
          const spearGeo = new THREE.ConeGeometry(0.11, 0.44, 6);
          const spear = new THREE.Mesh(spearGeo, this.materials.goldOrnament);
          spear.position.set(px, pyTop + 0.22, 0);
          leafGroup.add(spear);
        }

        // 7. Gilded Royal Coat of Arms Medallion (from photo)
        const crestGroup = new THREE.Group();
        crestGroup.position.set(midLeafX, 3.0, 0.05);

        // Double-sided disc with high-res texture
        const discGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.12, 32);
        discGeo.rotateX(Math.PI / 2);
        const crestDisc = new THREE.Mesh(discGeo, this.materials.gateCrestMat);
        crestGroup.add(crestDisc);

        // Gilded acanthus outer border ring
        const borderRingGeo = new THREE.TorusGeometry(1.36, 0.09, 10, 32);
        const borderRing = new THREE.Mesh(borderRingGeo, this.materials.goldOrnament);
        crestGroup.add(borderRing);

        // Flanking carved acanthus flourishes on crest ring
        [-1.4, 1.4].forEach((fx) => {
          const fGeo = new THREE.SphereGeometry(0.2, 8, 8);
          const fMesh = new THREE.Mesh(fGeo, this.materials.goldOrnament);
          fMesh.position.set(fx, 0, 0);
          crestGroup.add(fMesh);
        });

        leafGroup.add(crestGroup);

        // 8. Heavy Iron Hinge Straps connecting to stone pier
        [0.8, 2.6, 4.8].forEach((hy) => {
          const hingeGeo = new THREE.BoxGeometry(0.5, 0.16, 0.24);
          const hinge = new THREE.Mesh(hingeGeo, this.materials.wroughtIron);
          hinge.position.set(xOuter - (side * 0.15), hy, 0);
          leafGroup.add(hinge);

          const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
          const pin = new THREE.Mesh(pinGeo, this.materials.wroughtIron);
          pin.position.set(xOuter, hy, 0.12);
          leafGroup.add(pin);
        });

        gateGroup.add(leafGroup);
      });

      // 9. Grand Center Apex Crown Finial where the two gate leaves meet (x = 0)
      const apexGroup = new THREE.Group();
      apexGroup.position.set(0, centerH + 0.1, 0);

      // Crown base
      const crownBaseGeo = new THREE.BoxGeometry(1.1, 0.25, 0.3);
      const crownBase = new THREE.Mesh(crownBaseGeo, this.materials.goldOrnament);
      apexGroup.add(crownBase);

      // Crown dome & arches
      const crownArchGeo = new THREE.TorusGeometry(0.48, 0.07, 8, 16, Math.PI);
      const crownArch = new THREE.Mesh(crownArchGeo, this.materials.goldOrnament);
      crownArch.position.y = 0.25;
      apexGroup.add(crownArch);

      // Cross Pattée atop crown
      const crossGeo = new THREE.BoxGeometry(0.22, 0.42, 0.08);
      const cross = new THREE.Mesh(crossGeo, this.materials.goldOrnament);
      cross.position.y = 0.9;
      apexGroup.add(cross);

      const crossHGeo = new THREE.BoxGeometry(0.38, 0.14, 0.08);
      const crossH = new THREE.Mesh(crossHGeo, this.materials.goldOrnament);
      crossH.position.y = 0.95;
      apexGroup.add(crossH);

      gateGroup.add(apexGroup);

      return gateGroup;
    }

    // Intermediate Railing Pier with Single Lantern
    createIntermediateRailingPier() {
      const pierGroup = new THREE.Group();

      const shaftGeo = new THREE.BoxGeometry(1.6, 5.2, 1.6);
      const shaft = new THREE.Mesh(shaftGeo, this.materials.stoneRusticated);
      shaft.position.y = 2.6;
      shaft.castShadow = true;
      pierGroup.add(shaft);

      const capGeo = new THREE.BoxGeometry(1.9, 0.6, 1.9);
      const cap = new THREE.Mesh(capGeo, this.materials.stone);
      cap.position.y = 5.5;
      pierGroup.add(cap);

      const lamp = this.createVictorianLantern(0.85, 1.6, false);
      lamp.position.y = 5.8;
      pierGroup.add(lamp);

      return pierGroup;
    }

    // Spearhead Railing Section with Gilded Tips
    createSpearheadRailingSection(width, height) {
      const railGroup = new THREE.Group();

      // Top & Bottom Rails
      const topRailGeo = new THREE.BoxGeometry(width, 0.2, 0.2);
      const topRail = new THREE.Mesh(topRailGeo, this.materials.wroughtIron);
      topRail.position.y = height;
      railGroup.add(topRail);

      const bottomRailGeo = new THREE.BoxGeometry(width, 0.2, 0.2);
      const bottomRail = new THREE.Mesh(bottomRailGeo, this.materials.wroughtIron);
      bottomRail.position.y = 0.5;
      railGroup.add(bottomRail);

      // Pickets & Spearheads
      const count = Math.floor(width / 0.55);
      const spacing = width / count;
      for (let i = 0; i < count; i++) {
        const x = -width / 2 + i * spacing + spacing / 2;

        const picketGeo = new THREE.CylinderGeometry(0.05, 0.05, height - 0.5, 6);
        const picket = new THREE.Mesh(picketGeo, this.materials.wroughtIron);
        picket.position.set(x, (height - 0.5) / 2 + 0.5, 0);
        railGroup.add(picket);

        const spearGeo = new THREE.ConeGeometry(0.1, 0.38, 6);
        const spear = new THREE.Mesh(spearGeo, this.materials.goldOrnament);
        spear.position.set(x, height + 0.2, 0);
        railGroup.add(spear);
      }

      // Gold scroll frieze under top rail
      const friezeGeo = new THREE.BoxGeometry(width, 0.4, 0.1);
      const frieze = new THREE.Mesh(friezeGeo, this.materials.goldOrnament);
      frieze.position.set(0, height - 0.3, 0);
      railGroup.add(frieze);

      return railGroup;
    }

    // --- 3. SIR ASTON WEBB'S 1913 EAST FRONT PALACE ELEVATION ---
    buildEastFrontPalace() {
      const palaceGroup = new THREE.Group();
      palaceGroup.name = 'EastFrontPalace';
      const palaceZ = 0;

      // 3A. Base Plinth & Rusticated Ground Floor
      const plinthBaseGeo = new THREE.BoxGeometry(108, 0.8, 16.8);
      const plinthBase = new THREE.Mesh(plinthBaseGeo, this.materials.stoneDark);
      plinthBase.position.set(0, 0.4, palaceZ);
      plinthBase.castShadow = true;
      palaceGroup.add(plinthBase);

      const groundFloorGeo = new THREE.BoxGeometry(106, 6.2, 16);
      const groundFloor = new THREE.Mesh(
        groundFloorGeo,
        this.materials.stoneRusticated
      );
      groundFloor.position.set(0, 3.9, palaceZ);
      groundFloor.castShadow = true;
      groundFloor.receiveShadow = true;
      palaceGroup.add(groundFloor);

      // Rusticated arches along Ground Floor
      for (let x = -48; x <= 48; x += 4.8) {
        if (Math.abs(x) < 4) continue;
        const archBay = this.createArchedRusticatedBay();
        archBay.position.set(x, 3.8, palaceZ + 8.08);
        palaceGroup.add(archBay);
      }

      // Center Carriage Archways (3 Arches leading into Quadrangle)
      [-4.0, 0, 4.0].forEach((cx, idx) => {
        const archWidth = idx === 1 ? 4.2 : 2.8;
        const archGeo = new THREE.BoxGeometry(archWidth, 5.0, 16.5);
        const archMesh = new THREE.Mesh(archGeo, this.materials.wroughtIron);
        archMesh.position.set(cx, 2.7, palaceZ);
        palaceGroup.add(archMesh);
      });

      // Belt Entablature with Dentil Cornice
      const beltEntablature = this.createDentilCornice(108, 1.2, 0.8);
      beltEntablature.position.set(0, 7.2, palaceZ + 8.1);
      palaceGroup.add(beltEntablature);

      // 3B. First Floor (Piano Nobile) & Second Floor (Attic)
      const upperFloorsGeo = new THREE.BoxGeometry(106, 12, 15.6);
      const upperFloors = new THREE.Mesh(upperFloorsGeo, this.materials.stone);
      upperFloors.position.set(0, 13.2, palaceZ);
      upperFloors.castShadow = true;
      upperFloors.receiveShadow = true;
      palaceGroup.add(upperFloors);

      // Fluted Corinthian Pilasters & Windows
      for (let x = -48; x <= 48; x += 4.8) {
        if (Math.abs(x) < 7) continue;

        const isTri = Math.round(x) % 2 === 0;
        const win1st = this.createPianoNobileWindow(isTri);
        win1st.position.set(x, 11.2, palaceZ + 7.85);
        palaceGroup.add(win1st);

        const win2nd = this.createAtticWindow();
        win2nd.position.set(x, 16.4, palaceZ + 7.85);
        palaceGroup.add(win2nd);

        const pilaster = this.createFlutedPilaster(11.8, 0.85);
        pilaster.position.set(x + 2.4, 13.2, palaceZ + 7.95);
        palaceGroup.add(pilaster);
      }

      // 3C. End Pavilions (Left & Right)
      [-51, 51].forEach((posX) => {
        const pavilionFrontGeo = new THREE.BoxGeometry(11.5, 19.5, 2.4);
        const pavilion = new THREE.Mesh(pavilionFrontGeo, this.materials.stone);
        pavilion.position.set(posX, 10.0, palaceZ + 8.9);
        pavilion.castShadow = true;
        palaceGroup.add(pavilion);

        const pavPedimentGeo = new THREE.ConeGeometry(7.8, 3.4, 4);
        const pavPediment = new THREE.Mesh(pavPedimentGeo, this.materials.stone);
        pavPediment.rotation.y = Math.PI / 4;
        pavPediment.position.set(posX, 20.8, palaceZ + 8.9);
        pavPediment.castShadow = true;
        palaceGroup.add(pavPediment);
      });

      // 3D. Central Portico, Balcony & Great Pediment
      palaceGroup.add(this.buildCentralPorticoAndBalcony(palaceZ));

      // 3E. Continuous Roofline Balustrades & Skyline
      const parapet = this.createDentilCornice(108, 1.4, 0.9);
      parapet.position.set(0, 19.8, palaceZ + 7.8);
      palaceGroup.add(parapet);

      // Continuous rooftop balustrade
      const roofBalustradeGeo = new THREE.BoxGeometry(106, 1.2, 0.4);
      const roofBalustrade = new THREE.Mesh(roofBalustradeGeo, this.materials.stoneMarble);
      roofBalustrade.position.set(0, 20.8, palaceZ + 7.8);
      palaceGroup.add(roofBalustrade);

      // Flat mansard roof profile (matching photo)
      const roofGeo = new THREE.BoxGeometry(104, 3.5, 14);
      const roofMesh = new THREE.Mesh(roofGeo, this.materials.roofSlate);
      roofMesh.position.set(0, 21.0, palaceZ);
      palaceGroup.add(roofMesh);

      return palaceGroup;
    }

    // Central Portico, Royal Balcony & Pediment
    buildCentralPorticoAndBalcony(palaceZ) {
      const porticoGroup = new THREE.Group();

      // Base
      const porticoBaseGeo = new THREE.BoxGeometry(20, 7.2, 3.2);
      const porticoBase = new THREE.Mesh(porticoBaseGeo, this.materials.stoneRusticated);
      porticoBase.position.set(0, 3.6, palaceZ + 9.4);
      porticoBase.castShadow = true;
      porticoGroup.add(porticoBase);

      // THE ROYAL BALCONY (Center of First Floor)
      const balconyFloorGeo = new THREE.BoxGeometry(7.6, 0.6, 2.6);
      const balconyFloor = new THREE.Mesh(balconyFloorGeo, this.materials.stoneMarble);
      balconyFloor.position.set(0, 7.4, palaceZ + 10.4);
      balconyFloor.castShadow = true;
      porticoGroup.add(balconyFloor);

      // Console corbels
      [-3.2, -1.6, 0, 1.6, 3.2].forEach((cx) => {
        const corbelGeo = new THREE.BoxGeometry(0.5, 1.2, 1.4);
        const corbel = new THREE.Mesh(corbelGeo, this.materials.stoneMarble);
        corbel.position.set(cx, 6.6, palaceZ + 10.2);
        porticoGroup.add(corbel);
      });

      // Crimson velvet banner with gold trim
      const crimsonBannerGeo = new THREE.BoxGeometry(7.2, 1.6, 0.12);
      const crimsonBanner = new THREE.Mesh(crimsonBannerGeo, this.materials.royalVelvetCrimson);
      crimsonBanner.position.set(0, 6.5, palaceZ + 11.75);
      porticoGroup.add(crimsonBanner);

      const goldFringeGeo = new THREE.BoxGeometry(7.3, 0.18, 0.16);
      const goldFringe = new THREE.Mesh(goldFringeGeo, this.materials.goldOrnament);
      goldFringe.position.set(0, 5.6, palaceZ + 11.75);
      porticoGroup.add(goldFringe);

      // French Doors
      const balconyDoorGeo = new THREE.PlaneGeometry(3.8, 4.6);
      const balconyDoor = new THREE.Mesh(balconyDoorGeo, this.materials.windowDay);
      balconyDoor.position.set(0, 9.8, palaceZ + 7.86);
      this.windowMeshes.push(balconyDoor);
      porticoGroup.add(balconyDoor);

      // 6 Giant Corinthian Columns
      const columnPositions = [-8, -4.8, -1.6, 1.6, 4.8, 8];
      columnPositions.forEach((cx) => {
        const colGeo = new THREE.CylinderGeometry(0.48, 0.56, 11.6, 16);
        const column = new THREE.Mesh(colGeo, this.materials.stone);
        column.position.set(cx, 13.4, palaceZ + 10.6);
        column.castShadow = true;
        porticoGroup.add(column);

        const capGeo = new THREE.BoxGeometry(1.3, 0.9, 1.3);
        const cap = new THREE.Mesh(capGeo, this.materials.stoneMarble);
        cap.position.set(cx, 19.4, palaceZ + 10.6);
        porticoGroup.add(cap);
      });

      // Giant Entablature
      const mainEntablature = this.createDentilCornice(20.4, 1.8, 1.4);
      mainEntablature.position.set(0, 19.8, palaceZ + 10.6);
      porticoGroup.add(mainEntablature);

      // THE GREAT TRIANGULAR PEDIMENT
      const pedimentShape = new THREE.Shape();
      pedimentShape.moveTo(-10.2, 0);
      pedimentShape.lineTo(10.2, 0);
      pedimentShape.lineTo(0, 5.2);
      pedimentShape.closePath();

      const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, {
        depth: 2.4,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.28,
        bevelThickness: 0.28,
      });
      const pediment = new THREE.Mesh(pedimentGeo, this.materials.stone);
      pediment.position.set(0, 20.6, palaceZ + 9.2);
      pediment.castShadow = true;
      porticoGroup.add(pediment);

      // High-relief Royal Coat of Arms on Pediment Tympanum
      const armsPlaneGeo = new THREE.PlaneGeometry(8.8, 4.0);
      const armsMat = new THREE.MeshStandardMaterial({
        map: Textures.createPedimentCoatOfArmsTexture(),
        roughness: 0.5,
        metalness: 0.35,
      });
      const armsPlane = new THREE.Mesh(armsPlaneGeo, armsMat);
      armsPlane.position.set(0, 22.2, palaceZ + 11.65);
      porticoGroup.add(armsPlane);

      // Flagpole & Sovereign Flag
      const atticCenterGeo = new THREE.BoxGeometry(12, 3.8, 7.5);
      const atticCenter = new THREE.Mesh(atticCenterGeo, this.materials.stone);
      atticCenter.position.set(0, 22.0, palaceZ + 4.5);
      porticoGroup.add(atticCenter);

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 15, 12);
      const pole = new THREE.Mesh(poleGeo, this.materials.wroughtIron);
      pole.position.set(0, 30.5, palaceZ + 4.5);
      porticoGroup.add(pole);

      const flagGeo = new THREE.PlaneGeometry(5.8, 3.4, 18, 12);
      this.flagMaterial = new THREE.MeshStandardMaterial({
        map: this.royalStandardTex,
        roughness: 0.42,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const flagMesh = new THREE.Mesh(flagGeo, this.flagMaterial);
      flagMesh.position.set(3.0, 36.0, palaceZ + 4.5);
      porticoGroup.add(flagMesh);

      this.flagMesh = flagMesh;
      this.animatedObjects.push({
        type: 'flag',
        mesh: flagMesh,
        geo: flagGeo,
      });

      return porticoGroup;
    }

    // --- 4. SENTRIES & PARK ---
    buildSentriesAndPark() {
      const parkGroup = new THREE.Group();

      // Sentry Boxes & Marching Guards inside Forecourt
      const sentryPositions = [
        { x: -16, z: 12 },
        { x: -8, z: 12 },
        { x: 8, z: 12 },
        { x: 16, z: 12 },
      ];

      sentryPositions.forEach((pos, idx) => {
        // Sentry Box
        const boxGeo = new THREE.BoxGeometry(1.6, 3.8, 1.4);
        const box = new THREE.Mesh(boxGeo, this.materials.wroughtIron);
        box.position.set(pos.x, 1.9, pos.z);
        parkGroup.add(box);

        const doorCutoutGeo = new THREE.BoxGeometry(1.0, 3.0, 0.3);
        const doorCutout = new THREE.Mesh(doorCutoutGeo, this.materials.stoneMarble);
        doorCutout.position.set(pos.x, 1.5, pos.z + 0.6);
        parkGroup.add(doorCutout);

        // Marching Foot Guard
        const guard = this.createKingsGuard(idx);
        guard.position.set(pos.x, 0, pos.z + 2.0);
        guard.rotation.y = Math.PI;
        parkGroup.add(guard);

        this.animatedObjects.push({
          type: 'guard_marching',
          mesh: guard,
          baseX: pos.x,
          baseZ: pos.z + 2.0,
          range: 3.5,
          speed: 0.85,
          cycle: idx * 2.2,
        });
      });

      return parkGroup;
    }

    // --- ARCHITECTURAL HELPERS ---
    createDentilCornice(width, height, depth) {
      const corniceGroup = new THREE.Group();

      const mainMoldingGeo = new THREE.BoxGeometry(width, height * 0.65, depth);
      const mainMolding = new THREE.Mesh(mainMoldingGeo, this.materials.stone);
      mainMolding.castShadow = true;
      corniceGroup.add(mainMolding);

      const dentilSpacing = 1.2;
      const dentilCount = Math.floor(width / dentilSpacing);
      const dentilGeo = new THREE.BoxGeometry(0.5, height * 0.35, 0.4);
      const instancedDentils = new THREE.InstancedMesh(
        dentilGeo,
        this.materials.stone,
        dentilCount
      );

      const dummy = new THREE.Object3D();
      for (let i = 0; i < dentilCount; i++) {
        const x = -width / 2 + i * dentilSpacing + dentilSpacing / 2;
        dummy.position.set(x, -height * 0.4, depth * 0.45);
        dummy.updateMatrix();
        instancedDentils.setMatrixAt(i, dummy.matrix);
      }
      instancedDentils.instanceMatrix.needsUpdate = true;
      corniceGroup.add(instancedDentils);

      return corniceGroup;
    }

    createFlutedPilaster(height, width) {
      const pilasterGroup = new THREE.Group();

      const shaftGeo = new THREE.BoxGeometry(width, height * 0.88, 0.4);
      const shaft = new THREE.Mesh(shaftGeo, this.materials.stone);
      shaft.castShadow = true;
      pilasterGroup.add(shaft);

      const capGeo = new THREE.BoxGeometry(width * 1.4, height * 0.08, 0.65);
      const cap = new THREE.Mesh(capGeo, this.materials.stoneMarble);
      cap.position.y = height * 0.47;
      pilasterGroup.add(cap);

      return pilasterGroup;
    }

    createPianoNobileWindow(isTriangular = true) {
      const winGroup = new THREE.Group();

      const glassGeo = new THREE.PlaneGeometry(2.4, 4.4);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      glass.position.z = -0.15;
      this.windowMeshes.push(glass);
      winGroup.add(glass);

      const frameGeo = new THREE.BoxGeometry(2.7, 4.6, 0.3);
      const frame = new THREE.Mesh(frameGeo, this.materials.stoneDark);
      winGroup.add(frame);

      const sillGeo = new THREE.BoxGeometry(3.0, 0.3, 0.5);
      const sill = new THREE.Mesh(sillGeo, this.materials.stone);
      sill.position.set(0, -2.4, 0.15);
      winGroup.add(sill);

      if (isTriangular) {
        const pedShape = new THREE.Shape();
        pedShape.moveTo(-1.6, 0);
        pedShape.lineTo(1.6, 0);
        pedShape.lineTo(0, 1.0);
        pedShape.closePath();
        const pedGeo = new THREE.ShapeGeometry(pedShape);
        const ped = new THREE.Mesh(pedGeo, this.materials.stone);
        ped.position.set(0, 2.3, 0.16);
        winGroup.add(ped);
      } else {
        const archShape = new THREE.Shape();
        archShape.moveTo(-1.6, 0);
        archShape.quadraticCurveTo(0, 1.2, 1.6, 0);
        archShape.closePath();
        const archGeo = new THREE.ShapeGeometry(archShape);
        const arch = new THREE.Mesh(archGeo, this.materials.stone);
        arch.position.set(0, 2.3, 0.16);
        winGroup.add(arch);
      }

      return winGroup;
    }

    createAtticWindow() {
      const winGroup = new THREE.Group();

      const glassGeo = new THREE.PlaneGeometry(2.2, 2.3);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      glass.position.z = -0.12;
      this.windowMeshes.push(glass);
      winGroup.add(glass);

      const frameGeo = new THREE.BoxGeometry(2.5, 2.6, 0.22);
      const frame = new THREE.Mesh(frameGeo, this.materials.stoneDark);
      winGroup.add(frame);

      return winGroup;
    }

    createArchedRusticatedBay() {
      const bayGroup = new THREE.Group();

      const glassGeo = new THREE.PlaneGeometry(2.3, 3.4);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      glass.position.z = -0.1;
      this.windowMeshes.push(glass);
      bayGroup.add(glass);

      const archHeadGeo = new THREE.CylinderGeometry(
        1.15,
        1.15,
        0.3,
        16,
        1,
        false,
        0,
        Math.PI
      );
      const archHead = new THREE.Mesh(archHeadGeo, this.materials.stoneRusticated);
      archHead.rotation.z = Math.PI / 2;
      archHead.position.set(0, 1.7, 0.08);
      bayGroup.add(archHead);

      const keyGeo = new THREE.BoxGeometry(0.55, 0.7, 0.42);
      const key = new THREE.Mesh(keyGeo, this.materials.stone);
      key.position.set(0, 2.55, 0.2);
      bayGroup.add(key);

      return bayGroup;
    }

    createKingsGuard(index = 0) {
      const guardGroup = new THREE.Group();

      // Boots
      const bootGeo = new THREE.BoxGeometry(0.24, 0.35, 0.45);
      [-0.2, 0.2].forEach((bx) => {
        const boot = new THREE.Mesh(bootGeo, this.materials.wroughtIron);
        boot.position.set(bx, 0.18, 0);
        guardGroup.add(boot);
      });

      // Trousers
      const legsGeo = new THREE.BoxGeometry(0.68, 1.1, 0.34);
      const legs = new THREE.Mesh(legsGeo, this.materials.wroughtIron);
      legs.position.y = 0.9;
      guardGroup.add(legs);

      // Red Tunic
      const tunicGeo = new THREE.BoxGeometry(0.72, 1.25, 0.38);
      const tunic = new THREE.Mesh(tunicGeo, this.materials.tunicRed);
      tunic.position.y = 1.95;
      tunic.castShadow = true;
      guardGroup.add(tunic);

      // White Belt
      const beltGeo = new THREE.BoxGeometry(0.74, 0.12, 0.4);
      const belt = new THREE.Mesh(beltGeo, this.materials.stoneMarble);
      belt.position.y = 1.6;
      guardGroup.add(belt);

      // Head
      const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const head = new THREE.Mesh(
        headGeo,
        new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 })
      );
      head.position.y = 2.75;
      guardGroup.add(head);

      // Bearskin Hat
      const bearskinGeo = new THREE.CylinderGeometry(0.26, 0.24, 1.05, 12);
      const bearskin = new THREE.Mesh(bearskinGeo, this.materials.bearskinFur);
      bearskin.position.y = 3.3;
      bearskin.castShadow = true;
      guardGroup.add(bearskin);

      // Rifle
      const rifleGeo = new THREE.BoxGeometry(0.08, 1.8, 0.12);
      const rifle = new THREE.Mesh(rifleGeo, this.materials.wroughtIron);
      rifle.position.set(0.42, 1.9, 0.15);
      guardGroup.add(rifle);

      return guardGroup;
    }

    // --- HOTSPOTS DATA ---
    setupHotspots() {
      this.interactiveHotspots = [
        {
          id: 'gate',
          title: 'The Grand Royal Gates',
          category: 'Iconic Landmark',
          badge: 'Most Recognizable',
          position: new THREE.Vector3(0, 4.5, 42),
          cameraTarget: new THREE.Vector3(0, 5.2, 58),
          cameraLookAt: new THREE.Vector3(0, 8.5, 0),
          shortDesc:
            'The monumental black and gold arched gates featuring the Royal Arms and candelabra piers.',
          fullContent: `
            <h4>The Royal Centre Gates & Candelabras</h4>
            <p>Designed by Sir Aston Webb in 1911 as part of the Queen Victoria Memorial scheme, these gates represent the finest British ceremonial ironwork.</p>
            <ul>
              <li><strong>Twin Royal Crests:</strong> Two massive gilded medallions showing the Lion and the Unicorn flanking the Royal Shield.</li>
              <li><strong>5-Lantern Candelabras:</strong> Crown each monumental Portland stone pier with four branching arms surrounding a grand central lantern.</li>
              <li><strong>Ceremonial Opening:</strong> The gates are unlocked exclusively for the Sovereign, Visiting Heads of State, and during Changing of the Guard.</li>
            </ul>
          `,
          tip: 'Stand directly outside the center gates to take the quintessential Buckingham Palace postcard photo framing the central balcony!',
        },
        {
          id: 'balcony',
          title: 'The Royal Balcony',
          category: 'Iconic Landmark',
          badge: 'Most Famous',
          position: new THREE.Vector3(0, 9.8, 11.5),
          cameraTarget: new THREE.Vector3(0, 10.5, 26),
          cameraLookAt: new THREE.Vector3(0, 10.0, 5),
          shortDesc:
            'Where the Royal Family appears during momentous national celebrations, weddings, and Jubilees.',
          fullContent: `
            <h4>A Window on British Royal History</h4>
            <p>The iconic Central Balcony was introduced by Prince Albert in 1851 during the reign of Queen Victoria, allowing the Sovereign to connect directly with the British public.</p>
            <ul>
              <li><strong>First Public Appearance:</strong> 1851 by Queen Victoria during the Great Exhibition.</li>
              <li><strong>Famous Moments:</strong> VE Day in 1945 with Sir Winston Churchill; Royal Weddings and King Charles III's Coronation.</li>
              <li><strong>The Red Drape:</strong> Ceremonial crimson velvet cloth with gold bullion fringe embroidered with the Sovereign's Royal Cypher.</li>
            </ul>
          `,
          tip: 'Arrive 2 hours early before major royal flypasts to secure a direct line of sight down The Mall!',
        },
        {
          id: 'guard',
          title: 'Changing of the Guard',
          category: 'Ceremony',
          badge: 'Top Attraction',
          position: new THREE.Vector3(0, 2.5, 24),
          cameraTarget: new THREE.Vector3(-14, 6, 36),
          cameraLookAt: new THREE.Vector3(0, 2, 20),
          shortDesc:
            'The world-famous handover ceremony between the Old Guard and New Guard.',
          fullContent: `
            <h4>Guard Mounting (Changing of the Guard)</h4>
            <p>Carried out by the Foot Guards of the Household Division in their world-famous scarlet tunics and tall black bearskin hats made from Canadian black bear fur.</p>
            <ul>
              <li><strong>Schedule:</strong> 11:00 AM on Mondays, Wednesdays, Fridays, and Sundays.</li>
              <li><strong>Ceremony Location:</strong> Takes place directly across the red forecourt behind the center gates.</li>
            </ul>
          `,
          tip: 'Best viewing vantage: Stand right outside the central gates by 10:15 AM.',
        },
        {
          id: 'flag',
          title: 'The Sovereign Flagpole',
          category: 'Royal Protocol',
          badge: 'Live Status',
          position: new THREE.Vector3(0, 31, 4.5),
          cameraTarget: new THREE.Vector3(0, 32, 28),
          cameraLookAt: new THREE.Vector3(0, 30, 4.5),
          shortDesc:
            'Discover whether His Majesty King Charles III is currently residing inside the Palace.',
          fullContent: `
            <h4>The Sovereign's Flag Code</h4>
            <p>If the 4-quadrant Royal Standard is flying, The King is inside the palace. If the Union Jack is flying, His Majesty is away.</p>
          `,
          tip: 'Look up at the flagpole to know immediately if the King is home today!',
        },
        {
          id: 'staircase',
          title: 'The Grand Staircase',
          category: 'State Rooms',
          badge: 'Architectural Gem',
          position: new THREE.Vector3(-24, 7, 2),
          cameraTarget: new THREE.Vector3(-22, 11, 24),
          cameraLookAt: new THREE.Vector3(-24, 6, 2),
          shortDesc:
            'John Nash’s theatrical imperial entrance with gilded bronze acanthus balustrades.',
          fullContent: `
            <h4>The Grand Staircase</h4>
            <p>Designed by John Nash for King George IV in 1825, this breathtaking staircase provides the first regal impression for heads of state entering the State Apartments.</p>
            <ul>
              <li><strong>Cast Gilt Bronze Balustrade:</strong> Costing £3,900 in 1828, sculpted by Joseph Browne with intricate acanthus, oak, and laurel leaves.</li>
              <li><strong>Glazed Dome:</strong> An ornate skylight lantern ceiling floods the crimson-carpeted flights with daylight.</li>
              <li><strong>Ancestral Portraits:</strong> Features portraits of George III, Queen Charlotte, William IV, and Queen Adelaide.</li>
            </ul>
          `,
          tip: 'Notice the dramatic double return flight as the staircase splits to reach the first floor state rooms!',
        },
        {
          id: 'ballroom',
          title: 'The Grand Ballroom',
          category: 'State Rooms',
          badge: 'Largest Hall',
          position: new THREE.Vector3(-38, 8, -8),
          cameraTarget: new THREE.Vector3(-36, 13, 16),
          cameraLookAt: new THREE.Vector3(-38, 7, -8),
          shortDesc:
            'The largest room in Buckingham Palace, setting for grand State Banquets and royal investitures.',
          fullContent: `
            <h4>The Grand Ballroom</h4>
            <p>Added in 1853–1855 by Sir James Pennethorne for Queen Victoria, measuring 36.6m long, 18m wide, and 13.5m high.</p>
            <ul>
              <li><strong>State Banquets:</strong> Hosts up to 170 guests at a magnificent horseshoe-shaped table adorned with the silver-gilt Grand Service.</li>
              <li><strong>Table Setup Precision:</strong> Palace footmen use measuring sticks to align every place setting to exactly 45cm!</li>
              <li><strong>Investitures:</strong> The sovereign confers knighthoods, DBEs, CBEs, and MBEs here to more than 1,000 recipients annually.</li>
              <li><strong>Coronation Canopy:</strong> Features the 1911 Delhi Durbar throne canopy designed by Sir Edwin Lutyens.</li>
            </ul>
          `,
          tip: 'Look for the two thrones under the crimson velvet canopy at the far end of the ballroom!',
        },
        {
          id: 'throne_room',
          title: 'The Throne Room',
          category: 'State Rooms',
          badge: 'Royal Ceremonial',
          position: new THREE.Vector3(18, 8, -4),
          cameraTarget: new THREE.Vector3(16, 12, 20),
          cameraLookAt: new THREE.Vector3(18, 7, -4),
          shortDesc:
            'Opulent crimson hall holding the Chairs of Estate used in sovereign coronation ceremonies.',
          fullContent: `
            <h4>The Throne Room</h4>
            <p>Conceived by John Nash with a theatrical proscenium arch reminiscent of grand opera houses, draped in royal crimson silk damask.</p>
            <ul>
              <li><strong>Chairs of Estate:</strong> The pink-crimson Chairs of Estate made for Queen Elizabeth II (1953) and King Charles III (2023) stand on the royal dais.</li>
              <li><strong>Wars of the Roses Frieze:</strong> Sculpted by William Pitts, chronicling the medieval conflict and eventual Tudor reconciliation.</li>
              <li><strong>Royal Wedding Portraits:</strong> The official setting for wedding portraits of Elizabeth II & Prince Philip (1947), Charles & Diana (1981), and William & Catherine (2011).</li>
            </ul>
          `,
          tip: 'Admire the gold bullion Royal Cypher embroidered on the back of each Chair of Estate!',
        },
        {
          id: 'google_model',
          title: 'Google Arts & Culture 3D Model',
          category: '3D Heritage',
          badge: 'Photogrammetry',
          position: new THREE.Vector3(0, 14, 0),
          cameraTarget: new THREE.Vector3(0, 18, 45),
          cameraLookAt: new THREE.Vector3(0, 12, 0),
          shortDesc:
            'Authentic high-resolution 3D scan of Buckingham Palace provided by Google Arts & Culture.',
          fullContent: `
            <h4>Google Arts & Culture 3D Heritage Scan</h4>
            <p>This accurate 3D model captures the complete architectural envelope of Buckingham Palace, including the Quadrangle, West Garden elevation, and State Wing roofs.</p>
            <ul>
              <li><strong>Complete Quadrangle:</strong> Inspect the inner courtyard shielded behind the East Front facade.</li>
              <li><strong>Garden Facade:</strong> See the stone balustrades and John Nash terrace overlooking the 39-acre palace gardens.</li>
              <li><strong>AR Compatible:</strong> Can be viewed in augmented reality on supported mobile devices!</li>
            </ul>
          `,
          tip: 'Use the model toggle button in the top HUD to switch between the 1913 facade and the Google 3D model!',
        },
      ];
    }

    // --- IMPORTED 3D MODEL LOADER (Google Arts & Culture GLB) ---
    loadImportedModel(renderer, onLoadSuccess, onLoadError) {
      if (typeof THREE.GLTFLoader === 'undefined') {
        console.warn('THREE.GLTFLoader is not loaded');
        if (onLoadError) onLoadError('THREE.GLTFLoader not available');
        return;
      }

      const loader = new THREE.GLTFLoader();

      // Configure DRACO Loader if present
      if (typeof THREE.DRACOLoader !== 'undefined') {
        try {
          const dracoLoader = new THREE.DRACOLoader();
          dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
          loader.setDRACOLoader(dracoLoader);
        } catch (e) {
          console.warn('DRACOLoader setup error:', e);
        }
      }

      // Configure KTX2 Loader if present
      if (typeof THREE.KTX2Loader !== 'undefined' && renderer) {
        try {
          const ktx2Loader = new THREE.KTX2Loader();
          ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/basis/');
          ktx2Loader.detectSupport(renderer);
          loader.setKTX2Loader(ktx2Loader);
        } catch (e) {
          console.warn('KTX2Loader setup error:', e);
        }
      }

      const localModelUrl = 'model.glb';
      const remoteModelUrl =
        'https://culturalinstitute-3d-serving.storage.googleapis.com/98969182/KAGAFaI72HwM5g/1631639669829/gltf/model.glb';

      const handleSuccess = (gltf) => {
        const model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!model) {
          if (onLoadError) onLoadError('No scene found in GLB');
          return;
        }

        // Compute bounding box
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Desired palace facade width is ~108 units
        const targetWidth = 108;
        const scaleFactor = size.x > 0 ? targetWidth / size.x : 1;
        model.scale.setScalar(scaleFactor);

        // Recompute bbox with new scale
        const scaledBbox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBbox.getCenter(scaledCenter);

        // Position: center x at 0, bottom at y = 0, center z at palace position (z = 0)
        model.position.x = -scaledCenter.x;
        model.position.y = -scaledBbox.min.y;
        model.position.z = -scaledCenter.z;

        // Enhance materials & shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.max(0.65, child.material.roughness || 0.7);
            }
          }
        });

        if (this.importedModelGroup) {
          this.importedModelGroup.clear();
          this.importedModelGroup.add(model);
        }

        this.importedModel = model;
        this.importedModelLoaded = true;

        // Auto-switch to imported model mode
        this.setDisplayMode('imported');

        console.log('Google Arts & Culture Buckingham Palace 3D model loaded successfully!');
        if (onLoadSuccess) onLoadSuccess(model);
      };

      // Try local model first; if fails (e.g. file:/// fetch restriction), try remote URL
      loader.load(
        localModelUrl,
        handleSuccess,
        undefined,
        (err) => {
          console.warn('Local model.glb fetch failed, trying remote Google Storage URL...', err);
          loader.load(
            remoteModelUrl,
            handleSuccess,
            undefined,
            (remoteErr) => {
              console.warn('Remote model fetch also failed. Keeping procedural facade as active model.', remoteErr);
              if (onLoadError) onLoadError(remoteErr);
            }
          );
        }
      );
    }

    // Toggle between imported 3D model, procedural 1913 facade, or both
    setDisplayMode(mode) {
      this.displayMode = mode;
      if (mode === 'imported' && this.importedModelLoaded) {
        if (this.eastFrontGroup) this.eastFrontGroup.visible = false;
        if (this.importedModelGroup) this.importedModelGroup.visible = true;
      } else if (mode === 'procedural') {
        if (this.eastFrontGroup) this.eastFrontGroup.visible = true;
        if (this.importedModelGroup) this.importedModelGroup.visible = false;
      } else if (mode === 'both') {
        if (this.eastFrontGroup) this.eastFrontGroup.visible = true;
        if (this.importedModelGroup) this.importedModelGroup.visible = true;
      }
    }

    setFlag(type) {
      if (!this.flagMaterial) return;
      this.currentFlagType = type;
      if (type === 'royal') {
        this.flagMaterial.map = this.royalStandardTex;
      } else {
        this.flagMaterial.map = this.unionJackTex;
      }
      this.flagMaterial.needsUpdate = true;
    }

    setLightingMode(mode) {
      this.nightMode = mode === 'night';
      const isNight = this.nightMode;

      this.windowMeshes.forEach((mesh) => {
        mesh.material = isNight
          ? this.materials.windowNight
          : this.materials.windowDay;
      });
    }

    update(time) {
      const t = time * 0.001;

      // Waving Flag
      if (this.flagMesh && this.flagMesh.geometry) {
        const pos = this.flagMesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const wave =
            Math.sin(u * 2.2 - t * 4.5) * 0.22 * Math.max(0, (u + 2.7) / 5.4);
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;
      }

      // Marching Sentries
      this.animatedObjects.forEach((obj) => {
        if (obj.type === 'guard_marching') {
          const phase = Math.sin(t * obj.speed + obj.cycle);
          obj.mesh.position.x = obj.baseX + phase * obj.range;
          const marchingRight = Math.cos(t * obj.speed + obj.cycle) > 0;
          obj.mesh.rotation.y = marchingRight ? Math.PI / 2 : -Math.PI / 2;
          obj.mesh.position.y = Math.abs(Math.sin(t * obj.speed * 4)) * 0.08;
        }
      });
    }
  }

  return {
    createPalaceBuilder: function () {
      return new BuckinghamPalaceBuilder();
    },
  };
})();
