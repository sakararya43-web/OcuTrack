import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Eye, Zap, Layers, Activity, Sliders, RotateCw } from 'lucide-react';
import { soundFx } from '../../lib/soundFx';

type VisualMode = 'anatomy' | 'landmarks' | 'neural';

export const Ocular3DExplorer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<VisualMode>('anatomy');
  const [ambientLux, setAmbientLux] = useState<number>(0.35); // 0 (dark) to 1 (bright)
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [gazeFollow, setGazeFollow] = useState<boolean>(true);
  const [pupilMm, setPupilMm] = useState<number>(4.5);
  const [latencyTimer, setLatencyTimer] = useState<number | null>(null);

  // References for animation state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const eyeGroupRef = useRef<THREE.Group | null>(null);
  const pupilMeshRef = useRef<THREE.Mesh | null>(null);
  const landmarksGroupRef = useRef<THREE.Group | null>(null);
  const neuralGroupRef = useRef<THREE.Group | null>(null);
  const flashLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Mouse & Orbit state
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pupilTargetScaleRef = useRef<number>(1.0);
  const pupilCurrentScaleRef = useRef<number>(1.0);

  // Trigger Photic Flash Reflex
  const handleTriggerFlash = useCallback(() => {
    soundFx.playFlash();
    setIsFlashing(true);
    setLatencyTimer(238);

    // After physiological latency window (~220-240ms), pupil sharply constricts
    setTimeout(() => {
      setLatencyTimer(null);
    }, 240);

    setTimeout(() => {
      setIsFlashing(false);
      soundFx.playSuccess();
    }, 1200);
  }, []);

  // Set up Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    // 2. WebGL Renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const flashLight = new THREE.PointLight(0xffffff, 0, 10);
    flashLight.position.set(0, 0, 3.2);
    scene.add(flashLight);
    flashLightRef.current = flashLight;

    // 4. Main Eyeball Group
    const eyeGroup = new THREE.Group();
    scene.add(eyeGroup);
    eyeGroupRef.current = eyeGroup;

    // --- SCLERA (Outer White Eye Body) ---
    const scleraGeo = new THREE.SphereGeometry(1.6, 48, 48);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xf3f3ef,
      roughness: 0.25,
      metalness: 0.05,
    });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    eyeGroup.add(sclera);

    // --- PROCEDURAL IRIS DISC ---
    // Universal biological constant: 11.7 mm diameter
    const irisCanvas = document.createElement('canvas');
    irisCanvas.width = 512;
    irisCanvas.height = 512;
    const ictx = irisCanvas.getContext('2d');
    if (ictx) {
      const cx = 256;
      const cy = 256;
      const grad = ictx.createRadialGradient(cx, cy, 50, cx, cy, 250);
      grad.addColorStop(0, '#0a1017');
      grad.addColorStop(0.2, '#182b3d');
      grad.addColorStop(0.5, '#264b63');
      grad.addColorStop(0.8, '#41738e');
      grad.addColorStop(0.96, '#17303d');
      grad.addColorStop(1, '#09131a');
      ictx.fillStyle = grad;
      ictx.fillRect(0, 0, 512, 512);

      // Radial crypts & fibers
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2;
        const len = 70 + Math.random() * 170;
        ictx.strokeStyle = i % 5 === 0 ? 'rgba(228, 253, 83, 0.35)' : 'rgba(255, 255, 255, 0.18)';
        ictx.lineWidth = 0.8 + Math.random() * 1.5;
        ictx.beginPath();
        ictx.moveTo(cx + Math.cos(angle) * 55, cy + Math.sin(angle) * 55);
        ictx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ictx.stroke();
      }

      // Outer limbal ring border
      ictx.strokeStyle = '#050c12';
      ictx.lineWidth = 14;
      ictx.beginPath();
      ictx.arc(cx, cy, 246, 0, Math.PI * 2);
      ictx.stroke();
    }

    const irisTexture = new THREE.CanvasTexture(irisCanvas);
    irisTexture.colorSpace = THREE.SRGBColorSpace;

    const irisGeo = new THREE.RingGeometry(0.3, 0.82, 48);
    const irisMat = new THREE.MeshStandardMaterial({
      map: irisTexture,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    irisMesh.position.set(0, 0, 1.48);
    eyeGroup.add(irisMesh);

    // --- PUPIL VOID (Animated Aperture) ---
    const pupilGeo = new THREE.CircleGeometry(0.36, 48);
    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
    });
    const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
    pupilMesh.position.set(0, 0, 1.49);
    eyeGroup.add(pupilMesh);
    pupilMeshRef.current = pupilMesh;

    // --- CORNEA DOME (Clear refractive anterior curvature) ---
    const corneaGeo = new THREE.SphereGeometry(0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.36);
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.376, // Physiological corneal refractive index
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const corneaMesh = new THREE.Mesh(corneaGeo, corneaMat);
    corneaMesh.position.set(0, 0, 1.05);
    eyeGroup.add(corneaMesh);

    // --- 5. MEDIAPIPE 478 LANDMARK WIREFRAME OVERLAY ---
    const landmarksGroup = new THREE.Group();
    eyeGroup.add(landmarksGroup);
    landmarksGroupRef.current = landmarksGroup;

    // Iris perimeter landmarks (points 468-477)
    const irisPointsCount = 20;
    const irisPoints: THREE.Vector3[] = [];
    const pointGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const pointMat = new THREE.MeshBasicMaterial({ color: 0xe4fd53 });
    const cardinalPointMat = new THREE.MeshBasicMaterial({ color: 0x0f766e });

    for (let i = 0; i < irisPointsCount; i++) {
      const theta = (i / irisPointsCount) * Math.PI * 2;
      const x = Math.cos(theta) * 0.82;
      const y = Math.sin(theta) * 0.82;
      const z = 1.5;
      irisPoints.push(new THREE.Vector3(x, y, z));

      const isCardinal = i % 5 === 0;
      const pMesh = new THREE.Mesh(pointGeo, isCardinal ? cardinalPointMat : pointMat);
      pMesh.position.set(x, y, z);
      landmarksGroup.add(pMesh);
    }

    // Connect perimeter with tracking reticle ring
    irisPoints.push(irisPoints[0].clone()); // close ring
    const ringGeo = new THREE.BufferGeometry().setFromPoints(irisPoints);
    const ringMat = new THREE.LineDashedMaterial({
      color: 0xe4fd53,
      dashSize: 0.06,
      gapSize: 0.04,
      linewidth: 1.5,
    });
    const ringLine = new THREE.Line(ringGeo, ringMat);
    ringLine.computeLineDistances();
    landmarksGroup.add(ringLine);

    // Crosshair Calipers (Horizontal & Vertical 11.7mm standard markers)
    const crossPoints = [
      new THREE.Vector3(-1.1, 0, 1.51),
      new THREE.Vector3(1.1, 0, 1.51),
      new THREE.Vector3(0, -1.1, 1.51),
      new THREE.Vector3(0, 1.1, 1.51),
    ];
    const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPoints);
    const crossMat = new THREE.LineBasicMaterial({ color: 0x0f766e, transparent: true, opacity: 0.6 });
    const crossLines = new THREE.LineSegments(crossGeo, crossMat);
    landmarksGroup.add(crossLines);

    // --- 6. NEURAL REFLEX ARC MODE (Optic Nerve CN II & Oculomotor CN III) ---
    const neuralGroup = new THREE.Group();
    eyeGroup.add(neuralGroup);
    neuralGroupRef.current = neuralGroup;

    // Posterior Optic Nerve Trunk
    const nerveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(0.3, -0.2, -2.4),
      new THREE.Vector3(0.5, 0.1, -3.2),
      new THREE.Vector3(0.8, -0.4, -4.0),
    ]);
    const nerveGeo = new THREE.TubeGeometry(nerveCurve, 32, 0.18, 12, false);
    const nerveMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.4,
      metalness: 0.1,
    });
    const nerveMesh = new THREE.Mesh(nerveGeo, nerveMat);
    neuralGroup.add(nerveMesh);

    // Pretectal nucleus marker
    const pretectalGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const pretectalMat = new THREE.MeshStandardMaterial({
      color: 0xe4fd53,
      emissive: 0x84cc16,
      emissiveIntensity: 0.6,
    });
    const pretectalMesh = new THREE.Mesh(pretectalGeo, pretectalMat);
    pretectalMesh.position.set(0.8, -0.4, -4.0);
    neuralGroup.add(pretectalMesh);

    // Initial mode visibility
    landmarksGroup.visible = mode === 'landmarks';
    neuralGroup.visible = mode === 'neural';

    // 7. Handle Window Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Visibility observer to prevent background frame drops
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    });
    observer.observe(container);

    // 9. Render & Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      clock.getDelta();

      // Smooth Pupil Constriction / Dilation Physics
      // Target scale determined by ambient lux and stimulus flash
      const effectiveLux = isFlashing ? 1.0 : ambientLux;
      // Dilation ranges from 1.25 (dark scotopic ~5.6mm) to 0.52 (photopic flash ~2.4mm)
      pupilTargetScaleRef.current = isFlashing ? 0.48 : 1.2 - effectiveLux * 0.65;

      // Smooth damping (exponential decay)
      pupilCurrentScaleRef.current += (pupilTargetScaleRef.current - pupilCurrentScaleRef.current) * (isFlashing ? 0.15 : 0.08);
      if (pupilMeshRef.current) {
        pupilMeshRef.current.scale.set(pupilCurrentScaleRef.current, pupilCurrentScaleRef.current, 1);
      }

      // Convert scale to physical millimeter readout for HUD
      const mm = (pupilCurrentScaleRef.current * 4.2).toFixed(2);
      setPupilMm(parseFloat(mm));

      // Light flash intensity
      if (flashLightRef.current) {
        flashLightRef.current.intensity = isFlashing ? 4.5 : 0;
      }

      // Eyeball Gaze Following (Smooth Pursuit toward cursor or gentle breathing drift)
      const targetRotY = gazeFollow ? mouseTargetRef.current.x * 0.45 : Math.sin(clock.elapsedTime * 0.6) * 0.15;
      const targetRotX = gazeFollow ? -mouseTargetRef.current.y * 0.35 : Math.cos(clock.elapsedTime * 0.5) * 0.1;

      currentRotationRef.current.x += (targetRotX - currentRotationRef.current.x) * 0.07;
      currentRotationRef.current.y += (targetRotY - currentRotationRef.current.y) * 0.07;

      if (eyeGroupRef.current) {
        eyeGroupRef.current.rotation.x = currentRotationRef.current.x;
        eyeGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
      scleraGeo.dispose();
      scleraMat.dispose();
      irisGeo.dispose();
      irisMat.dispose();
      irisTexture.dispose();
      pupilGeo.dispose();
      pupilMat.dispose();
      corneaGeo.dispose();
      corneaMat.dispose();
      pointGeo.dispose();
      pointMat.dispose();
      cardinalPointMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      crossGeo.dispose();
      crossMat.dispose();
      nerveGeo.dispose();
      nerveMat.dispose();
      pretectalGeo.dispose();
      pretectalMat.dispose();
    };
  }, []);

  // Update mode visibility when mode state changes
  useEffect(() => {
    if (landmarksGroupRef.current) {
      landmarksGroupRef.current.visible = mode === 'landmarks';
    }
    if (neuralGroupRef.current) {
      neuralGroupRef.current.visible = mode === 'neural';
    }
    // Reposition camera slightly for neural perspective
    if (cameraRef.current) {
      if (mode === 'neural') {
        cameraRef.current.position.set(1.5, 0.8, 4.6);
        cameraRef.current.lookAt(0.3, -0.1, -1.0);
      } else {
        cameraRef.current.position.set(0, 0, 5.2);
        cameraRef.current.lookAt(0, 0, 0);
      }
    }
  }, [mode]);

  // Handle pointer interactions over canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseTargetRef.current = { x, y };

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      currentRotationRef.current.y += dx * 0.008;
      currentRotationRef.current.x += dy * 0.008;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="w-full bg-[#0F1117] border border-[#27282D] rounded-xl overflow-hidden shadow-2xl relative">
      {/* 1. Header Bar: Telemetry Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#27282D] bg-[#14161F]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
            WebGL 3D Biometric Globe
          </span>
          <span className="font-mono text-[10px] text-[#64748B] bg-[#1E2230] px-2 py-0.5 rounded border border-[#2B3145]">
            Hardware Accelerated · 60 FPS
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#090A0E] p-1 rounded-lg border border-[#27282D]">
          <button
            onClick={() => {
              setMode('anatomy');
              soundFx.playClick();
            }}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
              mode === 'anatomy'
                ? 'bg-[#1E232F] text-white font-medium border border-white/10'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 text-[#0F766E]" />
            <span>Anatomy</span>
          </button>

          <button
            onClick={() => {
              setMode('landmarks');
              soundFx.playClick();
            }}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
              mode === 'landmarks'
                ? 'bg-[#1E232F] text-white font-medium border border-white/10'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3 text-[#0F766E]" />
            <span>478 Mesh</span>
          </button>

          <button
            onClick={() => {
              setMode('neural');
              soundFx.playClick();
            }}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 ${
              mode === 'neural'
                ? 'bg-[#1E232F] text-white font-medium border border-white/10'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3 text-[#F59E0B]" />
            <span>Neural Arc</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive 3D Canvas Area */}
      <div
        className="relative aspect-[16/10] sm:aspect-[16/9] w-full cursor-grab active:cursor-grabbing select-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Three.js Mount Container */}
        <div ref={mountRef} className="w-full h-full block" />

        {/* Stimulus Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white/95 pointer-events-none transition-opacity duration-150 flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0F172A] font-bold bg-white/90 px-3 py-1 rounded shadow">
              PHOTIC FLASH STIMULUS (1000 MS)
            </span>
          </div>
        )}

        {/* Real-Time Telemetry HUD Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 pointer-events-none space-y-2 font-mono text-xs">
          <div className="bg-[#090A0E]/85 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-white/10 text-white space-y-1 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Aperture Ø</span>
              <span className="font-bold text-sm text-[#0F766E]">{pupilMm.toFixed(2)} mm</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Iris Constant</span>
              <span className="text-xs text-white">11.70 mm</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">State</span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  isFlashing ? 'text-[#F87171]' : pupilMm < 3.2 ? 'text-[#38BDF8]' : 'text-[#34D399]'
                }`}
              >
                {latencyTimer !== null ? `LATENCY WINDOW (${latencyTimer}ms)` : isFlashing ? 'CONSTRICTING' : 'DYNAMIC EQUILIBRIUM'}
              </span>
            </div>
          </div>
        </div>

        {/* Orbit Hint (Top-Right) */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="bg-[#090A0E]/80 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-white/10 text-[10px] font-mono text-[#64748B] flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-[#0F766E]" />
            <span>Drag to Orbit · Mouse to Track Gaze</span>
          </div>
        </div>

        {/* Mode Specific Telemetry Callout (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 max-w-sm pointer-events-none">
          {mode === 'anatomy' && (
            <div className="bg-[#090A0E]/85 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs font-mono text-[#A0A5B5] space-y-1">
              <p className="text-white font-semibold text-[11px]">Human Sclera, Iris Crypts &amp; Cornea</p>
              <p className="text-[10px] leading-relaxed">
                Physical cornea curvature (IOR 1.376) and radial sphincter pupillae fiber dynamics simulated in real-time WebGL.
              </p>
            </div>
          )}
          {mode === 'landmarks' && (
            <div className="bg-[#090A0E]/85 backdrop-blur-md p-3 rounded-lg border border-[#0F766E]/40 text-xs font-mono text-[#A0A5B5] space-y-1">
              <p className="text-[#0F766E] font-semibold text-[11px]">MediaPipe Iris Coordinates (468–477)</p>
              <p className="text-[10px] leading-relaxed">
                Subpixel iris edge landmarks bound the 11.7mm standard circle, providing distance-invariant millimeter calibration.
              </p>
            </div>
          )}
          {mode === 'neural' && (
            <div className="bg-[#090A0E]/85 backdrop-blur-md p-3 rounded-lg border border-[#F59E0B]/40 text-xs font-mono text-[#A0A5B5] space-y-1">
              <p className="text-[#F59E0B] font-semibold text-[11px]">Parasympathetic Pupillary Reflex Arc</p>
              <p className="text-[10px] leading-relaxed">
                Light activates CN II (Optic) → Pretectal Nucleus → Edinger-Westphal → CN III (Oculomotor) constriction.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Control Deck (Bottom Strip) */}
      <div className="p-4 sm:p-5 bg-[#14161F] border-t border-[#27282D] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Flash Reflex Trigger Button */}
        <div className="md:col-span-5 flex items-center gap-3">
          <button
            onClick={handleTriggerFlash}
            disabled={isFlashing}
            className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
              isFlashing
                ? 'bg-[#F87171] text-white opacity-80 cursor-not-allowed'
                : 'bg-[#0F766E] hover:bg-[#d8f244] text-[#0F172A] active:scale-[0.98]'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isFlashing ? 'Stimulus Active…' : 'Trigger Photopic Flash Reflex'}</span>
          </button>
        </div>

        {/* Ambient Lux Range Slider */}
        <div className="md:col-span-4 flex items-center gap-3 font-mono text-xs text-white">
          <Sliders className="w-4 h-4 text-[#64748B] shrink-0" />
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>Scotopic (Dark)</span>
              <span className="text-[#0F766E]">{Math.round(ambientLux * 100)}% Lux</span>
              <span>Photopic (Bright)</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={ambientLux}
              onChange={(e) => setAmbientLux(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#27282D] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />
          </div>
        </div>

        {/* Gaze Toggle */}
        <div className="md:col-span-3 flex items-center justify-end gap-2 font-mono text-xs text-[#64748B]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gazeFollow}
              onChange={(e) => setGazeFollow(e.target.checked)}
              className="w-4 h-4 rounded border-[#27282D] text-[#0F766E] focus:ring-0 bg-[#090A0E]"
            />
            <span className="text-xs text-white">Mouse Pursuit</span>
          </label>
        </div>
      </div>
    </div>
  );
};
