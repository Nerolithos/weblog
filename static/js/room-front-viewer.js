import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js/+esm";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/DRACOLoader.js/+esm";
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/meshopt_decoder.module.js/+esm";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/environments/RoomEnvironment.js/+esm";

const FIXED_BLENDER_CAMERA = {
  // Blender transform (XYZ Euler, meters) provided by user.
  position: [-0.682, -3.6217, 0.97217],
  rotationDegrees: [78.359, -0.082029, -6.18],
  eulerOrder: "XYZ"
};

const CAMERA_SWIVEL_LIMIT_DEGREES = 25;
const CAMERA_SWIVEL_LIMIT_RADIANS = THREE.MathUtils.degToRad(CAMERA_SWIVEL_LIMIT_DEGREES);
const CAMERA_ZOOM_FACTOR = 1.75;
const LOOK_PRESET = {
  exposure: 0.74,
  environmentIntensity: 0.14,
  ambientIntensity: 0.045,
  keyLightIntensity: 1.55,
  materialEnvMapIntensity: 0.24
};

function setStatus(el, text, isError = false) {
  if (!el) {
    return;
  }
  el.textContent = text;
  el.dataset.error = isError ? "1" : "0";
}

function blenderVectorToThree(vector) {
  return new THREE.Vector3(vector.x, vector.z, -vector.y);
}

function blenderPositionToThree(position) {
  return new THREE.Vector3(position[0], position[2], -position[1]);
}

function tuneTextureAnisotropy(texture, anisotropy) {
  if (!texture) {
    return;
  }
  texture.anisotropy = anisotropy;
}

function tunePbrMaterial(material, anisotropy) {
  if (!material) {
    return;
  }

  tuneTextureAnisotropy(material.map, anisotropy);
  tuneTextureAnisotropy(material.normalMap, anisotropy);
  tuneTextureAnisotropy(material.roughnessMap, anisotropy);
  tuneTextureAnisotropy(material.metalnessMap, anisotropy);
  tuneTextureAnisotropy(material.emissiveMap, anisotropy);
  tuneTextureAnisotropy(material.alphaMap, anisotropy);

  if ("envMapIntensity" in material) {
    material.envMapIntensity = LOOK_PRESET.materialEnvMapIntensity;
  }

  material.needsUpdate = true;
}

function applyFixedBlenderCameraPose(camera, pose) {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(pose.rotationDegrees[0]),
    THREE.MathUtils.degToRad(pose.rotationDegrees[1]),
    THREE.MathUtils.degToRad(pose.rotationDegrees[2]),
    pose.eulerOrder ?? "XYZ"
  );

  const forwardBlender = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
  const forwardThree = blenderVectorToThree(forwardBlender).normalize();

  // Keep horizon level by rebuilding up/right from world-up instead of Blender roll.
  const worldUp = new THREE.Vector3(0, 1, 0);
  let rightThree = new THREE.Vector3().crossVectors(forwardThree, worldUp);
  if (rightThree.lengthSq() < 1e-6) {
    rightThree = new THREE.Vector3(1, 0, 0);
  }
  rightThree.normalize();
  const upThree = new THREE.Vector3().crossVectors(rightThree, forwardThree).normalize();

  camera.position.copy(blenderPositionToThree(pose.position));
  camera.up.copy(upThree);
  camera.lookAt(camera.position.clone().add(forwardThree));

  return {
    forward: forwardThree.clone(),
    up: upThree.clone(),
    right: rightThree.clone()
  };
}

function bindLimitedLookController(canvas, camera, basePose) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const sensitivity = 0.0032;
  const originalTouchAction = canvas.style.touchAction;

  let yaw = 0;
  let pitch = 0;
  let dragging = false;
  let activePointerId = null;
  let lastX = 0;
  let lastY = 0;

  const applyLook = () => {
    const yawQ = new THREE.Quaternion().setFromAxisAngle(basePose.up, yaw);
    const rightAxis = basePose.right.clone().applyQuaternion(yawQ).normalize();
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(rightAxis, pitch);

    const forward = basePose.forward.clone().applyQuaternion(yawQ).applyQuaternion(pitchQ).normalize();
    const up = basePose.up.clone().applyQuaternion(yawQ).applyQuaternion(pitchQ).normalize();

    camera.up.copy(up);
    camera.lookAt(camera.position.clone().add(forward));
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    dragging = true;
    activePointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!dragging || event.pointerId !== activePointerId) {
      return;
    }

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    yaw = clamp(yaw - dx * sensitivity, -CAMERA_SWIVEL_LIMIT_RADIANS, CAMERA_SWIVEL_LIMIT_RADIANS);
    pitch = clamp(pitch - dy * sensitivity, -CAMERA_SWIVEL_LIMIT_RADIANS, CAMERA_SWIVEL_LIMIT_RADIANS);

    applyLook();
    event.preventDefault();
  };

  const stopDragging = (event) => {
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return;
    }

    dragging = false;
    if (activePointerId !== null) {
      canvas.releasePointerCapture?.(activePointerId);
    }
    activePointerId = null;
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("pointerleave", stopDragging);

  applyLook();

  return {
    reset() {
      yaw = 0;
      pitch = 0;
      applyLook();
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointercancel", stopDragging);
      canvas.removeEventListener("pointerleave", stopDragging);
      canvas.style.touchAction = originalTouchAction;
    }
  };
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
    scene.background = new THREE.Color("#c9d0d9");

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = LOOK_PRESET.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = LOOK_PRESET.environmentIntensity;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 300);
    camera.zoom = CAMERA_ZOOM_FACTOR;
    camera.updateProjectionMatrix();
    const baseCameraPose = applyFixedBlenderCameraPose(camera, FIXED_BLENDER_CAMERA);
    const lookController = bindLimitedLookController(canvas, camera, baseCameraPose);

    const ambient = new THREE.AmbientLight("#ffffff", LOOK_PRESET.ambientIntensity);
    scene.add(ambient);

    const keyDir = new THREE.DirectionalLight("#fff2db", LOOK_PRESET.keyLightIntensity);
    // High top-front key light gives a flatter, cleaner face illumination.
    keyDir.position.set(0.25, 9.0, 3.4);
    keyDir.castShadow = true;
    keyDir.shadow.mapSize.set(3072, 3072);
    keyDir.shadow.bias = -0.0001;
    keyDir.shadow.normalBias = 0.05;
    keyDir.shadow.radius = 2.4;
    keyDir.shadow.camera.near = 0.5;
    keyDir.shadow.camera.far = 28;
    keyDir.shadow.camera.left = -7;
    keyDir.shadow.camera.right = 7;
    keyDir.shadow.camera.top = 7;
    keyDir.shadow.camera.bottom = -7;
    keyDir.shadow.camera.updateProjectionMatrix();
    scene.add(keyDir);
    scene.add(keyDir.target);

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

      if (Array.isArray(node.material)) {
        for (const material of node.material) {
          tunePbrMaterial(material, maxAnisotropy);
        }
      } else {
        tunePbrMaterial(node.material, maxAnisotropy);
      }
    });

    scene.add(model);

    const bounds = new THREE.Box3().setFromObject(model);
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const faceTarget = center.clone().setY(center.y + size.y * 0.2);
      keyDir.target.position.copy(faceTarget);
      keyDir.target.updateMatrixWorld();
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
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderLoop);
    };
    renderLoop();

    mount.dataset.viewerReady = "1";
    setStatus(statusEl, "Scene ready. Drag to rotate within +/-25 deg. Camera position is fixed.");

    window.roomFrontViewer = {
      scene,
      camera,
      renderer,
      keyDir,
      resetView() {
        lookController.reset();
      },
      setLightIntensity(value) {
        keyDir.intensity = Number(value);
      },
      dispose() {
        window.cancelAnimationFrame(rafId);
        lookController.dispose();
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
