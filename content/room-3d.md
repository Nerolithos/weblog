---
title: "Room 3D Viewer"
date: 2026-08-31T18:40:00+08:00
draft: false
summary: "Standalone room.glb viewer with mouse-driven light source."
---

This is a standalone page for rendering /models/room.glb directly in the frontend.

<div
  id="room-front-viewer"
  class="blender-room-viewer-shell"
  style="--viewer-height: 74vh;"
  data-model-url="/models/room.glb"
>
  <div class="blender-room-viewer-canvas-wrap">
    <canvas class="blender-room-viewer-canvas" aria-label="Standalone room viewer"></canvas>
    <div class="blender-room-viewer-status" data-viewer-status>Loading 3D scene...</div>
  </div>

  <div class="blender-room-viewer-hints">
    <p>Mouse move: light source, drag: rotate, wheel: zoom, right button or Shift + drag: pan.</p>
  </div>
</div>

<script type="module" src="/js/room-front-viewer.js?v=20260831d"></script>
