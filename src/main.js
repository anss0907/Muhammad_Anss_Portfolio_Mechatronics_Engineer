import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ===== MECHATRONICS-THEMED THREE.JS BACKGROUND =====
class ParticleBackground {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.particles = null;
    this.mechatronicsGroup = null;
    this.gears = [];
    this.wormGroup = null;
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.z = 5;

    this.createParticles();
    this.createMechatronicsScene();
    this.addEventListeners();
    this.animate();
  }

  // ===== PARTICLES (STARS) =====
  createParticles() {
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new THREE.Color('#6366f1');
    const color2 = new THREE.Color('#8b5cf6');
    const color3 = new THREE.Color('#06b6d4');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 14;
      positions[i3 + 2] = (Math.random() - 0.5) * 14;

      const colorChoice = Math.random();
      const c = colorChoice < 0.33 ? color1 : colorChoice < 0.66 ? color2 : color3;
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  // ===== GEAR SHAPE GENERATOR =====
  createGearShape(innerRadius, outerRadius, teeth) {
    const shape = new THREE.Shape();
    const toothDepth = outerRadius - innerRadius;
    const toothWidth = (2 * Math.PI) / (teeth * 2);

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 1) / teeth) * Math.PI * 2;
      const midAngle = angle + toothWidth;

      if (i === 0) {
        shape.moveTo(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        );
      }

      // Tooth rise
      shape.lineTo(
        Math.cos(angle + toothWidth * 0.15) * outerRadius,
        Math.sin(angle + toothWidth * 0.15) * outerRadius
      );
      // Tooth top
      shape.lineTo(
        Math.cos(midAngle - toothWidth * 0.15) * outerRadius,
        Math.sin(midAngle - toothWidth * 0.15) * outerRadius
      );
      // Tooth fall
      shape.lineTo(
        Math.cos(midAngle) * innerRadius,
        Math.sin(midAngle) * innerRadius
      );
      // Valley
      shape.lineTo(
        Math.cos(nextAngle) * innerRadius,
        Math.sin(nextAngle) * innerRadius
      );
    }

    shape.closePath();

    // Center hole
    const holePath = new THREE.Path();
    const holeRadius = innerRadius * 0.35;
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
    shape.holes.push(holePath);

    return shape;
  }

  // ===== MAIN SCENE BUILDER =====
  createMechatronicsScene() {
    this.mechatronicsGroup = new THREE.Group();

    // --- GEAR 1 (Large, top-right) ---
    const gear1Shape = this.createGearShape(0.5, 0.7, 16);
    const gear1Geo = new THREE.ShapeGeometry(gear1Shape);
    const gear1Edges = new THREE.EdgesGeometry(gear1Geo);
    const gear1Mat = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.18 });
    const gear1 = new THREE.LineSegments(gear1Edges, gear1Mat);
    gear1.position.set(3.5, 2.2, -3);
    gear1.userData = { rotSpeed: 0.15, type: 'gear' };
    this.gears.push(gear1);
    this.mechatronicsGroup.add(gear1);

    // --- GEAR 2 (Medium, meshed with gear1) ---
    const gear2Shape = this.createGearShape(0.3, 0.45, 12);
    const gear2Geo = new THREE.ShapeGeometry(gear2Shape);
    const gear2Edges = new THREE.EdgesGeometry(gear2Geo);
    const gear2Mat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.18 });
    const gear2 = new THREE.LineSegments(gear2Edges, gear2Mat);
    gear2.position.set(2.45, 1.35, -3);
    gear2.userData = { rotSpeed: -0.2, type: 'gear' };
    this.gears.push(gear2);
    this.mechatronicsGroup.add(gear2);

    // --- GEAR 3 (Small, bottom-left) ---
    const gear3Shape = this.createGearShape(0.25, 0.38, 10);
    const gear3Geo = new THREE.ShapeGeometry(gear3Shape);
    const gear3Edges = new THREE.EdgesGeometry(gear3Geo);
    const gear3Mat = new THREE.LineBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.15 });
    const gear3 = new THREE.LineSegments(gear3Edges, gear3Mat);
    gear3.position.set(-3.8, -2.5, -4);
    gear3.userData = { rotSpeed: 0.25, type: 'gear' };
    this.gears.push(gear3);
    this.mechatronicsGroup.add(gear3);

    // --- GEAR 4 (Large, bottom-left meshed with gear3) ---
    const gear4Shape = this.createGearShape(0.45, 0.62, 14);
    const gear4Geo = new THREE.ShapeGeometry(gear4Shape);
    const gear4Edges = new THREE.EdgesGeometry(gear4Geo);
    const gear4Mat = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.12 });
    const gear4 = new THREE.LineSegments(gear4Edges, gear4Mat);
    gear4.position.set(-3.0, -1.6, -4);
    gear4.userData = { rotSpeed: -0.17, type: 'gear' };
    this.gears.push(gear4);
    this.mechatronicsGroup.add(gear4);

    // --- WORM AND WORM WHEEL ---
    this.createWormGear();

    // --- MICROCONTROLLER CHIPS ---
    this.createChip(1.8, -2.0, -3.5, 0.7, 0.5, '#06b6d4', 0.14, 'JETSON');
    this.createChip(-2.5, 2.8, -4, 0.5, 0.35, '#8b5cf6', 0.12, 'STM32');
    this.createChip(-4.5, 0.2, -3, 0.55, 0.4, '#6366f1', 0.10, 'RPi');

    // --- CIRCUIT BOARD TRACES ---
    this.createCircuitTraces();

    // --- LOGIC GATES ---
    this.createLogicGate(-1.2, -3.2, -3.5, 'AND', '#06b6d4');
    this.createLogicGate(4.2, -1.5, -4, 'OR', '#8b5cf6');
    this.createLogicGate(-0.5, 3.5, -4, 'NOT', '#6366f1');

    // --- CONNECTING WIRES ---
    this.createWires();

    // --- ORIGINAL WIREFRAME SHAPES (kept) ---
    const icoGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const wireframe = new THREE.WireframeGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.10 });
    const ico = new THREE.LineSegments(wireframe, icoMat);
    ico.position.set(0.5, 3.8, -5);
    ico.userData = { rotSpeed: 0.08, type: 'shape' };
    this.mechatronicsGroup.add(ico);

    const octGeo = new THREE.OctahedronGeometry(0.35, 0);
    const octWire = new THREE.WireframeGeometry(octGeo);
    const octMat = new THREE.LineBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.10 });
    const oct = new THREE.LineSegments(octWire, octMat);
    oct.position.set(4.5, 0.5, -5);
    oct.userData = { rotSpeed: 0.1, type: 'shape' };
    this.mechatronicsGroup.add(oct);

    this.scene.add(this.mechatronicsGroup);
  }

  // ===== WORM AND WORM WHEEL =====
  createWormGear() {
    const wormGroup = new THREE.Group();
    wormGroup.position.set(-1, -0.5, -3);
    wormGroup.rotation.z = 0.3;

    // Worm (helix)
    const wormPoints = [];
    const helixTurns = 3;
    const helixLength = 1.2;
    const helixRadius = 0.12;
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const angle = t * Math.PI * 2 * helixTurns;
      wormPoints.push(new THREE.Vector3(
        Math.cos(angle) * helixRadius,
        Math.sin(angle) * helixRadius,
        (t - 0.5) * helixLength
      ));
    }
    const wormGeo = new THREE.BufferGeometry().setFromPoints(wormPoints);
    const wormMat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.16 });
    const worm = new THREE.Line(wormGeo, wormMat);
    worm.rotation.y = Math.PI / 2;
    wormGroup.add(worm);

    // Worm shaft
    const shaftPoints = [
      new THREE.Vector3(-0.8, 0, 0),
      new THREE.Vector3(0.8, 0, 0),
    ];
    const shaftGeo = new THREE.BufferGeometry().setFromPoints(shaftPoints);
    const shaftMat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.10 });
    wormGroup.add(new THREE.Line(shaftGeo, shaftMat));

    // Worm wheel (torus-like gear)
    const wheelGeo = new THREE.TorusGeometry(0.3, 0.06, 6, 24);
    const wheelWire = new THREE.WireframeGeometry(wheelGeo);
    const wheelMat = new THREE.LineBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.14 });
    const wheel = new THREE.LineSegments(wheelWire, wheelMat);
    wheel.position.set(0, -0.35, 0);
    wheel.rotation.x = Math.PI / 2;
    wormGroup.add(wheel);

    this.wormGroup = wormGroup;
    this.mechatronicsGroup.add(wormGroup);
  }

  // ===== MICROCONTROLLER CHIP OUTLINE =====
  createChip(x, y, z, width, height, color, opacity, label) {
    const chipGroup = new THREE.Group();
    chipGroup.position.set(x, y, z);

    // Main body outline
    const bodyGeo = new THREE.PlaneGeometry(width, height);
    const bodyEdges = new THREE.EdgesGeometry(bodyGeo);
    const bodyMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    chipGroup.add(new THREE.LineSegments(bodyEdges, bodyMat));

    // Inner rectangle (die)
    const dieGeo = new THREE.PlaneGeometry(width * 0.65, height * 0.55);
    const dieEdges = new THREE.EdgesGeometry(dieGeo);
    const dieMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * 0.7 });
    chipGroup.add(new THREE.LineSegments(dieEdges, dieMat));

    // Pins on sides
    const pinMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * 0.8 });
    const pinCount = Math.floor(width * 8);
    const pinLen = 0.08;

    for (let i = 0; i < pinCount; i++) {
      const px = -width / 2 + (i + 0.5) * (width / pinCount);

      // Top pins
      const topPinGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, height / 2, 0),
        new THREE.Vector3(px, height / 2 + pinLen, 0),
      ]);
      chipGroup.add(new THREE.Line(topPinGeo, pinMat));

      // Bottom pins
      const botPinGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, -height / 2, 0),
        new THREE.Vector3(px, -height / 2 - pinLen, 0),
      ]);
      chipGroup.add(new THREE.Line(botPinGeo, pinMat));
    }

    // Side pins
    const sidePinCount = Math.floor(height * 6);
    for (let i = 0; i < sidePinCount; i++) {
      const py = -height / 2 + (i + 0.5) * (height / sidePinCount);

      const leftPinGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width / 2, py, 0),
        new THREE.Vector3(-width / 2 - pinLen, py, 0),
      ]);
      chipGroup.add(new THREE.Line(leftPinGeo, pinMat));

      const rightPinGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(width / 2, py, 0),
        new THREE.Vector3(width / 2 + pinLen, py, 0),
      ]);
      chipGroup.add(new THREE.Line(rightPinGeo, pinMat));
    }

    // Orientation dot
    const dotGeo = new THREE.CircleGeometry(0.025, 8);
    const dotEdges = new THREE.EdgesGeometry(dotGeo);
    const dotMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const dot = new THREE.LineSegments(dotEdges, dotMat);
    dot.position.set(-width / 2 + 0.08, height / 2 - 0.06, 0);
    chipGroup.add(dot);

    chipGroup.userData = { type: 'chip', floatOffset: Math.random() * Math.PI * 2 };
    this.mechatronicsGroup.add(chipGroup);
  }

  // ===== CIRCUIT BOARD TRACES =====
  createCircuitTraces() {
    const traceMat1 = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.08 });
    const traceMat2 = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.08 });
    const traceMat3 = new THREE.LineBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.06 });

    // Trace pattern 1 — right-angle PCB trace
    const trace1Points = [
      new THREE.Vector3(2.5, -2.0, -4.5),
      new THREE.Vector3(2.5, -1.2, -4.5),
      new THREE.Vector3(3.2, -1.2, -4.5),
      new THREE.Vector3(3.2, -0.3, -4.5),
      new THREE.Vector3(4.0, -0.3, -4.5),
    ];
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trace1Points), traceMat1
    ));

    // Trace pattern 2
    const trace2Points = [
      new THREE.Vector3(-3.5, 1.5, -4.5),
      new THREE.Vector3(-3.5, 2.2, -4.5),
      new THREE.Vector3(-2.8, 2.2, -4.5),
      new THREE.Vector3(-2.8, 3.0, -4.5),
      new THREE.Vector3(-2.0, 3.0, -4.5),
    ];
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trace2Points), traceMat2
    ));

    // Trace pattern 3 (horizontal bus)
    const trace3Points = [
      new THREE.Vector3(-4.0, -0.5, -5),
      new THREE.Vector3(-2.5, -0.5, -5),
      new THREE.Vector3(-2.5, -1.0, -5),
      new THREE.Vector3(-1.0, -1.0, -5),
    ];
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trace3Points), traceMat3
    ));

    // Trace pattern 4
    const trace4Points = [
      new THREE.Vector3(0.5, 2.5, -5),
      new THREE.Vector3(1.2, 2.5, -5),
      new THREE.Vector3(1.2, 1.8, -5),
      new THREE.Vector3(2.0, 1.8, -5),
      new THREE.Vector3(2.0, 1.0, -5),
      new THREE.Vector3(2.8, 1.0, -5),
    ];
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trace4Points), traceMat1
    ));

    // Trace pattern 5 — vertical data bus
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.12;
      const busPoints = [
        new THREE.Vector3(4.5 + offset, -3.5, -5),
        new THREE.Vector3(4.5 + offset, -2.0, -5),
      ];
      this.mechatronicsGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(busPoints), traceMat2
      ));
    }

    // Via dots (PCB vias)
    const viaMat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.10 });
    const viaPositions = [
      [2.5, -2.0, -4.5], [3.2, -0.3, -4.5], [-2.8, 3.0, -4.5],
      [-1.0, -1.0, -5], [2.8, 1.0, -5],
    ];
    viaPositions.forEach(([vx, vy, vz]) => {
      const viaGeo = new THREE.RingGeometry(0.03, 0.06, 8);
      const viaEdges = new THREE.EdgesGeometry(viaGeo);
      const via = new THREE.LineSegments(viaEdges, viaMat);
      via.position.set(vx, vy, vz);
      this.mechatronicsGroup.add(via);
    });
  }

  // ===== LOGIC GATES =====
  createLogicGate(x, y, z, type, color) {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12 });
    const gateGroup = new THREE.Group();
    gateGroup.position.set(x, y, z);
    const s = 0.2; // scale

    if (type === 'AND') {
      // D-shape AND gate
      const points = [];
      points.push(new THREE.Vector3(-s, -s, 0));
      points.push(new THREE.Vector3(-s, s, 0));
      points.push(new THREE.Vector3(0, s, 0));
      // Arc for right side
      for (let i = 0; i <= 12; i++) {
        const angle = Math.PI / 2 - (i / 12) * Math.PI;
        points.push(new THREE.Vector3(Math.cos(angle) * s, Math.sin(angle) * s, 0));
      }
      points.push(new THREE.Vector3(-s, -s, 0));
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat));

      // Input lines
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-s * 1.8, s * 0.5, 0), new THREE.Vector3(-s, s * 0.5, 0),
      ]), mat));
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-s * 1.8, -s * 0.5, 0), new THREE.Vector3(-s, -s * 0.5, 0),
      ]), mat));
      // Output
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s, 0, 0), new THREE.Vector3(s * 1.8, 0, 0),
      ]), mat));
    }

    if (type === 'OR') {
      const points = [];
      // Curved input side
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const cy = (t - 0.5) * 2 * s;
        const cx = -s + Math.sin(t * Math.PI) * s * 0.3;
        points.push(new THREE.Vector3(cx, cy, 0));
      }
      // Top curve to output
      for (let i = 8; i >= 0; i--) {
        const t = i / 8;
        const cx = -s * 0.7 + (1 - t) * s * 2.2;
        const cy = s * t;
        points.push(new THREE.Vector3(cx, cy, 0));
      }
      // Bottom curve
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const cx = -s * 0.7 + (1 - t) * s * 2.2;
        const cy = -s * t;
        points.push(new THREE.Vector3(cx, cy, 0));
      }
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat));

      // Input/output lines
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-s * 1.8, s * 0.4, 0), new THREE.Vector3(-s * 0.6, s * 0.4, 0),
      ]), mat));
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-s * 1.8, -s * 0.4, 0), new THREE.Vector3(-s * 0.6, -s * 0.4, 0),
      ]), mat));
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s * 1.5, 0, 0), new THREE.Vector3(s * 2.2, 0, 0),
      ]), mat));
    }

    if (type === 'NOT') {
      // Triangle
      const triPoints = [
        new THREE.Vector3(-s, -s, 0),
        new THREE.Vector3(-s, s, 0),
        new THREE.Vector3(s, 0, 0),
        new THREE.Vector3(-s, -s, 0),
      ];
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(triPoints), mat));

      // Bubble
      const bubbleGeo = new THREE.CircleGeometry(s * 0.18, 8);
      const bubbleEdges = new THREE.EdgesGeometry(bubbleGeo);
      const bubble = new THREE.LineSegments(bubbleEdges, mat);
      bubble.position.set(s * 1.18, 0, 0);
      gateGroup.add(bubble);

      // Input/output
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-s * 1.8, 0, 0), new THREE.Vector3(-s, 0, 0),
      ]), mat));
      gateGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s * 1.35, 0, 0), new THREE.Vector3(s * 2.2, 0, 0),
      ]), mat));
    }

    gateGroup.userData = { type: 'gate', floatOffset: Math.random() * Math.PI * 2 };
    this.mechatronicsGroup.add(gateGroup);
  }

  // ===== CONNECTING WIRES =====
  createWires() {
    const wireMat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.06 });
    const wireMat2 = new THREE.LineBasicMaterial({ color: '#8b5cf6', transparent: true, opacity: 0.06 });

    // Curved wire 1 — connecting gears to chip area
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.5, 1.5, -3.5),
      new THREE.Vector3(2.0, 0.5, -3.5),
      new THREE.Vector3(2.2, -0.5, -3.5),
      new THREE.Vector3(1.8, -1.5, -3.5),
    ]);
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve1.getPoints(30)), wireMat
    ));

    // Curved wire 2
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.0, -1.8, -4),
      new THREE.Vector3(-2.0, -2.2, -4),
      new THREE.Vector3(-1.0, -2.8, -4),
      new THREE.Vector3(-0.5, -3.2, -4),
    ]);
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve2.getPoints(30)), wireMat2
    ));

    // Curved wire 3 — top area
    const curve3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.5, 2.8, -4.2),
      new THREE.Vector3(-1.5, 3.2, -4.2),
      new THREE.Vector3(-0.5, 3.5, -4.2),
      new THREE.Vector3(0.5, 3.0, -4.2),
    ]);
    this.mechatronicsGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve3.getPoints(30)), wireMat
    ));

    // Straight signal wires (like jumper wires)
    const jumpWires = [
      [[-4.0, 0.5, -3.5], [-3.0, 1.5, -3.5]],
      [[3.5, -1.0, -4.5], [4.2, -1.5, -4.5]],
      [[-1.5, -0.2, -3.5], [-0.5, 0.5, -3.5]],
    ];
    jumpWires.forEach(([start, end]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
      ]);
      this.mechatronicsGroup.add(new THREE.Line(geo, wireMat2));
    });
  }

  // ===== EVENT LISTENERS =====
  addEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  // ===== ANIMATION LOOP =====
  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();

    // Rotate particles slowly
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.03;
      this.particles.rotation.x = elapsed * 0.015;
    }

    // Animate mechatronics elements
    if (this.mechatronicsGroup) {
      this.mechatronicsGroup.children.forEach((child) => {
        const ud = child.userData;

        // Gears rotate
        if (ud.type === 'gear') {
          child.rotation.z = elapsed * ud.rotSpeed;
        }

        // Chips and gates float gently
        if (ud.type === 'chip' || ud.type === 'gate') {
          const offset = ud.floatOffset || 0;
          child.position.y += Math.sin(elapsed * 0.5 + offset) * 0.0005;
        }

        // Original shapes rotate
        if (ud.type === 'shape') {
          child.rotation.x = elapsed * ud.rotSpeed;
          child.rotation.y = elapsed * ud.rotSpeed * 1.3;
        }
      });
    }

    // Worm gear rotation
    if (this.wormGroup) {
      const worm = this.wormGroup.children[0]; // helix
      const wheel = this.wormGroup.children[2]; // torus wheel
      if (worm) worm.rotation.z = elapsed * 0.3;
      if (wheel) wheel.rotation.z = elapsed * 0.15;
    }

    // Mouse parallax
    this.camera.position.x += (this.mouse.x * 0.4 - this.camera.position.x) * 0.04;
    this.camera.position.y += (this.mouse.y * 0.4 - this.camera.position.y) * 0.04;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }
}

// ===== CURSOR GLOW =====
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  // Only show on desktop
  if (window.innerWidth < 768) {
    glow.style.display = 'none';
    return;
  }

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '0.3';
  });
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
    });

    // Close on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        links.classList.remove('open');
      });
    });
  }

  // Active link on scroll
  const sections = document.querySelectorAll('.section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });
}

// ===== SCROLL REVEAL ANIMATIONS =====
function initScrollAnimations() {
  // Hero section animations — fire IMMEDIATELY, no scroll needed
  const heroElements = document.querySelectorAll('.hero-content .reveal-text');
  heroElements.forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.1 + i * 0.12, ease: 'power3.out' }
    );
  });

  // Generic reveal animations
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  revealElements.forEach(el => {
    const isLeft = el.classList.contains('reveal-left');
    const isRight = el.classList.contains('reveal-right');
    const delay = el.dataset.delay ? el.dataset.delay * 0.1 : 0;

    const isMobile = window.innerWidth < 768;
    const triggerStart = isMobile ? 'top 110%' : 'top 95%';

    gsap.fromTo(el,
      {
        opacity: 0,
        x: isLeft ? -50 : isRight ? 50 : 0,
        y: (!isLeft && !isRight) ? 50 : 0,
      },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: isMobile ? 0.4 : 0.7,
        delay: delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: triggerStart,
          toggleActions: 'play none none none',
        },
      }
    );
  });

  // Section titles
  document.querySelectorAll('.section-title').forEach(title => {
    const isMob = window.innerWidth < 768;
    gsap.fromTo(title,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: isMob ? 0.3 : 0.6, ease: 'power3.out',
        scrollTrigger: {
          trigger: title,
          start: isMob ? 'top 110%' : 'top 95%',
        },
      }
    );
  });

  // Force ScrollTrigger to check positions on load (fixes first-visit blank sections)
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

// ===== COUNTER ANIMATION =====
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  counters.forEach(counter => {
    ScrollTrigger.create({
      trigger: counter,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const target = parseInt(counter.dataset.target);
        gsap.to(counter, {
          innerHTML: target,
          duration: 1.5,
          ease: 'power2.out',
          snap: { innerHTML: 1 },
          onUpdate: function () {
            counter.innerHTML = Math.round(parseFloat(counter.innerHTML));
          },
        });
      },
    });
  });
}

// ===== PROJECT FILTER =====
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      projects.forEach(project => {
        const category = project.dataset.category;
        if (filter === 'all' || category === filter) {
          gsap.to(project, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out',
            onStart: () => { project.style.display = ''; },
          });
        } else {
          gsap.to(project, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => { project.style.display = 'none'; },
          });
        }
      });
    });
  });
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>Sending...</span>';
    btn.style.pointerEvents = 'none';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        btn.innerHTML = '<span>Sent! ✓</span>';
        form.reset();
      } else {
        btn.innerHTML = '<span>Error — try again</span>';
      }
    } catch {
      btn.innerHTML = '<span>Error — try again</span>';
    }

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.pointerEvents = '';
    }, 2500);
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ===== TYPING EFFECT FOR HERO TAGLINE =====
function initTypingEffect() {
  const tagline = document.querySelector('.hero-tagline');
  if (!tagline) return;

  const texts = [
    'Mechatronics & Control Engineer',
    'Rank 1st — 3.84 CGPA at UET Lahore',
    'Robotics | AI | Embedded Systems',
    'Building Intelligent Machines from Scratch',
  ];

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 80;

  function type() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      tagline.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 40;
    } else {
      tagline.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 80;
    }

    if (!isDeleting && charIndex === currentText.length) {
      typingSpeed = 2000; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typingSpeed = 400; // Pause before new text
    }

    setTimeout(type, typingSpeed);
  }

  // Start after hero animation completes
  setTimeout(type, 1200);
}

// ===== PARALLAX ON SCROLL =====
function initParallax() {
  gsap.to('.hero-content', {
    y: 100,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// ===== SKILL CARD COLLAPSE / EXPAND =====
function initSkillCollapse() {
  const collapsibleCards = document.querySelectorAll('.skill-card[data-collapse]');

  collapsibleCards.forEach(card => {
    const limit = parseInt(card.dataset.collapse);
    const tags = card.querySelectorAll('.tag');
    const btn = card.querySelector('.see-more-btn');

    // Hide tags beyond the limit
    tags.forEach((tag, i) => {
      if (i >= limit) {
        tag.classList.add('tag-hidden');
      }
    });

    // Count hidden tags
    const hiddenCount = tags.length - limit;
    if (btn && hiddenCount > 0) {
      btn.textContent = `See More (+${hiddenCount}) ▾`;
    } else if (btn) {
      btn.style.display = 'none'; // No hidden tags, no button needed
    }

    // Toggle on button click
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('expanded');
        if (card.classList.contains('expanded')) {
          btn.textContent = 'Show Less ▴';
        } else {
          btn.textContent = `See More (+${hiddenCount}) ▾`;
        }
      });
    }

    // Also expand on hover (desktop only)
    if (window.innerWidth >= 768) {
      card.addEventListener('mouseenter', () => {
        card.classList.add('expanded');
        if (btn) btn.textContent = 'Show Less ▴';
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('expanded');
        if (btn) btn.textContent = `See More (+${hiddenCount}) ▾`;
      });
    }
  });
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  new ParticleBackground();
  initCursorGlow();
  initNavbar();
  initScrollAnimations();
  initCounters();
  initProjectFilter();
  initContactForm();
  initSmoothScroll();
  initTypingEffect();
  initParallax();
  initSkillCollapse();

  // Final safety refresh after everything loads (images, fonts, etc.)
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});
