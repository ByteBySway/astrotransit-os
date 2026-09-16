import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TargetPlanet, getPlanetaryClassification } from '../../types';
import { 
  Compass,
  Play,
  Pause,
  Sliders,
  Sparkles
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction & View Mode State
  const [isRotating, setIsRotating] = useState(true);
  const [renderMode, setRenderMode] = useState<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');
  const [splitOffset, setSplitOffset] = useState(0.5); // 0.0 to 1.0 (where wireframe begins)

  // Dragging split slider state
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Animation & Interaction Refs
  const yawRef = useRef(0.5);
  const pitchRef = useRef(0.2);
  const isRotatingRef = useRef(true);
  const isDraggingPlanetRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const renderModeRef = useRef<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');
  const splitOffsetRef = useRef(0.5);

  // Sync refs
  isRotatingRef.current = isRotating;
  renderModeRef.current = renderMode;
  splitOffsetRef.current = splitOffset;

  const classification = getPlanetaryClassification(target.planetRadius);
  const isEarthStandard = target.id === 'Earth-Standard' || target.name.toLowerCase().includes('earth');

  // Seed for procedural variations if non-Earth
  const seed = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Mouse / Touch handlers for 3D Globe Rotation
  const handlePlanetMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingPlanetRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePlanetMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingPlanetRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    yawRef.current += deltaX * 0.008;
    pitchRef.current = Math.max(-1.1, Math.min(1.1, pitchRef.current + deltaY * 0.008));
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePlanetMouseUp = () => {
    isDraggingPlanetRef.current = false;
  };

  const handlePlanetTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingPlanetRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handlePlanetTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingPlanetRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;
    
    yawRef.current += deltaX * 0.008;
    pitchRef.current = Math.max(-1.1, Math.min(1.1, pitchRef.current + deltaY * 0.008));
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handlePlanetTouchEnd = () => {
    isDraggingPlanetRef.current = false;
  };

  // Dragging the Split Scanline handle
  const handleSplitDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSplit(true);
  };

  const handleSplitDragMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0.08, Math.min(0.92, relativeX));
    setSplitOffset(clamped);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit) {
        handleSplitDragMove(e.clientX);
      }
    };
    const handleGlobalMouseUp = () => {
      setIsDraggingSplit(false);
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingSplit && e.touches.length > 0) {
        handleSplitDragMove(e.touches[0].clientX);
      }
    };
    const handleGlobalTouchEnd = () => {
      setIsDraggingSplit(false);
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDraggingSplit, handleSplitDragMove]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 2.75);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;

    const resize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // 2. Directional Sunlight & Ambient Light Setup
    // Angled from top-right with intensity: 2.2
    const sunDir = new THREE.Vector3(1.2, 0.75, 0.9).normalize();
    const sunLight = new THREE.DirectionalLight(0xfff8ea, 2.2);
    sunLight.position.copy(sunDir.clone().multiplyScalar(10));
    scene.add(sunLight);

    // Ambient cosmic fill light with intensity: 0.35
    const ambientLight = new THREE.AmbientLight(0x0e1b30, 0.35);
    scene.add(ambientLight);

    // 3. Clipping Planes for 50/50 Split View
    // Terrain visible on left side (x <= splitX), wireframe visible on right side (x >= splitX)
    const terrainClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    const wireframeClippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

    // 4. Load Textures (Earth NASA Blue Marble Suite or Procedural Fallback)
    const textureLoader = new THREE.TextureLoader();

    let dayMap: THREE.Texture;
    let specMap: THREE.Texture;
    let nightMap: THREE.Texture;
    let cloudMap: THREE.Texture;

    if (isEarthStandard) {
      dayMap = textureLoader.load('/textures/planets/earth_day.jpg');
      dayMap.colorSpace = THREE.SRGBColorSpace;

      specMap = textureLoader.load('/textures/planets/earth_specular.jpg');
      nightMap = textureLoader.load('/textures/planets/earth_night.png');
      cloudMap = textureLoader.load('/textures/planets/earth_clouds.png');
    } else {
      const proc = createProceduralPlanetTextures(classification.type, seed);
      dayMap = proc.dayTexture;
      specMap = proc.specularTexture;
      nightMap = proc.nightTexture;
      cloudMap = proc.cloudTexture;
    }

    // 5. Planetary Core Surface Shader Material
    const planetMaterial = new THREE.ShaderMaterial({
      clipping: true,
      uniforms: {
        uDayMap: { value: dayMap },
        uNightMap: { value: nightMap },
        uSpecularMap: { value: specMap },
        uSunDirection: { value: sunDir },
        uSunIntensity: { value: 2.2 },
        uAmbientIntensity: { value: 0.35 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        #include <clipping_planes_pars_vertex>

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = viewMatrix * worldPos;
          #include <clipping_planes_vertex>
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform sampler2D uDayMap;
        uniform sampler2D uNightMap;
        uniform sampler2D uSpecularMap;
        uniform vec3 uSunDirection;
        uniform float uSunIntensity;
        uniform float uAmbientIntensity;
        #include <clipping_planes_pars_fragment>

        void main() {
          #include <clipping_planes_fragment>

          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(uSunDirection);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // Day Lighting (Lambertian with smooth terminator transition)
          float nDotL = dot(normal, sunDir);
          float dayFactor = smoothstep(-0.16, 0.16, nDotL);

          // Sample Day Albedo Texture
          vec4 dayColor = texture2D(uDayMap, vUv);

          // Water specular reflection (Blinn-Phong)
          vec3 halfVec = normalize(sunDir + viewDir);
          float nDotH = max(0.0, dot(normal, halfVec));
          vec4 specSample = texture2D(uSpecularMap, vUv);
          float waterMask = specSample.r;
          float specular = pow(nDotH, 28.0) * waterMask * dayFactor * 2.2;
          vec3 specColor = vec3(0.65, 0.88, 1.0) * specular;

          // Night Lights & Golden Terminator Glow
          vec4 nightSample = texture2D(uNightMap, vUv);
          float nightFactor = smoothstep(0.12, -0.16, nDotL);
          // Soft golden transition glow along the shadow terminator
          float terminatorGlow = smoothstep(-0.16, 0.0, nDotL) * (1.0 - smoothstep(0.0, 0.16, nDotL));
          vec3 goldenLight = vec3(1.0, 0.72, 0.32) * terminatorGlow * nightSample.r * 1.8;
          vec3 nightLights = nightSample.rgb * vec3(1.0, 0.88, 0.62) * nightFactor * 2.4 + goldenLight;

          // Rayleigh scattering limb fresnel
          float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.2);
          vec3 atmosphereRim = vec3(0.22, 0.74, 0.98) * fresnel * max(0.0, nDotL * 0.7 + 0.3) * 0.75;

          // Combine Diffuse + Specular + Night Emissive
          vec3 sunColor = vec3(1.0, 0.97, 0.92) * uSunIntensity;
          vec3 ambientColor = vec3(0.06, 0.11, 0.20) * (uAmbientIntensity * 3.0);

          vec3 diffuse = dayColor.rgb * (sunColor * max(0.0, nDotL) + ambientColor);
          vec3 finalColor = mix(nightLights, diffuse + specColor, dayFactor) + atmosphereRim;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const planetGeometry = new THREE.SphereGeometry(1, 64, 64);
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    // 6. Atmospheric Fresnel Scattering Rim Mesh (Scale: 1.025)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      clipping: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color('#38bdf8') }, // Spectral Azure/Cyan
        uSunDirection: { value: sunDir },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        #include <clipping_planes_pars_vertex>

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = viewMatrix * worldPos;
          #include <clipping_planes_vertex>
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uAtmosphereColor;
        uniform vec3 uSunDirection;
        #include <clipping_planes_pars_fragment>

        void main() {
          #include <clipping_planes_fragment>
          // Back-side Fresnel limb glow
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(uAtmosphereColor * 1.6, intensity * 0.95);
        }
      `,
    });

    const atmosphereMesh = new THREE.Mesh(planetGeometry, atmosphereMaterial);
    atmosphereMesh.scale.setScalar(1.025);

    // 7. Independent Dynamic Cloud Sphere (Scale: 1.01)
    const cloudMaterial = new THREE.ShaderMaterial({
      clipping: true,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCloudMap: { value: cloudMap },
        uSunDirection: { value: sunDir },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        #include <clipping_planes_pars_vertex>

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          #include <clipping_planes_vertex>
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform sampler2D uCloudMap;
        uniform vec3 uSunDirection;
        #include <clipping_planes_pars_fragment>

        void main() {
          #include <clipping_planes_fragment>
          vec4 cloudSample = texture2D(uCloudMap, vUv);
          float alpha = cloudSample.r;
          if (alpha < 0.04) discard;

          vec3 normal = normalize(vNormal);
          float nDotL = dot(normal, normalize(uSunDirection));
          float dayLight = smoothstep(-0.2, 0.25, nDotL);
          vec3 litCloud = vec3(1.0, 1.0, 1.0) * (dayLight * 1.15 + 0.06);

          gl_FragColor = vec4(litCloud, alpha * 0.85);
        }
      `,
    });

    const cloudMesh = new THREE.Mesh(planetGeometry, cloudMaterial);
    cloudMesh.scale.setScalar(1.01);

    // Group for photorealistic terrain + atmosphere + clouds
    const texturedPlanetGroup = new THREE.Group();
    texturedPlanetGroup.add(planetMesh);
    texturedPlanetGroup.add(cloudMesh);
    texturedPlanetGroup.add(atmosphereMesh);
    scene.add(texturedPlanetGroup);

    // 8. Modern Holographic Laser-Cyan Wireframe Mesh
    const wireframeGeometry = new THREE.SphereGeometry(1, 36, 24);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      clippingPlanes: [wireframeClippingPlane],
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);

    // Subtle dark core to block backface wireframe clutter
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x020713,
      clippingPlanes: [wireframeClippingPlane],
    });
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.995, 32, 24), coreMaterial);

    // Geodesic coordinate node dots
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.028,
      transparent: true,
      opacity: 0.85,
      clippingPlanes: [wireframeClippingPlane],
    });
    const pointsMesh = new THREE.Points(wireframeGeometry, pointsMaterial);

    const wireframeGroup = new THREE.Group();
    wireframeGroup.add(coreMesh);
    wireframeGroup.add(wireframeMesh);
    wireframeGroup.add(pointsMesh);
    scene.add(wireframeGroup);

    // 9. Animation & Render Loop
    let animationFrameId: number;
    let cloudSpinOffset = 0;

    const animate = () => {
      // Auto-rotation when not dragging
      if (isRotatingRef.current && !isDraggingPlanetRef.current) {
        yawRef.current += 0.0028;
      }

      const yaw = yawRef.current;
      const pitch = pitchRef.current;
      const mode = renderModeRef.current;
      const split = splitOffsetRef.current;

      // Differential Cloud Rotation relative to ground surface
      cloudSpinOffset += 0.0007;

      // Update Planet Orientation
      texturedPlanetGroup.rotation.x = pitch;
      planetMesh.rotation.y = yaw;
      atmosphereMesh.rotation.y = yaw;
      cloudMesh.rotation.y = yaw * 1.15 + cloudSpinOffset; // Differential speed!

      // Wireframe Orientation
      wireframeGroup.rotation.x = pitch;
      wireframeGroup.rotation.y = yaw;

      // Update Clipping Planes based on View Mode
      // split ranges 0 to 1; center is 0.5; maps to x in world space: [-1.2 to +1.2]
      const splitWorldX = (split - 0.5) * 2.2;
      terrainClippingPlane.constant = splitWorldX;
      wireframeClippingPlane.constant = -splitWorldX;

      if (mode === 'SPLIT') {
        texturedPlanetGroup.visible = true;
        wireframeGroup.visible = true;

        planetMaterial.clippingPlanes = [terrainClippingPlane];
        atmosphereMaterial.clippingPlanes = [terrainClippingPlane];
        cloudMaterial.clippingPlanes = [terrainClippingPlane];

        wireframeMaterial.clippingPlanes = [wireframeClippingPlane];
        coreMaterial.clippingPlanes = [wireframeClippingPlane];
        pointsMaterial.clippingPlanes = [wireframeClippingPlane];
      } else if (mode === 'TEXTURE') {
        texturedPlanetGroup.visible = true;
        wireframeGroup.visible = false;

        planetMaterial.clippingPlanes = [];
        atmosphereMaterial.clippingPlanes = [];
        cloudMaterial.clippingPlanes = [];
      } else {
        // WIREFRAME mode
        texturedPlanetGroup.visible = false;
        wireframeGroup.visible = true;

        wireframeMaterial.clippingPlanes = [];
        coreMaterial.clippingPlanes = [];
        pointsMaterial.clippingPlanes = [];
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 10. Clean-up on unmount or target switch
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Dispose Three.js resources
      planetGeometry.dispose();
      wireframeGeometry.dispose();
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
      cloudMaterial.dispose();
      wireframeMaterial.dispose();
      coreMaterial.dispose();
      pointsMaterial.dispose();

      dayMap.dispose();
      specMap.dispose();
      nightMap.dispose();
      cloudMap.dispose();

      renderer.dispose();
    };
  }, [target.id, classification.type, seed, isEarthStandard]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl cosmic-glass p-4 flex flex-col justify-between overflow-hidden group shadow-2xl border border-white/[0.08]"
    >
      {/* Atmospheric Celestial Radiance / Back-Glow behind the sphere */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.18) 0%, rgba(0, 240, 255, 0.08) 35%, transparent 70%)',
        }}
      />

      {/* Top Header & Mode Controls */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
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
              Photorealistic Radiance Globe &bull; AstroPlus Holographic Split
            </div>
          </div>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-xl border border-white/[0.08] text-[10px] font-mono-code">
          <button
            onClick={() => {
              setRenderMode('SPLIT');
              setSplitOffset(0.5);
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'SPLIT'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Photorealistic Terrain & Wireframe"
          >
            Split 50/50
          </button>
          <button
            onClick={() => setRenderMode('TEXTURE')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'TEXTURE'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full Photorealistic Atmosphere"
          >
            Texture
          </button>
          <button
            onClick={() => setRenderMode('WIREFRAME')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'WIREFRAME'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Holographic Geodesic Mesh"
          >
            Mesh
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Canvas Area */}
      <div className="relative w-full h-64 sm:h-76 my-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-xl">
        {/* Luminous Atmospheric Halo framing the 3D sphere */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.22) 0%, rgba(0, 240, 255, 0.10) 30%, transparent 70%)',
          }}
        />

        <canvas
          ref={canvasRef}
          className="w-full h-full block relative z-10"
          onMouseDown={handlePlanetMouseDown}
          onMouseMove={handlePlanetMouseMove}
          onMouseUp={handlePlanetMouseUp}
          onMouseLeave={handlePlanetMouseUp}
          onTouchStart={handlePlanetTouchStart}
          onTouchMove={handlePlanetTouchMove}
          onTouchEnd={handlePlanetTouchEnd}
        />

        {/* Sharp Glowing Vertical Scanline Separator (SPLIT Mode Only) */}
        {renderMode === 'SPLIT' && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center justify-between"
            style={{
              left: `${splitOffset * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Top Scanline Indicator Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#050914]/90 border border-cyan-400 text-[8px] font-mono-code text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.6)] tracking-wider uppercase mt-1 pointer-events-auto select-none backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>VET // SCAN</span>
            </div>

            {/* Glowing Laser-Cyan Scanline */}
            <div className="relative h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff,0_0_20px_rgba(0,240,255,0.8)]">
              {/* Sweeping optical flare */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1.5 h-10 bg-white/80 blur-[1px] rounded-full animate-pulse" />
            </div>

            {/* Center Draggable Grip Handle */}
            <div 
              onMouseDown={handleSplitDragStart}
              onTouchStart={handleSplitDragStart}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-[#050914] border-2 border-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.9)] text-cyan-300 cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
              title="Drag to adjust Terrain vs Holographic Mesh ratio"
            >
              <div className="flex gap-1 items-center justify-center">
                <div className="w-0.5 h-3 bg-cyan-400 rounded-full" />
                <div className="w-0.5 h-3 bg-cyan-400 rounded-full" />
              </div>
            </div>

            {/* Bottom 50:50 Split Ratio Badge */}
            <div className="flex items-center px-2 py-0.5 rounded bg-[#050914]/90 border border-cyan-400/70 text-[8px] font-mono-code text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.5)] tracking-wider mb-1 pointer-events-auto select-none backdrop-blur-md">
              <span>{Math.round(splitOffset * 100)} : {Math.round((1 - splitOffset) * 100)}</span>
            </div>
          </div>
        )}

        {/* Ambient Overlay Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none text-[10px] font-mono-code z-10">
          <div className="bg-[#050914]/80 border border-cyan-500/30 px-2 py-0.5 rounded-md text-cyan-300 backdrop-blur-md shadow-sm">
            Rp: <strong className="text-white">{target.planetRadius.toFixed(2)} R⊕</strong>
          </div>
          <div className="bg-[#050914]/80 border border-purple-500/30 px-2 py-0.5 rounded-md text-purple-300 backdrop-blur-md shadow-sm">
            T_eq: <strong className="text-white">{target.equilibriumTemp} K</strong>
          </div>
        </div>

        {/* Rotation State & Control Button Overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 bg-[#060a14]/90 hover:bg-[#0b1326] text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-lg border border-white/[0.08] text-[10px] font-mono-code backdrop-blur-md transition-all cursor-pointer shadow-md"
            title="Toggle Slow Axial Auto-Rotation"
          >
            {isRotating ? (
              <>
                <Pause className="h-3 w-3 text-cyan-400" />
                <span>Pause Spin</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>Auto Spin</span>
              </>
            )}
          </button>
        </div>

        {/* Floating Instruction Hint on Hover */}
        <div className="absolute bottom-2 left-2 text-[9px] font-mono-code text-slate-400 bg-[#050914]/85 px-2 py-0.5 rounded border border-white/[0.06] backdrop-blur-md pointer-events-none z-10">
          Drag to orbit view &bull; Radiance Rayleigh Rim
        </div>
      </div>

      {/* Footer Surface & Habitability Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.08] text-[11px] font-mono-code z-10">
        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Atmosphere Type</span>
          <strong className="text-cyan-300 truncate block">
            {target.planetRadius < 1.4 ? 'Secondary (N2/CO2)' : target.planetRadius < 2.5 ? 'Volatile-Rich Hycean' : 'Hydrogen/Helium Envelope'}
          </strong>
        </div>

        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Insolation Flux</span>
          <strong className="text-slate-200 block">{target.insolationFlux ? target.insolationFlux.toFixed(2) : '1.00'} S⊕</strong>
        </div>

        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Hydrosphere Index</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${target.liquidWaterIndex || 20}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-300">{target.liquidWaterIndex || 20}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
