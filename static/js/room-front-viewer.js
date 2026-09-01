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
const CAMERA_ZOOM_FACTOR = 1.75;
const LOOK_PRESET = {
  exposure: 0.7,
  environmentIntensity: 0.11,
  ambientIntensity: 0.035,
  keyLightIntensity: 0.49,
  keyLightDefaultAngle: -74,
  frontalFillIntensity: 0.26,
  materialEnvMapIntensity: 0.2
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

    const ambient = new THREE.AmbientLight("#ffffff", LOOK_PRESET.ambientIntensity);
    scene.add(ambient);

    const keyDir = new THREE.DirectionalLight("#fff2db", LOOK_PRESET.keyLightIntensity);
    // Move key light farther on horizontal axis while keeping it high.
    keyDir.position.set(6.6, 6.8, 8.0);
    keyDir.castShadow = true;
    keyDir.shadow.mapSize.set(2048, 2048);
    keyDir.shadow.bias = -0.0001;
    keyDir.shadow.normalBias = 0.065;
    keyDir.shadow.radius = 3.8;
    keyDir.shadow.camera.near = 0.5;
    keyDir.shadow.camera.far = 28;
    keyDir.shadow.camera.left = -7;
    keyDir.shadow.camera.right = 7;
    keyDir.shadow.camera.top = 7;
    keyDir.shadow.camera.bottom = -7;
    keyDir.shadow.camera.updateProjectionMatrix();
    scene.add(keyDir);
    scene.add(keyDir.target);

    const frontalFill = new THREE.DirectionalLight("#f6f8ff", LOOK_PRESET.frontalFillIntensity);
    frontalFill.position.copy(camera.position.clone().add(baseCameraPose.forward.clone().multiplyScalar(-3.4)).add(new THREE.Vector3(0, 1.0, 0)));
    scene.add(frontalFill);
    scene.add(frontalFill.target);

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

    let faceTarget = new THREE.Vector3(0, 1.2, 0);

    const lightIntensityInput = mount.querySelector("[data-light-intensity]");
    const lightIntensityValueEl = mount.querySelector("[data-light-intensity-value]");
    const lightAngleInput = mount.querySelector("[data-light-angle]");
    const lightAngleValueEl = mount.querySelector("[data-light-angle-value]");
    const cameraYawInput = mount.querySelector("[data-camera-yaw]");
    const cameraYawValueEl = mount.querySelector("[data-camera-yaw-value]");
    const lightResetBtn = mount.querySelector("[data-light-reset]");

    const worldUp = new THREE.Vector3(0, 1, 0);
    let orbitCenter = faceTarget.clone();
    let baseOrbitOffset = camera.position.clone().sub(orbitCenter);
    const yawDragSensitivity = 0.12;
    const originalTouchAction = canvas.style.touchAction;

    let currentYawDegrees = 0;
    let dragging = false;
    let activePointerId = null;
    let lastPointerX = 0;

    const applyCameraYaw = (rawDegrees) => {
      const yawDegrees = THREE.MathUtils.clamp(rawDegrees, -CAMERA_SWIVEL_LIMIT_DEGREES, CAMERA_SWIVEL_LIMIT_DEGREES);
      const yawRadians = THREE.MathUtils.degToRad(yawDegrees);
      const yawRotation = new THREE.Quaternion().setFromAxisAngle(worldUp, yawRadians);

      const orbitOffset = baseOrbitOffset.clone().applyQuaternion(yawRotation);
      camera.position.copy(orbitCenter.clone().add(orbitOffset));
      camera.up.copy(worldUp);
      camera.lookAt(orbitCenter);

      currentYawDegrees = yawDegrees;

      if (cameraYawInput && Number(cameraYawInput.value) !== yawDegrees) {
        cameraYawInput.value = String(yawDegrees);
      }

      if (cameraYawValueEl) {
        cameraYawValueEl.textContent = `${Math.round(yawDegrees)} deg`;
      }
    };

    const updateCameraYawFromSlider = () => {
      applyCameraYaw(Number(cameraYawInput?.value ?? currentYawDegrees));
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) {
        return;
      }

      dragging = true;
      activePointerId = event.pointerId;
      lastPointerX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (!dragging || event.pointerId !== activePointerId) {
        return;
      }

      const dx = event.clientX - lastPointerX;
      lastPointerX = event.clientX;

      applyCameraYaw(currentYawDegrees - dx * yawDragSensitivity);
      event.preventDefault();
    };

    const stopPointerDrag = (event) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) {
        return;
      }

      dragging = false;
      if (activePointerId !== null) {
        canvas.releasePointerCapture?.(activePointerId);
      }
      activePointerId = null;
    };

    const updateLightPositionFromAngle = () => {
      const angleDegrees = Number(lightAngleInput?.value ?? LOOK_PRESET.keyLightDefaultAngle);
      const angleRadians = THREE.MathUtils.degToRad(angleDegrees);

      const radial = 8.5;
      const side = Math.cos(angleRadians) * radial;
      const back = Math.sin(angleRadians) * radial;

      const sideOffset = baseCameraPose.right.clone().multiplyScalar(side);
      const upOffset = new THREE.Vector3(0, 1, 0).multiplyScalar(4.0);
      const backOffset = baseCameraPose.forward.clone().multiplyScalar(back + 5.6);

      keyDir.position.copy(faceTarget.clone().add(sideOffset).add(upOffset).add(backOffset));
      keyDir.target.position.copy(faceTarget);
      keyDir.target.updateMatrixWorld();

      frontalFill.target.position.copy(faceTarget);
      frontalFill.target.updateMatrixWorld();

      if (lightAngleValueEl) {
        lightAngleValueEl.textContent = `${Math.round(angleDegrees)} deg`;
      }
    };

    const onLightIntensityInput = () => {
      const intensity = Number(lightIntensityInput?.value ?? LOOK_PRESET.keyLightIntensity);
      keyDir.intensity = intensity;
      if (lightIntensityValueEl) {
        lightIntensityValueEl.textContent = intensity.toFixed(2);
      }
    };

    const resetLightDefaults = () => {
      if (lightIntensityInput) {
        lightIntensityInput.value = LOOK_PRESET.keyLightIntensity.toFixed(2);
      }
      if (lightAngleInput) {
        lightAngleInput.value = String(LOOK_PRESET.keyLightDefaultAngle);
      }
      onLightIntensityInput();
      updateLightPositionFromAngle();
    };

    lightIntensityInput?.addEventListener("input", onLightIntensityInput);
    lightAngleInput?.addEventListener("input", updateLightPositionFromAngle);
    cameraYawInput?.addEventListener("input", updateCameraYawFromSlider);
    lightResetBtn?.addEventListener("click", resetLightDefaults);
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", stopPointerDrag);
    canvas.addEventListener("pointercancel", stopPointerDrag);
    canvas.addEventListener("pointerleave", stopPointerDrag);

    const bounds = new THREE.Box3().setFromObject(model);
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      faceTarget = center.clone().setY(center.y + size.y * 0.2);
    }

    orbitCenter = faceTarget.clone();
    baseOrbitOffset = camera.position.clone().sub(orbitCenter);

    resetLightDefaults();
    updateCameraYawFromSlider();

    function resize() {
      // Use the actual canvas viewport size; mount includes controls/hints and skews aspect.
      const viewportWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || mount.clientWidth;
      const viewportHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || mount.clientHeight;

      const width = Math.max(320, viewportWidth);
      const height = Math.max(280, viewportHeight);

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
    setStatus(statusEl, "Scene ready.");

    window.roomFrontViewer = {
      scene,
      camera,
      renderer,
      keyDir,
      resetView() {
        applyCameraYaw(0);
      },
      setLightIntensity(value) {
        const intensity = Number(value);
        keyDir.intensity = intensity;
        if (lightIntensityInput) {
          lightIntensityInput.value = intensity.toFixed(2);
        }
        if (lightIntensityValueEl) {
          lightIntensityValueEl.textContent = intensity.toFixed(2);
        }
      },
      setLightAngle(value) {
        if (!lightAngleInput) {
          return;
        }
        lightAngleInput.value = String(Number(value));
        updateLightPositionFromAngle();
      },
      resetLightDefaults,
      dispose() {
        window.cancelAnimationFrame(rafId);
        lightIntensityInput?.removeEventListener("input", onLightIntensityInput);
        lightAngleInput?.removeEventListener("input", updateLightPositionFromAngle);
        cameraYawInput?.removeEventListener("input", updateCameraYawFromSlider);
        lightResetBtn?.removeEventListener("click", resetLightDefaults);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", stopPointerDrag);
        canvas.removeEventListener("pointercancel", stopPointerDrag);
        canvas.removeEventListener("pointerleave", stopPointerDrag);
        canvas.style.touchAction = originalTouchAction;
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
