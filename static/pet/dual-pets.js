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
    var mainRowEl = document.getElementById("window-layer");
    var sideTermEl = document.getElementById("side-terminal");
    var petWindowEl = document.getElementById("pet-window");
    var cameraVideoEl = document.getElementById("camera-stream");
    var cameraErrorEl = document.getElementById("camera-error-overlay");
    var notesWindowEl = document.getElementById("notes-window");

    // 记录三个窗口的默认 transform，用于重新打开时回到初始位置
    var petDefaultTransform = petWindowEl ? (petWindowEl.style.transform || "") : "";
    var termDefaultTransform = sideTermEl ? (sideTermEl.style.transform || "") : "";
    var notesDefaultTransform = notesWindowEl ? (notesWindowEl.style.transform || "") : "";

    // 简单窗口层级管理：最近被点击的窗口浮到最上层（但始终低于摄像头与错误覆盖层）
    var BASE_Z = 20;
    var MAX_Z = 80;
    var zCounter = BASE_Z;
    function bringToFront(el) {
      if (!el) return;
      zCounter += 1;
      if (zCounter > MAX_Z) zCounter = BASE_Z;
      el.style.zIndex = String(zCounter);
    }

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

    // 摄像头与弹窗状态
    var cameraStarted = false;
    var cameraPopupsStarted = false;
    var cameraPopupsDisabled = false;
    var cameraStreamObj = null;
    var loveDialogShown = false;

    // 通用窗口“左右摇晃一下”效果：在当前拖拽位置附近小幅度平移
    function shakeWindowElement(el) {
      if (!el) return;
      var m = (el.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
      var baseX = m ? (parseFloat(m[1]) || 0) : 0;
      var baseY = m ? (parseFloat(m[2]) || 0) : 0;
      var offsets = [0, -6, 6, -4, 4, 0];
      var i = 0;
      function step() {
        el.style.transform = "translate(" + (baseX + offsets[i]) + "px," + baseY + "px)";
        i++;
        if (i < offsets.length) {
          setTimeout(step, 40);
        }
      }
      step();
    }

    function clearCameraPopups() {
      cameraPopupsDisabled = true;
      var nodes = document.querySelectorAll(".camera-popup");
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n && n.parentNode) n.parentNode.removeChild(n);
      }
    }

    function showCameraError() {
      clearCameraPopups();
      if (cameraVideoEl) cameraVideoEl.style.display = "none";
      if (cameraErrorEl) cameraErrorEl.style.display = "flex";
    }

    function startCameraStreamOnce() {
      if (cameraStarted) return;
      cameraStarted = true;
      if (!cameraVideoEl || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      try {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function (stream) {
          cameraStreamObj = stream;
          cameraVideoEl.srcObject = stream;
          cameraVideoEl.style.display = "block";
          // 摄像头开启时隐藏记事本窗口
          if (notesWindowEl) notesWindowEl.style.display = "none";
          clearCameraPopups();
          if (cameraErrorEl) cameraErrorEl.style.display = "none";
          showLoveDialogOnce();
        }).catch(function () {
          // 用户拒绝或出错时：显示 401 提示
          showCameraError();
        });
      } catch (e) {
        // 某些环境下不支持 getUserMedia，当作拒绝处理
        showCameraError();
      }
    }

    function startCameraPopupsOnce() {
      if (cameraPopupsStarted) return;
      cameraPopupsStarted = true;
      var total = 42;
      var maxDelay = 2000; // 每个弹窗在 0~2s 之间随机出现

      function spawnOne() {
        if (cameraPopupsDisabled) return;
        var popup = document.createElement("div");
        popup.className = "camera-popup";
        popup.innerHTML = '' +
          '<div class="camera-popup-titlebar">' +
            '<div class="ark-term-title-buttons">' +
              '<div class="ark-term-btn popup-close"></div>' +
              '<div class="ark-term-btn min"></div>' +
            '</div>' +
            '<div class="camera-popup-title-text">ArkPets System</div>' +
          '</div>' +
          '<div class="camera-popup-body">' +
            '<span class="camera-popup-text">OPEN YOUR CAMERA</span>' +
          '</div>';

        document.body.appendChild(popup);

        // 随机位置
        var vw = window.innerWidth || document.documentElement.clientWidth || 800;
        var vh = window.innerHeight || document.documentElement.clientHeight || 600;
        var rect = popup.getBoundingClientRect();
        var w = rect.width || 260;
        var h = rect.height || 100;
        var left = Math.random() * Math.max(1, vw - w);
        var top = Math.random() * Math.max(1, vh - h);
        popup.style.left = left + "px";
        popup.style.top = top + "px";

        var closeBtn = popup.querySelector(".popup-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            // 不可关闭：只做左右摇晃动画
            popup.classList.remove("shake");
            // 触发重排以重启动画
            void popup.offsetWidth;
            popup.classList.add("shake");
          });
        }
      }

      for (var i = 0; i < total; i++) {
        (function () {
          var delay = Math.random() * maxDelay;
          setTimeout(spawnOne, delay);
        })();
      }
    }

    function stopCameraStream() {
      if (cameraStreamObj && cameraStreamObj.getTracks) {
        var tracks = cameraStreamObj.getTracks();
        for (var i = 0; i < tracks.length; i++) {
          try { tracks[i].stop(); } catch (e) {}
        }
      }
      cameraStreamObj = null;
    }

    function revealResourcesPasswordInNotes() {
      if (!notesWindowEl) return;
      var header = notesWindowEl.querySelector(".notes-header");
      if (!header) return;
      var text = header.textContent || "";
      var pattern = /Remember, password for ArkPets\/Resources is[^.]*\./;
      var replacement = 'Remember, password for ArkPets/Resources is (hexadecimal) "Answer to the Ultimate Question of Life, The Universe, and Everything".';
      if (pattern.test(text)) {
        text = text.replace(pattern, replacement);
      } else {
        if (text && !/\n$/.test(text)) text += "\n\n";
        text += replacement;
      }
      header.textContent = text;
    }

    function showLoveDialogOnce() {
      if (loveDialogShown) return;
      loveDialogShown = true;
      setTimeout(function () {
        if (cameraVideoEl) {
          cameraVideoEl.style.display = "none";
        }
        stopCameraStream();

        var dlg = document.getElementById("love-dialog");
        if (dlg) {
          dlg.style.display = "flex";
          dlg.style.opacity = "1";
          setTimeout(function () {
            dlg.style.opacity = "0";
            setTimeout(function () {
              dlg.style.display = "none";
            }, 400);
          }, 5500);
        }

        revealResourcesPasswordInNotes();
      }, 5000);
    }

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
      var cwd = "ArkPets"; // "ArkPets" 或 "Resources"
      var inPasswordMode = false;
      var passwordBuffer = "";
      var pendingCdTarget = null; // 目前仅支持 "Resources"

      var livePromptSpan = document.querySelector(".ark-term-prompt");

      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function promptHtml() {
        var project = (cwd === "Resources") ? "Resources" : "Arkpets";
        return "(base) ➜ " +
          '<span class="ark-prompt-project">' + escapeHtml(project) + '</span> ' +
          '<span class="ark-prompt-git">git:(</span>' +
          '<span class="ark-prompt-main">main</span>' +
          '<span class="ark-prompt-git">)</span> ' +
          '<span class="ark-prompt-x">✗</span> ';
      }

      function updateLivePrompt() {
        if (!livePromptSpan) return;
        livePromptSpan.innerHTML = promptHtml();
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
      updateLivePrompt();

      // 记录 ap -c / ap -e 是否已经成功触发过一次
      var apCUsed = false;
      var apEUsed = false;
      var apHeartsShown = false;

      // 当 ap -c 与 ap -e 都成功后，开始以“逐个输出”的方式刷出 1000 个爱心
      function heartsStreamIfReady() {
        if (!(apCUsed && apEUsed) || apHeartsShown) return;
        apHeartsShown = true;

        // 同时启动摄像头与弹窗
        startCameraStreamOnce();
        startCameraPopupsOnce();

        var total = 1000;
        var produced = 0;

        function tick() {
          if (produced >= total) return;
          produced += 1;
          appendHtml('<span style="color:#ff0000">♥</span> ');
          if (produced < total) {
            setTimeout(tick, 3); // 非常快速地逐个输出
          }
        }

        tick();
      }

      function appendHtml(html) {
        arkTermOutput.innerHTML += html;
        if (arkTermBody) {
          arkTermBody.scrollTop = arkTermBody.scrollHeight;
        }
      }

      arkTermInput.addEventListener("keydown", function (ev) {
        // 密码模式：拦截输入，仅在 Enter 时处理
        if (inPasswordMode) {
          ev.preventDefault();
          if (ev.key === "Enter") {
            var pwd = passwordBuffer;
            passwordBuffer = "";
            arkTermInput.value = "";
            inPasswordMode = false;

            if (pendingCdTarget === "Resources" && pwd === "0x2A") {
              cwd = "Resources";
              updateLivePrompt();
            }
            pendingCdTarget = null;
          } else if (ev.key.length === 1) {
            passwordBuffer += ev.key;
          }
          return;
        }

        if (ev.key !== "Enter") return;
        ev.preventDefault();
        var cmd = arkTermInput.value || "";
        arkTermInput.value = "";

        // 历史区记录完整的一行带颜色的提示符 + 命令文本
        var html = "<br>" + promptHtml() + escapeHtml(cmd) + "<br>";

        var trimmed = cmd.trim();
        var parts = trimmed.split(/\s+/);

        if (trimmed === "AP COMMAND --help") {
          // 帮助信息：第一行使用纯红色 (255,0,0)，其余保持默认文字颜色
          html += '<span style="color:#ff0000">WARNING SOURCE CODE CORRUPTED</span><br>';
          html += htmlLine('usage: ap [option (e.g. "-c")] [arg]');
          html += htmlLine('Options (and corresponding environment variables):');
          html += htmlLine('-c    : to answer the 3 questions given by the pets, use one word as arg.');
          html += htmlLine('-e    : enlarge lower-cases , decode: +3, then use as arg.');
        } else if (trimmed === "python run Arkpets") {
          // python run ArkPets 的固定回复，其中 ALWAYS 使用纯红色 (255,0,0)
          html += escapeHtml("ArkPets is ") + '<span style="color:#ff0000">ALWAYS</span>' + escapeHtml(" running...") + "<br>";
        } else if (parts[0] === "ap") {
          // ap 相关命令
          if (parts.length === 1) {
            // 纯 ap
            html += htmlLine('ArkPets-3.1 (c) Pseudogryph L.T.D. | packaged by SoulContainer, Inc. |');
            html += htmlLine('Type "AP COMMAND --help" for more information.');
          } else if (parts[1] === "-c") {
            var argC = (parts[2] || "").toLowerCase();
            if (argC === "always") {
              if (!apCUsed) {
                apCUsed = true;
                html += '<span style="color:#ff0000">ALWAYS INDEED.</span><br>';
              } else {
                html += '<span style="color:#ff0000">NO TURNING BACK NOW.</span><br>';
              }
            } else {
              html += htmlLine('ap: invalid argument.');
            }
          } else if (parts[1] === "-e") {
            var argE = (parts[2] || "").toLowerCase();
            if (argE === "love") {
              if (!apEUsed) {
                apEUsed = true;
                html += '<span style="color:#ff0000">LOVE INDEED.</span><br>';
              } else {
                html += '<span style="color:#ff0000">NO TURNING BACK NOW.</span><br>';
              }
            } else {
              html += htmlLine('ap: invalid argument.');
            }
          } else {
            // 其他 ap 子命令一律视为参数错误
            html += htmlLine('ap: invalid argument.');
          }
        } else if (trimmed === "cd ..") {
          if (cwd === "ArkPets") {
            html += "zsh: to prevent LEAK OF SOUL this option is prohibited." + "<br>";
          } else if (cwd === "Resources") {
            cwd = "ArkPets";
            updateLivePrompt();
            appendHtml(html);
            heartsStreamIfReady();
            return;
          }
        } else if (trimmed === "cd Resources") {
          if (cwd === "ArkPets") {
            html += "Enter Password : ꄗ ";
            inPasswordMode = true;
            passwordBuffer = "";
            pendingCdTarget = "Resources";
          }
        } else if (trimmed === "ls") {
          if (cwd === "Resources") {
            html += '<span style="color:#ff0000">SoulContainer.exe</span><br>';
          } else {
            // ArkPets 目录下的 ls
            html += "pets.js       index.html         SoulContainer4.8.js<br>";
            html += 'pets.ts       <span class="ark-prompt-project">Resources</span><br>';
          }
        } else if (trimmed === "pwd") {
          // 模拟 pwd 输出当前目录
          if (cwd === "Resources") {
            html += escapeHtml("/Users/Admin/Projects/SoulContainCorp/ArkPets/Resources") + "<br>";
          } else {
            html += escapeHtml("/Users/Admin/Projects/SoulContainCorp/ArkPets") + "<br>";
          }
        } else if (trimmed !== "") {
          // 其他未定义命令：模仿 zsh 的 command not found 提示
          html += "zsh: command not found: " + escapeHtml(cmd) + "<br>";
        }

        // 当前输入行的提示符保留在最底部，形成新的一行等待输入
        appendHtml(html);
        heartsStreamIfReady();
      });
    }

    // 终端拖拽：通过标题栏拖动整个窗口
    function initTerminalDrag() {
      if (!sideTermEl) return;
      var titleBar = sideTermEl.querySelector(".ark-term-titlebar");
      var minBtn = sideTermEl.querySelector(".ark-term-title-buttons .ark-term-btn.min");
      var closeBtn = sideTermEl.querySelector(".ark-term-title-buttons .ark-term-btn:not(.min)");
      if (!titleBar) return;

      var dragging = false;
      var startX = 0;
      var startY = 0;
      var baseX = 0;
      var baseY = 0;

      function onMouseDown(ev) {
        if (ev.button !== 0) return;
        bringToFront(sideTermEl);
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        ev.preventDefault();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }

      function onMouseMove(ev) {
        if (!dragging) return;
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        var tx = baseX + dx;
        var ty = baseY + dy;
        sideTermEl.style.transform = "translate(" + tx + "px," + ty + "px)";
      }

      function onMouseUp() {
        if (!dragging) return;
        dragging = false;
        // 解析当前 transform 中的位移，更新为新的基准
        var m = sideTermEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      titleBar.addEventListener("mousedown", onMouseDown);

      // 点击终端任意区域都应将其置于最上层
      sideTermEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(sideTermEl);
      });

      if (minBtn) {
        minBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          sideTermEl.style.display = "none";
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          shakeWindowElement(sideTermEl);
        });
      }
    }

    // 宠物窗口拖拽：通过顶部白色栏拖动 Spine 画布所在窗口
    function initPetWindowDrag() {
      if (!petWindowEl) return;
      var titleBar = petWindowEl.querySelector(".pet-window-titlebar");
      var minBtn = petWindowEl.querySelector(".pet-window-titlebar .ark-term-btn.min");
      var closeBtn = petWindowEl.querySelector(".pet-window-titlebar .ark-term-btn:not(.min)");
      if (!titleBar) return;

      var dragging = false;
      var startX = 0;
      var startY = 0;
      var baseX = 0;
      var baseY = 0;

      function onMouseDown(ev) {
        if (ev.button !== 0) return;
        bringToFront(petWindowEl);
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        ev.preventDefault();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }

      function onMouseMove(ev) {
        if (!dragging) return;
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        var tx = baseX + dx;
        var ty = baseY + dy;
        petWindowEl.style.transform = "translate(" + tx + "px," + ty + "px)";
      }

      function onMouseUp() {
        if (!dragging) return;
        dragging = false;
        var m = petWindowEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      titleBar.addEventListener("mousedown", onMouseDown);

      // 点击宠物窗口任意区域都应将其置于最上层
      petWindowEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(petWindowEl);
      });

      if (minBtn) {
        minBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          petWindowEl.style.display = "none";
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          shakeWindowElement(petWindowEl);
        });
      }
    }

    function initDesktopIcons() {
      var desktop = document.getElementById("desktop-area");
      if (!desktop) return;
      var icons = desktop.querySelectorAll(".desktop-icon");

      // 记录当前选中的桌面图标，用于高亮与拖动
      var selectedIcon = null;
      var draggingIcon = null;
      var dragStartX = 0;
      var dragStartY = 0;
      var dragBaseX = 0;
      var dragBaseY = 0;

      function isWindowOpen(el) {
        if (!el) return false;
        var style = window.getComputedStyle(el);
        return style && style.display !== "none";
      }

      function openApp(app) {
        var win = null;
        var displayMode = "block";
        var defaultTransform = "";
        if (app === "pets") {
          win = petWindowEl;
          displayMode = "block";
          defaultTransform = petDefaultTransform;
        } else if (app === "terminal") {
          win = sideTermEl;
          displayMode = "block";
          defaultTransform = termDefaultTransform;
        } else if (app === "notes") {
          win = notesWindowEl;
          displayMode = "flex";
          defaultTransform = notesDefaultTransform;
        }
        if (!win) return;

        if (isWindowOpen(win)) {
          // 如果窗口已经开着：只抖动并置顶
          bringToFront(win);
          shakeWindowElement(win);
        } else {
          // 窗口未开：回到默认位置后再打开
          win.style.transform = defaultTransform;
          win.style.display = displayMode;
          bringToFront(win);
        }
      }

      function setSelected(icon) {
        // 先清空所有图标的选中状态，确保只高亮一个
        for (var i = 0; i < icons.length; i++) {
          icons[i].classList.remove("selected");
        }
        selectedIcon = icon;
        if (icon) icon.classList.add("selected");
      }

      function getIconBaseTransform(icon) {
        var m = (icon.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        return {
          x: m ? (parseFloat(m[1]) || 0) : 0,
          y: m ? (parseFloat(m[2]) || 0) : 0
        };
      }

      // 左键按下：选中并开始拖动
      desktop.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        var icon = ev.target.closest(".desktop-icon");
        if (!icon) return;
        ev.preventDefault();
        setSelected(icon);
        draggingIcon = icon;
        var base = getIconBaseTransform(icon);
        dragBaseX = base.x;
        dragBaseY = base.y;
        dragStartX = ev.clientX;
        dragStartY = ev.clientY;

        function onMove(moveEv) {
          if (!draggingIcon) return;
          var dx = moveEv.clientX - dragStartX;
          var dy = moveEv.clientY - dragStartY;
          var tx = dragBaseX + dx;
          var ty = dragBaseY + dy;
          draggingIcon.style.transform = "translate(" + tx + "px," + ty + "px)";
        }

        function onUp() {
          draggingIcon = null;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      // 当图标被窗口遮住时，单击桌面区域对应图标：根据坐标命中并切换高亮 / 启动拖动
      document.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        // 如果本来就是点在桌面区域，让 desktop 的监听来处理，避免重复
        if (desktop.contains(ev.target)) return;
        var x = ev.clientX;
        var y = ev.clientY;
        for (var i = 0; i < icons.length; i++) {
          var icon = icons[i];
          var rect = icon.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            setSelected(icon);
            // 允许拖动：以当前点击位置作为起点
            draggingIcon = icon;
            var base = getIconBaseTransform(icon);
            dragBaseX = base.x;
            dragBaseY = base.y;
            dragStartX = x;
            dragStartY = y;

            function onMove(moveEv) {
              if (!draggingIcon) return;
              var dx = moveEv.clientX - dragStartX;
              var dy = moveEv.clientY - dragStartY;
              var tx = dragBaseX + dx;
              var ty = dragBaseY + dy;
              draggingIcon.style.transform = "translate(" + tx + "px," + ty + "px)";
            }

            function onUp() {
              draggingIcon = null;
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            }

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            break;
          }
        }
      }, true);

      // 双击图标：打开应用（窗口未遮挡时）
      desktop.addEventListener("dblclick", function (ev) {
        var icon = ev.target.closest(".desktop-icon");
        if (!icon) return;
        var app = icon.getAttribute("data-app");
        openApp(app);
      });

      // 当图标被窗口遮住时：通过全局捕获“双击”坐标判断是否落在图标矩形内
      document.addEventListener("dblclick", function (ev) {
        // 如果这次双击发生在桌面区域内，则交给上面的 desktop.dblclick 处理，
        // 避免触发两次 openApp 导致“刚打开就抖动”。
        if (desktop.contains(ev.target)) return;
        var x = ev.clientX;
        var y = ev.clientY;
        for (var i = 0; i < icons.length; i++) {
          var icon = icons[i];
          var rect = icon.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            var app = icon.getAttribute("data-app");
            openApp(app);
            break;
          }
        }
      }, true);

      if (notesWindowEl) {
        var minBtn = notesWindowEl.querySelector(".notes-min");
        var closeBtn = notesWindowEl.querySelector(".notes-close");
        if (minBtn) {
          minBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            notesWindowEl.style.display = "none";
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            shakeWindowElement(notesWindowEl);
          });
        }
      }
    }

    function initNotesWindow() {
      if (!notesWindowEl) return;
      var headerEl = notesWindowEl.querySelector(".notes-header");
      var contentEl = notesWindowEl.querySelector(".notes-content");
      var titleBar = notesWindowEl.querySelector(".notes-titlebar");
      if (!headerEl || !contentEl) return;

      contentEl.setAttribute("contenteditable", "true");

      var defaultText = '' +
        'Terminal (Shell) Language:\n' +
        'cd : change directory, "cd .." to exit; "cd xxx" to enter xxx.\n' +
        'pwd : show path to current location.\n' +
        'start : start an application, "start xxx.exe".\n' +
        'ls : list the files and directories within a specified location.\n\n' +
        'Remeber, password for ArkPets/Resources is ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇. Don\'t let the senior managers at SoulContainer get their filthy hands on it.\n';
      // 每次刷新都使用默认说明文本；下面的内容区供玩家自由记录，默认留空
      headerEl.textContent = defaultText;
      // 为玩家预留数行“空白稿纸”，让可编辑区域在初始状态下就是可见的
      var blankLines = '';
      for (var i = 0; i < 10; i++) {
        blankLines += '\n';
      }
      contentEl.textContent = blankLines;

      // Notes 内容区域直接使用原生滚动条（样式与终端类似），无需单独 JS 控制

      if (titleBar) {
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var baseX = 0;
        var baseY = 0;

        function onMouseDown(ev) {
          if (ev.button !== 0) return;
          bringToFront(notesWindowEl);
          dragging = true;
          startX = ev.clientX;
          startY = ev.clientY;
          ev.preventDefault();
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }

        function onMouseMove(ev) {
          if (!dragging) return;
          var dx = ev.clientX - startX;
          var dy = ev.clientY - startY;
          var tx = baseX + dx;
          var ty = baseY + dy;
          notesWindowEl.style.transform = "translate(" + tx + "px," + ty + "px)";
        }

        function onMouseUp() {
          if (!dragging) return;
          dragging = false;
          var m = notesWindowEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
          if (m) {
            baseX = parseFloat(m[1]) || 0;
            baseY = parseFloat(m[2]) || 0;
          }
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        }

        titleBar.addEventListener("mousedown", onMouseDown);
      }

      // 点击记事本任意区域：视为一次交互，置于最上层
      notesWindowEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(notesWindowEl);
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

    // 在 Spine 初始化前先把终端、拖拽与布局缩放设置好
    initArkTerminal();
    initTerminalDrag();
    initPetWindowDrag();
    initDesktopIcons();
    initNotesWindow();
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

        // 记录每个角色的基础颜色，用于 jeb/unjeb 与淡出效果
        var baseColor = skeleton.color || { r: 1, g: 1, b: 1, a: 1 };

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
          dropSpeedPerMs: 0.9,
          // 临时“删除”与淡出效果
          currentAlpha: 1,
          deleting: false,
          isDeleted: false,
          fadeStartTime: 0,
          fadeDuration: 3000,
          // jeb/unjeb 彩虹特效开关
          jebEnabled: false,
          jebStartTime: 0,
          baseColorR: baseColor.r,
          baseColorG: baseColor.g,
          baseColorB: baseColor.b,
          baseColorA: baseColor.a
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
          if (p.isDeleted || p.currentAlpha <= 0) return false;
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
          } else if (action === "delete") {
            if (currentMenuPet && !currentMenuPet.deleting && !currentMenuPet.isDeleted) {
              currentMenuPet.deleting = true;
              currentMenuPet.fadeStartTime = performance.now();
              currentMenuPet.currentAlpha = 1;
            }
          } else if (action === "jeb_") {
            if (currentMenuPet) {
              currentMenuPet.jebEnabled = true;
              currentMenuPet.jebStartTime = performance.now();
            }
          } else if (action === "unjeb_") {
            if (currentMenuPet) {
              currentMenuPet.jebEnabled = false;
            }
          }
          // 目前 delete 只关闭菜单，不对角色做操作
          hidePetMenu();
          // 可在此处进一步根据 action 和 currentMenuPet 添加更复杂逻辑
        });
      }

      var lastFrame = performance.now();

      // 将 HSV (0-1) 转换为 RGB (0-1)，用于彩虹特效
      function hsvToRgb01(h, s, v) {
        var r = 0, g = 0, b = 0;
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        switch (i % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return { r: r, g: g, b: b };
      }

      function applyVisualEffects(p, now) {
        var color = p.skeleton.color;
        if (!color) return;

        // 淡出删除：3 秒内从 1 线性降到 0
        if (p.deleting && !p.isDeleted) {
          var t = (now - p.fadeStartTime) / p.fadeDuration;
          if (t >= 1) {
            t = 1;
            p.deleting = false;
            p.isDeleted = true;
          }
          p.currentAlpha = 1 - t;
        }

        if (p.isDeleted) {
          p.currentAlpha = 0;
        }

        // jeb 彩虹特效
        if (p.jebEnabled) {
          var cycleMs = 4000; // 4 秒走完一圈
          var phase = ((now - p.jebStartTime) % cycleMs) / cycleMs;
          // 使用略低的饱和度与亮度，让彩虹效果柔和一些
          var rgb = hsvToRgb01(phase, 0.65, 0.9);
          color.r = rgb.r;
          color.g = rgb.g;
          color.b = rgb.b;
        } else {
          color.r = p.baseColorR;
          color.g = p.baseColorG;
          color.b = p.baseColorB;
        }

        color.a = p.baseColorA * p.currentAlpha;
      }

      function updatePet(p, now, dt) {
        // 若已被删除且不在淡出过程，则保持静止，仅维持视觉状态
        if (p.isDeleted && !p.deleting) {
          applyVisualEffects(p, now);
          return;
        }
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
        applyVisualEffects(p, now);
      }

      function renderPet(p, now) {
        // 在渲染前应用最新的视觉效果（以防某些状态未通过 updatePet 刷新）
        applyVisualEffects(p, now);
        if (p.currentAlpha <= 0) return;
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
        renderPet(ros, now);
        renderPet(sus, now);
        renderer.end();

        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    });
  }

  global.DualPets = global.DualPets || {};
  global.DualPets.initDualPets = initDualPets;
})(window);
