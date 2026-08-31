import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js/+esm";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js/+esm";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/DRACOLoader.js/+esm";
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/meshopt_decoder.module.js/+esm";

function setStatus(el, text, isError = false) {
  if (!el) {
    return;
  }
  el.textContent = text;
  el.dataset.error = isError ? "1" : "0";
}

function frameLightTarget(camera, controls, nx, ny) {
  const lookDistance = Math.max(camera.position.distanceTo(controls.target) * 0.65, 1.2);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

  return controls.target
    .clone()
    .add(forward.multiplyScalar(lookDistance))
    .add(right.multiplyScalar(nx * lookDistance * 1.05))
    .add(up.multiplyScalar(ny * lookDistance * 0.72));
}

async function bootRoomFrontViewer() {
  const mount = document.getElementById("room-front-viewer");
  if (!mount || mount.dataset.viewerReady === "1") {
    return;
  }

  const canvas = mount.querySelector(".blender-room-viewer-canvas");
  const statusEl = mount.querySelector("[data-viewer-status]");
  if (!canvas) {
    return;
  }

  setStatus(statusEl, "Loading room.glb...");

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9edf3");

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 300);
    camera.position.set(3.3, 2.2, 4.8);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1.1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.8;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = 1.55;

    const ambient = new THREE.AmbientLight("#ffffff", 0.32);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight("#c8dcff", "#8d7e71", 0.55);
    hemi.position.set(0, 6, 0);
    scene.add(hemi);

    const keyDir = new THREE.DirectionalLight("#fff3d9", 1.6);
    keyDir.position.set(4.2, 6.2, 3.5);
    keyDir.castShadow = true;
    keyDir.shadow.mapSize.set(2048, 2048);
    keyDir.shadow.bias = -0.00015;
    keyDir.shadow.normalBias = 0.02;
    scene.add(keyDir);

    const cursorLight = new THREE.PointLight("#f5f3ff", 1.9, 18, 2);
    cursorLight.castShadow = true;
    cursorLight.shadow.mapSize.set(1024, 1024);
    scene.add(cursorLight);

    const pointerTarget = new THREE.Vector3(0, 2.2, 1.8);
    cursorLight.position.copy(pointerTarget);

    const setPointerTargetFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerTarget.copy(frameLightTarget(camera, controls, nx, ny));
    };

    canvas.addEventListener("pointermove", setPointerTargetFromEvent, { passive: true });
    canvas.addEventListener("pointerleave", () => {
      pointerTarget.copy(frameLightTarget(camera, controls, 0, 0));
    });

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/draco/");
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);
    if (MeshoptDecoder && MeshoptDecoder.ready) {
      await MeshoptDecoder.ready;
    }

    const modelUrl = mount.dataset.modelUrl || "/models/room.glb";
    const gltf = await loader.loadAsync(modelUrl);
    const model = gltf.scene || gltf.scenes?.[0];
    if (!model) {
      throw new Error("Model payload is empty.");
    }

    model.traverse((node) => {
      if (!node.isMesh) {
        return;
      }
      node.castShadow = true;
      node.receiveShadow = true;
    });

    scene.add(model);

    const bounds = new THREE.Box3().setFromObject(model);
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      camera.lookAt(center);
      pointerTarget.copy(frameLightTarget(camera, controls, 0, 0));
      cursorLight.position.copy(pointerTarget);
    }

    function resize() {
      const width = Math.max(320, mount.clientWidth);
      const height = Math.max(280, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    let rafId = 0;
    const renderLoop = () => {
      controls.update();
      cursorLight.position.lerp(pointerTarget, 0.14);
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderLoop);
    };
    renderLoop();

    mount.dataset.viewerReady = "1";
    setStatus(statusEl, "Scene ready. Move mouse to paint light.");

    window.roomFrontViewer = {
      scene,
      camera,
      controls,
      renderer,
      cursorLight,
      dispose() {
        window.cancelAnimationFrame(rafId);
        controls.dispose();
          dracoLoader.dispose();
        renderer.dispose();
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      }
    };
  } catch (error) {
    setStatus(statusEl, `Failed: ${error.message}`, true);
    console.error("room-front-viewer", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootRoomFrontViewer, { once: true });
} else {
  bootRoomFrontViewer();
}
