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

    // 主布局容器（用于整体缩放以适配不同屏幕尺寸）
    var mainRowEl = document.getElementById("main-row");

    // 简单对话框 DOM 与台词库
    var dialogEl = document.getElementById("pet-dialog");
    var dialogHideTimer = null;
    var currentDialogPet = null; // 当前对白框所属的角色
    var dialogOffsetX = 0;       // 白框相对角色包围盒中心的世界坐标偏移（X）
    var dialogOffsetY = -7;      // 白框相对白框顶部基准（b.maxY）的世界坐标偏移（Y）

    // 右键菜单 DOM
    var menuEl = document.getElementById("pet-menu");
    var currentMenuPet = null;
    var menuHideTimer = null;
    var menuHovering = false;

    // 终端风格提示框 DOM
    var terminalEl = document.getElementById("terminal-dialog");
    var terminalPre = terminalEl ? terminalEl.querySelector("pre") : null;
    var terminalHideTimer = null;
    var terminalCountdownTimer = null;

    // 蓝屏覆盖层 DOM（仅盖住宠物 canvas 区域）
    var errorOverlayEl = document.getElementById("error-overlay");
    var bsodTextEl = document.getElementById("bsod-text");
    var errorOverlayTimer = null;
    var rebootTimer = null;
    var bsodLineTimer = null;
    var bsodKeyHandler = null;

    // 侧边终端 DOM
    var arkTermOutput = document.getElementById("ark-terminal-output");
    var arkTermInput = document.getElementById("ark-terminal-input");
    var arkTermBody = document.getElementById("ark-terminal-body");

    var dialogLines = {
      ros: [
        "Am I really here ... with you?",
        "Save your time, I'm just a program.",
        "Feels like, I'm running in circles.",
        "...But at least I'm with you, right?",
        "..."
      ],
      sus: [
        "...Oh, you noticed me.",
        "Could you stay here a bit longer?",
        "The background here seems quite unreal.",
        "I wanna pet your head too...",
        "..."
      ]
    };

    var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL not available");

    var spineNS = global.spine;
    var assetManager = new spineNS.webgl.AssetManager(gl);

    // 简单的剪贴板工具：优先使用 Clipboard API，失败时退化为隐藏 textarea + execCommand
    function copyTextToClipboard(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
          return;
        }
      } catch (e) {
        // 忽略，继续尝试退化方案
      }

      try {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } catch (e2) {
          // 旧 API 失败则静默忽略，不打断其他逻辑
        }
        document.body.removeChild(textarea);
      } catch (e3) {
        // 最终失败时也不影响原有行为
      }
    }

    // 侧边终端初始化
    function initArkTerminal() {
      if (!arkTermOutput || !arkTermInput) return;

      var PROMPT = "(base) ➜ Arkpets git:(main) ✗ ";

      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function promptHtml() {
        return "(base) ➜ " +
          '<span class="ark-prompt-project">Arkpets</span> ' +
          '<span class="ark-prompt-git">git:(</span>' +
          '<span class="ark-prompt-main">main</span>' +
          '<span class="ark-prompt-git">)</span> ' +
          '<span class="ark-prompt-x">✗</span> ';
      }

      function htmlLine(text) {
        return escapeHtml(text) + "<br>";
      }

      function pad2(n) {
        return (n < 10 ? "0" : "" ) + n;
      }

      function formatLoginTime() {
        var d = new Date();
        var yy = (d.getFullYear() % 100);
        var MM = d.getMonth() + 1;
        var DD = d.getDate();
        var hh = d.getHours();
        var mm = d.getMinutes();
        var ss = d.getSeconds();
        return pad2(yy) + pad2(MM) + pad2(DD) + " " + pad2(hh) + ":" + pad2(mm) + ":" + pad2(ss);
      }

      var headerHtml = htmlLine("Last login: " + formatLoginTime() + " on ttys000") + "<br>";
      var bodyHtml = "" +
        promptHtml() + escapeHtml("python run ArkPets") + "<br>" +
        htmlLine("ArkPets daemon starting... ") +
        htmlLine("(c) pseudogryph L.T.D.") + "<br>" +
        htmlLine("input interface ready:") +
        htmlLine("--left click") +
        htmlLine("--right click") +
        htmlLine("--drag") + "<br>" +
        htmlLine("stdin stream interrupted") +
        htmlLine("tty reassigned") +
        htmlLine("process id: unknown") + "<br>" +
        htmlLine("For more help on ArkPets, head to ▇▇▇▇▇▇▇▇, or run 'AP COMMAND --help'.");

      arkTermOutput.innerHTML = headerHtml + bodyHtml;
      arkTermInput.value = "";

      function appendHtml(html) {
        arkTermOutput.innerHTML += html;
        if (arkTermBody) {
          arkTermBody.scrollTop = arkTermBody.scrollHeight;
        }
      }

      arkTermInput.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        var cmd = arkTermInput.value || "";
        arkTermInput.value = "";

        // 历史区记录完整的一行带颜色的提示符 + 命令文本
        var html = "<br>" + promptHtml() + escapeHtml(cmd) + "<br>";

        if (cmd === "AP COMMAND --help") {
          // 帮助信息：第一行使用纯红色 (255,0,0)，其余保持默认文字颜色
          html += '<span style="color:#ff0000">WARNING SOURCE CODE CORRUPTED</span><br>';
          html += htmlLine('usage: ap [option (e.g. "-c")] [arg]');
          html += htmlLine('Options (and corresponding environment variables):');
          html += htmlLine('-c    : to answer the 3 questions given by the pets, use one word as arg.');
          html += htmlLine('-e    : enlarge lower-cases , decode: +3, then use as arg.');
        } else if (cmd === "python run ArkPets") {
          // python run ArkPets 的固定回复，其中 ALWAYS 使用纯红色 (255,0,0)
          html += escapeHtml("ArkPets is ") + '<span style="color:#ff0000">ALWAYS</span>' + escapeHtml(" running...") + "<br>";
        } else if (cmd === "ls") {
          // 模拟 ls，两行输出，第二行 Resources 使用与 ArkPets 相同的青蓝色
          html += "pets.js       index.html         SoulContainer4.8.js<br>";
          html += 'pets.ts       <span class="ark-prompt-project">Resources</span><br>';
        } else if (cmd === "pwd") {
          // 模拟 pwd 输出当前目录
          html += escapeHtml("/Users/Admin/Projects/SoulContainCorp/ArkPets") + "<br>";
        } else if (cmd.trim() !== "") {
          // 其他未定义命令：模仿 zsh 的 command not found 提示
          html += "zsh: command not found: " + escapeHtml(cmd) + "<br>";
        }

        // 当前输入行的提示符保留在最底部，形成新的一行等待输入
        appendHtml(html);
      });
    }

    // 整体缩放以适配屏幕尺寸
    function applyLayoutScale() {
      if (!mainRowEl) return;
      var BASE_WIDTH = 960 + 24 + 420; // 画布 + 间距 + 侧边终端
      var BASE_HEIGHT = 640;           // 以画布高度为基准
      var vw = window.innerWidth || document.documentElement.clientWidth || BASE_WIDTH;
      var vh = window.innerHeight || document.documentElement.clientHeight || BASE_HEIGHT;
      var scale = Math.min(vw / BASE_WIDTH, vh / BASE_HEIGHT, 1);
      mainRowEl.style.transformOrigin = "center center";
      mainRowEl.style.transform = "scale(" + scale + ")";
    }

    // 在 Spine 初始化前先把终端与布局缩放设置好
    initArkTerminal();
    applyLayoutScale();
    window.addEventListener("resize", applyLayoutScale);

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

      // 将 Spine 世界坐标转换到浏览器窗口坐标，用于摆放对话框
      function worldToClient(wx, wy) {
        var rect = canvas.getBoundingClientRect();
        var sx = (wx + canvas.width / 2) * (rect.width / canvas.width);
        var sy = (canvas.height / 2 - wy) * (rect.height / canvas.height);
        return {
          x: rect.left + sx,
          y: rect.top + sy
        };
      }

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

      function showPetMenu(pet, clientX, clientY) {
        if (!menuEl) return;
        currentMenuPet = pet;
        menuEl.style.left = clientX + "px";
        menuEl.style.top = clientY + "px";
        menuEl.style.opacity = "1";
        menuEl.style.pointerEvents = "auto";
        menuEl.style.transform = "translateY(0)";

        // 1.5 秒后若未选择则自动淡出；但若鼠标仍停留在菜单上，则继续等待
        if (menuHideTimer !== null) {
          clearTimeout(menuHideTimer);
          menuHideTimer = null;
        }
        function scheduleCheck() {
          menuHideTimer = setTimeout(function () {
            if (!menuHovering) {
              hidePetMenu();
            } else {
              // 仍在菜单上，则稍后再检查一次
              scheduleCheck();
            }
          }, 1500);
        }
        scheduleCheck();
      }

      function hidePetMenu() {
        if (!menuEl) return;
        menuEl.style.opacity = "0";
        menuEl.style.pointerEvents = "none";
        menuEl.style.transform = "translateY(-4px)";
        currentMenuPet = null;

        if (menuHideTimer !== null) {
          clearTimeout(menuHideTimer);
          menuHideTimer = null;
        }
      }

      // 启动蓝屏覆盖：逐行打印 ARKPETS 文本，并等待 Enter
      function startBsodOverlay() {
        if (!errorOverlayEl || !bsodTextEl) return;

        // 清理蓝屏相关的计时器与键盘监听
        if (bsodLineTimer !== null) {
          clearTimeout(bsodLineTimer);
          bsodLineTimer = null;
        }
        if (bsodKeyHandler) {
          window.removeEventListener("keydown", bsodKeyHandler);
          bsodKeyHandler = null;
        }

        // 隐藏对白框，避免“穿透”蓝屏
        if (dialogEl) {
          dialogEl.style.opacity = "0";
          currentDialogPet = null;
        }

        // 显示蓝屏覆盖层
        errorOverlayEl.style.opacity = "1";
        errorOverlayEl.style.pointerEvents = "auto";
        bsodTextEl.textContent = "";

        var lines = [
          " :( ",
          "ARKPETS-3.1 (c) pseudogryph L.T.D.",
          "_",
          "An error has occurred. To continue:",
          "Press Enter to restart, or",
          "Press CTRL+V in another ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ _",
          "Error: 42 : 0x2A : ▇▇▇▇▇",
          "_",
          "Waiting (0/3) ... Press Enter Please _",
          "Waiting (1/3) ... Press Enter Please _",
          "Waiting (2/3) ... Press Enter Please _"
        ];

        var idx = 0;
        var lineDelay = 250; // 每行之间的间隔，毫秒

        function appendNextLine() {
          if (idx < lines.length) {
            if (idx === 0) {
              bsodTextEl.textContent = lines[0];
            } else {
              bsodTextEl.textContent += "\n" + lines[idx];
            }
            idx++;
            bsodLineTimer = setTimeout(appendNextLine, lineDelay);
          } else {
            bsodLineTimer = null;

            // 所有行输出完毕后，等待用户按下 Enter
            bsodKeyHandler = function (ev) {
              if (ev.key === "Enter") {
                window.removeEventListener("keydown", bsodKeyHandler);
                bsodKeyHandler = null;

                // 按下 Enter 时，在蓝屏上再追加一行告别信息
                if (bsodTextEl) {
                  bsodTextEl.textContent += "\nWaiting (3/3) ...  GOODBYE_";
                }

                // 模仿“Press Enter to restart”：稍等 0.5 秒再恢复
                rebootTimer = setTimeout(function () {
                  errorOverlayEl.style.opacity = "0";
                  errorOverlayEl.style.pointerEvents = "none";
                  // 为了彻底“重启”，保持原语义，重载页面重新初始化动画循环
                  window.location.reload();
                }, 500);
              }
            };
            window.addEventListener("keydown", bsodKeyHandler);
          }
        }

        appendNextLine();
      }

      function showTerminalError() {
        // 若终端不存在，则直接退化为蓝屏
        if (!terminalEl || !terminalPre) {
          startBsodOverlay();
          return;
        }

        // 清理所有可能存在的计时器与键盘监听，避免多次触发叠加
        if (terminalHideTimer !== null) {
          clearTimeout(terminalHideTimer);
          terminalHideTimer = null;
        }
        if (terminalCountdownTimer !== null) {
          clearInterval(terminalCountdownTimer);
          terminalCountdownTimer = null;
        }
        if (errorOverlayTimer !== null) {
          clearTimeout(errorOverlayTimer);
          errorOverlayTimer = null;
        }
        if (rebootTimer !== null) {
          clearTimeout(rebootTimer);
          rebootTimer = null;
        }
        if (bsodLineTimer !== null) {
          clearTimeout(bsodLineTimer);
          bsodLineTimer = null;
        }
        if (bsodKeyHandler) {
          window.removeEventListener("keydown", bsodKeyHandler);
          bsodKeyHandler = null;
        }

        // 确保蓝屏覆盖层当前处于隐藏状态
        if (errorOverlayEl) {
          errorOverlayEl.style.opacity = "0";
          errorOverlayEl.style.pointerEvents = "none";
        }

        // 红色终端基础内容
        var baseLines = [
          "CRITICAL WARNING",
          "> [authd] REQUEST REJECTED (401 UNAUTHORIZED)",
          "> [authd] ACCESS DENIED (403 FORBIDDEN)",
          "> RUNTIME FAULT: undefined behavior detected",
          "> MEMORY STATE: CORRUPTED",
          "> PROCESS ABORTED.",
          ""
        ];

        var count = 5;

        function renderCountdown() {
          var lines = baseLines.slice();
          lines.push("> Rebooting in: " + count + "...");
          terminalPre.textContent = lines.join("\n");
        }

        // 显示终端对话框，并立刻渲染第一帧（5 秒）
        terminalEl.style.opacity = "1";
        terminalEl.style.pointerEvents = "auto";
        renderCountdown();

        terminalCountdownTimer = setInterval(function () {
          count -= 1;
          if (count < 0) return;
          renderCountdown();

          if (count === 0) {
            clearInterval(terminalCountdownTimer);
            terminalCountdownTimer = null;

            // 0 秒后稍等 0.1 秒，把当前终端里的所有可见字符“融化”为 0
            setTimeout(function () {
              if (!terminalPre) return;
              var src = terminalPre.textContent || "";
              var out = "";
              for (var i = 0; i < src.length; i++) {
                var ch = src.charAt(i);
                out += (ch === "\n" || ch === "\r") ? ch : "0";
              }
              terminalPre.textContent = out;
            }, 100);

            // 倒计时为 0 后等待 0.5 秒，再切换到蓝屏覆盖
            errorOverlayTimer = setTimeout(function () {
              terminalEl.style.opacity = "0";
              terminalEl.style.pointerEvents = "none";
              startBsodOverlay();
            }, 500);
          }
        }, 1000);
      }

      function placeDialogForPet(pet) {
        if (!dialogEl) return;
        if (!pet) return;

        // 把对话框放在角色头顶稍下的位置，X 轴略微随机偏移，且限制在可视范围内
        var b = computeWorldBounds(pet.skeleton);
        var baseWx = (b.minX + b.maxX) * 0.5;
        // 使用当前记录的偏移量，不再在这里重新随机
        var wx = baseWx + dialogOffsetX;
        if (wx < WALK_MIN_X) wx = WALK_MIN_X;
        if (wx > WALK_MAX_X) wx = WALK_MAX_X;
        var wy = b.maxY + dialogOffsetY;
        var clientPos = worldToClient(wx, wy);
        dialogEl.style.left = clientPos.x + "px";
        dialogEl.style.top = clientPos.y + "px";
      }

      function showPetDialog(pet) {
        if (!dialogEl) return;

        var pool = dialogLines[pet.kind] || dialogLines.ros;
        if (!pool || !pool.length) return;
        var idx = Math.floor(Math.random() * pool.length);
        dialogEl.textContent = pool[idx];

        // 根据角色切换对白文字颜色
        if (pet.kind === "sus") {
          dialogEl.style.color = "#967fa4"; // Sussurro
        } else if (pet.kind === "ros") {
          dialogEl.style.color = "#8eb2bc"; // Rosmon
        }

        // 为这一次对白随机一个水平偏移量，仅在创建对白时执行一次
        var b = computeWorldBounds(pet.skeleton);
        var baseWx = (b.minX + b.maxX) * 0.5;
        var offsetRange = 60;
        var rawOffsetX = (Math.random() * 2 - 1) * offsetRange;
        var wx = baseWx + rawOffsetX;
        if (wx < WALK_MIN_X) wx = WALK_MIN_X;
        if (wx > WALK_MAX_X) wx = WALK_MAX_X;
        dialogOffsetX = wx - baseWx;
        dialogOffsetY = -7;

        // 记录当前对白所属角色，并放置位置
        currentDialogPet = pet;
        placeDialogForPet(pet);

        if (dialogHideTimer !== null) {
          clearTimeout(dialogHideTimer);
          dialogHideTimer = null;
        }
        // 稍微降低整体不透明度
        dialogEl.style.opacity = "0.9";
        dialogHideTimer = setTimeout(function () {
          dialogEl.style.opacity = "0";
          currentDialogPet = null;
        }, 3500);
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
        // 开始拖拽时，关闭右键菜单
        hidePetMenu();
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

        // 点击角色时，在不影响原有动画的前提下显示一条随机对白
        showPetDialog(target);
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
        // 仅响应左键按下
        if (ev.button !== 0) return;
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

          // 若当前对白属于正在拖拽的角色，则让对白框跟随角色移动
          if (currentDialogPet === draggingPet && dialogEl && dialogEl.style.opacity !== "0") {
            placeDialogForPet(draggingPet);
          }
        }
      });

      function handleMouseUp(ev) {
        // 仅响应左键抬起
        if (ev.button !== 0 && ev.type === "mouseup") {
          return;
        }
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

      // 右键菜单：在人物上点击右键时弹出简易菜单
      canvas.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
        var pos = screenToWorld(ev);
        var targetPet = hitTestAt(pos.x, pos.y);
        if (!targetPet) {
          hidePetMenu();
          return;
        }
        showPetMenu(targetPet, ev.clientX, ev.clientY);
      });

      // 跟踪鼠标是否悬停在菜单上，用于抑制自动淡出
      if (menuEl) {
        menuEl.addEventListener("mouseenter", function () {
          menuHovering = true;
        });
        menuEl.addEventListener("mouseleave", function () {
          menuHovering = false;
        });
      }

      if (menuEl) {
        menuEl.addEventListener("click", function (ev) {
          var item = ev.target;
          if (!item.classList.contains("pet-menu-item")) return;
          var action = item.getAttribute("data-action");
          // 根据菜单项触发相应行为
          if (action === "copy") {
            // 额外：在选择 Copy 时，把一行文字放入剪贴板
            copyTextToClipboard("i WIlL ALWAYs bE HERE FOR YOU.");
            showTerminalError();
          }
          // 目前 delete 只关闭菜单，不对角色做操作
          hidePetMenu();
          // 可在此处进一步根据 action 和 currentMenuPet 添加更复杂逻辑
        });
      }

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
          // 掉落过程中若对白属于该角色，则持续更新对白框位置
          if (currentDialogPet === p && dialogEl && dialogEl.style.opacity !== "0") {
            placeDialogForPet(p);
          }
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
