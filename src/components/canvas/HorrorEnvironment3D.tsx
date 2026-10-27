'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AtmosphereState, InteractableObject } from '@/types/episode';

interface HorrorEnvironment3DProps {
  atmosphere: AtmosphereState;
  interactables: InteractableObject[];
  onInspectObject: (object: InteractableObject) => void;
  onCameraOrientationChange?: (
    pos: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number }
  ) => void;
  isInspecting: boolean;
  reducedMotion?: boolean;
}

export const HorrorEnvironment3D: React.FC<HorrorEnvironment3DProps> = ({
  atmosphere,
  interactables,
  onInspectObject,
  onCameraOrientationChange,
  isInspecting,
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<AtmosphereState>(atmosphere);
  const isInspectingRef = useRef<boolean>(isInspecting);
  const onInspectObjectRef = useRef(onInspectObject);

  atmosphereRef.current = atmosphere;
  isInspectingRef.current = isInspecting;
  onInspectObjectRef.current = onInspectObject;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06070a, 0.12);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    // Listener seated position in the rural room
    camera.position.set(0, 1.35, 0.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) {
      console.error('WebGL not supported', e);
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ==========================================
    // PROCEDURAL TEXTURES (Mud plaster, wood planks)
    // ==========================================
    const createWoodTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e1610';
        ctx.fillRect(0, 0, 512, 512);
        // Wood grain lines
        for (let y = 0; y < 512; y += 4) {
          const darkness = Math.random() * 25;
          ctx.fillStyle = `rgba(10, 8, 5, ${darkness / 100})`;
          ctx.fillRect(0, y, 512, 2);
        }
        // Plank borders
        for (let x = 0; x < 512; x += 64) {
          ctx.fillStyle = 'rgba(5, 4, 2, 0.7)';
          ctx.fillRect(x, 0, 3, 512);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const createMudWallTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#141312';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 6000; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const r = Math.random() * 2;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(35, 30, 25, 0.3)' : 'rgba(5, 5, 5, 0.35)';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const woodTex = createWoodTexture();
    const mudTex = createMudWallTexture();

    // ==========================================
    // ROOM ARCHITECTURE (Bengali Rural Chamber)
    // ==========================================
    const roomWidth = 7.5;
    const roomHeight = 3.4;
    const roomDepth = 7.0;

    // Floor (Dark rustic wood planks)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.1,
      color: 0x3d2c1f,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling (Wood beams)
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x120e0b,
      roughness: 0.95,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    scene.add(ceiling);

    // Ceiling wooden rafters
    for (let z = -roomDepth / 2 + 0.8; z < roomDepth / 2; z += 1.2) {
      const beamGeo = new THREE.BoxGeometry(roomWidth, 0.16, 0.14);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x18120d, roughness: 0.9 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, roomHeight - 0.08, z);
      scene.add(beam);
    }

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: mudTex,
      roughness: 0.9,
      color: 0x221c16,
    });

    // Back Wall (with window cutout)
    const backWallLeft = new THREE.Mesh(new THREE.BoxGeometry(2.7, roomHeight, 0.2), wallMat);
    backWallLeft.position.set(-2.4, roomHeight / 2, -roomDepth / 2);
    scene.add(backWallLeft);

    const backWallRight = new THREE.Mesh(new THREE.BoxGeometry(2.7, roomHeight, 0.2), wallMat);
    backWallRight.position.set(2.4, roomHeight / 2, -roomDepth / 2);
    scene.add(backWallRight);

    const backWallBottom = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.2), wallMat);
    backWallBottom.position.set(0, 0.3, -roomDepth / 2);
    scene.add(backWallBottom);

    const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.2), wallMat);
    backWallTop.position.set(0, roomHeight - 0.6, -roomDepth / 2);
    scene.add(backWallTop);

    // Front Wall (behind listener)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, roomHeight / 2, roomDepth / 2);
    scene.add(frontWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    scene.add(rightWall);

    // Left Wall (with door opening)
    const leftWallFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, roomHeight, 2.5), wallMat);
    leftWallFront.position.set(-roomWidth / 2, roomHeight / 2, 2.0);
    scene.add(leftWallFront);

    const leftWallBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, roomHeight, 2.7), wallMat);
    leftWallBack.position.set(-roomWidth / 2, roomHeight / 2, -2.1);
    scene.add(leftWallBack);

    const leftWallDoorTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 1.8), wallMat);
    leftWallDoorTop.position.set(-roomWidth / 2, roomHeight - 0.45, 0);
    scene.add(leftWallDoorTop);

    // ==========================================
    // INTERACTIVE DOOR (Corridor Door on Left)
    // ==========================================
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-roomWidth / 2 + 0.1, 0, -0.9); // Hinge position
    scene.add(doorPivot);

    const doorLeafGeo = new THREE.BoxGeometry(0.08, 2.4, 1.7);
    const doorLeafMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.8,
      color: 0x2b1e15,
    });
    const doorLeaf = new THREE.Mesh(doorLeafGeo, doorLeafMat);
    doorLeaf.position.set(0, 1.2, 0.85); // Offset from hinge
    doorLeaf.castShadow = true;
    doorPivot.add(doorLeaf);

    // Iron Door Latch / Bolt
    const latchGeo = new THREE.BoxGeometry(0.12, 0.08, 0.35);
    const latchMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.4 });
    const latch = new THREE.Mesh(latchGeo, latchMat);
    latch.position.set(0, 1.2, 1.55);
    doorPivot.add(latch);

    // ==========================================
    // MONSOON WINDOW & EXTERIOR BAMBOO GROVE
    // ==========================================
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 1.4, -roomDepth / 2 + 0.05);

    // Window Wooden Frame
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.8 });
    const winTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.12), winFrameMat);
    winTop.position.set(0, 0.8, 0);
    const winBottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.12), winFrameMat);
    winBottom.position.set(0, -0.8, 0);
    const winLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.12), winFrameMat);
    winLeft.position.set(-1.0, 0, 0);
    const winRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.12), winFrameMat);
    winRight.position.set(1.0, 0, 0);
    windowGroup.add(winTop, winBottom, winLeft, winRight);

    // Iron Security Bars (লোহার শিক)
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.3 });
    for (let x = -0.8; x <= 0.8; x += 0.22) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.55, 8), barMat);
      bar.position.set(x, 0, 0);
      windowGroup.add(bar);
    }

    // Glass Pane with rain droplet simulation
    const glassGeo = new THREE.PlaneGeometry(1.95, 1.55);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.25,
      roughness: 0.15,
      transmission: 0.7,
      ior: 1.45,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    windowGroup.add(glass);
    scene.add(windowGroup);

    // Bamboo Tree Silhouettes outside window
    const outsideGroup = new THREE.Group();
    outsideGroup.position.set(0, 0, -roomDepth / 2 - 2.5);
    const bambooMat = new THREE.MeshBasicMaterial({ color: 0x050807 });
    for (let i = 0; i < 18; i++) {
      const h = 5 + Math.random() * 3;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, h, 6), bambooMat);
      stem.position.set((Math.random() - 0.5) * 6, h / 2 - 1, (Math.random() - 0.5) * 2);
      stem.rotation.z = (Math.random() - 0.5) * 0.15;
      outsideGroup.add(stem);
    }
    scene.add(outsideGroup);

    // ==========================================
    // WOODEN TABLE IN FRONT OF LISTENER
    // ==========================================
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, -1.8);

    const tabletopGeo = new THREE.BoxGeometry(2.0, 0.08, 1.1);
    const tableMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.75,
      color: 0x3a281c,
    });
    const tabletop = new THREE.Mesh(tabletopGeo, tableMat);
    tabletop.position.set(0, 0.74, 0);
    tabletop.receiveShadow = true;
    tabletop.castShadow = true;
    tableGroup.add(tabletop);

    // 4 Table legs
    const legGeo = new THREE.BoxGeometry(0.09, 0.74, 0.09);
    const legPositions = [
      [-0.9, 0.37, -0.45],
      [0.9, 0.37, -0.45],
      [-0.9, 0.37, 0.45],
      [0.9, 0.37, 0.45],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });
    scene.add(tableGroup);

    // ==========================================
    // OBJECTS ON TABLE (Interactable Models)
    // ==========================================
    const interactableMeshes: { [id: string]: THREE.Object3D } = {};

    // 1. HURRICANE LANTERN (হারিকেন বাতি)
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0.65, 0.78, -1.8);
    lanternGroup.name = 'hurricane-lantern';

    // Brass Base
    const baseGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.09, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      metalness: 0.75,
      roughness: 0.35,
    });
    const lBase = new THREE.Mesh(baseGeo, brassMat);
    lBase.position.y = 0.045;
    lanternGroup.add(lBase);

    // Glass Chimney
    const glassChimneyGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.28, 16);
    const glassChimneyMat = new THREE.MeshPhysicalMaterial({
      color: 0xffe8aa,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.8,
    });
    const chimney = new THREE.Mesh(glassChimneyGeo, glassChimneyMat);
    chimney.position.y = 0.22;
    lanternGroup.add(chimney);

    // Flame Core
    const flameGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.19;
    lanternGroup.add(flame);

    // Top Cap & Handle
    const topCapGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.06, 16);
    const topCap = new THREE.Mesh(topCapGeo, brassMat);
    topCap.position.y = 0.38;
    lanternGroup.add(topCap);

    scene.add(lanternGroup);
    interactableMeshes['hurricane-lantern'] = lanternGroup;

    // 2. VINTAGE RADIO (ফিলিপস ট্রানজিস্টর)
    const radioGroup = new THREE.Group();
    radioGroup.position.set(-0.7, 0.78, -1.8);
    radioGroup.name = 'vintage-radio';

    const radioBoxGeo = new THREE.BoxGeometry(0.42, 0.24, 0.15);
    const radioWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7 });
    const radioBody = new THREE.Mesh(radioBoxGeo, radioWoodMat);
    radioBody.position.y = 0.12;
    radioBody.castShadow = true;
    radioGroup.add(radioBody);

    // Speaker grill
    const grillGeo = new THREE.PlaneGeometry(0.22, 0.18);
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x1f1a14, roughness: 0.9 });
    const grill = new THREE.Mesh(grillGeo, grillMat);
    grill.position.set(-0.07, 0.12, 0.076);
    radioGroup.add(grill);

    // Tuning Dial
    const dialGeo = new THREE.PlaneGeometry(0.12, 0.16);
    const dialMat = new THREE.MeshBasicMaterial({ color: 0x1a2e1f });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(0.12, 0.12, 0.076);
    radioGroup.add(dial);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.45);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const antenna = new THREE.Mesh(antennaGeo, metalMat);
    antenna.position.set(0.18, 0.44, -0.04);
    antenna.rotation.z = -0.2;
    radioGroup.add(antenna);

    scene.add(radioGroup);
    interactableMeshes['vintage-radio'] = radioGroup;

    // 3. YELLOWED BENGALI DIARY (দিনলিপি)
    const diaryGroup = new THREE.Group();
    diaryGroup.position.set(0.1, 0.78, -1.75);
    diaryGroup.name = 'zamindar-diary';

    const diaryGeo = new THREE.BoxGeometry(0.28, 0.025, 0.22);
    const diaryMat = new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.95 });
    const diary = new THREE.Mesh(diaryGeo, diaryMat);
    diary.position.y = 0.012;
    diary.rotation.y = 0.15;
    diaryGroup.add(diary);
    scene.add(diaryGroup);
    interactableMeshes['zamindar-diary'] = diaryGroup;

    // 4. SILVER AMULET (তাবিজ)
    const amuletGroup = new THREE.Group();
    amuletGroup.position.set(-0.25, 0.78, -1.7);
    amuletGroup.name = 'silver-amulet';

    const amuletGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 12);
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xd5d5d5, metalness: 0.85, roughness: 0.25 });
    const tabiz = new THREE.Mesh(amuletGeo, silverMat);
    tabiz.rotation.z = Math.PI / 2;
    tabiz.position.y = 0.015;
    amuletGroup.add(tabiz);
    scene.add(amuletGroup);
    interactableMeshes['silver-amulet'] = amuletGroup;

    // 5. WINDOW & DOOR INTERACTABLE REFERENCE
    interactableMeshes['barred-window'] = windowGroup;
    interactableMeshes['left-door'] = doorPivot;

    // ==========================================
    // LIGHTING SYSTEM
    // ==========================================
    // Ambient light: pitch black / charcoal blue base
    const ambientLight = new THREE.AmbientLight(0x0a0d14, 0.4);
    scene.add(ambientLight);

    // Warm Hurricane Lamp PointLight
    const lanternLight = new THREE.PointLight(0xffa033, 2.2, 7.5, 1.8);
    lanternLight.position.set(0.65, 1.05, -1.8);
    lanternLight.castShadow = true;
    lanternLight.shadow.bias = -0.002;
    lanternLight.shadow.mapSize.width = 1024;
    lanternLight.shadow.mapSize.height = 1024;
    scene.add(lanternLight);

    // Lightning Directional Light (Outside window)
    const lightningLight = new THREE.DirectionalLight(0xb0d4ff, 0.0);
    lightningLight.position.set(2, 4, -roomDepth / 2 - 3);
    lightningLight.target = windowGroup;
    lightningLight.castShadow = true;
    scene.add(lightningLight);

    // ==========================================
    // MONSOON RAIN PARTICLE SYSTEM
    // ==========================================
    const rainCount = 1400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 8;
      rainPositions[i * 3 + 1] = Math.random() * 5 + 0.5;
      rainPositions[i * 3 + 2] = -roomDepth / 2 - Math.random() * 4;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(rainSystem);

    // Floating Dust Motes (warm lantern atmosphere)
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 3;
      dustPositions[i * 3 + 1] = 0.5 + Math.random() * 1.8;
      dustPositions[i * 3 + 2] = -0.5 - Math.random() * 2.5;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.02,
      transparent: true,
      opacity: 0.35,
    });
    const dustSystem = new THREE.Points(dustGeo, dustMat);
    scene.add(dustSystem);

    // ==========================================
    // USER LOOK-AROUND CAMERA CONTROLS
    // ==========================================
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetYaw = 0;
    let targetPitch = -0.05;
    let currentYaw = 0;
    let currentPitch = -0.05;

    const onMouseDown = (e: MouseEvent) => {
      if (isInspectingRef.current) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || isInspectingRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetYaw -= deltaX * 0.003;
      targetPitch -= deltaY * 0.003;
      // Clamp pitch to prevent camera flipping
      targetPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetPitch));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch support for mobile devices
    const onTouchStart = (e: TouchEvent) => {
      if (isInspectingRef.current || e.touches.length !== 1) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || isInspectingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      targetYaw -= deltaX * 0.0035;
      targetPitch -= deltaY * 0.0035;
      targetPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetPitch));
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    // RAYCASTING FOR OBJECT INSPECTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      if (isInspectingRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const testObjects = Object.values(interactableMeshes);
      const intersects = raycaster.intersectObjects(testObjects, true);

      if (intersects.length > 0) {
        // Find which interactable contains this mesh
        let hitObject = intersects[0].object;
        let matchedInteractable: InteractableObject | undefined;

        while (hitObject && hitObject !== scene) {
          matchedInteractable = interactables.find(
            (item) => item.id === hitObject.name || interactableMeshes[item.id] === hitObject
          );
          if (matchedInteractable) break;
          hitObject = hitObject.parent as THREE.Object3D;
        }

        if (matchedInteractable) {
          onInspectObjectRef.current(matchedInteractable);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('click', onClick);

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // ANIMATION & RENDER LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let lightningTimer = 0;
    let lightningDuration = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const currentAtmos = atmosphereRef.current;

      // Smooth camera interpolation
      const damping = reducedMotion ? 1.0 : 0.08;
      currentYaw += (targetYaw - currentYaw) * damping;
      currentPitch += (targetPitch - currentPitch) * damping;

      camera.rotation.set(0, 0, 0);
      camera.rotation.y = currentYaw;
      camera.rotation.x = currentPitch;

      // Extract camera vectors for spatial audio positioning
      const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      onCameraOrientationChange?.(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        { x: forwardVec.x, y: forwardVec.y, z: forwardVec.z },
        { x: upVec.x, y: upVec.y, z: upVec.z }
      );

      // 1. Lantern flicker & intensity
      const baseLantern = currentAtmos.lanternBrightness;
      const flickerAmp = currentAtmos.lanternFlicker;
      // Perlin-style noise flicker using sin frequencies
      const flickerVal =
        Math.sin(elapsed * 12.0) * 0.15 +
        Math.sin(elapsed * 27.3) * 0.1 +
        (Math.random() < 0.03 ? -0.35 : 0);
      const finalBrightness = Math.max(0.1, baseLantern + flickerVal * flickerAmp);
      lanternLight.intensity = finalBrightness * 2.4;
      flame.scale.setScalar(0.85 + Math.sin(elapsed * 20.0) * 0.2);

      // 2. Door state animation
      const targetDoorAngle =
        currentAtmos.doorState === 'open'
          ? -1.35
          : currentAtmos.doorState === 'ajar'
          ? -0.45
          : 0.0;
      doorPivot.rotation.y += (targetDoorAngle - doorPivot.rotation.y) * 0.04;

      // 3. Rain particle animation
      const rainPos = rainGeo.attributes.position.array as Float32Array;
      const rainSpeed = 5.0 + currentAtmos.rainIntensity * 12.0;
      for (let i = 0; i < rainCount; i++) {
        rainPos[i * 3 + 1] -= delta * rainSpeed;
        rainPos[i * 3] += delta * (currentAtmos.windIntensity * 1.5); // Wind slants the rain
        if (rainPos[i * 3 + 1] < 0.2) {
          rainPos[i * 3 + 1] = 5.0;
          rainPos[i * 3] = (Math.random() - 0.5) * 8;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
      rainMat.opacity = Math.max(0.08, currentAtmos.rainIntensity * 0.75);

      // 4. Dust motes drift
      const dustPos = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3 + 1] += Math.sin(elapsed + i) * 0.001;
        dustPos[i * 3] += Math.cos(elapsed * 0.5 + i) * 0.0008;
      }
      dustGeo.attributes.position.needsUpdate = true;

      // 5. Lightning logic
      if (currentAtmos.lightningActive || (currentAtmos.weather === 'heavy-storm' && Math.random() < 0.0015)) {
        if (lightningDuration <= 0) {
          lightningDuration = 0.25; // Flash burst duration
          lightningLight.intensity = 4.5;
        }
      }
      if (lightningDuration > 0) {
        lightningDuration -= delta;
        lightningLight.intensity = Math.random() > 0.3 ? 3.5 : 0.4;
        if (lightningDuration <= 0) {
          lightningLight.intensity = 0.0;
        }
      }

      // 6. Supernatural Mist / Fog pulsation
      if (currentAtmos.coldMist) {
        scene.fog = new THREE.FogExp2(0x0a1018, 0.22);
      } else {
        scene.fog = new THREE.FogExp2(0x06070a, 0.12);
      }

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('click', onClick);

      // Dispose Geometries and Materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      woodTex.dispose();
      mudTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactables, onCameraOrientationChange, reducedMotion]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden cursor-grab active:cursor-grabbing">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
