import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js/+esm";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/DRACOLoader.js/+esm";
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/meshopt_decoder.module.js/+esm";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/environments/RoomEnvironment.js/+esm";

const ITEMS = [
  { id: "lgu", label: "龙大生存指南 CUHKSZ Survival Handbook", url: "/posts/lgu/", center: true },
  { id: "pomodoro", label: "龙大课程助手", url: "http://lguide.net" },
  { id: "markdown", label: "mdAnything", url: "https://md.nero-lithos.com/" },
  { id: "game", label: "games", url: "/categories/#games" },
  { id: "courseai", label: "LGU 选课 AI 助手", url: "/courseai" },
  { id: "chem", label: "Interactive Periodic Table", url: "/chem" },
  { id: "history-today", label: "历史上的今天", url: "/posts/history-today/" },
  {
    id: "illustration",
    label: "My Pixiv Illustration Portfolio｜笔刷 + 画板",
    url: "https://p.nero-lithos.com/",
    models: [
      { id: "palette", size: 1.35, position: [-0.28, 0, 0] },
      { id: "brush", size: 1.15, position: [0.5, -0.05, 0.08], rotation: [0, 0, -0.38] }
    ]
  }
];

const mount = document.querySelector("[data-orbit-viewer]");
const canvas = mount?.querySelector("[data-orbit-canvas]");
const statusEl = mount?.querySelector("[data-orbit-status]");
const tooltipEl = mount?.querySelector("[data-orbit-tooltip]");

if (mount && canvas && statusEl && tooltipEl) {
  let active = false;
  let booted = false;
  let bootPromise = null;
  let frameId = 0;
  let lastTime = 0;
  let hovered = null;
  let pointerX = 0;
  let pointerY = 0;
  let scene;
  let camera;
  let renderer;
  let raycaster;
  let pointer;
  let orbitItems = [];
  let centerItem = null;
  let elapsed = 0;
  let layoutScale = 1;
  let orbitRadiusX = 5;

  function setTooltip(item, event) {
    hovered = item;
    canvas.classList.toggle("is-link-hovered", Boolean(item));
    if (!item) {
      tooltipEl.hidden = true;
      return;
    }
    if (event) {
      const rect = mount.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    }
    tooltipEl.textContent = item.label;
    tooltipEl.style.left = `${pointerX}px`;
    tooltipEl.style.top = `${pointerY}px`;
    tooltipEl.hidden = false;
  }

  function normalizeModel(root, targetSize) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z) || 1;
    root.scale.setScalar(targetSize / largest);
    root.position.copy(center.multiplyScalar(-targetSize / largest));
    root.updateMatrixWorld(true);
  }

  function markInteractive(root, item) {
    root.traverse((node) => {
      if (!node.isMesh) return;
      node.userData.orbitItem = item;
      node.castShadow = true;
      node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (!material) return;
        if ("envMapIntensity" in material) material.envMapIntensity = 0.72;
        material.needsUpdate = true;
      });
    });
  }

  async function boot() {
    if (booted) return;
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      scene = new THREE.Scene();
      scene.background = null;

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(new RoomEnvironment(), 0.035);
      scene.environment = environment.texture;
      pmrem.dispose();

      camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
      camera.position.set(0, 4.2, 13.6);
      camera.lookAt(0, 0.15, 0);

      scene.add(new THREE.HemisphereLight("#eaf4ff", "#6b7280", 1.6));
      const key = new THREE.DirectionalLight("#fff2dc", 3.4);
      key.position.set(5, 8, 8);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.DirectionalLight("#bcd7ff", 1.9);
      rim.position.set(-7, 3, -5);
      scene.add(rim);

      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/draco/");
      loader.setDRACOLoader(draco);
      loader.setMeshoptDecoder(MeshoptDecoder);
      await MeshoptDecoder.ready;

      const results = await Promise.allSettled(ITEMS.map(async (item, index) => {
        const holder = new THREE.Group();
        holder.userData.orbitItem = item;

        if (item.models) {
          const assembly = new THREE.Group();
          const parts = await Promise.all(item.models.map(async (part) => {
            const gltf = await loader.loadAsync(`/models/${part.id}.glb`);
            const root = gltf.scene || gltf.scenes?.[0];
            if (!root) throw new Error(`${part.id}.glb is empty`);
            normalizeModel(root, part.size || 1);
            root.position.add(new THREE.Vector3(...(part.position || [0, 0, 0])));
            root.rotation.set(...(part.rotation || [0, 0, 0]));
            return root;
          }));
          parts.forEach((part) => assembly.add(part));
          normalizeModel(assembly, 2.352);
          markInteractive(assembly, item);
          holder.add(assembly);
        } else {
          const gltf = await loader.loadAsync(`/models/${item.id}.glb`);
          const root = gltf.scene || gltf.scenes?.[0];
          if (!root) throw new Error(`${item.id}.glb is empty`);
          normalizeModel(root, item.center ? 3.92 : 2.352);
          markInteractive(root, item);
          holder.add(root);
        }

        scene.add(holder);
        if (item.center) {
          centerItem = { item, holder };
        } else {
          orbitItems.push({ item, holder, phase: ((index - 1) / (ITEMS.length - 1)) * Math.PI * 2 });
        }
      }));

      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length === results.length) throw new Error("所有模型均加载失败");
      statusEl.hidden = true;
      booted = true;
      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2(2, 2);
      resize();
    })().catch((error) => {
      statusEl.textContent = "3D 导航加载失败";
      statusEl.hidden = false;
      console.error("Hero orbit viewer failed:", error);
      throw error;
    });
    return bootPromise;
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const areaScale = Math.sqrt((width * height) / (1100 * 520));
    layoutScale = THREE.MathUtils.clamp(areaScale, 0.9, 1.42);
    const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const visibleWidth = visibleHeight * camera.aspect;
    orbitRadiusX = THREE.MathUtils.clamp(visibleWidth * 0.38, 4.6, 9.2);
  }

  function updatePositions() {
    if (centerItem) {
      centerItem.holder.position.set(0, 0.32 + Math.sin(elapsed * 1.5) * 0.12, 0);
      centerItem.holder.scale.setScalar(layoutScale);
      centerItem.holder.rotation.y = Math.sin(elapsed * 0.42) * 0.14;
    }
    orbitItems.forEach((entry) => {
      const angle = entry.phase + elapsed * 0.22;
      const depth = Math.sin(angle);
      entry.holder.position.set(Math.cos(angle) * orbitRadiusX, depth * 1.38 + Math.sin(elapsed * 1.2 + entry.phase) * 0.1, depth * 2.25);
      const perspectiveScale = 0.88 + ((depth + 1) * 0.09);
      entry.holder.scale.setScalar(perspectiveScale * layoutScale);
      entry.holder.rotation.y = -angle + Math.PI * 0.5;
      entry.holder.renderOrder = Math.round((depth + 1) * 10);
    });
  }

  function animate(time) {
    if (!active || document.hidden || !booted) {
      frameId = 0;
      return;
    }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (!hovered && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) elapsed += delta;
    updatePositions();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }

  function start() {
    if (frameId || !active || !booted || document.hidden) return;
    lastTime = 0;
    frameId = requestAnimationFrame(animate);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    setTooltip(null);
  }

  function pick(event) {
    if (!active || !booted) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(scene.children, true).find((entry) => entry.object.userData.orbitItem);
    setTooltip(hit?.object.userData.orbitItem || null, event);
  }

  canvas.addEventListener("pointermove", pick);
  canvas.addEventListener("pointerleave", () => setTooltip(null));
  canvas.addEventListener("click", (event) => {
    pick(event);
    if (!hovered) return;
    if (/^https?:\/\//.test(hovered.url)) window.open(hovered.url, "_blank", "noopener,noreferrer");
    else window.location.href = hovered.url;
  });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  document.addEventListener("hero-orbit-state", async (event) => {
    active = event.detail?.active === true;
    if (!active) {
      stop();
      return;
    }
    try {
      await boot();
      resize();
      start();
    } catch (_) {}
  });
}
