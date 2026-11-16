/**
 * BUCKINGHAM PALACE 3D - MAIN APPLICATION CONTROLLER
 * Architecture based on the 3D Web Experience Skill:
 * - Loading indicator with progress bar & status steps
 * - WebGL capability detection & graceful fallback
 * - Mobile DPR capping (DPR 1.0 on mobile, max 1.5 on desktop)
 * - OrbitControls scroll isolation & touch protection
 * - Real-time 3D Royal Compass Rose
 * - Cinematic Guided Royal Tour autoplay engine
 * - Advanced Web Audio: Big Ben Westminster Chimes, Regimental Marching Drum & Fanfare
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    lighting: 'day', // 'day', 'sunset', 'night'
    flag: 'royal', // 'royal', 'union'
    quality: 'high', // 'high', 'balanced', 'saver'
    isAudioPlaying: false,
    autoRotate: true,
    activeHotspot: null,
    activeTab: 'explorer',
    isDrawerOpen: false,
    isTourActive: false,
    currentTourStep: 0,
    tourTimer: null,
  };

  let activeViewMode = 'google'; // 'google' (Google Arts & Culture 3D model) or 'forecourt' (Three.js scene)

  let scene, camera, renderer, controls;
  let palaceBuilder, palaceSceneData;
  let dirLight, ambientLight, hemiLight, uplights = [];
  let starsMesh = null;
  let rafId = null;
  const clock = new THREE.Clock();

  // Mobile detection for 3D performance optimization
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // --- WEBGL CAPABILITY DETECTION ---
  function isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  // --- AUDIO SYNTHESIZER (Native Web Audio API) ---
  const SoundEngine = (function () {
    let ctx = null;
    let masterGain = null;
    let ambientNode = null;
    let drumInterval = null;
    let isInitialized = false;

    function init() {
      if (isInitialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
        masterGain.connect(ctx.destination);
        isInitialized = true;
      } catch (e) {
        console.warn('Web Audio not supported', e);
      }
    }

    // 1. Royal Brass Fanfare Synth
    function playFanfare() {
      init();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      const durations = [0.22, 0.22, 0.24, 0.24, 0.35, 0.7];
      let now = ctx.currentTime + 0.05;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(1200, now + durations[idx]);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.38, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durations[idx]);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + durations[idx] + 0.05);

        now += durations[idx] * 0.95;
      });
    }

    // 2. Westminster Quarters (Big Ben Chimes)
    function playBigBenChime() {
      init();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      // Westminster Quarters: G#4, F#4, E4, B3 (approx notes: 415.3, 369.99, 329.63, 246.94)
      const chimes = [415.3, 369.99, 329.63, 246.94];
      let now = ctx.currentTime + 0.05;

      chimes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.3);
        now += 0.55;
      });
    }

    // 3. Regimental Marching Snare Drum Cadence
    function startMarchingDrums() {
      init();
      if (!ctx || drumInterval) return;
      if (ctx.state === 'suspended') ctx.resume();

      drumInterval = setInterval(() => {
        playSnareHit();
      }, 550); // 110 BPM British ceremonial march tempo
    }

    function stopMarchingDrums() {
      if (drumInterval) {
        clearInterval(drumInterval);
        drumInterval = null;
      }
    }

    function playSnareHit() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(t);
    }

    // 4. London Park Ambiance (Breeze & Birds)
    function startLondonAmbiance() {
      init();
      if (!ctx || ambientNode) return;
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.03;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const breezeGain = ctx.createGain();
      breezeGain.gain.setValueAtTime(0.12, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(breezeGain);
      breezeGain.connect(masterGain);
      whiteNoise.start();

      ambientNode = { noise: whiteNoise, gain: breezeGain };
      scheduleRandomBirdChirp();
    }

    function stopLondonAmbiance() {
      if (ambientNode) {
        try {
          ambientNode.noise.stop();
        } catch (e) {}
        ambientNode = null;
      }
    }

    function scheduleRandomBirdChirp() {
      if (!ambientNode || !ctx) return;
      const delay = 4000 + Math.random() * 6000;
      setTimeout(() => {
        if (!ambientNode) return;
        playBirdChirp();
        scheduleRandomBirdChirp();
      }, delay);
    }

    function playBirdChirp() {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 2200 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, t + 0.12);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    return {
      playFanfare,
      playBigBenChime,
      startMarchingDrums,
      stopMarchingDrums,
      startLondonAmbiance,
      stopLondonAmbiance,
    };
  })();

  // --- GUIDED TOUR WAYPOINTS ---
  const TOUR_WAYPOINTS = [
    {
      title: '1. The Mall Approach & Victoria Memorial',
      desc: 'Sir Thomas Brock’s gilded Winged Victory monument stands at the apex of The Mall, welcoming visitors to the royal gates.',
      pos: new THREE.Vector3(0, 16, 114),
      target: new THREE.Vector3(0, 12, 82),
      duration: 7000,
    },
    {
      title: '2. The Forecourt & Sentry Inspection',
      desc: 'The red gravel parade ground where the King’s Guard conducts Guard Mounting every morning at 11:00 AM.',
      pos: new THREE.Vector3(-14, 5.5, 36),
      target: new THREE.Vector3(0, 2.5, 20),
      duration: 7000,
    },
    {
      title: '3. The Iconic Royal Balcony',
      desc: 'Introduced in 1851 by Prince Albert, the balcony where the Royal Family gathers for Weddings, Jubilees, and RAF Flypasts.',
      pos: new THREE.Vector3(0, 10.5, 26),
      target: new THREE.Vector3(0, 10.0, 5),
      duration: 7000,
    },
    {
      title: '4. The Sovereign’s Flagpole & Standard',
      desc: 'High atop the central pediment: if the 4-quadrant Royal Standard is flying, His Majesty is in residence!',
      pos: new THREE.Vector3(0, 32, 28),
      target: new THREE.Vector3(0, 30, 4.5),
      duration: 7000,
    },
    {
      title: '5. The Quadrangle & State Rooms Wing',
      desc: 'The 19 lavish State Rooms, Throne Room, and Grand Ballroom where State Banquets for 170 guests take place.',
      pos: new THREE.Vector3(70, 24, -10),
      target: new THREE.Vector3(35, 10, -25),
      duration: 7000,
    },
    {
      title: '6. The 39-Acre Private Royal Gardens',
      desc: 'London’s largest private walled sanctuary, featuring an ornamental lake, royal beehives, and summer tea garden parties.',
      pos: new THREE.Vector3(-35, 20, -105),
      target: new THREE.Vector3(0, 2, -60),
      duration: 7000,
    },
  ];

  // --- INITIALIZE 3D SCENE ---
  function init3D() {
    const container = document.getElementById('webgl-container');
    const fallbackBox = document.getElementById('webgl-fallback');

    // 1. WebGL Validation Check
    if (!isWebGLSupported()) {
      if (container) container.style.display = 'none';
      if (fallbackBox) fallbackBox.style.display = 'flex';
      hideLoadingScreen();
      return;
    }

    if (!container) return;

    // 2. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a88cc);
    scene.fog = new THREE.FogExp2(0x4a88cc, 0.0006);

    // 3. Camera positioned for the iconic reference photo view
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 800);
    camera.position.set(0, 4.6, 62);

    // 4. Renderer with Mobile DPR Capping
    renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable MSAA on mobile for 60fps
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    // Cap mobile DPR at 1.0; desktop at 1.5 for crisp performance
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    container.appendChild(renderer.domElement);

    // 5. OrbitControls with Scroll Isolation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 240;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.target.set(0, 8.2, 0);
    // Do not lock scroll on page if wheel is outside viewport
    controls.listenToKeyEvents(window);
    controls.update();

    // 6. Lights
    setupLighting();

    // 7. Stars for Night Mode
    setupStarfield();

    // 8. Build Buckingham Palace with simulated loading progress
    simulateLoadingSequence(() => {
      palaceBuilder = PalaceModel.createPalaceBuilder();
      palaceSceneData = palaceBuilder.buildEntireScene();
      scene.add(palaceSceneData.root);

      createHotspotMarkers(palaceSceneData.hotspots);
      hideLoadingScreen();
      playCinematicIntroFlyIn();

      // Load Imported 3D Model in background
      palaceBuilder.loadImportedModel(
        renderer,
        (model) => {
          console.log('Google Arts & Culture 3D model integrated into scene.');
          const btnImported = document.getElementById('btn-mode-imported');
          if (btnImported) {
            btnImported.innerHTML = '<i class="fa-solid fa-check"></i> Google 3D Model';
            btnImported.classList.add('active');
          }
          const btnProcedural = document.getElementById('btn-mode-procedural');
          if (btnProcedural) {
            btnProcedural.classList.remove('active');
          }
        },
        (err) => {
          console.log('Procedural 1913 facade active as default model.');
        }
      );
    });

    // 9. Resize Handling
    window.addEventListener('resize', onWindowResize);

    // 10. Start Loop
    clock.start();
    animate();
  }

  // --- SIMULATED ASSET LOADING PROGRESS ---
  function simulateLoadingSequence(onComplete) {
    const progressBar = document.getElementById('loader-progress-bar');
    const percentLabel = document.getElementById('loader-percent');
    const stepLabel = document.getElementById('loader-status-step');

    const steps = [
      { p: 20, text: 'Quarrying Portland Limestone...' },
      { p: 45, text: 'Carving Edward Blore’s East Front...' },
      { p: 70, text: 'Mounting the King’s Guard at Sentry Boxes...' },
      { p: 88, text: 'Raising the Sovereign’s Royal Standard...' },
      { p: 100, text: 'Polishing Queen Victoria’s Golden Angel...' },
    ];

    let current = 0;
    function nextStep() {
      if (current >= steps.length) {
        setTimeout(onComplete, 250);
        return;
      }
      const s = steps[current];
      if (progressBar) progressBar.style.width = `${s.p}%`;
      if (percentLabel) percentLabel.textContent = `${s.p}%`;
      if (stepLabel) stepLabel.textContent = s.text;
      current++;
      setTimeout(nextStep, 160);
    }

    nextStep();
  }

  function hideLoadingScreen() {
    const loader = document.getElementById('royal-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 600);
    }
  }

  // --- LIGHTING SETUP ---
  function setupLighting() {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x544738, 0.55);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xfff7e8, 1.85);
    dirLight.position.set(65, 80, 75);
    dirLight.castShadow = !isMobile;
    dirLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
    dirLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 280;
    dirLight.shadow.bias = -0.0004;

    const d = 110;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const uplightPositions = [-40, -20, 0, 20, 40];
    uplightPositions.forEach((ux) => {
      const spot = new THREE.SpotLight(0xffdfa0, 0, 45, Math.PI / 4, 0.45, 1);
      spot.position.set(ux, 0.5, 20);
      spot.target.position.set(ux, 14, 8);
      scene.add(spot);
      scene.add(spot.target);
      uplights.push(spot);
    });
  }

  // --- STARFIELD ---
  function setupStarfield() {
    const starCount = isMobile ? 300 : 600;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600;
      positions[i + 1] = 60 + Math.random() * 250;
      positions[i + 2] = (Math.random() - 0.5) * 600;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0,
    });
    starsMesh = new THREE.Points(starGeo, starMat);
    scene.add(starsMesh);
  }

  // --- LIGHTING / TIME OF DAY MODES ---
  function setLightingMode(mode) {
    state.lighting = mode;
    if (palaceBuilder) palaceBuilder.setLightingMode(mode);

    document.querySelectorAll('[data-lighting]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lighting === mode);
    });

    if (mode === 'day') {
      scene.background.set(0x4a88cc);
      scene.fog.color.set(0x4a88cc);
      scene.fog.density = 0.0006;

      dirLight.color.set(0xfff8ed);
      dirLight.intensity = 2.0;
      dirLight.position.set(65, 80, 75);

      ambientLight.color.set(0xffffff);
      ambientLight.intensity = 0.55;

      hemiLight.color.set(0xc5e2ff);
      hemiLight.groundColor.set(0x524638);
      hemiLight.intensity = 0.55;

      renderer.toneMappingExposure = 1.08;

      uplights.forEach((sp) => (sp.intensity = 0));
      if (starsMesh) starsMesh.material.opacity = 0;
    } else if (mode === 'sunset') {
      scene.background.set(0xd97c55);
      scene.fog.color.set(0xd97c55);
      scene.fog.density = 0.0032;

      dirLight.color.set(0xff8344);
      dirLight.intensity = 2.4;
      dirLight.position.set(110, 24, 60);

      ambientLight.color.set(0xffb799);
      ambientLight.intensity = 0.4;

      hemiLight.color.set(0xffa175);
      hemiLight.groundColor.set(0x4a2e22);
      hemiLight.intensity = 0.45;

      renderer.toneMappingExposure = 1.15;

      uplights.forEach((sp) => (sp.intensity = 0.4));
      if (starsMesh) starsMesh.material.opacity = 0.15;
    } else if (mode === 'night') {
      scene.background.set(0x090f1d);
      scene.fog.color.set(0x090f1d);
      scene.fog.density = 0.0035;

      dirLight.color.set(0x7899cc);
      dirLight.intensity = 0.35;
      dirLight.position.set(-50, 70, -40);

      ambientLight.color.set(0x192742);
      ambientLight.intensity = 0.25;

      hemiLight.color.set(0x1b2d4b);
      hemiLight.groundColor.set(0x0d1421);
      hemiLight.intensity = 0.3;

      renderer.toneMappingExposure = 0.95;

      uplights.forEach((sp) => (sp.intensity = 3.2));
      if (starsMesh) starsMesh.material.opacity = 0.9;
    }
  }

  // --- SOVEREIGN FLAG TOGGLE ---
  function setFlagStatus(type) {
    state.flag = type;
    if (palaceBuilder) palaceBuilder.setFlag(type);

    const isInResidence = type === 'royal';
    const statusBadges = document.querySelectorAll('.sovereign-status-badge');
    const flagNames = document.querySelectorAll('.active-flag-name');
    const flagToggleBtns = document.querySelectorAll('[data-flag-type]');

    statusBadges.forEach((badge) => {
      badge.textContent = isInResidence
        ? 'His Majesty: In Residence'
        : 'His Majesty: Away from Palace';
      badge.className = `sovereign-status-badge ${
        isInResidence ? 'in-residence' : 'away'
      }`;
    });

    flagNames.forEach((el) => {
      el.textContent = isInResidence
        ? 'The Royal Standard'
        : 'The Union Flag (Union Jack)';
    });

    flagToggleBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.flagType === type);
    });
  }

  // --- QUALITY PROFILES (3D Performance Optimization) ---
  function setQualityMode(mode) {
    state.quality = mode;
    document.querySelectorAll('[data-quality]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.quality === mode);
    });

    if (mode === 'high') {
      renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.shadowMap.enabled = true;
    } else if (mode === 'balanced') {
      renderer.setPixelRatio(1.0);
      renderer.shadowMap.enabled = !isMobile;
    } else if (mode === 'saver') {
      renderer.setPixelRatio(0.85);
      renderer.shadowMap.enabled = false;
    }
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
  }

  // --- HOTSPOT MARKERS ---
  function createHotspotMarkers(hotspots) {
    const container = document.getElementById('hotspots-layer');
    if (!container) return;
    container.innerHTML = '';

    hotspots.forEach((spot) => {
      const pin = document.createElement('button');
      pin.className = 'hotspot-pin';
      pin.setAttribute('data-hotspot-id', spot.id);
      pin.setAttribute('aria-label', `Explore ${spot.title}`);

      pin.innerHTML = `
        <span class="hotspot-pulse"></span>
        <span class="hotspot-core"><i class="fa-solid fa-crown"></i></span>
        <div class="hotspot-label">
          <span class="badge">${spot.badge}</span>
          <span class="title">${spot.title}</span>
        </div>
      `;

      pin.addEventListener('click', () => {
        focusOnHotspot(spot);
      });

      container.appendChild(pin);
      spot.element = pin;
    });
  }

  function updateHotspotsScreenPositions() {
    if (!palaceSceneData || !palaceSceneData.hotspots || !camera) return;
    const container = document.getElementById('webgl-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;

    const tempV = new THREE.Vector3();

    palaceSceneData.hotspots.forEach((spot) => {
      if (!spot.element) return;

      tempV.copy(spot.position);
      tempV.project(camera);

      const isBehind = tempV.z > 1;
      const isOffScreen =
        tempV.x < -1.1 || tempV.x > 1.1 || tempV.y < -1.1 || tempV.y > 1.1;

      if (isBehind || isOffScreen || state.isTourActive) {
        spot.element.style.display = 'none';
      } else {
        spot.element.style.display = 'flex';
        const x = tempV.x * widthHalf + widthHalf;
        const y = -(tempV.y * heightHalf) + heightHalf;
        spot.element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
      }
    });
  }

  // --- REAL-TIME 3D ROYAL COMPASS ROSE ---
  function updateCompassRose() {
    const compassNeedle = document.getElementById('compass-needle');
    const compassBearing = document.getElementById('compass-bearing');
    if (!compassNeedle || !camera || !controls) return;

    // Camera angle around target in XZ plane
    const dx = camera.position.x - controls.target.x;
    const dz = camera.position.z - controls.target.z;
    const angleRad = Math.atan2(dx, dz);
    const angleDeg = angleRad * (180 / Math.PI);

    // Rotate needle to mirror orientation
    compassNeedle.style.transform = `rotate(${-angleDeg}deg)`;

    // Determine readable cardinal direction
    if (compassBearing) {
      let deg = (angleDeg + 360) % 360;
      let dir = 'Facing Buckingham Palace';
      if (deg >= 337.5 || deg < 22.5) dir = 'Facing North (Green Park)';
      else if (deg >= 22.5 && deg < 67.5) dir = 'Facing North-East';
      else if (deg >= 67.5 && deg < 112.5) dir = 'Facing East down The Mall';
      else if (deg >= 112.5 && deg < 157.5) dir = 'Facing South-East';
      else if (deg >= 157.5 && deg < 202.5) dir = 'Facing South (Victoria)';
      else if (deg >= 202.5 && deg < 247.5) dir = 'Facing South-West';
      else if (deg >= 247.5 && deg < 292.5) dir = 'Facing West (Palace Gardens)';
      else if (deg >= 292.5 && deg < 337.5) dir = 'Facing North-West';

      compassBearing.textContent = dir;
    }
  }

  // --- CAMERA TWEEN & VIEW PRESETS ---
  function animateCameraTo(targetPos, lookAtPos, duration = 1600, onDone = null) {
    if (typeof TWEEN === 'undefined') {
      camera.position.copy(targetPos);
      controls.target.copy(lookAtPos);
      controls.update();
      if (onDone) onDone();
      return;
    }

    controls.enabled = false;

    new TWEEN.Tween(camera.position)
      .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    new TWEEN.Tween(controls.target)
      .to({ x: lookAtPos.x, y: lookAtPos.y, z: lookAtPos.z }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        controls.enabled = true;
        if (onDone) onDone();
      })
      .start();
  }

  function focusOnHotspot(spot) {
    state.activeHotspot = spot;
    animateCameraTo(spot.cameraTarget, spot.cameraLookAt, 1700);
    openTouristDrawer(spot);
    SoundEngine.playFanfare();
  }

  function playCinematicIntroFlyIn() {
    camera.position.set(12, 18, 86);
    controls.target.set(0, 8.5, 18);
    controls.update();
    setTimeout(() => {
      animateCameraTo(
        new THREE.Vector3(0, 4.6, 62),
        new THREE.Vector3(0, 8.2, 0),
        2500
      );
    }, 350);
  }

  // --- VIEW MODE SWITCHER (Google 3D Model vs Forecourt View) ---
  function setViewMode(mode) {
    activeViewMode = mode;
    const googleContainer = document.getElementById('google-model-viewer-container');
    const webglContainer = document.getElementById('webgl-container');
    const hotspotsLayer = document.getElementById('hotspots-layer');
    const btnGoogle = document.getElementById('btn-mode-google');
    const btnForecourt = document.getElementById('btn-mode-forecourt');

    if (mode === 'google') {
      if (googleContainer) googleContainer.style.display = 'block';
      if (webglContainer) webglContainer.style.display = 'none';
      if (hotspotsLayer) hotspotsLayer.style.display = 'none';
      if (btnGoogle) btnGoogle.classList.add('active');
      if (btnForecourt) btnForecourt.classList.remove('active');
    } else {
      if (googleContainer) googleContainer.style.display = 'none';
      if (webglContainer) webglContainer.style.display = 'block';
      if (hotspotsLayer) hotspotsLayer.style.display = 'block';
      if (btnForecourt) btnForecourt.classList.add('active');
      if (btnGoogle) btnGoogle.classList.remove('active');
      setTimeout(onWindowResize, 60);
    }
  }

  function setCameraPreset(presetKey, isInternal = false) {
    if (presetKey === 'intro') {
      if (activeViewMode === 'google') {
        const mv = document.getElementById('main-google-model-viewer');
        if (mv) {
          mv.cameraOrbit = '0deg 75deg auto';
          mv.cameraTarget = '0m 0.08m 0m';
        }
        return;
      }
      playCinematicIntroFlyIn();
      return;
    }

    if (state.isTourActive && !isInternal) stopGuidedTour();

    // 1. Google 3D Model Mode
    if (activeViewMode === 'google') {
      const mv = document.getElementById('main-google-model-viewer');
      if (mv) {
        const googleViews = {
          facade: { orbit: '0deg 80deg auto', target: '0m 0.08m 0m' },
          balcony: { orbit: '0deg 75deg 0.6m', target: '0.01m 0.09m 0.16m' },
          quadrangle: { orbit: '45deg 55deg 0.8m', target: '0.01m 0.08m -0.06m' },
          gardens: { orbit: '180deg 75deg auto', target: '0.01m 0.08m -0.2m' },
          birds_eye: { orbit: '30deg 35deg 1.6m', target: '0m 0.05m -0.1m' },
          guard: { orbit: '0deg 85deg 0.9m', target: '0m 0.04m 0.22m' },
          staircase: { orbit: '-40deg 68deg 0.55m', target: '-0.22m 0.08m 0.04m' },
          ballroom: { orbit: '-110deg 68deg 0.65m', target: '-0.36m 0.09m -0.16m' },
          throne_room: { orbit: '45deg 68deg 0.55m', target: '0.18m 0.08m -0.04m' },
          flag: { orbit: '0deg 70deg 0.5m', target: '0.01m 0.16m 0.05m' },
        };
        const gv = googleViews[presetKey] || googleViews.facade;
        mv.cameraOrbit = gv.orbit;
        mv.cameraTarget = gv.target;
      }
      document.querySelectorAll('[data-camera-preset]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.cameraPreset === presetKey);
      });
      return;
    }

    // 2. Forecourt Three.js Mode
    const presets = {
      facade: {
        pos: new THREE.Vector3(0, 4.6, 62),
        target: new THREE.Vector3(0, 8.2, 0),
      },
      balcony: {
        pos: new THREE.Vector3(0, 9.8, 22),
        target: new THREE.Vector3(0, 8.5, 9),
      },
      quadrangle: {
        pos: new THREE.Vector3(30, 20, -10),
        target: new THREE.Vector3(0, 8, -6),
      },
      gardens: {
        pos: new THREE.Vector3(0, 18, -90),
        target: new THREE.Vector3(0, 8, -25),
      },
      guard: {
        pos: new THREE.Vector3(-12, 4.2, 32),
        target: new THREE.Vector3(-6, 2.8, 12),
      },
      memorial: {
        pos: new THREE.Vector3(0, 16, 114),
        target: new THREE.Vector3(0, 12, 82),
      },
      birds_eye: {
        pos: new THREE.Vector3(75, 65, 100),
        target: new THREE.Vector3(0, 8, -5),
      },
      pedestrian: {
        pos: new THREE.Vector3(-8, 2.2, 54),
        target: new THREE.Vector3(0, 4.5, 20),
      },
    };

    const preset = presets[presetKey];
    if (preset) {
      animateCameraTo(preset.pos, preset.target, 1600);
      document.querySelectorAll('[data-camera-preset]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.cameraPreset === presetKey);
      });
    }
  }

  // --- CINEMATIC GUIDED ROYAL TOUR ---
  function startGuidedTour() {
    state.isTourActive = true;
    state.currentTourStep = 0;
    closeTouristDrawer();

    const tourBar = document.getElementById('hud-guided-tour');
    if (tourBar) tourBar.classList.add('active');

    SoundEngine.playFanfare();
    executeTourStep(0);
  }

  function executeTourStep(index) {
    if (!state.isTourActive) return;
    if (index >= TOUR_WAYPOINTS.length) {
      stopGuidedTour();
      return;
    }

    state.currentTourStep = index;
    const step = TOUR_WAYPOINTS[index];

    // Update HUD Tour Subtitles
    const titleEl = document.getElementById('tour-step-title');
    const descEl = document.getElementById('tour-step-desc');
    const counterEl = document.getElementById('tour-step-counter');

    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.desc;
    if (counterEl)
      counterEl.textContent = `Stage ${index + 1} of ${TOUR_WAYPOINTS.length}`;

    // Camera Flight
    if (activeViewMode === 'google') {
      const googleTourViews = ['facade', 'balcony', 'quadrangle', 'gardens', 'throne_room', 'ballroom'];
      const gvKey = googleTourViews[index] || 'facade';
      setCameraPreset(gvKey, true);

      clearTimeout(state.tourTimer);
      state.tourTimer = setTimeout(() => {
        if (state.isTourActive) {
          executeTourStep(index + 1);
        }
      }, step.duration);
    } else {
      animateCameraTo(step.pos, step.target, 2400, () => {
        clearTimeout(state.tourTimer);
        state.tourTimer = setTimeout(() => {
          if (state.isTourActive) {
            executeTourStep(index + 1);
          }
        }, step.duration);
      });
    }
  }

  function stopGuidedTour() {
    state.isTourActive = false;
    clearTimeout(state.tourTimer);
    const tourBar = document.getElementById('hud-guided-tour');
    if (tourBar) tourBar.classList.remove('active');
  }

  // --- TOURIST DRAWER MODAL ---
  function openTouristDrawer(spot) {
    state.isDrawerOpen = true;
    const drawer = document.getElementById('tourist-info-drawer');
    if (!drawer) return;

    document.getElementById('drawer-category').textContent = spot.category;
    document.getElementById('drawer-badge').textContent = spot.badge;
    document.getElementById('drawer-title').textContent = spot.title;
    document.getElementById('drawer-content').innerHTML = spot.fullContent;
    document.getElementById('drawer-tip-text').textContent = spot.tip;

    drawer.classList.add('open');
  }

  function closeTouristDrawer() {
    state.isDrawerOpen = false;
    const drawer = document.getElementById('tourist-info-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  // --- RESIZE ---
  function onWindowResize() {
    const container = document.getElementById('webgl-container');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // --- RENDER ANIMATION LOOP ---
  function animate(time = 0) {
    rafId = requestAnimationFrame(animate);

    if (typeof TWEEN !== 'undefined') {
      TWEEN.update();
    }

    if (controls) {
      controls.autoRotate = state.autoRotate && !state.isTourActive;
      controls.autoRotateSpeed = 0.45;
      controls.update();
    }

    if (palaceSceneData && palaceSceneData.builder) {
      palaceSceneData.builder.update(time);
    }

    updateHotspotsScreenPositions();
    updateCompassRose();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // --- UI EVENT BINDINGS ---
  function setupUIBindings() {
    // 1. Lighting buttons
    document.querySelectorAll('[data-lighting]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setLightingMode(e.currentTarget.dataset.lighting);
      });
    });

    // 2. Sovereign Flag switchers
    document.querySelectorAll('[data-flag-type]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setFlagStatus(e.currentTarget.dataset.flagType);
      });
    });

    // 3. Camera presets
    document.querySelectorAll('[data-camera-preset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setCameraPreset(e.currentTarget.dataset.cameraPreset);
      });
    });

    // 4. Quality selector
    document.querySelectorAll('[data-quality]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setQualityMode(e.currentTarget.dataset.quality);
      });
    });

    // 5. Guided Tour Triggers
    const btnStartTour = document.getElementById('btn-start-tour');
    if (btnStartTour) {
      btnStartTour.addEventListener('click', startGuidedTour);
    }

    const btnCloseTour = document.getElementById('btn-close-tour');
    if (btnCloseTour) {
      btnCloseTour.addEventListener('click', stopGuidedTour);
    }

    const btnNextTour = document.getElementById('btn-next-tour');
    if (btnNextTour) {
      btnNextTour.addEventListener('click', () => {
        executeTourStep(state.currentTourStep + 1);
      });
    }

    const btnPrevTour = document.getElementById('btn-prev-tour');
    if (btnPrevTour) {
      btnPrevTour.addEventListener('click', () => {
        executeTourStep(Math.max(0, state.currentTourStep - 1));
      });
    }

    // 6. Auto Rotate
    const autoRotateBtn = document.getElementById('btn-auto-rotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        state.autoRotate = !state.autoRotate;
        autoRotateBtn.classList.toggle('active', state.autoRotate);
        const mv = document.getElementById('main-google-model-viewer');
        if (mv) {
          mv.autoRotate = state.autoRotate;
        }
      });
    }

    // 7. Audio Ambiance Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.isAudioPlaying = !state.isAudioPlaying;
        soundBtn.classList.toggle('active', state.isAudioPlaying);
        if (state.isAudioPlaying) {
          SoundEngine.playFanfare();
          setTimeout(() => {
            if (state.isAudioPlaying) {
              SoundEngine.startLondonAmbiance();
              SoundEngine.startMarchingDrums();
            }
          }, 1800);
          soundBtn.querySelector('.sound-label').textContent = 'Audio: On';
        } else {
          SoundEngine.stopLondonAmbiance();
          SoundEngine.stopMarchingDrums();
          soundBtn.querySelector('.sound-label').textContent = 'Audio: Off';
        }
      });
    }

    // 8. Big Ben Chime Button
    const bigBenBtn = document.getElementById('btn-big-ben-chime');
    if (bigBenBtn) {
      bigBenBtn.addEventListener('click', () => {
        SoundEngine.playBigBenChime();
      });
    }

    // 9. Fanfare Button
    const fanfareBtn = document.getElementById('btn-play-fanfare');
    if (fanfareBtn) {
      fanfareBtn.addEventListener('click', () => {
        SoundEngine.playFanfare();
      });
    }

    // 10. Close Drawer
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeTouristDrawer);
    }

    // 11. Navigation Tabs
    document.querySelectorAll('[data-nav-tab]').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.navTab;
        document.querySelectorAll('[data-nav-tab]').forEach((t) => {
          t.classList.toggle('active', t.dataset.navTab === targetTab);
        });
        document.querySelectorAll('.app-section').forEach((sec) => {
          sec.classList.toggle('active', sec.id === `section-${targetTab}`);
        });

        if (targetTab === 'explorer') {
          setTimeout(onWindowResize, 100);
        }
      });
    });

    // 12. Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const activeContainer =
          activeViewMode === 'google'
            ? document.getElementById('google-model-viewer-container')
            : document.getElementById('webgl-container');
        if (!document.fullscreenElement) {
          activeContainer?.requestFullscreen?.().catch(console.warn);
        } else {
          document.exitFullscreen?.().catch(console.warn);
        }
      });
    }

    // 13. 3D Model Mode Switcher (Google Arts & Culture Model vs Forecourt View)
    const btnModeGoogle = document.getElementById('btn-mode-google');
    const btnModeForecourt = document.getElementById('btn-mode-forecourt');

    if (btnModeGoogle) {
      btnModeGoogle.addEventListener('click', () => {
        setViewMode('google');
      });
    }

    if (btnModeForecourt) {
      btnModeForecourt.addEventListener('click', () => {
        setViewMode('forecourt');
      });
    }

    // 14. Hotspots on Google Model-Viewer
    document.querySelectorAll('.view-hotspot').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const hid = e.currentTarget.dataset.hotspotId;
        setCameraPreset(hid);
        const hotspotData = palaceSceneData?.hotspots?.find((h) => h.id === hid);
        if (hotspotData) {
          openTouristDrawer(hotspotData);
        }
      });
    });

    // 15. Lightbox Modal for State Room Photographs
    const lightboxModal = document.getElementById('royal-lightbox');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');

    window.openLightbox = function (src, title, desc) {
      const img = document.getElementById('lightbox-img');
      const titleElem = document.getElementById('lightbox-title');
      const descElem = document.getElementById('lightbox-desc');
      if (img) img.src = src;
      if (titleElem) titleElem.textContent = title || 'Buckingham Palace';
      if (descElem) descElem.textContent = desc || '';
      if (lightboxModal) lightboxModal.classList.add('active');
    };

    if (btnCloseLightbox && lightboxModal) {
      btnCloseLightbox.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
      });
    }
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.remove('active');
        }
      });
    }

    // 16. State Rooms 3D Camera Fly-To Trigger
    window.flyToPalaceWing = function (roomKey) {
      const explorerTab = document.querySelector('[data-nav-tab="explorer"]');
      if (explorerTab) explorerTab.click();

      setViewMode('google');
      setCameraPreset(roomKey);

      const hotspotData = palaceSceneData?.hotspots?.find((h) => h.id === roomKey);
      if (hotspotData) {
        openTouristDrawer(hotspotData);
      }
    };

    // 17. Quiz & Search
    setupQuizEngine();
    setupTouristSearch();
  }

  // --- 55-QUESTION ROYAL INTERACTIVE QUIZ ENGINE ---
  function setupQuizEngine() {
    const questionsContainer = document.getElementById('quiz-questions-container');
    const submitBtn = document.getElementById('btn-submit-quiz');
    const resetBtn = document.getElementById('btn-reset-quiz');
    const certificateCard = document.getElementById('quiz-certificate-card');
    const showingCountLabel = document.getElementById('quiz-showing-count');
    const answeredCountLabel = document.getElementById('quiz-answered-count');
    const catPills = document.querySelectorAll('.quiz-cat-pill');

    if (!questionsContainer) return;

    // COMPLETE 55 QUESTIONS DATASET
    const QUIZ_QUESTIONS = [
      // CATEGORY 1: EARLY HISTORY & ROYALTY (Questions 1 - 12)
      {
        id: 1,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'What was the original house on this site called when built in 1703 before becoming a royal palace?',
        options: [
          { k: 'a', t: 'Westminster Manor' },
          { k: 'b', t: 'Buckingham House' },
          { k: 'c', t: 'Kensington Lodge' },
          { k: 'd', t: 'St James Villa' },
        ],
        a: 'b',
        exp: 'Buckingham House was built in 1703 as a three-storey brick townhouse for John Sheffield, 1st Duke of Buckingham and Normanby.',
      },
      {
        id: 2,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'In 1761, which British monarch acquired Buckingham House as a private retreat for his wife?',
        options: [
          { k: 'a', t: 'King Henry VIII' },
          { k: 'b', t: 'King Charles II' },
          { k: 'c', t: 'King George III' },
          { k: 'd', t: 'King William IV' },
        ],
        a: 'c',
        exp: 'King George III bought Buckingham House in 1761 for £28,000 for Queen Charlotte, creating a tranquil domestic retreat near St James’s Palace.',
      },
      {
        id: 3,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'What informal name did Buckingham House acquire after George III bought it for Queen Charlotte?',
        options: [
          { k: 'a', t: 'The Queen’s House' },
          { k: 'b', t: 'The Mulberry Lodge' },
          { k: 'c', t: 'The Regent Pavilion' },
          { k: 'd', t: 'The Sovereign Keep' },
        ],
        a: 'a',
        exp: 'Because 14 of George III and Queen Charlotte’s 15 children were born there, the residence was popularly known as "The Queen\'s House".',
      },
      {
        id: 4,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Which architect did King George IV commission in 1826 to transform the residence into a monumental palace?',
        options: [
          { k: 'a', t: 'Sir Christopher Wren' },
          { k: 'b', t: 'Inigo Jones' },
          { k: 'c', t: 'John Nash' },
          { k: 'd', t: 'Sir John Soane' },
        ],
        a: 'c',
        exp: 'John Nash, Official Architect to the Office of Woods and Forests, transformed the house into an extravagant neoclassical palace surrounding an open courtyard.',
      },
      {
        id: 5,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Why was architect John Nash abruptly dismissed from the palace project in 1830?',
        options: [
          { k: 'a', t: 'He used inferior crumbling building stone' },
          { k: 'b', t: 'He vastly exceeded his parliamentary budget, spending over £400,000' },
          { k: 'c', t: 'He refused to design a Throne Room' },
          { k: 'd', t: 'He retired to the French Riviera' },
        ],
        a: 'b',
        exp: 'Following King George IV\'s death in 1830, a parliamentary committee sacked Nash for extravagant overspending, having spent nearly double the approved estimates.',
      },
      {
        id: 6,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Which architect was appointed in 1830 to replace John Nash and complete the palace interiors for William IV?',
        options: [
          { k: 'a', t: 'Edward Blore' },
          { k: 'b', t: 'James Wyatt' },
          { k: 'c', t: 'Robert Adam' },
          { k: 'd', t: 'Sir Charles Barry' },
        ],
        a: 'a',
        exp: 'Edward Blore was appointed by Prime Minister the Duke of Wellington to complete the palace in a more restrained, cost-effective manner.',
      },
      {
        id: 7,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Who was the first reigning British monarch to establish Buckingham Palace as their official permanent London residence?',
        options: [
          { k: 'a', t: 'Queen Victoria (1837)' },
          { k: 'b', t: 'King George IV (1820)' },
          { k: 'c', t: 'Queen Anne (1702)' },
          { k: 'd', t: 'King Edward VII (1901)' },
        ],
        a: 'a',
        exp: 'In July 1837, just three weeks after her accession to the throne, 18-year-old Queen Victoria moved from Kensington Palace into Buckingham Palace.',
      },
      {
        id: 8,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'In what year was the Marble Arch removed from the palace forecourt and relocated to Hyde Park Corner?',
        options: [
          { k: 'a', t: '1825' },
          { k: 'b', t: '1851' },
          { k: 'c', t: '1901' },
          { k: 'd', t: '1914' },
        ],
        a: 'b',
        exp: 'Marble Arch, originally Nash’s ceremonial state gateway to the courtyard, was moved in 1851 to make room for Edward Blore’s new East Wing closing the quadrangle.',
      },
      {
        id: 9,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Why was the East Wing constructed in 1847 under Queen Victoria and Prince Albert?',
        options: [
          { k: 'a', t: 'To house an indoor equestrian riding school' },
          { k: 'b', t: 'To provide royal nurseries and space for Victoria’s growing family' },
          { k: 'c', t: 'To store the national naval archives' },
          { k: 'd', t: 'To serve as a public fine arts museum' },
        ],
        a: 'b',
        exp: 'Queen Victoria complained to the Prime Minister that the palace had no nurseries for her nine children and was too small for entertaining, prompting the construction of the East Wing.',
      },
      {
        id: 10,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Which architect redesigned and refaced the East Front in 1913 to create the neoclassical facade seen today?',
        options: [
          { k: 'a', t: 'Sir Aston Webb' },
          { k: 'b', t: 'Sir Edwin Lutyens' },
          { k: 'c', t: 'Sir Giles Gilbert Scott' },
          { k: 'd', t: 'Sir Norman Foster' },
        ],
        a: 'a',
        exp: 'Sir Aston Webb refaced the crumbling, soot-stained Caen stone with durable Portland stone in just 13 weeks in 1913 as part of the Queen Victoria Memorial project.',
      },
      {
        id: 11,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'Which British monarch was born, christened, and died at Buckingham Palace?',
        options: [
          { k: 'a', t: 'King George V' },
          { k: 'b', t: 'King Edward VII' },
          { k: 'c', t: 'King George VI' },
          { k: 'd', t: 'King William IV' },
        ],
        a: 'b',
        exp: 'King Edward VII was born at Buckingham Palace in 1841, christened in its chapel, and passed away there in May 1910.',
      },
      {
        id: 12,
        category: 'history',
        catLabel: 'Early History & Royalty',
        q: 'How many British monarchs have made Buckingham Palace their official London residence since 1837?',
        options: [
          { k: 'a', t: '4 monarchs' },
          { k: 'b', t: '5 monarchs' },
          { k: 'c', t: '7 monarchs' },
          { k: 'd', t: '9 monarchs' },
        ],
        a: 'c',
        exp: 'Seven monarchs: Queen Victoria, Edward VII, George V, Edward VIII, George VI, Elizabeth II, and Charles III.',
      },

      // CATEGORY 2: GEOGRAPHY & GROUNDS (Questions 13 - 24)
      {
        id: 13,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'In which London administrative city/borough is Buckingham Palace situated?',
        options: [
          { k: 'a', t: 'City of London' },
          { k: 'b', t: 'City of Westminster' },
          { k: 'c', t: 'Royal Borough of Kensington & Chelsea' },
          { k: 'd', t: 'Borough of Camden' },
        ],
        a: 'b',
        exp: 'Buckingham Palace is situated in the City of Westminster, the royal and administrative heart of London.',
      },
      {
        id: 14,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'What is the official Royal Postal Code for Buckingham Palace?',
        options: [
          { k: 'a', t: 'EC1A 1BB' },
          { k: 'b', t: 'SW1A 1AA' },
          { k: 'c', t: 'W1K 7AA' },
          { k: 'd', t: 'NW1 4NP' },
        ],
        a: 'b',
        exp: 'The postcode SW1A 1AA is reserved exclusively for Buckingham Palace by Royal Mail.',
      },
      {
        id: 15,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'How large is the private walled Palace Garden at the rear of Buckingham Palace?',
        options: [
          { k: 'a', t: '10 acres' },
          { k: 'b', t: '22 acres' },
          { k: 'c', t: '39 acres (16 hectares)' },
          { k: 'd', t: '75 acres' },
        ],
        a: 'c',
        exp: 'Covering 39 acres (16 hectares), the garden is the largest private walled sanctuary in London, featuring over 1,400 trees.',
      },
      {
        id: 16,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'Which subterranean lost river flows culverted beneath the South Wing of Buckingham Palace?',
        options: [
          { k: 'a', t: 'River Fleet' },
          { k: 'b', t: 'River Tyburn' },
          { k: 'c', t: 'River Walbrook' },
          { k: 'd', t: 'River Effra' },
        ],
        a: 'b',
        exp: 'The River Tyburn rises in Hampstead, flows enclosed beneath Buckingham Palace, and empties into the River Thames near Vauxhall Bridge.',
      },
      {
        id: 17,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'What is the surface area of the ornamental lake in the 39-acre palace garden?',
        options: [
          { k: 'a', t: '1 acre' },
          { k: 'b', t: '3.5 acres' },
          { k: 'c', t: '8 acres' },
          { k: 'd', t: '14 acres' },
        ],
        a: 'b',
        exp: 'Created in the 1820s by damming the Tyburn, the 3.5-acre lake features a secluded natural island that serves as a wildlife haven.',
      },
      {
        id: 18,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'What type of plantation did King James I establish on this site in 1609 in an attempt to produce English silk?',
        options: [
          { k: 'a', t: 'A Mulberry Garden of 4 acres' },
          { k: 'b', t: 'A Royal Olive Grove' },
          { k: 'c', t: 'A French Champagne Vineyard' },
          { k: 'd', t: 'An Egyptian Cotton Meadow' },
        ],
        a: 'a',
        exp: 'King James I planted 4 acres of mulberry trees to cultivate silkworms, but mistakenly planted Black Mulberry trees instead of White Mulberries, which silkworms feed upon!',
      },
      {
        id: 19,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'Which famous royal park borders Buckingham Palace directly to the east along The Mall?',
        options: [
          { k: 'a', t: 'Regent’s Park' },
          { k: 'b', t: 'Hyde Park' },
          { k: 'c', t: 'St James’s Park' },
          { k: 'd', t: 'Richmond Park' },
        ],
        a: 'c',
        exp: 'St James’s Park, London’s oldest Royal Park (created by Henry VIII), lies directly east facing the palace gates.',
      },
      {
        id: 20,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'Which Royal Park borders Buckingham Palace immediately to the north along Constitution Hill?',
        options: [
          { k: 'a', t: 'Green Park' },
          { k: 'b', t: 'Kensington Gardens' },
          { k: 'c', t: 'Greenwich Park' },
          { k: 'd', t: 'Battersea Park' },
        ],
        a: 'a',
        exp: 'Green Park covers 40 acres immediately north of the palace, featuring open meadows without formal flowerbeds.',
      },
      {
        id: 21,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'What famous ceremonial avenue connects Buckingham Palace with Trafalgar Square?',
        options: [
          { k: 'a', t: 'Piccadilly' },
          { k: 'b', t: 'The Mall' },
          { k: 'c', t: 'Whitehall' },
          { k: 'd', t: 'The Strand' },
        ],
        a: 'b',
        exp: 'The Mall is surfaced in ceremonial red tarmac giving the appearance of a giant red carpet leading directly to Buckingham Palace.',
      },
      {
        id: 22,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'What monument stands prominently in the center of the roundabout facing the palace front gates?',
        options: [
          { k: 'a', t: 'Nelson’s Column' },
          { k: 'b', t: 'The Queen Victoria Memorial' },
          { k: 'c', t: 'The Cenotaph' },
          { k: 'd', t: 'The Albert Memorial' },
        ],
        a: 'b',
        exp: 'Designed by Sir Thomas Brock in 1911, the Queen Victoria Memorial features a 2,300-tonne Carrara marble monument crowned by a gilded bronze Winged Victory.',
      },
      {
        id: 23,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'How many beehives are maintained in the palace gardens producing Buckingham Palace honey?',
        options: [
          { k: 'a', t: '1 hive' },
          { k: 'b', t: '4 hives' },
          { k: 'c', t: '12 hives' },
          { k: 'd', t: '25 hives' },
        ],
        a: 'b',
        exp: 'Four Italian honeybee hives on the lake island produce over 200 jars of royal wildflower honey each year.',
      },
      {
        id: 24,
        category: 'geography',
        catLabel: 'Geography & Grounds',
        q: 'Which exotic birds have lived in the St James’s Park lake facing Buckingham Palace since 1664?',
        options: [
          { k: 'a', t: 'Flamingos' },
          { k: 'b', t: 'Pelicans' },
          { k: 'c', t: 'Emus' },
          { k: 'd', t: 'Peacocks' },
        ],
        a: 'b',
        exp: 'Great White Pelicans were first presented to King Charles II by the Russian Ambassador in 1664 and still thrive in the park today.',
      },

      // CATEGORY 3: STATE ROOMS, ARCHITECTURE & ART (Questions 25 - 36)
      {
        id: 25,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'How many total rooms are inside Buckingham Palace?',
        options: [
          { k: 'a', t: '365 rooms' },
          { k: 'b', t: '520 rooms' },
          { k: 'c', t: '775 rooms' },
          { k: 'd', t: '1,100 rooms' },
        ],
        a: 'c',
        exp: 'The palace contains 775 rooms: 19 State Rooms, 52 royal and guest bedrooms, 188 staff bedrooms, 92 offices, and 78 bathrooms.',
      },
      {
        id: 26,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'How many official State Rooms make up the public ceremonial suite in the West Wing?',
        options: [
          { k: 'a', t: '7 rooms' },
          { k: 'b', t: '12 rooms' },
          { k: 'c', t: '19 rooms' },
          { k: 'd', t: '28 rooms' },
        ],
        a: 'c',
        exp: 'The 19 State Rooms form the ceremonial working core of the palace where official receptions, investitures, and summer tours take place.',
      },
      {
        id: 27,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'What is the largest room inside Buckingham Palace?',
        options: [
          { k: 'a', t: 'The Throne Room' },
          { k: 'b', t: 'The Grand Ballroom' },
          { k: 'c', t: 'The Picture Gallery' },
          { k: 'd', t: 'The State Dining Room' },
        ],
        a: 'b',
        exp: 'The Grand Ballroom measures 36.6m long, 18m wide, and 13.5m high, accommodating up to 170 banquet diners or 1,000 investiture attendees.',
      },
      {
        id: 28,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'In which year was the Grand Ballroom opened, and to celebrate what victory?',
        options: [
          { k: 'a', t: '1815 (Battle of Waterloo)' },
          { k: 'b', t: '1856 (Crimean War victory)' },
          { k: 'c', t: '1897 (Diamond Jubilee)' },
          { k: 'd', t: '1918 (WWI Armistice)' },
        ],
        a: 'b',
        exp: 'Queen Victoria officially inaugurated the Ballroom on 8 May 1856 to celebrate the conclusion of the Crimean War.',
      },
      {
        id: 29,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'In which State Room is the famous secret door hidden behind a mirror and console table?',
        options: [
          { k: 'a', t: 'The Throne Room' },
          { k: 'b', t: 'The White Drawing Room' },
          { k: 'c', t: 'The Bow Room' },
          { k: 'd', t: 'The Blue Drawing Room' },
        ],
        a: 'b',
        exp: 'The White Drawing Room features a concealed jib door hidden behind a mirror and console table, providing direct access to the Sovereign’s private apartments.',
      },
      {
        id: 30,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'Who designed the Grand Staircase with its gilded bronze acanthus balustrades?',
        options: [
          { k: 'a', t: 'John Nash' },
          { k: 'b', t: 'Sir Aston Webb' },
          { k: 'c', t: 'Edward Blore' },
          { k: 'd', t: 'Sir John Vanbrugh' },
        ],
        a: 'a',
        exp: 'John Nash designed the Grand Staircase between 1825 and 1830, using cast ormolu bronze sculpted by Joseph Browne for £3,900.',
      },
      {
        id: 31,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'What historic English conflict is depicted in the friezes sculpted by William Pitts in the Throne Room?',
        options: [
          { k: 'a', t: 'The Norman Conquest' },
          { k: 'b', t: 'The Wars of the Roses' },
          { k: 'c', t: 'The English Civil War' },
          { k: 'd', t: 'The Hundred Years’ War' },
        ],
        a: 'b',
        exp: 'The plaster relief friezes above the walls depict the 15th-century Wars of the Roses and the union of the Houses of Lancaster and York.',
      },
      {
        id: 32,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'What luxurious material lines the walls of the Throne Room?',
        options: [
          { k: 'a', t: 'Royal crimson silk damask' },
          { k: 'b', t: 'White French Carrara marble' },
          { k: 'c', t: 'Carved dark English oak' },
          { k: 'd', t: 'Flemish wool tapestry' },
        ],
        a: 'a',
        exp: 'The walls are covered in sumptuous crimson silk damask, creating an opulent royal backdrop for coronations, addresses, and wedding photos.',
      },
      {
        id: 33,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'How long is the world-renowned Picture Gallery inside Buckingham Palace?',
        options: [
          { k: 'a', t: '25 metres' },
          { k: 'b', t: '35 metres' },
          { k: 'c', t: '47 metres (155 feet)' },
          { k: 'd', t: '70 metres' },
        ],
        a: 'c',
        exp: 'The 47-metre long Picture Gallery was designed by John Nash with continuous glazed roof lanterns to illuminate royal Old Master paintings.',
      },
      {
        id: 34,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'Which Dutch Master’s masterpiece "The Music Lesson" is part of the Royal Collection in the palace?',
        options: [
          { k: 'a', t: 'Johannes Vermeer' },
          { k: 'b', t: 'Vincent van Gogh' },
          { k: 'c', t: 'Hieronymus Bosch' },
          { k: 'd', t: 'Frans Hals' },
        ],
        a: 'a',
        exp: 'Vermeer’s priceless "The Music Lesson" (Lady at the Virginals with a Gentleman) was acquired by King George III in 1762.',
      },
      {
        id: 35,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'What distinctive architectural feature lines the perimeter of the Music Room?',
        options: [
          { k: 'a', t: '16 vibrant blue scagliola imitation marble columns' },
          { k: 'b', t: 'Carved mahogany totem poles' },
          { k: 'c', t: 'Cast iron spiral staircases' },
          { k: 'd', t: 'Gothic ribbed stone vaults' },
        ],
        a: 'a',
        exp: 'The Music Room is famous for its 16 striking blue scagliola columns, where King Charles III, Princess Anne, and Prince William were all christened.',
      },
      {
        id: 36,
        category: 'architecture',
        catLabel: 'State Rooms & Art',
        q: 'What stone was chosen by Sir Aston Webb in 1913 to reface the East Front?',
        options: [
          { k: 'a', t: 'Portland limestone from Dorset' },
          { k: 'b', t: 'Bath stone from Somerset' },
          { k: 'c', t: 'Aberdeen pink granite' },
          { k: 'd', t: 'Carrara white marble' },
        ],
        a: 'a',
        exp: 'Portland limestone was chosen for its exceptional weather resistance against London\'s coal-smoke acid fog.',
      },

      // CATEGORY 4: CEREMONIES & GUARD (Questions 37 - 46)
      {
        id: 37,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'What does it indicate when the Royal Standard flag is flying from the palace roof?',
        options: [
          { k: 'a', t: 'The palace is open to public tourists' },
          { k: 'b', t: 'The King is currently inside the palace' },
          { k: 'c', t: 'A state banquet is taking place that evening' },
          { k: 'd', t: 'Parliament is in session' },
        ],
        a: 'b',
        exp: 'By royal protocol, the four-quadrant Royal Standard is only flown where the Sovereign is physically present.',
      },
      {
        id: 38,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'Which flag is flown over Buckingham Palace when the Sovereign is away or traveling?',
        options: [
          { k: 'a', t: 'The Union Jack' },
          { k: 'b', t: 'The Cross of St George' },
          { k: 'c', t: 'The Commonwealth Flag' },
          { k: 'd', t: 'No flag is flown' },
        ],
        a: 'a',
        exp: 'Since 1997, the Union Jack flies over the palace whenever the Sovereign is not in residence (and at half-mast during periods of national mourning).',
      },
      {
        id: 39,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'At what time does the Changing of the Guard ceremony start on the palace forecourt?',
        options: [
          { k: 'a', t: '9:00 AM' },
          { k: 'b', t: '10:30 AM' },
          { k: 'c', t: '11:00 AM' },
          { k: 'd', t: '1:00 PM' },
        ],
        a: 'c',
        exp: 'The forecourt ceremony begins promptly at 11:00 AM on scheduled days (Mondays, Wednesdays, Fridays, and Sundays; daily in summer).',
      },
      {
        id: 40,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'How many regiments of Foot Guards make up the Household Division protecting the King?',
        options: [
          { k: 'a', t: '3 regiments' },
          { k: 'b', t: '5 regiments' },
          { k: 'c', t: '7 regiments' },
          { k: 'd', t: '10 regiments' },
        ],
        a: 'b',
        exp: 'The five regiments are the Grenadier Guards, Coldstream Guards, Scots Guards, Irish Guards, and Welsh Guards.',
      },
      {
        id: 41,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'How can you identify a soldier of the Coldstream Guards by looking at their tunic buttons?',
        options: [
          { k: 'a', t: 'Evenly spaced single buttons' },
          { k: 'b', t: 'Buttons arranged in pairs of two' },
          { k: 'c', t: 'Buttons arranged in groups of three' },
          { k: 'd', t: 'Buttons arranged in groups of four' },
        ],
        a: 'b',
        exp: 'As the 2nd oldest regiment, Coldstream Guards wear buttons in pairs of 2, with a red plume on the right of their bearskin.',
      },
      {
        id: 42,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'Which regiment of Foot Guards wears NO plume in their black bearskin cap?',
        options: [
          { k: 'a', t: 'Grenadier Guards' },
          { k: 'b', t: 'Coldstream Guards' },
          { k: 'c', t: 'Scots Guards' },
          { k: 'd', t: 'Irish Guards' },
        ],
        a: 'c',
        exp: 'The Scots Guards wear buttons in groups of 3 and have no plume in their bearskin caps.',
      },
      {
        id: 43,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'What animal fur is traditionally used to make the King’s Foot Guards bearskin caps?',
        options: [
          { k: 'a', t: 'Russian sable' },
          { k: 'b', t: 'Canadian black bear' },
          { k: 'c', t: 'Synthetic polyester' },
          { k: 'd', t: 'Scottish badger' },
        ],
        a: 'b',
        exp: 'The ceremonial caps are made from the pelt of Canadian black bears, culled under strict Canadian wildlife management licenses.',
      },
      {
        id: 44,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'Who made the first recorded public appearance on the Buckingham Palace Balcony in 1851?',
        options: [
          { k: 'a', t: 'Queen Victoria' },
          { k: 'b', t: 'King George IV' },
          { k: 'c', t: 'Prince Albert alone' },
          { k: 'd', t: 'Winston Churchill' },
        ],
        a: 'a',
        exp: 'Queen Victoria stepped out onto the newly built balcony during the opening celebrations of the 1851 Great Exhibition.',
      },
      {
        id: 45,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'What ceremonial military parade celebrates the British Sovereign’s official birthday with a balcony flypast?',
        options: [
          { k: 'a', t: 'State Opening of Parliament' },
          { k: 'b', t: 'Trooping the Colour' },
          { k: 'c', t: 'The Garter Procession' },
          { k: 'd', t: 'Beating Retreat' },
        ],
        a: 'b',
        exp: 'Trooping the Colour takes place every June on Horse Guards Parade, concluding with the Royal Family on the Buckingham Palace balcony watching the RAF flypast.',
      },
      {
        id: 46,
        category: 'ceremonies',
        catLabel: 'Ceremonies & Guard',
        q: 'Approximately how many guests attend the Sovereign’s annual summer Royal Garden Parties?',
        options: [
          { k: 'a', t: '2,000 guests' },
          { k: 'b', t: '8,000 guests' },
          { k: 'c', t: 'Over 24,000 to 30,000 guests' },
          { k: 'd', t: '100,000 guests' },
        ],
        a: 'c',
        exp: 'Across three parties held each summer, approximately 30,000 members of the public are welcomed onto the palace lawn, consuming over 27,000 cups of tea and 20,000 sandwiches!',
      },

      // CATEGORY 5: WARTIME & SECRETS (Questions 47 - 55)
      {
        id: 47,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'How many times was Buckingham Palace directly struck by bombs during the WWII Blitz?',
        options: [
          { k: 'a', t: '2 times' },
          { k: 'b', t: '5 times' },
          { k: 'c', t: '9 times' },
          { k: 'd', t: '16 times' },
        ],
        a: 'c',
        exp: 'The palace was directly struck 9 times by Luftwaffe bombs between 1940 and 1941, notably destroying the Royal Chapel.',
      },
      {
        id: 48,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'What was Queen Elizabeth The Queen Mother’s famous quote after the palace chapel was bombed in 1940?',
        options: [
          { k: 'a', t: '“We shall fight in the garden”' },
          { k: 'b', t: '“Now I feel I can look the East End in the face”' },
          { k: 'c', t: '“London shall never surrender”' },
          { k: 'd', t: '“God save our brave soldiers”' },
        ],
        a: 'b',
        exp: 'The Queen Mother felt solidarity with East Enders whose homes had been devastated by heavy bombing, winning deep admiration from Londoners.',
      },
      {
        id: 49,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'Which prestigious private bank operates a private ATM cash machine in the palace basement?',
        options: [
          { k: 'a', t: 'Barclays' },
          { k: 'b', t: 'Coutts & Co.' },
          { k: 'c', t: 'HSBC' },
          { k: 'd', t: 'Lloyds Bank' },
        ],
        a: 'b',
        exp: 'Coutts & Co., banker to the royal household since the 18th century, maintains an ATM in the basement for royal family and staff.',
      },
      {
        id: 50,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'In 1982, who famously breached palace security and entered Queen Elizabeth II’s bedroom?',
        options: [
          { k: 'a', t: 'Guy Burgess' },
          { k: 'b', t: 'Michael Fagan' },
          { k: 'c', t: 'Marcus Sarjeant' },
          { k: 'd', t: 'John Bingham' },
        ],
        a: 'b',
        exp: 'Michael Fagan climbed a 14-foot wall and drainpipe on 9 July 1982, sitting on the edge of the Queen’s bed before police apprehended him.',
      },
      {
        id: 51,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'How many historic clocks inside Buckingham Palace are wound and serviced weekly by royal horologists?',
        options: [
          { k: 'a', t: '50 clocks' },
          { k: 'b', t: '120 clocks' },
          { k: 'c', t: 'Over 350 clocks' },
          { k: 'd', t: '800 clocks' },
        ],
        a: 'c',
        exp: 'Two full-time horological conservators maintain more than 350 historic clocks, taking over 40 hours during daylight saving time changes!',
      },
      {
        id: 52,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'How many total windows and doors are there in Buckingham Palace?',
        options: [
          { k: 'a', t: '200 windows and 400 doors' },
          { k: 'b', t: '760 windows and 1,514 doors' },
          { k: 'c', t: '1,200 windows and 2,000 doors' },
          { k: 'd', t: '500 windows and 800 doors' },
        ],
        a: 'b',
        exp: 'The palace features 760 windows (cleaned every six weeks) and 1,514 doors.',
      },
      {
        id: 53,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'Does Buckingham Palace have its own Court Post Office staffed by Royal Mail?',
        options: [
          { k: 'a', t: 'Yes, with its own unique royal handstamp and franking mark' },
          { k: 'b', t: 'No, all post is collected by horse at Waterloo' },
          { k: 'c', t: 'Only during the Christmas holiday season' },
          { k: 'd', t: 'No, email completely replaced it in 1995' },
        ],
        a: 'a',
        exp: 'Yes, the Court Post Office operates inside the palace handling thousands of letters weekly, using a unique royal crown postal cancellation mark.',
      },
      {
        id: 54,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'What underground feature links Buckingham Palace to Clarence House and nearby government offices?',
        options: [
          { k: 'a', t: 'A private royal subway train' },
          { k: 'b', t: 'A network of service tunnels and utility conduits' },
          { k: 'c', t: 'A submerged canal for royal gondolas' },
          { k: 'd', t: 'A nuclear missile bunker' },
        ],
        a: 'b',
        exp: 'A network of subterranean passages connects the palace with Clarence House, Whitehall offices, and heating/telecom infrastructure.',
      },
      {
        id: 55,
        category: 'secrets',
        catLabel: 'Wartime & Secrets',
        q: 'Which 260-year-old ceremonial vehicle in the Royal Mews has carried every British monarch to their coronation since 1831?',
        options: [
          { k: 'a', t: 'The Diamond Jubilee State Coach' },
          { k: 'b', t: 'The Gold State Coach (built 1762)' },
          { k: 'c', t: 'The Irish State Coach' },
          { k: 'd', t: 'The Scottish State Coach' },
        ],
        a: 'b',
        exp: 'Commissioned in 1760 and sculpted by Samuel Butler with paintings by Giovanni Cipriani, the 4-tonne Gold State Coach was used for the coronation of King Charles III in 2023.',
      },
    ];

    let activeCategory = 'all';
    const userAnswers = {};
    let isEvaluated = false;

    // RENDER QUESTIONS
    function renderQuestions() {
      questionsContainer.innerHTML = '';
      const filtered = QUIZ_QUESTIONS.filter(
        (q) => activeCategory === 'all' || q.category === activeCategory
      );

      if (showingCountLabel) {
        showingCountLabel.textContent = `Showing ${filtered.length} Question${filtered.length === 1 ? '' : 's'}`;
      }
      updateAnsweredCount();

      filtered.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.dataset.qid = item.id;
        card.dataset.category = item.category;

        if (isEvaluated) {
          card.classList.add('answered');
          const isCorrect = userAnswers[item.id] === item.a;
          card.classList.add(isCorrect ? 'correct' : 'incorrect');
        }

        const optionsHtml = item.options
          .map((opt) => {
            const isChecked = userAnswers[item.id] === opt.k;
            const checkedAttr = isChecked ? 'checked' : '';
            const selectedClass = isChecked ? 'selected' : '';
            return `
              <label class="quiz-option-label ${selectedClass}">
                <input type="radio" name="quiz_q_${item.id}" value="${opt.k}" ${checkedAttr}>
                <span><strong>${opt.k.toUpperCase()}.</strong> ${opt.t}</span>
              </label>
            `;
          })
          .join('');

        card.innerHTML = `
          <div class="quiz-card-header">
            <span class="quiz-card-number">Question ${item.id} of 55</span>
            <span class="quiz-card-category-tag">${item.catLabel}</span>
          </div>
          <div class="quiz-card-question">${item.q}</div>
          <div class="quiz-options-list">
            ${optionsHtml}
          </div>
          <div class="quiz-explanation-box">
            <div class="quiz-explanation-title">
              <i class="fa-solid fa-landmark"></i> Historical Note (Correct: ${item.a.toUpperCase()})
            </div>
            ${item.exp}
          </div>
        `;

        // Bind radio selection
        card.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.addEventListener('change', (e) => {
            userAnswers[item.id] = e.target.value;
            card.querySelectorAll('.quiz-option-label').forEach((lbl) => {
              lbl.classList.remove('selected');
            });
            e.target.closest('.quiz-option-label').classList.add('selected');
            updateAnsweredCount();
          });
        });

        questionsContainer.appendChild(card);
      });
    }

    function updateAnsweredCount() {
      const answeredTotal = Object.keys(userAnswers).length;
      if (answeredCountLabel) {
        answeredCountLabel.textContent = `${answeredTotal} of 55 Answered`;
      }
    }

    // CATEGORY FILTER TABS
    catPills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        catPills.forEach((p) => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeCategory = e.currentTarget.dataset.quizCat;
        renderQuestions();
      });
    });

    // SUBMIT & SCORE
    submitBtn.addEventListener('click', () => {
      let score = 0;
      QUIZ_QUESTIONS.forEach((q) => {
        if (userAnswers[q.id] === q.a) {
          score++;
        }
      });

      isEvaluated = true;
      renderQuestions();

      // Certificate Ranking Tiers
      const total = 55;
      const percent = Math.round((score / total) * 100);

      const scoreNumElem = document.getElementById('cert-score-num');
      const scoreDenomElem = document.getElementById('cert-score-denom');
      const rankBadgeElem = document.getElementById('cert-rank-badge');
      const feedbackElem = document.getElementById('cert-feedback');

      if (scoreNumElem) scoreNumElem.textContent = score;
      if (scoreDenomElem) scoreDenomElem.textContent = `/ ${total} Correct (${percent}%)`;

      let rankTitle = '';
      let feedback = '';

      if (score >= 50) {
        rankTitle = '👑 Grand Cross Sovereign Historian';
        feedback = `Extraordinary Royal Mastery! You achieved ${score}/55 (${percent}%). You know Buckingham Palace as intimately as the King\'s Private Secretary and the Sovereign Horologist!`;
      } else if (score >= 40) {
        rankTitle = '💂 Knight Commander & Keeper of Royal Heritage';
        feedback = `Outstanding Royal Knowledge! With ${score}/55 (${percent}%), you possess an exceptional understanding of the 19 State Rooms, the Household Division Foot Guards, and London topography.`;
      } else if (score >= 30) {
        rankTitle = '📜 Chief Royal Archivist & Palace Guide';
        feedback = `Very impressive! You scored ${score}/55 (${percent}%). You know the essential secrets of John Nash’s Grand Staircase, Pennethorne\'s Ballroom, and the sovereign flag protocols.`;
      } else if (score >= 20) {
        rankTitle = '🏰 Buckingham Palace State Guide';
        feedback = `Well done! You scored ${score}/55 (${percent}%). Review the State Rooms showcase and tourist guide sections above to master the remaining secrets!`;
      } else {
        rankTitle = '🎟️ Royal London Scholar';
        feedback = `A commendable royal start with ${score}/55! Explore the interactive 3D model, tour waypoints, and room features, then retake the quiz to claim your Knight Commander rank!`;
      }

      if (rankBadgeElem) rankBadgeElem.textContent = rankTitle;
      if (feedbackElem) feedbackElem.textContent = feedback;

      if (certificateCard) {
        certificateCard.style.display = 'block';
        certificateCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // RESET QUIZ
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        for (let key in userAnswers) {
          delete userAnswers[key];
        }
        isEvaluated = false;
        if (certificateCard) certificateCard.style.display = 'none';
        renderQuestions();
        window.scrollTo({
          top: document.getElementById('quiz-category-filter-nav').offsetTop - 60,
          behavior: 'smooth',
        });
      });
    }

    // INITIAL RENDER
    renderQuestions();
  }

  // --- SEARCH FILTER ---
  function setupTouristSearch() {
    const searchInput = document.getElementById('tourist-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const searchableCards = document.querySelectorAll('[data-search-item]');

      searchableCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // --- BOOTSTRAP ---
  document.addEventListener('DOMContentLoaded', () => {
    init3D();
    setupUIBindings();
    setLightingMode('day');
    setFlagStatus('royal');
  });
})();
