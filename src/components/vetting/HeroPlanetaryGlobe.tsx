import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TargetPlanet, getPlanetaryClassification } from '../../types';
import { 
  Compass,
  Play,
  Pause,
  RotateCcw,
  Globe
} from 'lucide-react';

interface HeroPlanetaryGlobeProps {
  target: TargetPlanet;
}

// Procedural texture generator for non-Earth planets or fallback
function createProceduralPlanetTextures(
  classificationType: string,
  seed: number
): {
  dayTexture: THREE.Texture;
  specularTexture: THREE.Texture;
  nightTexture: THREE.Texture;
  cloudTexture: THREE.Texture;
} {
  const width = 1024;
  const height = 512;

  // 1. Day Canvas
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const dayCtx = dayCanvas.getContext('2d')!;

  // 2. Specular Canvas (Roughness / water mask)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const specCtx = specCanvas.getContext('2d')!;

  // 3. Night Lights Canvas
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nightCtx = nightCanvas.getContext('2d')!;

  // 4. Cloud Alpha Canvas
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = width;
  cloudCanvas.height = height;
  const cloudCtx = cloudCanvas.getContext('2d')!;

  // Clear backgrounds
  specCtx.fillStyle = '#000000';
  specCtx.fillRect(0, 0, width, height);

  nightCtx.fillStyle = '#000000';
  nightCtx.fillRect(0, 0, width, height);

  cloudCtx.clearRect(0, 0, width, height);

  // Procedural generation based on classification
  const imgData = dayCtx.createImageData(width, height);
  const data = imgData.data;

  const specData = specCtx.createImageData(width, height);
  const sData = specData.data;

  const nightData = nightCtx.createImageData(width, height);
  const nData = nightData.data;

  const cloudData = cloudCtx.createImageData(width, height);
  const cData = cloudData.data;

  for (let y = 0; y < height; y++) {
    const lat = (y / height - 0.5) * Math.PI; // -pi/2 to pi/2
    const cosLat = Math.cos(lat);

    for (let x = 0; x < width; x++) {
      const lon = (x / width) * Math.PI * 2; // 0 to 2pi
      const idx = (y * width + x) * 4;

      // Noise terms
      const n1 = Math.sin(lon * 4 + seed) * Math.cos(lat * 3);
      const n2 = Math.sin(lon * 9 + lat * 6 + seed * 1.3) * 0.5;
      const n3 = Math.sin(lon * 18 - lat * 10) * 0.25;
      const elevation = n1 + n2 + n3;

      let r = 20, g = 35, b = 60;
      let isWater = false;
      let hasCity = false;

      if (classificationType === 'TERRESTRIAL') {
        // Rust & Silicate rocky world
        if (elevation > 0.15) {
          // Terra-cotta highlands
          r = 175; g = 85; b = 45;
        } else if (elevation > -0.1) {
          // Lowlands ochre
          r = 130; g = 95; b = 55;
        } else {
          // Basalt dark plains
          r = 45; g = 50; b = 65;
        }
        // Polar caps
        if (Math.abs(lat) > 1.25) {
          r = 210; g = 225; b = 240;
          isWater = true;
        }
      } else if (classificationType === 'SUPER_EARTH') {
        // Continental landmasses with deep sapphire oceans
        if (elevation > 0.05) {
          // Forest/highland greens and golds
          r = 38; g = 120; b = 85;
          if (elevation > 0.45) {
            r = 170; g = 145; b = 80;
          }
        } else {
          // Ocean
          r = 12; g = 45; b = 95;
          isWater = true;
        }
        if (Math.abs(lat) > 1.3) {
          r = 220; g = 240; b = 255;
          isWater = true;
        }
      } else if (classificationType === 'NEPTUNIAN') {
        // Deep turquoise / azure volatile atmosphere
        const band = Math.sin(lat * 14 + elevation * 0.8);
        r = Math.floor(18 + band * 15);
        g = Math.floor(100 + band * 35);
        b = Math.floor(205 + band * 40);
        isWater = true;
      } else {
        // Jovian storm bands
        const bandIdx = Math.floor((lat + Math.PI / 2) / (Math.PI / 10));
        if (bandIdx % 2 === 0) {
          r = 215; g = 140; b = 60;
        } else {
          r = 160; g = 85; b = 35;
        }
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;

      // Specular mask: 255 for water (high gloss sheen), 10 for land
      const specVal = isWater ? 240 : 15;
      sData[idx] = specVal;
      sData[idx + 1] = specVal;
      sData[idx + 2] = specVal;
      sData[idx + 3] = 255;

      // Night lights (for Earth/Super-Earth continental margins)
      if (!isWater && elevation > 0.05 && elevation < 0.35 && (x % 7 === 0) && (y % 7 === 0)) {
        if (Math.sin(x * 12 + y * 7 + seed) > 0.35) {
          hasCity = true;
        }
      }

      if (hasCity) {
        nData[idx] = 255;
        nData[idx + 1] = 210;
        nData[idx + 2] = 120;
        nData[idx + 3] = 255;
      }

      // Procedural Clouds (swirls & storm systems)
      const cloudNoise = Math.sin(lon * 6 + Math.cos(lat * 8)) * Math.cos(lat * 4 + lon * 2) + Math.sin(lon * 12 + lat * 10) * 0.4;
      if (cloudNoise > 0.28 && Math.abs(lat) < 1.4) {
        const cVal = Math.min(255, Math.floor((cloudNoise - 0.28) * 450));
        cData[idx] = 255;
        cData[idx + 1] = 255;
        cData[idx + 2] = 255;
        cData[idx + 3] = cVal;
      }
    }
  }

  dayCtx.putImageData(imgData, 0, 0);
  specCtx.putImageData(specData, 0, 0);
  nightCtx.putImageData(nightData, 0, 0);
  cloudCtx.putImageData(cloudData, 0, 0);

  const dayTexture = new THREE.CanvasTexture(dayCanvas);
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const specularTexture = new THREE.CanvasTexture(specCanvas);
  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

  return { dayTexture, specularTexture, nightTexture, cloudTexture };
}

export const HeroPlanetaryGlobe: React.FC<HeroPlanetaryGlobeProps> = ({ target }) => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Interaction & View Mode State
  const [isRotating, setIsRotating] = useState(true);
  const [renderMode, setRenderMode] = useState<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');

  const renderModeRef = useRef<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');
  const isRotatingRef = useRef(true);

  // Keep refs in sync for render loop
  renderModeRef.current = renderMode;
  isRotatingRef.current = isRotating;

  const classification = getPlanetaryClassification(target.planetRadius);
  const isEarthStandard = target.id === 'Earth-Standard' || target.name.toLowerCase().includes('earth');

  // Seed for procedural variations if non-Earth
  const seed = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Reset view handler
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!canvas || !canvasContainer) return;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();

    const initialWidth = canvasContainer.clientWidth || 300;
    const initialHeight = canvasContainer.clientHeight || 260;

    // Perspective camera positioned at camera.position.z = 5.2
    const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.localClippingEnabled = true;

    // OrbitControls for smooth interactive rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 3.0;
    controls.maxDistance = 12.0;
    controls.autoRotate = isRotating;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Precise ResizeObserver on canvas container
    const handleResize = () => {
      if (!canvasContainer || !renderer) return;
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvasContainer);

    // 2. Lighting & Radiance:
    // DirectionalLight: color 0xffffff, intensity 2.0 positioned at (5, 3, 5)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // AmbientLight: color 0x112244, intensity 0.6
    const ambientLight = new THREE.AmbientLight(0x112244, 0.6);
    scene.add(ambientLight);

    // 3. Clipping Planes for True 3D "Split 50/50" View:
    // Left plane keeps x <= 0 (textured planet left half)
    const leftClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    // Right plane keeps x >= 0 (laser-cyan wireframe right half)
    const rightClippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

    // 4. Reliable Planetary Texture Mapping
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    const loadTextureWithFallback = (url: string, fallbackUrl?: string) => {
      const tex = textureLoader.load(
        url,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
        },
        undefined,
        () => {
          if (fallbackUrl) {
            textureLoader.load(fallbackUrl, (fbTex) => {
              fbTex.colorSpace = THREE.SRGBColorSpace;
              tex.image = fbTex.image;
              tex.needsUpdate = true;
            });
          }
        }
      );
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    let surfaceMap: THREE.Texture;
    let normalMap: THREE.Texture | null = null;
    let specularMap: THREE.Texture | null = null;
    let cloudsMap: THREE.Texture;

    if (isEarthStandard) {
      // High-resolution, CORS-friendly Three.js Earth textures
      surfaceMap = loadTextureWithFallback(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        '/textures/planets/earth_day.jpg'
      );
      normalMap = loadTextureWithFallback(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        '/textures/planets/earth_normal.jpg'
      );
      specularMap = loadTextureWithFallback(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        '/textures/planets/earth_specular.jpg'
      );
      cloudsMap = loadTextureWithFallback(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
        '/textures/planets/earth_clouds.png'
      );
    } else {
      const proc = createProceduralPlanetTextures(classification.type, seed);
      surfaceMap = proc.dayTexture;
      specularMap = proc.specularTexture;
      cloudsMap = proc.cloudTexture;
    }

    // 5. True 3D Sphere Geometry: new THREE.SphereGeometry(2, 64, 64)
    const planetGeometry = new THREE.SphereGeometry(2, 64, 64);

    const planetMaterial = new THREE.MeshPhongMaterial({
      map: surfaceMap,
      normalMap: normalMap || undefined,
      normalScale: normalMap ? new THREE.Vector2(0.85, 0.85) : undefined,
      specularMap: specularMap || undefined,
      specular: new THREE.Color(0x333333),
      shininess: 25,
      clippingPlanes: renderModeRef.current === 'SPLIT' ? [leftClippingPlane] : [],
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    // 6. Concentric Cloud Mesh: slightly larger sphere (radius: 2.02)
    // with transparent: true, opacity: 0.8
    const cloudGeometry = new THREE.SphereGeometry(2.02, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
      depthWrite: false,
      clippingPlanes: renderModeRef.current === 'SPLIT' ? [leftClippingPlane] : [],
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

    // 7. Atmospheric Cyan Fresnel Rim Glow (#38bdf8) radiating starlight
    const atmosphereGeometry = new THREE.SphereGeometry(2.06, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      clippingPlanes: renderModeRef.current === 'SPLIT' ? [leftClippingPlane] : [],
      vertexShader: `
        varying vec3 vNormal;
        #include <clipping_planes_pars_vertex>
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          #include <clipping_planes_vertex>
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        #include <clipping_planes_pars_fragment>
        void main() {
          #include <clipping_planes_fragment>
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(vec3(0.22, 0.74, 0.98), intensity * 0.85);
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    // Textured planet group containing surface, clouds, and atmosphere
    const texturedPlanetGroup = new THREE.Group();
    texturedPlanetGroup.add(planetMesh);
    texturedPlanetGroup.add(cloudMesh);
    texturedPlanetGroup.add(atmosphereMesh);
    scene.add(texturedPlanetGroup);

    // 8. Clean laser-cyan wireframe material for right half / mesh view
    const wireframeGeometry = new THREE.SphereGeometry(2, 48, 36);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      clippingPlanes: renderModeRef.current === 'SPLIT' ? [rightClippingPlane] : [],
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);

    // Subtle dark core to occlude backface wireframe clutter and preserve clean geometry
    const coreGeometry = new THREE.SphereGeometry(1.99, 48, 36);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x02040a,
      clippingPlanes: renderModeRef.current === 'SPLIT' ? [rightClippingPlane] : [],
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);

    const wireframeGroup = new THREE.Group();
    wireframeGroup.add(coreMesh);
    wireframeGroup.add(wireframeMesh);
    scene.add(wireframeGroup);

    // 9. Animation & Render Loop
    let animationFrameId: number;
    let lastRenderMode: 'SPLIT' | 'TEXTURE' | 'WIREFRAME' = renderModeRef.current;

    const animate = () => {
      const mode = renderModeRef.current;

      // Handle mode transitions cleanly with Three.js clipping planes
      if (mode !== lastRenderMode) {
        lastRenderMode = mode;
        if (mode === 'SPLIT') {
          texturedPlanetGroup.visible = true;
          wireframeGroup.visible = true;

          planetMaterial.clippingPlanes = [leftClippingPlane];
          cloudMaterial.clippingPlanes = [leftClippingPlane];
          atmosphereMaterial.clippingPlanes = [leftClippingPlane];

          wireframeMaterial.clippingPlanes = [rightClippingPlane];
          coreMaterial.clippingPlanes = [rightClippingPlane];
        } else if (mode === 'TEXTURE') {
          texturedPlanetGroup.visible = true;
          wireframeGroup.visible = false;

          planetMaterial.clippingPlanes = [];
          cloudMaterial.clippingPlanes = [];
          atmosphereMaterial.clippingPlanes = [];
        } else {
          // WIREFRAME
          texturedPlanetGroup.visible = false;
          wireframeGroup.visible = true;

          wireframeMaterial.clippingPlanes = [];
          coreMaterial.clippingPlanes = [];
        }
      }

      // Update interactive OrbitControls
      controls.autoRotate = isRotatingRef.current;
      controls.update();

      // Independent dynamic cloud movement
      if (cloudMesh) {
        cloudMesh.rotation.y += 0.0004;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 10. Clean-up on unmount or target change
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();

      planetGeometry.dispose();
      cloudGeometry.dispose();
      atmosphereGeometry.dispose();
      wireframeGeometry.dispose();
      coreGeometry.dispose();

      planetMaterial.dispose();
      cloudMaterial.dispose();
      atmosphereMaterial.dispose();
      wireframeMaterial.dispose();
      coreMaterial.dispose();

      surfaceMap.dispose();
      if (normalMap) normalMap.dispose();
      if (specularMap) specularMap.dispose();
      cloudsMap.dispose();

      renderer.dispose();
    };
  }, [target.id, classification.type, seed, isEarthStandard]);

  return (
    <div 
      className="relative rounded-2xl cosmic-glass p-4 flex flex-col justify-between overflow-hidden group shadow-2xl border border-cyan-500/20 hover:border-cyan-400/50 transition-colors"
    >
      {/* Atmospheric Celestial Radiance / Starlight back-glow */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.20) 0%, rgba(0, 240, 255, 0.08) 35%, transparent 70%)',
        }}
      />

      {/* Top Header & Mode Controls */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-cyan-500/20 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-[#00f0ff]">
            <Globe className="h-3.5 w-3.5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-bold tracking-wide text-white uppercase">
                {target.name}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${classification.borderClass} ${classification.bgClass} ${classification.colorClass}`}>
                {classification.badgeLabel.replace('CLASS: ', '')}
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-slate-400">
              3D Planetary Sphere &bull; Laser-Cyan Mesh Split
            </div>
          </div>
        </div>

        {/* View Mode Toggle Pills (Clean 3D Split, Full Texture, Full Mesh) */}
        <div className="flex items-center gap-1 bg-[#040914]/90 p-1 rounded-xl border border-cyan-500/20 text-[10px] font-mono-code">
          <button
            id="btn-mode-split"
            onClick={() => setRenderMode('SPLIT')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              renderMode === 'SPLIT'
                ? 'bg-cyan-950/90 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split 50/50: Left Textured / Right Holographic Wireframe"
          >
            Split 50/50
          </button>
          <button
            id="btn-mode-texture"
            onClick={() => setRenderMode('TEXTURE')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              renderMode === 'TEXTURE'
                ? 'bg-cyan-950/90 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full Photorealistic Earth with Atmospheric Clouds"
          >
            Texture
          </button>
          <button
            id="btn-mode-wireframe"
            onClick={() => setRenderMode('WIREFRAME')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              renderMode === 'WIREFRAME'
                ? 'bg-cyan-950/90 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full Holographic Laser-Cyan Geodesic Mesh"
          >
            Mesh
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Canvas Area: Dedicated Container for True Aspect Ratio & Spherical Rendering */}
      <div 
        ref={canvasContainerRef}
        className="relative w-full h-64 sm:h-76 my-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-xl"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block relative z-10"
        />

        {/* Ambient Overlay Telemetry Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none text-[10px] font-mono-code z-20">
          <div className="bg-[#040914]/85 border border-cyan-500/30 px-2 py-0.5 rounded-md text-[#00f0ff] backdrop-blur-md shadow-sm">
            Rp: <strong className="text-white">{target.planetRadius.toFixed(2)} R⊕</strong>
          </div>
          <div className="bg-[#040914]/85 border border-purple-500/30 px-2 py-0.5 rounded-md text-purple-300 backdrop-blur-md shadow-sm">
            T_eq: <strong className="text-white">{target.equilibriumTemp} K</strong>
          </div>
        </div>

        {/* Interactive Controls Overlay (Auto-Spin & Reset View) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
          <button
            id="btn-reset-globe-view"
            onClick={handleResetView}
            className="flex items-center gap-1 bg-[#040914]/90 hover:bg-[#081226] text-slate-300 hover:text-[#00f0ff] px-2 py-1 rounded-lg border border-cyan-500/20 text-[10px] font-mono-code backdrop-blur-md transition-all cursor-pointer shadow-md"
            title="Reset Camera View Orientation"
          >
            <RotateCcw className="h-3 w-3 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            id="btn-toggle-spin"
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 bg-[#040914]/90 hover:bg-[#081226] text-slate-300 hover:text-[#00f0ff] px-2.5 py-1 rounded-lg border border-cyan-500/20 text-[10px] font-mono-code backdrop-blur-md transition-all cursor-pointer shadow-md"
            title="Toggle Axial Auto-Rotation"
          >
            {isRotating ? (
              <>
                <Pause className="h-3 w-3 text-[#00f0ff]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>Spin</span>
              </>
            )}
          </button>
        </div>

        {/* Orbit Interaction Hint */}
        <div className="absolute bottom-2 left-2 text-[9px] font-mono-code text-slate-400 bg-[#040914]/85 px-2 py-0.5 rounded border border-cyan-500/15 backdrop-blur-md pointer-events-none z-20">
          Drag to orbit &bull; Scroll to zoom
        </div>
      </div>

      {/* Footer Surface & Habitability Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-cyan-500/20 text-[11px] font-mono-code z-10">
        <div className="rounded-xl bg-[#040914]/85 border border-cyan-500/15 p-2">
          <span className="text-slate-400 text-[10px] block">Atmosphere Type</span>
          <strong className="text-[#00f0ff] truncate block">
            {target.planetRadius < 1.4 ? 'Secondary (N2/O2)' : target.planetRadius < 2.5 ? 'Volatile-Rich Hycean' : 'Hydrogen/Helium Envelope'}
          </strong>
        </div>

        <div className="rounded-xl bg-[#040914]/85 border border-cyan-500/15 p-2">
          <span className="text-slate-400 text-[10px] block">Insolation Flux</span>
          <strong className="text-slate-200 block">{target.insolationFlux ? target.insolationFlux.toFixed(2) : '1.00'} S⊕</strong>
        </div>

        <div className="rounded-xl bg-[#040914]/85 border border-cyan-500/15 p-2">
          <span className="text-slate-400 text-[10px] block">Hydrosphere Index</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#00f0ff] to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#00f0ff]"
                style={{ width: `${target.liquidWaterIndex || 71}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-300">{target.liquidWaterIndex || 71}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
