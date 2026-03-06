// Minimal spine-ts dual pets demo for plain JS usage.
// Requires a global `spine` (spine-ts webgl bundle) and a <canvas>.
// Exposes window.DualPets.initDualPets(options).

// 注：canvas 的中心坐标为 (0, 0)， spine 人物的判定点在脚部，-300 的位置大约恰好站在底部。

(function (global) {
  function initDualPets(options) {
    var canvas = options.canvas;
    var assetBaseUrl = (options.assetBaseUrl || "./assets").replace(/\/$/, "");
    var rosAtlas = options.rosAtlas || "rosmon.atlas";
    var rosSkeleton = options.rosSkeleton || "rosmon.skel";
    // 注意：Resources 目录里实际文件名已经去掉了 #6
    // build_char_298_susuro_summer.atlas / .skel / .png
    var susAtlas = options.susAtlas || "build_char_298_susuro_summer.atlas";
    var susSkeleton = options.susSkeleton || "build_char_298_susuro_summer.skel";

    var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL not available");

    var spineNS = global.spine;
    var assetManager = new spineNS.webgl.AssetManager(gl);

    var rosAtlasUrl = assetBaseUrl + "/" + rosAtlas;
    var rosSkelUrl = assetBaseUrl + "/" + rosSkeleton;
    var susAtlasUrl = assetBaseUrl + "/" + susAtlas;
    var susSkelUrl = assetBaseUrl + "/" + susSkeleton;

    assetManager.loadTextureAtlas(rosAtlasUrl);
    assetManager.loadBinary(rosSkelUrl);
    assetManager.loadTextureAtlas(susAtlasUrl);
    assetManager.loadBinary(susSkelUrl);

    function waitForAssets(done) {
      function loop() {
        if (assetManager.isLoadingComplete()) return done();
        if (assetManager.hasErrors()) throw new Error("Failed to load spine assets");
        requestAnimationFrame(loop);
      }
      loop();
    }

    waitForAssets(function () {
      var renderer = new spineNS.webgl.SceneRenderer(canvas, gl, false);
      renderer.premultipliedAlpha = true;

      function buildPet(kind, atlasUrl, skelUrl) {
        var atlas = assetManager.get(atlasUrl);
        var atlasLoader = new spineNS.AtlasAttachmentLoader(atlas);
        var skelBinary = new spineNS.SkeletonBinary(atlasLoader);
        var skelData = skelBinary.readSkeletonData(assetManager.get(skelUrl));

        var skeleton = new spineNS.Skeleton(skelData);
        var stateData = new spineNS.AnimationStateData(skelData);
        var state = new spineNS.AnimationState(stateData);

        // 让角色保持正立：WebGL 这里使用正常的 Y 轴朝上坐标，不再翻转。
        skeleton.scaleY = 1;

        var anims = [];
        for (var i = 0; i < skelData.animations.length; i++) {
          anims.push(skelData.animations[i].name);
        }

        var idle = null, touch = null, walk = null, special = null;

        if (kind === "ros") {
          // RosMon：按照 run_dual_pets.cpp 中的逻辑确定 touch / key3(待机) / move
          var touchIndex = -1;
          for (var i = 0; i < anims.length; i++) {
            var n = anims[i];
            var lower = n.toLowerCase();
            if (lower.indexOf("touch") !== -1 || lower.indexOf("tap") !== -1) {
              touchIndex = i;
              break;
            }
          }
          if (touchIndex === -1 && anims.length > 1) touchIndex = 1;

          var indicesForNumbers = [];
          for (var j = 0; j < anims.length; j++) {
            if (j === touchIndex) continue;
            indicesForNumbers.push(j);
          }

          var key3Index = -1;
          if (indicesForNumbers.length >= 3) key3Index = indicesForNumbers[2];
          else if (anims.length > 0) key3Index = 0;

          var moveIndex = -1;
          for (var k = 0; k < anims.length; k++) {
            var n2 = anims[k];
            var lower2 = n2.toLowerCase();
            if (lower2.indexOf("move") !== -1 || lower2.indexOf("walk") !== -1) {
              moveIndex = k;
              break;
            }
          }
          if (moveIndex === -1 && anims.length >= 2) moveIndex = 1;

          idle = key3Index >= 0 ? anims[key3Index] : (anims.length > 0 ? anims[0] : null);
          touch = touchIndex >= 0 ? anims[touchIndex] : null;
          walk = moveIndex >= 0 ? anims[moveIndex] : null;

          // 让 RosMon 略微缩小一些（仅影响 Ros，不影响 Sussurro）。
          var rosScale = 0.95;
          skeleton.scaleX *= rosScale;
          skeleton.scaleY *= rosScale;
        } else {
          // Sussurro：固定索引映射 1 touch, 2 walk, 3 idle, 6 special
          function safe(idx) { return (idx >= 0 && idx < anims.length) ? idx : -1; }
          var tIdx = safe(1);
          var wIdx = safe(2);
          var iIdx = safe(3);
          var sIdx = safe(6);

          idle = iIdx >= 0 ? anims[iIdx] : (anims.length > 0 ? anims[0] : null);
          touch = tIdx >= 0 ? anims[tIdx] : null;
          walk = wIdx >= 0 ? anims[wIdx] : null;
          special = sIdx >= 0 ? anims[sIdx] : null;
        }

        if (!idle && anims.length > 0) idle = anims[0];
        if (idle) state.setAnimation(0, idle, true);

        return {
          kind: kind,
          skeleton: skeleton,
          state: state,
          idleAnim: idle,
          touchAnim: touch,
          walkAnim: walk,
          specialAnim: special,
          baseX: 0,
          baseY: 0,
          moveDir: 0,
          moveSpeed: 90,
          leftMargin: 80,
          rightMargin: 80,
          autoWalking: false,
          nextAutoWalk: performance.now() + 4000,
          autoWalkEnd: 0,
          idleHoldUntil: 0,
          playingSpecial: false,
          nextWalkDir: 0, // 边界反弹后，下一次行走的强制方向（-1 左 / 1 右 / 0 随机）
          isDragging: false,
          // 拖拽结束后的下落插值状态
          isDropping: false,
          dropStartY: 0,
          dropStartTime: 0,
          // 下落速度（单位：每毫秒多少坐标单位），可自行微调；
          // 例如 0.8 ≈ 每秒 800 像素左右。
          dropSpeedPerMs: 0.9
        };
      }

      var ros = buildPet("ros", rosAtlasUrl, rosSkelUrl);
      var sus = buildPet("sus", susAtlasUrl, susSkelUrl);

      var worldWidth = canvas.width;
      var worldHeight = canvas.height;

      // 水平活动边界：人物只能在 [WALK_MIN_X, WALK_MAX_X] 范围内来回走动
      // 根据你的最新观测，假设 (0,0) 在画布中心，
      // 左侧边界改为 -350，右侧边界保留在 350。
      var WALK_MIN_X = -350;
      var WALK_MAX_X = 350;

      // 最简单版本：用固定坐标把角色放进画布里，
      // 先确保能看见，再考虑更精细的“站在底边”。
      (function layoutCharacters() {
        var w = worldWidth;
        var h = worldHeight;

        var groundY = -300;

        // 初始放在你指定的位置
        ros.skeleton.x = -300;
        ros.skeleton.y = groundY;
        ros.skeleton.updateWorldTransform();
        ros.baseX = ros.skeleton.x;
        ros.baseY = ros.skeleton.y;

        sus.skeleton.x = 300;
        sus.skeleton.y = groundY;
        sus.skeleton.updateWorldTransform();
        sus.baseX = sus.skeleton.x;
        sus.baseY = sus.skeleton.y;
      })();

      // 将屏幕坐标转换为 Spine 世界坐标。
      function screenToWorld(ev) {
        var rect = canvas.getBoundingClientRect();
        var sx = (ev.clientX - rect.left) * (canvas.width / rect.width);
        var sy = (ev.clientY - rect.top) * (canvas.height / rect.height);
        // 以画布中心为 (0,0)，X 向右为正，Y 向上为正。
        var wx = sx - canvas.width / 2;
        var wy = canvas.height / 2 - sy;
        return { x: wx, y: wy };
      }

      // 仿照 C++ 版 computeSkeletonBounds / computeSkeletonYBounds：
      // 直接用 RegionAttachment / MeshAttachment 的 world vertices 计算包围盒，
      // 不依赖 Spine 的 SkeletonBounds（因为当前骨骼没有单独的 bounding box）。
      function computeWorldBounds(skeleton) {
        var minX = Number.POSITIVE_INFINITY;
        var maxX = Number.NEGATIVE_INFINITY;
        var minY = Number.POSITIVE_INFINITY;
        var maxY = Number.NEGATIVE_INFINITY;

        var drawOrder = skeleton.drawOrder;
        for (var i = 0; i < drawOrder.length; i++) {
          var slot = drawOrder[i];
          var att = slot.attachment;
          if (!att) continue;

          if (att instanceof spineNS.RegionAttachment) {
            var verts = new Float32Array(8);
            att.computeWorldVertices(slot.bone, verts, 0, 2);
            for (var v = 0; v < 4; v++) {
              var vx = verts[v * 2];
              var vy = verts[v * 2 + 1];
              if (vx < minX) minX = vx;
              if (vx > maxX) maxX = vx;
              if (vy < minY) minY = vy;
              if (vy > maxY) maxY = vy;
            }
          } else if (att instanceof spineNS.MeshAttachment) {
            var worldLength = att.worldVerticesLength;
            var worldVerts = new Float32Array(worldLength);
            att.computeWorldVertices(slot, 0, worldLength, worldVerts, 0, 2);
            for (var vi = 0; vi < worldLength / 2; vi++) {
              var vx2 = worldVerts[vi * 2];
              var vy2 = worldVerts[vi * 2 + 1];
              if (vx2 < minX) minX = vx2;
              if (vx2 > maxX) maxX = vx2;
              if (vy2 < minY) minY = vy2;
              if (vy2 > maxY) maxY = vy2;
            }
          }
        }

        if (!isFinite(minX)) {
          minX = maxX = skeleton.x;
          minY = maxY = skeleton.y;
        }
        return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
      }

      function hitTestAt(worldX, worldY) {
        function hit(p) {
          var b = computeWorldBounds(p.skeleton);
          return worldX >= b.minX && worldX <= b.maxX && worldY >= b.minY && worldY <= b.maxY;
        }
        var target = hit(sus) ? sus : (hit(ros) ? ros : null);
        return target;
      }

      // ==== 鼠标交互：短按触摸 + 拖拽 ====
      var draggingPet = null;
      var pressedPet = null;
      var isMouseDown = false;
      var mouseDownTime = 0;
      var mouseDownPos = { x: 0, y: 0 };
      var dragOffset = { x: 0, y: 0 };
      var DRAG_THRESHOLD2 = 25; // 世界坐标中约 5 像素的位移阈值

      function startDrag(target, pos) {
        draggingPet = target;
        draggingPet.isDragging = true;
        draggingPet.moveDir = 0;
        draggingPet.autoWalking = false;
        dragOffset.x = draggingPet.skeleton.x - pos.x;
        dragOffset.y = draggingPet.skeleton.y - pos.y;
        if (draggingPet.idleAnim) {
          draggingPet.state.setAnimation(0, draggingPet.idleAnim, true);
        }
      }

      function finishClick(target, nowMs) {
        if (!target || !target.touchAnim) return;
        var now = nowMs || performance.now();
        target.state.setAnimation(0, target.touchAnim, false);
        if (target.idleAnim) {
          target.state.addAnimation(0, target.idleAnim, true, 0);
        }
        target.idleHoldUntil = now + 1200;
        target.moveDir = 0;
        target.autoWalking = false;
        target.playingSpecial = false;
        target.nextAutoWalk = now + 4000 + Math.random() * 3000;
      }

      function finishDrag(target, nowMs) {
        if (!target) return;
        var now = nowMs || performance.now();
        // 开始一个平滑下落动画：从当前 Y 插值回 -300
        target.isDragging = false;
        target.isDropping = true;
        target.dropStartY = target.skeleton.y;
        target.dropStartTime = now;
        if (target.idleAnim) {
          target.state.setAnimation(0, target.idleAnim, true);
        }
        target.idleHoldUntil = now + 1000;
        target.nextAutoWalk = now + 4000 + Math.random() * 3000;
      }

      canvas.addEventListener("mousedown", function (ev) {
        var pos = screenToWorld(ev);
        isMouseDown = true;
        mouseDownTime = performance.now();
        mouseDownPos = pos;
        pressedPet = hitTestAt(pos.x, pos.y);
        draggingPet = null;
      });

      canvas.addEventListener("mousemove", function (ev) {
        if (!isMouseDown || !pressedPet) return;
        var pos = screenToWorld(ev);

        // 若尚未进入拖拽，检查是否移动超过阈值，超过则开始拖拽
        if (!draggingPet) {
          var dx0 = pos.x - mouseDownPos.x;
          var dy0 = pos.y - mouseDownPos.y;
          if (dx0 * dx0 + dy0 * dy0 < DRAG_THRESHOLD2) return;
          startDrag(pressedPet, pos);
        }

        if (draggingPet) {
          var newX = pos.x + dragOffset.x;
          var newY = pos.y + dragOffset.y;

          // X 始终限制在 [-350, 350] 区间内
          if (newX < WALK_MIN_X) newX = WALK_MIN_X;
          if (newX > WALK_MAX_X) newX = WALK_MAX_X;

          // Y 不允许小于 -300（不能被往下拖出地面）
          if (newY < -300) newY = -300;

          draggingPet.skeleton.x = newX;
          draggingPet.skeleton.y = newY;
          draggingPet.skeleton.updateWorldTransform();
        }
      });

      function handleMouseUp(ev) {
        if (!isMouseDown) return;
        var nowMs = performance.now();

        if (draggingPet) {
          finishDrag(draggingPet, nowMs);
        } else if (pressedPet) {
          var held = nowMs - mouseDownTime;
          // 小于 500ms 视为“短按触摸”
          if (held < 500) {
            finishClick(pressedPet, nowMs);
          }
        }

        isMouseDown = false;
        draggingPet = null;
        pressedPet = null;
      }

      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("mouseleave", handleMouseUp);

      var lastFrame = performance.now();

      function updatePet(p, now, dt) {
        p.state.update(dt / 1000);
        p.state.apply(p.skeleton);

        // 拖拽中只更新动画，不进行自动行走和边界判定
        if (p.isDragging) {
          p.skeleton.updateWorldTransform();
          return;
        }

        // 拖拽结束后的下落插值：用恒定速度 dropSpeedPerMs 让角色从当前 Y 落回 -300
        if (p.isDropping) {
          var targetY = -300;
          var dy = targetY - p.skeleton.y;
          var dist = Math.abs(dy);
          // dt 是毫秒，这里用恒定速度推进，距离越远耗时越久，但速度相同。
          var maxStep = p.dropSpeedPerMs * dt;
          if (dist <= maxStep) {
            p.skeleton.y = targetY;
            p.isDropping = false;
          } else if (dist > 0) {
            var dirY = dy > 0 ? 1 : -1;
            p.skeleton.y += dirY * maxStep;
          }
          p.skeleton.updateWorldTransform();
          // 下落过程中也不做自动行走逻辑
          return;
        }

        var elapsed = now;
        var cur = p.state.getCurrent(0);
        var inIdle = !!p.idleAnim && cur && cur.animation && cur.animation.name === p.idleAnim;
        var idleBlocked = elapsed < p.idleHoldUntil;

        if (inIdle && !idleBlocked && elapsed >= p.nextAutoWalk && p.walkAnim) {
          // 使用固定区间 [WALK_MIN_X, WALK_MAX_X] 控制水平活动范围
          var canGoLeft = p.skeleton.x > WALK_MIN_X + 1;
          var canGoRight = p.skeleton.x < WALK_MAX_X - 1;
          if (!canGoLeft && !canGoRight) {
            p.nextAutoWalk = elapsed + 5000 + Math.random() * 3000;
          } else {
            var dir = 0;

            // 如果上一次撞到了某一侧边界，则强制下一次朝反方向走
            if (p.nextWalkDir === -1 || p.nextWalkDir === 1) {
              dir = p.nextWalkDir;
              p.nextWalkDir = 0;
            } else {
              if (!canGoLeft && canGoRight) dir = 1;
              else if (!canGoRight && canGoLeft) dir = -1;
              else dir = Math.random() < 0.5 ? -1 : 1;
            }

            p.moveDir = dir;
            p.autoWalking = true;

            var curScaleX = (p.skeleton.scaleX === 0 ? 1 : p.skeleton.scaleX);
            var absScaleX = Math.abs(curScaleX) || 1;
            p.skeleton.scaleX = dir < 0 ? -absScaleX : absScaleX;

            p.state.setAnimation(0, p.walkAnim, true);

            var dur = 1000 + Math.random() * 1500;
            p.autoWalkEnd = elapsed + dur;
            p.nextAutoWalk = p.autoWalkEnd + 4000 + Math.random() * 3000;
          }
        }

        if (p.moveDir !== 0) {
          var dx = p.moveSpeed * (dt / 1000) * p.moveDir;
          p.skeleton.x += dx;

          var hitBoundary = false;

          // 触到左边界：立刻停下、翻转向右、切回待机，并记录下次行走方向
          if (p.skeleton.x <= WALK_MIN_X && p.moveDir < 0) {
            p.skeleton.x = WALK_MIN_X;
            hitBoundary = true;

            var absX = Math.abs(p.skeleton.scaleX || 1) || 1;
            p.skeleton.scaleX = absX; // 面向右侧

            p.moveDir = 0;
            p.autoWalking = false;
            if (p.idleAnim) p.state.setAnimation(0, p.idleAnim, true);

            p.nextWalkDir = 1; // 下一次只能往右走
            p.nextAutoWalk = elapsed + 4000 + Math.random() * 3000;
          }

          // 触到右边界：立刻停下、翻转向左、切回待机，并记录下次行走方向
          if (!hitBoundary && p.skeleton.x >= WALK_MAX_X && p.moveDir > 0) {
            p.skeleton.x = WALK_MAX_X;
            hitBoundary = true;

            var absX2 = Math.abs(p.skeleton.scaleX || 1) || 1;
            p.skeleton.scaleX = -absX2; // 面向左侧

            p.moveDir = 0;
            p.autoWalking = false;
            if (p.idleAnim) p.state.setAnimation(0, p.idleAnim, true);

            p.nextWalkDir = -1; // 下一次只能往左走
            p.nextAutoWalk = elapsed + 4000 + Math.random() * 3000;
          }

          // 正常走完一段自动行走
          if (!hitBoundary && elapsed >= p.autoWalkEnd) {
            p.moveDir = 0;
            p.autoWalking = false;
            if (p.idleAnim) p.state.setAnimation(0, p.idleAnim, true);
          }
        }

        p.skeleton.updateWorldTransform();
      }

      function renderPet(p) {
        renderer.drawSkeleton(p.skeleton, true);
      }

      function frame() {
        var now = performance.now();
        var dt = now - lastFrame;
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
    });
  }

  global.DualPets = global.DualPets || {};
  global.DualPets.initDualPets = initDualPets;
})(window);
