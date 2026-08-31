---
title: "Blender Room GLB Lab"
date: 2026-08-31T17:00:00+08:00
draft: false
summary: "A configurable room.glb sandbox for camera, light, and control tuning."
categories:
- 3D
tags:
- blender
- glb
- threejs
---

This page loads /static/models/room.glb with a configurable rendering stack.

How to tune:
1. Edit /static/models/room-viewer.config.json
2. Refresh this page
3. Repeat until your camera and lighting setup is right

{{< blender_room_viewer
id="room-glb-lab"
height="72vh"
model="/models/room.glb"
config="/models/room-viewer.config.json"
>}}

Quick parameter map:
- camera.position: [x, y, z]
- camera.target: [x, y, z]
- camera.fitToModel: true or false
- controls.enablePan / enableRotate / enableZoom
- controls.autoRotate
- controls.minDistance / maxDistance
- controls.minPolarAngle / maxPolarAngle
- renderer.toneMappingExposure
- lights[].intensity
- lights[].position

Console helpers after page load:
- window.blenderRoomViewer["room-glb-lab"].setExposure(1.25)
- window.blenderRoomViewer["room-glb-lab"].setCameraPosition(2.8, 1.9, 4.3)
- window.blenderRoomViewer["room-glb-lab"].setTarget(0, 1.2, 0)
- window.blenderRoomViewer["room-glb-lab"].setLightIntensity("key-dir", 1.8)
