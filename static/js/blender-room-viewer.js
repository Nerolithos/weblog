import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js";

const DEFAULT_CONFIG = {
  modelUrl: "",
  renderer: {
    antialias: true,
    alpha: false,
    clearColor: "#e9edf3",
    toneMapping: "ACESFilmicToneMapping",
    toneMappingExposure: 1,
    shadowMapEnabled: true,
    shadowMapType: "PCFSoftShadowMap"
  },
  scene: {
    background: "#e9edf3"
  },
  camera: {
    fov: 48,
    near: 0.01,
    far: 300,
    position: [3, 2, 4],
    target: [0, 1, 0],
    fitToModel: false,
    fitOffset: 1.2
  },
  controls: {
    enablePan: true,
    enableRotate: true,
    enableZoom: true,
    enableDamping: true,
    dampingFactor: 0.08,
    minDistance: 0.8,
    maxDistance: 20,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    autoRotate: false,
    autoRotateSpeed: 1
  },
  modelTransform: {
    scale: [1, 1, 1],
    position: [0, 0, 0],
    rotationDegrees: [0, 0, 0]
  },
  modelShadows: {
    castShadow: true,
    receiveShadow: true,
    forceDoubleSide: false
  },
  lights: [],
  helpers: {
    grid: false,
    gridSize: 12,
    gridDivisions: 12,
    axes: false,
    axesSize: 1.5
  }
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base, override) {
  if (!isObject(base) || !isObject(override)) {
    return override;
  }

  const merged = { ...base };
  for (const key of Object.keys(override)) {
    const overrideValue = override[key];
    if (isObject(overrideValue) && isObject(base[key])) {
      merged[key] = mergeDeep(base[key], overrideValue);
    } else {
      merged[key] = overrideValue;
    }
  }
  return merged;
}

function toVector3(input, fallback = [0, 0, 0]) {
  if (!Array.isArray(input) || input.length < 3) {
    return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
  }
  return new THREE.Vector3(Number(input[0]), Number(input[1]), Number(input[2]));
}

function getToneMapping(name) {
  const mappings = {
    NoToneMapping: THREE.NoToneMapping,
    LinearToneMapping: THREE.LinearToneMapping,
    ReinhardToneMapping: THREE.ReinhardToneMapping,
    CineonToneMapping: THREE.CineonToneMapping,
    ACESFilmicToneMapping: THREE.ACESFilmicToneMapping,
    AgXToneMapping: THREE.AgXToneMapping,
    NeutralToneMapping: THREE.NeutralToneMapping
  };
  return mappings[name] ?? THREE.ACESFilmicToneMapping;
}

function getShadowType(name) {
  const types = {
    BasicShadowMap: THREE.BasicShadowMap,
    PCFShadowMap: THREE.PCFShadowMap,
    PCFSoftShadowMap: THREE.PCFSoftShadowMap,
    VSMShadowMap: THREE.VSMShadowMap
  };
  return types[name] ?? THREE.PCFSoftShadowMap;
}

function applyTransform(object3d, transform) {
  if (!object3d || !transform) {
    return;
  }

  const scale = toVector3(transform.scale, [1, 1, 1]);
  const position = toVector3(transform.position, [0, 0, 0]);
  const rotationDegrees = toVector3(transform.rotationDegrees, [0, 0, 0]);

  object3d.scale.copy(scale);
  object3d.position.copy(position);
  object3d.rotation.set(
    THREE.MathUtils.degToRad(rotationDegrees.x),
    THREE.MathUtils.degToRad(rotationDegrees.y),
    THREE.MathUtils.degToRad(rotationDegrees.z)
  );
}

function fitCameraToObject(camera, controls, object3d, fitOffset = 1.2) {
  const box = new THREE.Box3().setFromObject(object3d);
  if (box.isEmpty()) {
    return;
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  const direction = new THREE.Vector3(1, 0.8, 1).normalize();
  camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 100, 100);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

function createLight(lightConfig) {
  const type = lightConfig.type;
  const intensity = Number(lightConfig.intensity ?? 1);
  let light;

  if (type === "AmbientLight") {
    light = new THREE.AmbientLight(lightConfig.color ?? "#ffffff", intensity);
  } else if (type === "HemisphereLight") {
    light = new THREE.HemisphereLight(
      lightConfig.skyColor ?? "#ffffff",
      lightConfig.groundColor ?? "#444444",
      intensity
    );
  } else if (type === "DirectionalLight") {
    light = new THREE.DirectionalLight(lightConfig.color ?? "#ffffff", intensity);
  } else if (type === "PointLight") {
    light = new THREE.PointLight(
      lightConfig.color ?? "#ffffff",
      intensity,
      Number(lightConfig.distance ?? 0),
      Number(lightConfig.decay ?? 2)
    );
  } else if (type === "SpotLight") {
    light = new THREE.SpotLight(
      lightConfig.color ?? "#ffffff",
      intensity,
      Number(lightConfig.distance ?? 0),
      Number(lightConfig.angle ?? Math.PI / 6),
      Number(lightConfig.penumbra ?? 0),
      Number(lightConfig.decay ?? 2)
    );
  } else {
    return null;
  }

  if (Array.isArray(lightConfig.position)) {
    light.position.copy(toVector3(lightConfig.position, [0, 0, 0]));
  }

  if ("castShadow" in lightConfig) {
    light.castShadow = Boolean(lightConfig.castShadow);
  }

  if (light.castShadow && light.shadow) {
    if (lightConfig.shadowMapSize) {
      light.shadow.mapSize.set(lightConfig.shadowMapSize, lightConfig.shadowMapSize);
    }
    if (typeof lightConfig.shadowBias === "number") {
      light.shadow.bias = lightConfig.shadowBias;
    }
    if (typeof lightConfig.shadowNormalBias === "number") {
      light.shadow.normalBias = lightConfig.shadowNormalBias;
    }
  }

  if (lightConfig.name) {
    light.name = String(lightConfig.name);
  }

  return light;
}

async function loadConfig(configUrl) {
  if (!configUrl) {
    return {};
  }

  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Config fetch failed: ${response.status}`);
  }
  return response.json();
}

function setStatus(statusEl, text, isError = false) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = text;
  statusEl.dataset.error = isError ? "1" : "0";
}

export async function bootBlenderRoomViewer(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount || mount.dataset.viewerReady === "1") {
    return;
  }

  const canvas = mount.querySelector(".blender-room-viewer-canvas");
  const statusEl = mount.querySelector("[data-viewer-status]");
  if (!canvas) {
    return;
  }

  setStatus(statusEl, "Loading scene and config...");

  try {
    const configFromFile = await loadConfig(mount.dataset.configUrl);
    const config = mergeDeep(DEFAULT_CONFIG, configFromFile);
    if (!config.modelUrl) {
      config.modelUrl = mount.dataset.modelUrl ?? "";
    }
    if (!config.modelUrl) {
      throw new Error("No modelUrl found in config or shortcode.");
    }

    const scene = new THREE.Scene();

    if (config.scene?.background) {
      scene.background = new THREE.Color(config.scene.background);
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: config.renderer.antialias !== false,
      alpha: Boolean(config.renderer.alpha),
      powerPreference: "high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (Object.prototype.hasOwnProperty.call(renderer, "useLegacyLights")) {
      renderer.useLegacyLights = false;
    }
    renderer.toneMapping = getToneMapping(config.renderer.toneMapping);
    renderer.toneMappingExposure = Number(config.renderer.toneMappingExposure ?? 1);
    renderer.shadowMap.enabled = config.renderer.shadowMapEnabled !== false;
    renderer.shadowMap.type = getShadowType(config.renderer.shadowMapType);

    if (config.renderer.clearColor) {
      renderer.setClearColor(new THREE.Color(config.renderer.clearColor));
    }

    const camera = new THREE.PerspectiveCamera(
      Number(config.camera.fov ?? 48),
      1,
      Number(config.camera.near ?? 0.01),
      Number(config.camera.far ?? 300)
    );
    camera.position.copy(toVector3(config.camera.position, [3, 2, 4]));

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(toVector3(config.camera.target, [0, 1, 0]));
    controls.enablePan = config.controls.enablePan !== false;
    controls.enableRotate = config.controls.enableRotate !== false;
    controls.enableZoom = config.controls.enableZoom !== false;
    controls.enableDamping = config.controls.enableDamping !== false;
    controls.dampingFactor = Number(config.controls.dampingFactor ?? 0.08);
    controls.minDistance = Number(config.controls.minDistance ?? 0.8);
    controls.maxDistance = Number(config.controls.maxDistance ?? 20);
    controls.minPolarAngle = Number(config.controls.minPolarAngle ?? 0);
    controls.maxPolarAngle = Number(config.controls.maxPolarAngle ?? Math.PI);
    controls.autoRotate = Boolean(config.controls.autoRotate);
    controls.autoRotateSpeed = Number(config.controls.autoRotateSpeed ?? 1);
    controls.update();

    const lightMap = new Map();
    for (const lightConfig of config.lights ?? []) {
      const light = createLight(lightConfig);
      if (!light) {
        continue;
      }
      scene.add(light);
      if (light.name) {
        lightMap.set(light.name, light);
      }
    }

    if (config.helpers?.grid) {
      const grid = new THREE.GridHelper(
        Number(config.helpers.gridSize ?? 12),
        Number(config.helpers.gridDivisions ?? 12)
      );
      scene.add(grid);
    }

    if (config.helpers?.axes) {
      const axes = new THREE.AxesHelper(Number(config.helpers.axesSize ?? 1.5));
      scene.add(axes);
    }

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(config.modelUrl);
    const model = gltf.scene ?? gltf.scenes?.[0];
    if (!model) {
      throw new Error("Model payload is empty.");
    }

    applyTransform(model, config.modelTransform);

    model.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      node.castShadow = config.modelShadows.castShadow !== false;
      node.receiveShadow = config.modelShadows.receiveShadow !== false;

      if (config.modelShadows.forceDoubleSide && node.material) {
        if (Array.isArray(node.material)) {
          for (const material of node.material) {
            material.side = THREE.DoubleSide;
          }
        } else {
          node.material.side = THREE.DoubleSide;
        }
      }
    });

    scene.add(model);

    if (config.camera.fitToModel) {
      fitCameraToObject(
        camera,
        controls,
        model,
        Number(config.camera.fitOffset ?? 1.2)
      );
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
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const api = {
      config,
      scene,
      camera,
      controls,
      renderer,
      setExposure(value) {
        renderer.toneMappingExposure = Number(value);
      },
      setCameraPosition(x, y, z) {
        camera.position.set(Number(x), Number(y), Number(z));
        controls.update();
      },
      setTarget(x, y, z) {
        controls.target.set(Number(x), Number(y), Number(z));
        controls.update();
      },
      setLightIntensity(name, value) {
        const light = lightMap.get(name);
        if (!light) {
          return false;
        }
        light.intensity = Number(value);
        return true;
      },
      listLights() {
        return Array.from(lightMap.keys());
      },
      dispose() {
        window.cancelAnimationFrame(rafId);
        controls.dispose();
        renderer.dispose();
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      }
    };

    window.blenderRoomViewer = window.blenderRoomViewer || {};
    window.blenderRoomViewer[mountId] = api;

    mount.dataset.viewerReady = "1";
    setStatus(statusEl, "Scene loaded. Tune config JSON and refresh to test changes.");
  } catch (error) {
    setStatus(statusEl, `Failed: ${error.message}`, true);
    console.error("blender-room-viewer", error);
  }
}
