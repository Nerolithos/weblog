// Minimal spine-ts based dual-pet demo for web
// This is framework-agnostic TypeScript you can copy into the weblog repo.
// It assumes you include the spine-ts webgl build on the page, exposing a global `spine` object
// (for example via a CDN script tag). Adjust to your actual spine-ts distribution.

/* global spine */

declare const spine: any;

export interface DualPetsOptions {
  canvas: HTMLCanvasElement;
  // Asset base path, e.g. "/pet/assets" or "./assets"
  assetBaseUrl?: string;
  // File names for rosmon & sussurro; you can change these to match extracted assets
  rosAtlas?: string;
  rosSkeleton?: string; // .skel or .json
  susAtlas?: string;
  susSkeleton?: string;
}

interface PetRuntime {
  skeleton: any;
  state: any;
  idleAnim: string | null;
  touchAnim: string | null;
  walkAnim: string | null;
  specialAnim: string | null; // only used by Sussurro
  baseX: number;
  baseY: number;
  moveDir: number; // -1, 0, 1
  moveSpeed: number;
  nextAutoWalk: number;
  autoWalkEnd: number;
  idleHoldUntil: number;
  playingSpecial: boolean;
}

export async function initDualPets(options: DualPetsOptions): Promise<void> {
  const {
    canvas,
    assetBaseUrl = "./assets",
    rosAtlas = "rosmon.atlas",
    rosSkeleton = "rosmon.skel",
    susAtlas = "build_char_298_susuro_summer#6.atlas",
    susSkeleton = "build_char_298_susuro_summer#6.skel",
  } = options;

  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
  if (!gl) throw new Error("WebGL not available");

  const assetManager = new spine.webgl.AssetManager(gl);

  const rosAtlasUrl = assetBaseUrl.replace(/\/$/, "") + "/" + rosAtlas;
  const rosSkelUrl = assetBaseUrl.replace(/\/$/, "") + "/" + rosSkeleton;
  const susAtlasUrl = assetBaseUrl.replace(/\/$/, "") + "/" + susAtlas;
  const susSkelUrl = assetBaseUrl.replace(/\/$/, "") + "/" + susSkeleton;

  assetManager.loadTextureAtlas(rosAtlasUrl);
  assetManager.loadBinary(rosSkelUrl);
  assetManager.loadTextureAtlas(susAtlasUrl);
  assetManager.loadBinary(susSkelUrl);

  await new Promise<void>((resolve, reject) => {
    (function wait() {
      if (assetManager.isLoadingComplete()) return resolve();
      if (assetManager.hasErrors()) return reject(new Error("Failed to load spine assets"));
      requestAnimationFrame(wait);
    })();
  });

  const renderer = new spine.webgl.SceneRenderer(canvas, gl, false);
  renderer.premultipliedAlpha = true;

  function buildPet(atlasUrl: string, skelUrl: string, flipX: boolean): PetRuntime {
    const atlas = assetManager.get(atlasUrl);
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    const skelBinary = new spine.SkeletonBinary(atlasLoader);
    const skelData = skelBinary.readSkeletonData(assetManager.get(skelUrl));

    const skeleton = new spine.Skeleton(skelData);
    const stateData = new spine.AnimationStateData(skelData);
    const state = new spine.AnimationState(stateData);

    if (flipX) skeleton.scaleX = -1;
    skeleton.scaleY = -1;

    const anims: string[] = [];
    for (let i = 0; i < skelData.animations.length; i++) {
      anims.push(skelData.animations[i].name as string);
    }

    let idle: string | null = null;
    let touch: string | null = null;
    let walk: string | null = null;
    let special: string | null = null;

    for (const a of anims) {
      const lower = a.toLowerCase();
      if (!touch && (lower.includes("touch") || lower.includes("tap"))) touch = a;
      else if (!walk && (lower.includes("walk") || lower.includes("move"))) walk = a;
      else if (!idle && lower.includes("idle")) idle = a;
      else if (!special && (lower.includes("special") || lower.includes("sp"))) special = a;
    }
    if (!idle && anims.length > 0) idle = anims[0];

    if (idle) state.setAnimation(0, idle, true);

    return {
      skeleton,
      state,
      idleAnim: idle,
      touchAnim: touch,
      walkAnim: walk,
      specialAnim: special,
      baseX: 0,
      baseY: 0,
      moveDir: 0,
      moveSpeed: 90,
      nextAutoWalk: performance.now() + 4000,
      autoWalkEnd: 0,
      idleHoldUntil: 0,
      playingSpecial: false,
    };
  }

  const ros = buildPet(rosAtlasUrl, rosSkelUrl, false);
  const sus = buildPet(susAtlasUrl, susSkelUrl, false);

  const worldWidth = canvas.width;
  const worldHeight = canvas.height;

  ros.baseX = worldWidth * 0.5;
  ros.baseY = worldHeight * 0.6;
  sus.baseX = ros.baseX;
  sus.baseY = ros.baseY + 30;

  function resetPosition(p: PetRuntime) {
    p.skeleton.x = p.baseX;
    p.skeleton.y = p.baseY;
  }

  resetPosition(ros);
  resetPosition(sus);

  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);

    function hit(p: PetRuntime): boolean {
      const bounds = new spine.SkeletonBounds();
      bounds.update(p.skeleton, true);
      return bounds.containsPoint(x, y);
    }

    const target = hit(sus) ? sus : hit(ros) ? ros : null;
    if (!target) return;

    if (target.touchAnim) {
      target.state.setAnimation(0, target.touchAnim, false);
      target.idleHoldUntil = performance.now() + 1200;
      target.moveDir = 0;
      target.playingSpecial = false;
    }
  });

  let lastFrame = performance.now();

  function updatePet(p: PetRuntime, now: number, dt: number) {
    p.state.update(dt / 1000);
    p.state.apply(p.skeleton);

    const elapsed = now;

    const inIdle = !!p.idleAnim && p.state.getCurrent(0)?.animation?.name === p.idleAnim;
    const idleBlocked = elapsed < p.idleHoldUntil;

    if (inIdle && !idleBlocked && elapsed >= p.nextAutoWalk && p.walkAnim) {
      p.moveDir = Math.random() < 0.5 ? -1 : 1;
      p.state.setAnimation(0, p.walkAnim, true);
      p.autoWalkEnd = elapsed + 1000 + Math.random() * 1500;
      p.nextAutoWalk = p.autoWalkEnd + 4000 + Math.random() * 3000;
    }

    if (p.moveDir !== 0) {
      const dx = p.moveSpeed * (dt / 1000) * p.moveDir;
      p.skeleton.x += dx;
      const margin = 60;
      if (p.skeleton.x < margin) p.skeleton.x = margin;
      if (p.skeleton.x > worldWidth - margin) p.skeleton.x = worldWidth - margin;
      if (elapsed >= p.autoWalkEnd) {
        p.moveDir = 0;
        if (p.idleAnim) p.state.setAnimation(0, p.idleAnim, true);
      }
    }

    p.skeleton.updateWorldTransform();
  }

  function renderPet(p: PetRuntime) {
    renderer.drawSkeleton(p.skeleton, true);
  }

  function frame() {
    const now = performance.now();
    const dt = now - lastFrame;
    lastFrame = now;

    updatePet(ros, now, dt);
    updatePet(sus, now, dt);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.begin();
    renderPet(ros);
    renderPet(sus);
    renderer.end();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
