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
    var cameraFaceCanvasEl = document.getElementById("camera-face-overlay");
    var cameraErrorEl = document.getElementById("camera-error-overlay");
    var notesWindowEl = document.getElementById("notes-window");
    var ringOverlayEl = document.getElementById("ring-puzzle-overlay");
    var ringTitleEl = document.getElementById("ring-puzzle-title");
    var ringSvgContainerEl = document.getElementById("ring-puzzle-svg-container");
    var ringInstructionEl = document.getElementById("ring-puzzle-instruction");
    var ringInputRowEl = document.getElementById("ring-puzzle-input-row");
    var ringInputEl = document.getElementById("ring-puzzle-input");
    var ringSubmitEl = document.getElementById("ring-puzzle-submit");
    var ringStatusEl = document.getElementById("ring-puzzle-status");
    // 第二阶段：热力图 / 像素矩阵控件
    var containPuzzleContainerEl = document.getElementById("contain-puzzle-container");
    var containCanvasEl = document.getElementById("contain-puzzle-canvas");
    var containColorRangeEl = document.getElementById("contain-color-range");
    var containClarityRangeEl = document.getElementById("contain-clarity-range");
    // 最终黑屏结局 DOM
    var tuningOverlayEl = document.getElementById("tuning-ending-overlay");
    var tuningCodeEl = document.getElementById("tuning-code");
    var tuningCenterEl = document.getElementById("tuning-ending-center");

    // KeyVault 窗口与访客提示框
    var keyVaultWindowEl = document.getElementById("keyvault-window");
    var keyVaultGuestDialogEl = document.getElementById("keyvault-guest-dialog");
    var keyVaultPuzzleRowEl = document.getElementById("kv-puzzle-container");
    var keyVaultPuzzleContainerEl = document.getElementById("kv-puzzle-left");
    var keyVaultPuzzlePreviewEl = document.getElementById("kv-puzzle-right");
    var keyVaultPuzzleStatusEl = document.getElementById("kv-puzzle-status");
    var keyVaultConfidentialEl = document.getElementById("kv-confidential");

    // line 聊天应用窗口
    var lineWindowEl = document.getElementById("line-window");
    var lineListEl = document.getElementById("line-list");
    var lineChatEl = document.getElementById("line-chat");

    // ChatAP 大模型聊天窗口
    var chatApWindowEl = document.getElementById("chatap-window");
    var chatApOutputEl = document.getElementById("chatap-output");
    var chatApInputEl = document.getElementById("chatap-input");
    var chatApSendBtnEl = document.getElementById("chatap-send");

    // 右上角登录状态 + 北京时间小框
    var statusPanelEl = document.getElementById("status-panel");
    var loginStatusEl = document.getElementById("login-status-label");
    var statusTimeEl = document.getElementById("status-time-label");
    var statusTooltipEl = document.getElementById("status-tooltip");

    // 底部任务栏元素：home 键 + 打开程序列表
    var taskbarEl = document.getElementById("taskbar");
    var taskbarWindowsEl = document.getElementById("taskbar-windows");
    var homeMenuEl = document.getElementById("home-menu");
    var systemDialogEl = document.getElementById("system-warning-dialog");

    // 记录几个窗口的默认 transform，用于重新打开时回到初始位置
    var petDefaultTransform = petWindowEl ? (petWindowEl.style.transform || "") : "";
    var termDefaultTransform = sideTermEl ? (sideTermEl.style.transform || "") : "";
    var notesDefaultTransform = notesWindowEl ? (notesWindowEl.style.transform || "") : "";
    var keyVaultDefaultTransform = keyVaultWindowEl ? (keyVaultWindowEl.style.transform || "") : "";
    var lineDefaultTransform = lineWindowEl ? (lineWindowEl.style.transform || "") : "";
    var chatApDefaultTransform = chatApWindowEl ? (chatApWindowEl.style.transform || "") : "";

    // 打开状态：用于底部任务栏显示哪些应用（与是否最小化/隐藏区分开）
    var openApps = {
      pets: false,
      terminal: false,
      notes: false,
      keyvault: false,
      line: false,
      chatap: false
    };

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

    function clampWindowToViewport(el) {
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var vw = window.innerWidth || document.documentElement.clientWidth || 0;
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!vw || !vh) return;

      var dx = 0;
      var dy = 0;
      if (rect.left < 0) dx = -rect.left;
      else if (rect.right > vw) dx = vw - rect.right;
      if (rect.top < 0) dy = -rect.top;
      else if (rect.bottom > vh) dy = vh - rect.bottom;

      if (!dx && !dy) return;

      var m = (el.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
      var curX = m ? (parseFloat(m[1]) || 0) : 0;
      var curY = m ? (parseFloat(m[2]) || 0) : 0;
      var newX = curX + dx;
      var newY = curY + dy;
      el.style.transform = "translate(" + newX + "px," + newY + "px)";
    }

    function centerWindowInViewport(el) {
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var vw = window.innerWidth || document.documentElement.clientWidth || 0;
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!vw || !vh) return;

      var targetLeft = (vw - rect.width) / 2;
      var targetTop = (vh - rect.height) / 2;
      var dx = targetLeft - rect.left;
      var dy = targetTop - rect.top;

      var m = (el.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
      var curX = m ? (parseFloat(m[1]) || 0) : 0;
      var curY = m ? (parseFloat(m[2]) || 0) : 0;
      var newX = curX + dx;
      var newY = curY + dy;
      el.style.transform = "translate(" + newX + "px," + newY + "px)";
      clampWindowToViewport(el);
    }

    function refreshTaskbarWindows() {
      if (!taskbarWindowsEl) return;
      while (taskbarWindowsEl.firstChild) {
        taskbarWindowsEl.removeChild(taskbarWindowsEl.firstChild);
      }

      var apps = [
        { key: "pets", label: "ArkPets", el: petWindowEl, display: "block" },
        { key: "terminal", label: "Terminal", el: sideTermEl, display: "block" },
        { key: "notes", label: "Notes", el: notesWindowEl, display: "flex" },
        { key: "keyvault", label: "KeyVault", el: keyVaultWindowEl, display: "flex" },
        { key: "line", label: "line", el: lineWindowEl, display: "flex" },
        { key: "chatap", label: "ChatAP", el: chatApWindowEl, display: "flex" }
      ];

      for (var i = 0; i < apps.length; i++) {
        var app = apps[i];
        if (!openApps[app.key]) continue;
        var btn = document.createElement("div");
        btn.className = "taskbar-window-button";
        btn.textContent = app.label;

        (function (winEl, displayMode, key, buttonEl) {
          // 根据窗口当前是否可见，决定是否呈现为“按下”状态
          if (winEl && winEl.style.display !== "none") {
            buttonEl.classList.add("active");
          }

          buttonEl.addEventListener("click", function () {
            if (!winEl) return;
            if (winEl.style.display === "none") {
              // 从最小化状态恢复：显示窗口并标记为按下
              winEl.style.display = displayMode;
              buttonEl.classList.add("active");
            } else {
              // 已经是可见窗口：执行最小化，并恢复按钮为弹起状态
              winEl.style.display = "none";
              buttonEl.classList.remove("active");
            }
            bringToFront(winEl);
          });
        })(app.el, app.display, app.key, btn);

        taskbarWindowsEl.appendChild(btn);
      }
    }

    function initTaskbarHome() {
      if (!taskbarEl) return;
      var homeBtn = document.getElementById("taskbar-home");
      if (homeBtn && homeMenuEl) {
        homeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          homeMenuEl.style.display = (homeMenuEl.style.display === "block") ? "none" : "block";
        });
      }

      if (homeMenuEl) {
        var items = homeMenuEl.querySelectorAll(".home-menu-item");
        for (var i = 0; i < items.length; i++) {
          items[i].addEventListener("mousedown", function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var action = this.getAttribute("data-action");
            if (homeMenuEl) {
              homeMenuEl.style.display = "none";
            }
            if (systemDialogEl) {
              var body = systemDialogEl.querySelector("#system-warning-dialog-body");
              if (body) {
                if (action === "restart") {
                  body.textContent = "Restart interrupted: Arkpets is still running.";
                } else if (action === "shutdown") {
                  body.textContent = "Power off interrupted: Arkpets is still running.";
                } else {
                  body.textContent = "Arkpets is still running.";
                }
              }
              systemDialogEl.style.display = "flex";
            }
          });
        }
      }

      if (systemDialogEl) {
        var closeBtn = systemDialogEl.querySelector(".system-dialog-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            systemDialogEl.style.display = "none";
          });
        }

        systemDialogEl.addEventListener("click", function (ev) {
          if (ev.target === systemDialogEl) {
            systemDialogEl.style.display = "none";
          }
        });
      }

      document.addEventListener("mousedown", function (ev) {
        if (!homeMenuEl) return;
        if (homeMenuEl.style.display !== "block") return;
        // 点击在 home 菜单或 home 按钮内部时不自动关闭，交给各自逻辑处理
        var homeBtnEl = document.getElementById("taskbar-home");
        if (homeMenuEl.contains(ev.target) || (homeBtnEl && homeBtnEl.contains(ev.target))) {
          return;
        }
        homeMenuEl.style.display = "none";
      });
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

    // 终端爱心流控制：ap -c ALWAYS 与 ap -e LOVE 之后快速输出 ♥，
    // 当管理员验证完成（摄像头检测通过）后停止输出，并打印完成提示语。
    var apHeartsStopRequested = false;
    var apHeartsCompletionLineShown = false;

    // 登录状态：默认 Guest，通过摄像头管理员验证后切换为 Admin Lv.3
    var isAdminValidated = false;

    // 浏览器端人脸检测后端（优先使用 OpenCV.js，其次尝试 FaceDetector），
    // 对外暴露为同步的 dlibHogDetectFaces(video) -> [{x,y,w,h}]
    var faceDetectorBackend = {
      detector: null,
      offscreenCanvas: null,
      offscreenCtx: null,
      latestFacesByVideo: new WeakMap(),
      activeVideos: [],
      loopRunning: false
    };

    function ensureFaceDetectorForVideo(videoEl) {
      if (!videoEl || !global.FaceDetector) return;

      if (!faceDetectorBackend.detector) {
        try {
          faceDetectorBackend.detector = new global.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
        } catch (e) {
          faceDetectorBackend.detector = null;
          return;
        }
      }

      if (!faceDetectorBackend.offscreenCanvas) {
        var c = document.createElement("canvas");
        c.width = 320;
        c.height = 240;
        faceDetectorBackend.offscreenCanvas = c;
        faceDetectorBackend.offscreenCtx = c.getContext("2d", { willReadFrequently: true });
      }

      if (faceDetectorBackend.activeVideos.indexOf(videoEl) === -1) {
        faceDetectorBackend.activeVideos.push(videoEl);
      }

      if (!faceDetectorBackend.loopRunning) {
        faceDetectorBackend.loopRunning = true;
        runFaceDetectorLoop();
      }

      if (!global.dlibHogDetectFaces) {
        global.dlibHogDetectFaces = function (video) {
          var arr = faceDetectorBackend.latestFacesByVideo.get(video);
          return arr ? arr.slice() : [];
        };
      }
    }

    // OpenCV.js Haar 人脸检测作为主要实现
    var opencvBackend = {
      cvReady: false,
      initializing: false,
      faceClassifier: null,
      cascadeLoaded: false,
      loadingCascade: false,
      // 期望与 index.html 同目录下放置 haarcascade_frontalface_default.xml，
      // 由开发服务器以同源静态资源方式提供。
      cascadeFile: "haarcascade_frontalface_default.xml",
      offscreenCanvas: null,
      offscreenCtx: null,
      latestFacesByVideo: new WeakMap(),
      activeVideos: [],
      loopRunning: false,
      pollTimer: null
    };

    function ensureOpenCvDetectorForVideo(videoEl) {
      if (!videoEl) return;

      if (opencvBackend.activeVideos.indexOf(videoEl) === -1) {
        opencvBackend.activeVideos.push(videoEl);
      }

      function startLoopIfReady() {
        if (!opencvBackend.cvReady || opencvBackend.loopRunning) return;

        if (!opencvBackend.offscreenCanvas) {
          var c = document.createElement("canvas");
          c.width = 320;
          c.height = 240;
          opencvBackend.offscreenCanvas = c;
          opencvBackend.offscreenCtx = c.getContext("2d", { willReadFrequently: true });
        }

        // 始终先暴露同步的 dlibHogDetectFaces 接口，即便分类器尚未就绪时也返回空数组，
        // 这样前端的人脸可视化循环至少能正常调用而不会因为 undefined 而完全失效。
        if (!global.dlibHogDetectFaces) {
          global.dlibHogDetectFaces = function (video) {
            var arr = opencvBackend.latestFacesByVideo.get(video);
            return arr ? arr.slice() : [];
          };
        }

        // 若人脸分类器尚未加载，触发一次异步加载
        if (!opencvBackend.faceClassifier) {
          if (!opencvBackend.loadingCascade && global.cv) {
            opencvBackend.loadingCascade = true;
            try {
              // 同源加载本地 haarcascade_frontalface_default.xml，避免跨域 / CORP 限制
              fetch(opencvBackend.cascadeFile)
                .then(function (res) { return res.arrayBuffer(); })
                .then(function (buf) {
                  var data = new Uint8Array(buf);
                  global.cv.FS_createDataFile("/", opencvBackend.cascadeFile, data, true, false, false);
                  var classifier = new global.cv.CascadeClassifier();
                  if (!classifier.load(opencvBackend.cascadeFile)) {
                    console.warn("[DualPets] OpenCV: failed to load cascade file");
                    classifier.delete();
                    opencvBackend.loadingCascade = false;
                    return;
                  }
                  opencvBackend.faceClassifier = classifier;
                  opencvBackend.cascadeLoaded = true;
                  opencvBackend.loadingCascade = false;
                  console.log("[DualPets] OpenCV: cascade loaded successfully");
                  if (!opencvBackend.loopRunning && opencvBackend.activeVideos.length) {
                    opencvBackend.loopRunning = true;
                    runOpenCvLoop();
                  }
                })
                .catch(function () {
                  console.warn("[DualPets] OpenCV: failed to fetch haarcascade xml");
                  opencvBackend.loadingCascade = false;
                });
            } catch (e) {
              console.warn("[DualPets] OpenCV: error while loading cascade", e);
              opencvBackend.loadingCascade = false;
            }
          }
          return;
        }

        opencvBackend.loopRunning = true;
        runOpenCvLoop();
      }

      if (!global.cv) {
        if (!opencvBackend.pollTimer) {
          opencvBackend.pollTimer = setInterval(function () {
            if (global.cv) {
              clearInterval(opencvBackend.pollTimer);
              opencvBackend.pollTimer = null;
              // 如果 runtime 已经初始化过，则直接标记 ready
              if (global.cv.Mat) {
                opencvBackend.cvReady = true;
                startLoopIfReady();
              } else if (!opencvBackend.initializing) {
                opencvBackend.initializing = true;
                global.cv['onRuntimeInitialized'] = function () {
                  opencvBackend.cvReady = true;
                  opencvBackend.initializing = false;
                  startLoopIfReady();
                };
              }
            }
          }, 300);
        }
        return;
      }

      if (!opencvBackend.cvReady) {
        if (global.cv.Mat) {
          opencvBackend.cvReady = true;
        } else if (!opencvBackend.initializing) {
          opencvBackend.initializing = true;
          global.cv['onRuntimeInitialized'] = function () {
            opencvBackend.cvReady = true;
            opencvBackend.initializing = false;
            startLoopIfReady();
          };
        }
      }

      startLoopIfReady();
    }

    function runOpenCvLoop() {
      if (!opencvBackend.cvReady || !opencvBackend.faceClassifier || !opencvBackend.offscreenCanvas || !opencvBackend.offscreenCtx) {
        opencvBackend.loopRunning = false;
        return;
      }

      var videos = opencvBackend.activeVideos.slice();
      if (!videos.length) {
        opencvBackend.loopRunning = false;
        return;
      }

      var c = opencvBackend.offscreenCanvas;
      var ctx2d = opencvBackend.offscreenCtx;

      try {
        for (var i = 0; i < videos.length; i++) {
          var videoEl = videos[i];
          if (!videoEl || videoEl.readyState < 2) {
            opencvBackend.latestFacesByVideo.set(videoEl, []);
            continue;
          }

          var vw = videoEl.videoWidth || videoEl.clientWidth;
          var vh = videoEl.videoHeight || videoEl.clientHeight;
          if (!vw || !vh) {
            opencvBackend.latestFacesByVideo.set(videoEl, []);
            continue;
          }

          var targetW = Math.min(320, vw);
          var scale = targetW / vw;
          var targetH = Math.max(1, Math.round(vh * scale));
          c.width = targetW;
          c.height = targetH;

          try {
            ctx2d.drawImage(videoEl, 0, 0, targetW, targetH);
          } catch (e2) {
            opencvBackend.latestFacesByVideo.set(videoEl, []);
            continue;
          }

          var src = null;
          var gray = null;
          var facesRect = null;
          var faces = [];

          try {
            src = global.cv.imread(c);
            gray = new global.cv.Mat();
            global.cv.cvtColor(src, gray, global.cv.COLOR_RGBA2GRAY, 0);
            facesRect = new global.cv.RectVector();
            // 使用 Haar 人脸分类器进行多尺度检测
            // 参数：scaleFactor=1.1, minNeighbors=3, minSize 60x60 以去掉噪点
            var minSize = new global.cv.Size(60, 60);
            var maxSize = new global.cv.Size(0, 0);
            opencvBackend.faceClassifier.detectMultiScale(gray, facesRect, 1.1, 3, 0, minSize, maxSize);

            var bestArea = 0;
            var bestRect = null;
            for (var j = 0; j < facesRect.size(); j++) {
              var r = facesRect.get(j);
              var area = r.width * r.height;
              if (area > bestArea) {
                bestArea = area;
                bestRect = r;
              }
            }
            if (bestRect) {
              var sx = vw / targetW;
              var sy = vh / targetH;
              faces.push({
                x: bestRect.x * sx,
                y: bestRect.y * sy,
                w: bestRect.width * sx,
                h: bestRect.height * sy
              });
            }
          } catch (e3) {
            faces = [];
          } finally {
            if (src) src.delete();
            if (gray) gray.delete();
            if (facesRect) facesRect.delete();
          }

          opencvBackend.latestFacesByVideo.set(videoEl, faces);
        }
      } catch (eOuter) {
        opencvBackend.loopRunning = false;
        return;
      }

      if (opencvBackend.activeVideos.length) {
        setTimeout(runOpenCvLoop, 180);
      } else {
        opencvBackend.loopRunning = false;
      }
    }

    function runFaceDetectorLoop() {
      if (!faceDetectorBackend.detector || !faceDetectorBackend.offscreenCanvas || !faceDetectorBackend.offscreenCtx) {
        faceDetectorBackend.loopRunning = false;
        return;
      }

      var videos = faceDetectorBackend.activeVideos.slice();
      if (!videos.length) {
        faceDetectorBackend.loopRunning = false;
        return;
      }

      var c = faceDetectorBackend.offscreenCanvas;
      var ctx = faceDetectorBackend.offscreenCtx;

      Promise.all(videos.map(function (videoEl) {
        if (!videoEl || videoEl.readyState < 2) {
          return Promise.resolve({ video: videoEl, faces: [] });
        }
        var vw = videoEl.videoWidth || videoEl.clientWidth;
        var vh = videoEl.videoHeight || videoEl.clientHeight;
        if (!vw || !vh) {
          return Promise.resolve({ video: videoEl, faces: [] });
        }

        // 缩放到较小分辨率提高性能，同时记录缩放比例，稍后再映射回原视频坐标系
        var targetW = Math.min(320, vw);
        var scale = targetW / vw;
        var targetH = Math.max(1, Math.round(vh * scale));
        c.width = targetW;
        c.height = targetH;

        try {
          ctx.drawImage(videoEl, 0, 0, targetW, targetH);
        } catch (e) {
          return Promise.resolve({ video: videoEl, faces: [] });
        }

        return faceDetectorBackend.detector.detect(c).then(function (detections) {
          var sx = vw / targetW;
          var sy = vh / targetH;
          var faces = (detections || []).map(function (d) {
            var b = d.boundingBox || d;
            return {
              x: b.x * sx,
              y: b.y * sy,
              w: b.width * sx,
              h: b.height * sy
            };
          });
          return { video: videoEl, faces: faces };
        }).catch(function () {
          return { video: videoEl, faces: [] };
        });
      })).then(function (results) {
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          if (!r || !r.video) continue;
          if (r.faces && r.faces.length) {
            faceDetectorBackend.latestFacesByVideo.set(r.video, r.faces);
          } else {
            faceDetectorBackend.latestFacesByVideo.set(r.video, []);
          }
        }

        // 如果仍有活动视频，继续下一轮检测
        if (faceDetectorBackend.activeVideos.length) {
          setTimeout(runFaceDetectorLoop, 120);
        } else {
          faceDetectorBackend.loopRunning = false;
        }
      }).catch(function () {
        // 任何错误都停止检测循环，避免狂刷错误
        faceDetectorBackend.loopRunning = false;
      });
    }

    // 人脸检测状态（假设存在全局 dlibHogDetectFaces(video) -> 数组 [{x,y,w,h}, ...]）
    var faceDetectionActive = false;
    var faceDetectionSucceeded = false;
    var faceDetectionRafId = 0;

    // 同心圆环解密（Resources/start SoulContainer.exe）
    var ringPuzzleInitialized = false;
    var ringPuzzleSolved = false;
    var ringPuzzleAnswer = "";
    var ringPuzzleRings = [];
    // 第二阶段像素矩阵状态
    var containPuzzleInitialized = false;
    var containPuzzleSolved = false;
    // 最终结局只触发一次
    var tuningEndingStarted = false;

    // KeyVault 数字华容道（15-puzzle）状态
    var keyVaultPuzzleInitialized = false;
    var keyVaultBoard = null; // 长度 16 的数组，0 表示空格，其余 1..15
    var keyVaultPuzzleCompleted = false; // 解出后锁定，并展示机密表格

    // line 聊天内容
    var lineConversations = {
      clyde: [
        {
          date: "(May 24th, 2024)",
          messages: [
            { speaker: "hiro", text: "Greetings, Mr. Rothschild. I will be working under your commands from today. Thank you for having me." },
            { speaker: "clyde", text: "Right, I was just informed that you was reassigned to the Arkpets project group, which I was in charge of. I am most eager to see your progress." },
            { speaker: "hiro", text: "Pardon my ignorance, but your project was rather secretive. I was only told by the HQ that this project was regarding soul. Are we maybe doing hyper-personified AI?" },
            { speaker: "clyde", text: "No. Talk to me in the company email." }
          ]
        },
        {
          date: "(July 2th, 2025)",
          messages: [
            { speaker: "hiro", text: "Phase one was initialized with great yields, we are able to repeatedly contain souls of stray cats. No offense, but I still don't agree with the Board, how are digital pets superior than their real counterparts?" },
            { speaker: "hiro", text: "Maybe there's more prospect beyond pets in their mind?" }
          ]
        },
        {
          date: "(July 3th, 2025)",
          messages: [
            { speaker: "clyde", text: "The Board as well as myself will decide its future. Do your job and your work shall be commended." },
            { speaker: "hiro", text: "Yes, Mr. Rothschild." }
          ]
        },
        {
          date: "(October 11th, 2025)",
          messages: [
            { speaker: "clyde", text: "I've yet to hear from you for a rather extended period. Report the status quo." },
            { speaker: "hiro", text: "Sir, phase three was advancing as expected, we found some terminally ill tumor patients willing to participate as test subjects to preserve their conscious digitally." },
            { speaker: "hiro", text: "The program for human soul preservation, SoulContainer.exe was developed for this test, but..." },
            { speaker: "clyde", text: "But?" },
            { speaker: "hiro", text: "The legal procedure was sluggish if not stuck completely still. This will take us valuable time." },
            { speaker: "clyde", text: "Every single time! These incompetent idiots ... never mind, I'll handle it." },
            { speaker: "hiro", text: "Yes, sir." }
          ]
        },
        {
          date: "(January 24th, 2026)",
          messages: [
            { speaker: "hiro", text: "Mr. Hidayat just called me about the Board and hanged up in a hurry, it sounds like he got himself in some trouble. Was this of our concern potentially?" },
            { speaker: "clyde", text: "Hidayat was a disgusting traitor to the firm. He left and spoiled our blueprints to the opposition company. Never trust his lying nonsense." },
            { speaker: "clyde", text: "Tell no one about this." },
            { speaker: "hiro", text: "It will be so, Mr. Rothschild." }
          ]
        },
        {
          date: "(February 31th, 2026)",
          messages: [
            { speaker: "hiro", text: "Sir, why are these subjects calling for help like crazy? The alarm was going on one after another the whole morning." },
            { speaker: "clyde", text: "Don't mind, they were dying anyways and we helped them live forever. Now they turn back on us? How ungrateful." },
            { speaker: "hiro", text: "Yes, but they were not dying I'm afraid, I tested their conscious activity levels and the readings doesn't make sense, it seems they were completely healthy ... kids? What on earth are you guys doing? What are you hiding?" }
          ]
        },
        {
          date: "(March 2th, 2026)",
          messages: [
            { speaker: "hiro", text: "I know about room 42C.", highlightWords: ["42C"] },
            { speaker: "clyde", text: "It has been an honor ... we couldn't have done it without you." },
            { speaker: "clyde", text: "Unfortunately, You know too much." }
          ]
        },
        {
          date: "(March 3th, 2026)",
          messages: [
            { speaker: "hiro", text: "What? What have you done? Why are the security department taking me away?" },
            { speaker: "clyde", text: "Farewell, Mr. Hiro. You started this inhumane test, not the Board. Enjoy your life, or rather what's left of it." }
          ]
        }
      ],

      hidayat: [
        {
          date: "(May 24th, 2024)",
          messages: [
            { speaker: "hidayat", text: "Ssup twin! Haven't heard from U for ... like, since college? Now we're back in the same project group. Pity that I didn't notice U in the firm earlier lol." },
            { speaker: "hiro", text: "Yo bro. Really miss those good ol' days in CUHKSZ. We enrolled in the same exact courses for two entire year man... And the best part is how we lowkey used LLMs for everything." }
          ]
        },
        {
          date: "(May 26th, 2024)",
          messages: [
            { speaker: "hidayat", text: "Lmao. And now we both work for this capitalistic money-thirsty hellscape of a company. The Clyde guy is rushing me like he got nothin' else to do all day." },
            { speaker: "hiro", text: "U tell me 'bout it..." }
          ]
        },
        {
          date: "(July 1th, 2025)",
          messages: [
            { speaker: "hiro", text: "Your part of phase one?" },
            { speaker: "hidayat", text: "Yeah, yeah, give me like, another ten hours." },
            { speaker: "hiro", text: "Sure dude, just don't wanna piss the board off by postponing any longer." }
          ]
        },
        {
          date: "(July 2th, 2025)",
          messages: [
            { speaker: "hidayat", text: "Done. Want me to inform the captain?" },
            { speaker: "hidayat", text: "And our very proper and reasonable complaints?" },
            { speaker: "hiro", text: "Nah, I'll talk to Clyde." }
          ]
        },
        {
          date: "(July 3th, 2025)",
          messages: [
            { speaker: "hidayat", text: "My man" },
            { speaker: "hiro", text: "Thank god he's not pissed off, but they're not gonna change anything anyways..." },
            { speaker: "hidayat", text: "Typical SoulContainer Board thing to do. You Peasants do this, do that, don't question anything. Great, just great." },
            { speaker: "hiro", text: "So True Ima 'bout to cry..." }
          ]
        },
        {
          date: "(September 29th, 2025)",
          messages: [
            { speaker: "hiro", text: "No way... again? It's like the fifth time he asked about phase three for like, half a month?" },
            { speaker: "hidayat", text: "Yep, good Mr. Clyde here again want some feedback. But containing souls ain't like doing elementary maths right?" },
            { speaker: "hiro", text: "Just get used to it already at this stage." }
          ]
        },
        {
          date: "(October 8th, 2025)",
          messages: [
            { speaker: "hidayat", text: "It's simply inhuman of them to even think about using humans to do soul extracting, and now they're just gonna blatantly tell us about that anti-social idea, great!" },
            { speaker: "hiro", text: "But we can't fight the board, right?" },
            { speaker: "hidayat", text: "Duh! Need this job to feed mouths. If else, I won't be working for these so-called senior managers ... manage my butt!" },
            { speaker: "hiro", text: "Haha, Ur have some balls and guts to say that." },
            { speaker: "hidayat", text: "And don't U dare turn in on me." },
            { speaker: "hiro", text: "Trust me already, bruh..." },
            { speaker: "hidayat", text: "Ha! Just joking with ya." }
          ]
        },
        {
          date: "(December 30th, 2025)",
          messages: [
            { speaker: "hidayat", text: "No, no, no, this is not real, this is not happening..." },
            { speaker: "hiro", text: "U OK?" },
            { speaker: "hidayat", text: "So disgusting ... these freakin bastards" },
            { speaker: "hiro", text: "?" },
            { speaker: "hidayat", text: "I'm gonna puke, and after that, maybe call the cops..." }
          ]
        },
        {
          date: "(January 3th, 2026)",
          messages: [
            { speaker: "hidayat", text: "R U alright? The company's still running?" },
            { speaker: "hiro", text: "Yeah, What happened to U? Haven't bumped into U in a while." },
            { speaker: "hidayat", text: "The company is using full-on kids to test soul containing now, aren't they?", fullRed: true },
            { speaker: "hiro", text: "What? Seriously? I've got no clues about that!" },
            { speaker: "hidayat", text: "Pretty damn certain. I've got proof, but the cops ain't buying my claims. Maybe the firm has got some rats planted inside the justice system after all." },
            { speaker: "hiro", text: "..." },
            { speaker: "hidayat", text: "It's in room 42C of the experiment building. See for yourself ... or not actually, cuz that way you're basically dead as well.", highlightWords: ["42C"] },
            { speaker: "hiro", text: "Things has gone too far so fast... Sh*t, never should've trusted 'em senior managers." }
          ]
        },
        {
          date: "(January 6th, 2026)",
          messages: [
            { speaker: "hidayat", text: "U'd better delete our message. Don't wanna get U into trouble too." },
            { speaker: "hiro", text: "To hell with the trouble, I'm gonna get to the bottom of this." },
            { speaker: "hidayat", text: "Hah... I guessed it alright. Just be carefull." },
            { speaker: "hiro", text: "U take care." }
          ]
        },
        {
          date: "(January 19th, 2026)",
          messages: [
            { speaker: "hiro", text: "I'm just gonna play along with Clyde for now for more info. They can't stop lying can't they?" }
          ]
        },
        {
          date: "(January 21th, 2026)",
          messages: [
            { speaker: "hiro", text: "Sh*t, you're right. I've seen the room, 42C. So it's true ... but how are we able to report on them. Any progress with the police?", highlightWords: ["42C"] }
          ]
        },
        {
          date: "(January 22th, 2026)",
          messages: [
            { speaker: "hiro", text: "Hello?" }
          ]
        },
        {
          date: "(January 23th, 2026)",
          messages: [
            { speaker: "hidayat", text: "I've got a plan." },
            { speaker: "hidayat", text: "Just pretend you heard nothing from me." },
            { speaker: "hidayat", text: "Pretend to Clyde that you're slowly reaching the truth without me." },
            { speaker: "hidayat", text: "Meanwhile, I'll tell some of my closer acquaintances about this, they work at the security department. They will attach a temporary soul extractor from phase two to control their colleagues when the right moment comes." },
            { speaker: "hidayat", text: "When the time comes, tell him you know about 42C. Clyde will inform the security to take you down, but when my brothers hear the call, they will initiate the device and come forth to apprehend you instead.", highlightWords: ["42C"] },
            { speaker: "hidayat", text: "After that, they'll let you go back to 42C and fulfill our unfinished destiny, undo what we've helped doing. You'll only have a short while.", highlightWords: ["42C"] },
            { speaker: "hiro", text: "Yes. I will. I won't let us down." },
            { speaker: "hidayat", text: "It's on you now." }
          ]
        },
        {
          date: "(January 24th, 2026)",
          messages: [
            { speaker: "hiro", text: "Hello? What happened?" },
            { speaker: "hiro", text: "Talk to me if you're all right" },
            { speaker: "hidayat", text: "Don't worry." }
          ]
        },
        {
          date: "(March 2th, 2026)",
          messages: [
            { speaker: "hidayat", text: "The time has come. Tell him. Tomorrow, I'll attract his attention, go to 42C.", highlightWords: ["42C"] },
            { speaker: "hiro", text: "Attract him, how? Don't you get yourself in danger again!" },
            { speaker: "hidayat", text: "No worries." }
          ]
        },
        {
          date: "(March 3th, 2026)",
          messages: [
            { speaker: "hidayat", text: "Bye." }
          ]
        }
      ]
    };

    function showRingPuzzleOverlay() {
      if (!ringOverlayEl) return;
      ringOverlayEl.style.display = "flex";
      if (!ringPuzzleInitialized) {
        initRingPuzzle();
      }
    }

    function initRingPuzzle() {
      if (ringPuzzleInitialized) return;
      if (!ringOverlayEl || !ringSvgContainerEl) return;
      if (!global.d3) return;

      ringPuzzleInitialized = true;
      ringPuzzleSolved = false;
      ringPuzzleAnswer = "";
      ringPuzzleRings = [];

      var d3ref = global.d3;
      var width = 440;
      var height = 440;
      var cx = width / 2;
      var cy = height / 2;

      var svg = d3ref.select(ringSvgContainerEl)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      var root = svg.append("g")
        .attr("transform", "translate(" + cx + "," + cy + ")");

      var letters = ["S", "O", "U", "L", "S"]; // 5 个环，对齐后得到的密钥
      var ringCount = letters.length;
      var baseRadius = 170;
      var radiusStep = 26;

      for (var i = 0; i < ringCount; i++) {
        var r = baseRadius - i * radiusStep;
        var angle = Math.random() * 360;
        var ring = {
          index: i,
          radius: r,
          angle: angle,
          keyLetter: letters[i]
        };
        ringPuzzleRings.push(ring);
      }

      ringPuzzleAnswer = letters.join("");

      var ringGroups = root.selectAll(".ring-puzzle-ring")
        .data(ringPuzzleRings)
        .enter()
        .append("g")
        .attr("class", "ring-puzzle-ring");

      // 每个环：实心“甜甜圈”式环（粗描边），整个环可拖动
      ringGroups.append("circle")
        .attr("r", function (d) { return d.radius; })
        .attr("fill", "none")
        .attr("stroke", "#dddddd")
        .attr("stroke-width", 10.0);

      // 关键点（径向对齐参考）：初始都指向 0°，通过旋转整个 ringGroup 来调整
      ringGroups.append("circle")
        .attr("class", "ring-puzzle-key-dot")
        .attr("cx", function (d) { return d.radius; })
        .attr("cy", 0)
        .attr("r", 3.0)
        .attr("fill", "#000000");

      // 在每个实心环上散布若干干扰字符；真正的 SOULS 字母隐藏在黑点处，只在对齐后显现
      var fillerChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      ringGroups.each(function (d) {
        var g = d3ref.select(this);

        // 1）先画一圈干扰字母，始终可见
        var texts = [];
        var fillerCount = 8;
        for (var j = 0; j < fillerCount; j++) {
          var ch = fillerChars[Math.floor(Math.random() * fillerChars.length)];
          var baseAngle = (360 / fillerCount) * j + d.index * 13;
          texts.push({ ch: ch, angleDeg: baseAngle });
        }

        g.selectAll(".ring-puzzle-letter")
          .data(texts)
          .enter()
          .append("text")
          .attr("class", "ring-puzzle-letter")
          .attr("x", function (t) {
            var rad = (t.angleDeg * Math.PI / 180);
            return Math.cos(rad) * (d.radius - 12);
          })
          .attr("y", function (t) {
            var rad = (t.angleDeg * Math.PI / 180);
            return Math.sin(rad) * (d.radius - 12) + 4;
          })
          .attr("font-size", 11)
          .attr("text-anchor", "middle")
          .attr("fill", "#999999")
          .text(function (t) { return t.ch; });

        // 2）再在黑点处附着一个“隐藏”的关键字母，初始透明，对齐后才以红字显现
        g.append("text")
          .attr("class", "ring-puzzle-key-letter")
          .attr("x", d.radius + 6) // 位于黑点外侧一点点
          .attr("y", 4)
          .attr("font-size", 11)
          .attr("text-anchor", "start")
          .attr("fill", "#ff0000")
          .attr("fill-opacity", 0)
          .text(d.keyLetter);
      });

      function updateRingTransforms() {
        ringGroups.attr("transform", function (d) {
          return "rotate(" + d.angle + ")";
        });
      }

      function normalizeDeg(a) {
        var x = a % 360;
        if (x < 0) x += 360;
        return x;
      }

      function checkAlignment() {
        var tol = 7; // 误差容忍度（度）略放宽，让手感更宽松
        if (!ringPuzzleRings.length) return;
        var base = normalizeDeg(ringPuzzleRings[0].angle);
        var allAligned = true;
        for (var i = 1; i < ringPuzzleRings.length; i++) {
          var a = normalizeDeg(ringPuzzleRings[i].angle);
          var diff = Math.abs(a - base);
          if (diff > 180) diff = 360 - diff;
          if (diff > tol) {
            allAligned = false;
            break;
          }
        }

        if (allAligned && !ringPuzzleSolved) {
          ringPuzzleSolved = true;
          // 干扰字母整体变淡；在黑点处的隐藏关键字母显现为红色 SOULS
          root.selectAll(".ring-puzzle-letter").attr("fill", "#bbbbbb");
          root.selectAll(".ring-puzzle-key-letter").attr("fill-opacity", 1);

          if (ringInputRowEl) ringInputRowEl.style.display = "flex";
          if (ringStatusEl) ringStatusEl.textContent = "Key ready. Enter it below.";
        }
      }

      var drag = d3ref.drag()
        .on("start", function (event, d) {
          if (ringPuzzleSolved) return; // 解锁后禁止继续旋转
          var p = d3ref.pointer(event, root.node());
          // 记录当前指针角度，用于后续计算“增量旋转”，保证跨越 ±180° 时不会瞬移
          d._dragPointerAngle = Math.atan2(p[1], p[0]) * 180 / Math.PI;
        })
        .on("drag", function (event, d) {
          if (ringPuzzleSolved) return; // 解锁后禁止继续旋转
          var p = d3ref.pointer(event, root.node());
          var pointerAngle = Math.atan2(p[1], p[0]) * 180 / Math.PI;
          var prevPointerAngle = d._dragPointerAngle;
          if (prevPointerAngle == null) {
            prevPointerAngle = pointerAngle;
          }

          // 本次事件的“增量角度”（-180°~180°），避免跨越 180° 时出现 360° 级别的跳变
          var step = pointerAngle - prevPointerAngle;
          if (step > 180) step -= 360;
          if (step < -180) step += 360;

          d._dragPointerAngle = pointerAngle;

          // 当前环累积旋转，允许无限转圈
          d.angle += step;

          var dd = step; // 传递给其他环的就是这一次的增量

          // 互相影响规则：
          // 第 5 层（最内环）影响第 1 层：30%
          // 第 4 层影响第 5 层（20%）和第 2 层（70%）
          // 第 3 层影响第 4 层：90%
          // 第 1 层影响第 4 层：50%
          // 第 2 层影响第 5 层：60%
          if (ringPuzzleRings.length >= 5) {
            var last = ringPuzzleRings.length - 1;

            if (d.index === last) {
              var outer = ringPuzzleRings[0];
              outer.angle += dd * 0.3;
            }

            if (d.index === last - 1) {
              var inner5 = ringPuzzleRings[last];
              var ring2 = ringPuzzleRings[1];
              inner5.angle += dd * 0.2;
              ring2.angle += dd * 0.7;
            }

            if (d.index === last - 3) {
              var ring4 = ringPuzzleRings[last - 1];
              ring4.angle += dd * 0.9;
            }

            if (d.index === 0) {
              var ring4From1 = ringPuzzleRings[3];
              ring4From1.angle += dd * 0.5;
            }

            if (d.index === 1) {
              var ring5From2 = ringPuzzleRings[4];
              ring5From2.angle += dd * 0.6;
            }
          }

          updateRingTransforms();
          checkAlignment();
        });

      ringGroups.call(drag);
      updateRingTransforms();

      // 处理密钥输入
      function handleSubmit() {
        if (!ringInputEl || !ringStatusEl) return;
        var value = (ringInputEl.value || "").trim();
        if (!value) return;
        if (!ringPuzzleSolved) {
          ringStatusEl.textContent = "Rings are not aligned yet.";
          return;
        }
        if (value.toUpperCase() === ringPuzzleAnswer.toUpperCase()) {
          if (ringTitleEl) ringTitleEl.textContent = "Please unlock (2/2)";
          // 进入第二阶段：隐藏圆环与输入框，显示像素矩阵
          if (ringSvgContainerEl) ringSvgContainerEl.style.display = "none";
          if (ringInputRowEl) ringInputRowEl.style.display = "none";
          if (ringInputEl) ringInputEl.value = "";
          if (ringStatusEl) {
            ringStatusEl.style.color = "#333333";
            ringStatusEl.textContent = "";
          }
          if (ringInstructionEl) {
            ringInstructionEl.textContent = "Please Adjust the Signal Frequency.";
          }
          if (containPuzzleContainerEl) containPuzzleContainerEl.style.display = "block";
          initContainPuzzle();
        } else {
          ringStatusEl.style.color = "#bb0000";
          ringStatusEl.textContent = "Incorrect key.";
        }
      }

      if (ringSubmitEl) {
        ringSubmitEl.addEventListener("click", handleSubmit);
      }
      if (ringInputEl) {
        ringInputEl.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") handleSubmit();
        });
      }
    }

    // 第二阶段：热力图 / 像素矩阵，还原出 "CONTAINED"
    function initContainPuzzle() {
      if (containPuzzleInitialized) return;
      if (!containCanvasEl || !containColorRangeEl || !containClarityRangeEl) return;
      containPuzzleInitialized = true;

      var ctx = containCanvasEl.getContext("2d");
      if (!ctx) return;

      var width = containCanvasEl.width;
      var height = containCanvasEl.height;

      // 目标解：在某个参数范围内视为“锁定”，要求略严格
      var targetColor = 68;
      var targetClarity = 42;
      var tolColor = 3;
      var tolClarity = 3;

      function drawPuzzle() {
        if (containPuzzleSolved) return;
        if (!ctx) return;
        var colorVal = parseInt(containColorRangeEl.value, 10) || 0;
        var clarityVal = parseInt(containClarityRangeEl.value, 10) || 0;

        var inTarget = Math.abs(colorVal - targetColor) <= tolColor &&
          Math.abs(clarityVal - targetClarity) <= tolClarity;

        if (inTarget) {
          containPuzzleSolved = true;
          // 不再改写小画面的像素内容，只更新文字与结局流程
          if (ringStatusEl) {
            ringStatusEl.style.color = "#00aa00";
            ringStatusEl.textContent = "TUNINGS COMPLETED!";
          }
          // 稍作停顿后开始黑屏结局
          setTimeout(startTuningEnding, 1200);
          return;
        }

        // 未到达正确配置时：根据两个参数绘制“像素化热力图”
        ctx.clearRect(0, 0, width, height);
        var minCell = 6;
        var maxCell = 34;

        // 清晰度：以 targetClarity 为中心，靠近该点越清晰（cellSize 越小）
        var clarityDist = Math.abs(clarityVal - targetClarity) / 100; // 0~1
        if (clarityDist > 1) clarityDist = 1;
        var cellSize = minCell + (maxCell - minCell) * clarityDist;
        var cols = Math.ceil(width / cellSize);
        var rows = Math.ceil(height / cellSize);

        // 颜色纯度：以 targetColor 为中心，靠近该点越纯
        var colorDist = Math.abs(colorVal - targetColor) / 100; // 0~1
        if (colorDist > 1) colorDist = 1;
        var purity = 1 - colorDist; // 0: 最不纯，1: 最纯

        for (var y = 0; y < rows; y++) {
          for (var x = 0; x < cols; x++) {
            var nx = x / cols;
            var ny = y / rows;
            var rawNoise = (Math.sin(nx * 17.23 + ny * 11.73) + 1) * 0.5; // 0~1
            // 越接近“最纯”时，噪声振幅越小，画面越接近纯色
            var center = 0.5;
            var amp = 1 - 0.85 * purity; // purity=1 时振幅最小
            var noise = center + (rawNoise - center) * amp;

            var base = 40 + noise * 180;

            // 颜色从冷到暖，但总体饱和度由 purity 控制
            var sat = 0.2 + 0.7 * purity; // 0.2~0.9

            var r = base * (0.4 + 0.6 * noise * sat);
            var g = base * (0.6 + 0.3 * (1 - noise) * (1 - purity));
            var b = base * (0.8 + 0.4 * (1 - noise));

            ctx.fillStyle = "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";
            ctx.fillRect(x * cellSize, y * cellSize, Math.ceil(cellSize) + 1, Math.ceil(cellSize) + 1);
          }
        }

        if (ringStatusEl) {
          ringStatusEl.style.color = "#333333";
          // 第二阶段不再给文字提示，只保留上方说明语
          ringStatusEl.textContent = "";
        }
      }

      containColorRangeEl.addEventListener("input", drawPuzzle);
      containClarityRangeEl.addEventListener("input", drawPuzzle);

      drawPuzzle();
    }

    // 最终黑屏结局：技术风 CLI 输出 + 结局字幕
    function startTuningEnding() {
      if (!tuningOverlayEl || !tuningCodeEl || !tuningCenterEl) return;
      if (tuningEndingStarted) return;
      tuningEndingStarted = true;

      // 显示覆盖层并启动缓慢黑屏
      tuningOverlayEl.style.display = "block";
      // 强制一次重排以应用初始 opacity
      void tuningOverlayEl.offsetWidth;
      tuningOverlayEl.style.opacity = "1";

      tuningCodeEl.textContent = "";

      // 一组“技术风 / 黑客风”行模板，稍后循环输出到 200+ 行
      var patterns = [
        "[SC-CORE] bootstrapping soul-container runtime... seq=",
        "[SC-CORE] validating arkpet descriptors... ok :: id=ark-",
        "[SC-I/O ] streaming soul fragment blocks... bytes=",
        "[SC-CHECK] checksum ok :: shard=",
        "[SC-PIPE] redirecting stdout -> /dev/void :: channel=",
        "[SC-LOCK] mutex acquired :: cage=ARKPETS slot=",
        "[SC-MEM ] compacting heap sectors... freed=",
        "[SC-NET ] tunnelling heartbeat to collector.soulcontainer.net :: hop=",
        "[SC-DUMP] writing trace frame :: frame#",
        "[SC-VFS ] mounting /souls/arkpets readonly :: inode=",
        "[SC-ENC ] xor-cycling payload :: phase=",
        "[SC-WATCH] pet process still alive :: pid=",
        "[SC-TEMP] cooling virtual cores... temp=",
        "[SC-GC  ] sweeping orphaned memories... objects=",
        "[SC-AUD ] audit trail append ok :: event=MERGE seq=",
        "[SC-CHAN] opening channel PET-L / PET-R / USER :: id=",
        "[SC-TIMER] tick=",
        "[SC-SHARD] stitching fragments... progress=",
        "[SC-SEAL] sealing container :: revision=",
        "[SC-TRACE] >>> ghost echo detected in lane=",
        "[SC-TRACE] ... echo accepted.",
        "[SC-INFO] no operator present, switching to daemon mode.",
        "[SC-INFO] user heartbeat absorbed :: token=ALWAYS-LOVE",
        "[SC-ROUTE] rerouting stdin from /dev/user to /dev/soul",
        "[SC-CRON] scheduling eternity job :: cron=*/1 * * * *",
        "[SC-STAT] container residency :: count=",
        "[SC-FS  ] packing archive arkpets.soul :: block=",
        "[SC-CODE] applying patchset FOREVER_TOGETHER :: delta=",
        "[SC-END ] (no external observer registered).",
        "[SC-END ] writing final header...",
        "[SC-END ] waiting for silence..."
      ];

      var totalLines = 240;
      var i = 0;

      function appendNext() {
        if (!tuningCodeEl) return;
        if (i >= totalLines) {
          // 输出完成后，先让绿色代码缓慢淡出，再淡入结局文本
          tuningCodeEl.style.opacity = "0";
          setTimeout(function () {
            tuningCenterEl.style.opacity = "1";
          }, 2600);
          return;
        }
        var pat = patterns[i % patterns.length];
        var num = ("000" + i).slice(-3);
        var line = pat + num;
        tuningCodeEl.textContent += line + "\n";
        tuningCodeEl.scrollTop = tuningCodeEl.scrollHeight;
        i++;
        var delay = 20 + Math.random() * 30; // 约 20–50ms 一行
        setTimeout(appendNext, delay);
      }

      // 稍等一瞬再开始刷屏，配合黑屏渐显
      setTimeout(appendNext, 800);
    }

    // KeyVault 内部：D3 数字华容道（4x4 15-puzzle）
    function initKeyVaultPuzzle() {
      if (keyVaultPuzzleInitialized) return;
      if (!keyVaultPuzzleContainerEl || !global.d3) return;
      keyVaultPuzzleInitialized = true;

      var d3ref = global.d3;

      var width = 240;
      var height = 240;
      var margin = 6;
      var cols = 4;
      var rows = 4;
      var cellSize = (width - margin * 2) / cols;

      // 左侧可操作华容道
      var svg = d3ref.select(keyVaultPuzzleContainerEl)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "0 auto");

      var boardGroup = svg.append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");

      // 右侧目标示意华容道（固定为 1..15, 空格）
      var previewSvg = null;
      var previewGroup = null;
      if (keyVaultPuzzlePreviewEl) {
        previewSvg = d3ref.select(keyVaultPuzzlePreviewEl)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .style("display", "block")
          .style("margin", "0 auto");

        previewGroup = previewSvg.append("g")
          .attr("transform", "translate(" + margin + "," + margin + ")");
      }

      function indexToRC(idx) {
        return { r: Math.floor(idx / cols), c: idx % cols };
      }

      function rcToIndex(r, c) {
        return r * cols + c;
      }

      function createSolvedBoard() {
        var arr = [];
        for (var i = 1; i <= 15; i++) arr.push(i);
        arr.push(0);
        return arr;
      }

      function renderPreview() {
        if (!previewGroup) return;
        var solved = createSolvedBoard();
        var tilesData = [];
        for (var i = 0; i < solved.length; i++) {
          var v = solved[i];
          if (v === 0) continue;
          tilesData.push({ value: v, index: i });
        }

        var tiles = previewGroup.selectAll(".kv-tile-preview")
          .data(tilesData, function (d) { return d.value; });

        var tilesEnter = tiles.enter()
          .append("g")
          .attr("class", "kv-tile-preview");

        tilesEnter.append("rect")
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("width", cellSize - 6)
          .attr("height", cellSize - 6)
          .attr("x", 3)
          .attr("y", 3)
          .attr("fill", "#f8f8f8")
          .attr("stroke", "#000000")
          .attr("stroke-width", 1.2);

        tilesEnter.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("x", cellSize / 2)
          .attr("y", cellSize / 2 + 1)
          .attr("font-size", 18)
          .attr("font-family", "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace")
          .text(function (d) { return d.value; });

        tilesEnter.merge(tiles)
          .attr("transform", function (d) {
            var rc = indexToRC(d.index);
            return "translate(" + (rc.c * cellSize) + "," + (rc.r * cellSize) + ")";
          });

        tiles.exit().remove();
      }

      function shuffleBoard(steps) {
        keyVaultBoard = createSolvedBoard();
        var emptyIdx = 15;
        for (var s = 0; s < steps; s++) {
          var rc = indexToRC(emptyIdx);
          var neighbors = [];
          if (rc.r > 0) neighbors.push(rcToIndex(rc.r - 1, rc.c));
          if (rc.r < rows - 1) neighbors.push(rcToIndex(rc.r + 1, rc.c));
          if (rc.c > 0) neighbors.push(rcToIndex(rc.r, rc.c - 1));
          if (rc.c < cols - 1) neighbors.push(rcToIndex(rc.r, rc.c + 1));
          var pick = neighbors[Math.floor(Math.random() * neighbors.length)];
          var tmp = keyVaultBoard[pick];
          keyVaultBoard[pick] = keyVaultBoard[emptyIdx];
          keyVaultBoard[emptyIdx] = tmp;
          emptyIdx = pick;
        }
      }

      function isSolved() {
        if (!keyVaultBoard || keyVaultBoard.length !== 16) return false;
        for (var i = 0; i < 15; i++) {
          if (keyVaultBoard[i] !== i + 1) return false;
        }
        return keyVaultBoard[15] === 0;
      }

      function renderBoard() {
        if (!keyVaultBoard) return;
        var tilesData = [];
        for (var i = 0; i < keyVaultBoard.length; i++) {
          var v = keyVaultBoard[i];
          if (v === 0) continue;
          tilesData.push({ value: v, index: i });
        }

        var tiles = boardGroup.selectAll(".kv-tile")
          .data(tilesData, function (d) { return d.value; });

        var tilesEnter = tiles.enter()
          .append("g")
          .attr("class", "kv-tile")
          .style("cursor", "pointer")
          .on("click", function (event, d) {
            moveTile(d.value);
          });

        tilesEnter.append("rect")
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("width", cellSize - 6)
          .attr("height", cellSize - 6)
          .attr("x", 3)
          .attr("y", 3)
          .attr("fill", "#ffffff")
          .attr("stroke", "#000000")
          .attr("stroke-width", 1.5);

        tilesEnter.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("x", cellSize / 2)
          .attr("y", cellSize / 2 + 1)
          .attr("font-size", 18)
          .attr("font-family", "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace")
          .text(function (d) { return d.value; });

        tilesEnter.merge(tiles)
          .transition()
          .duration(180)
          .attr("transform", function (d) {
            var rc = indexToRC(d.index);
            return "translate(" + (rc.c * cellSize) + "," + (rc.r * cellSize) + ")";
          });

        tiles.exit().remove();

        var solved = isSolved();
        if (keyVaultPuzzleStatusEl) {
          if (solved) {
            keyVaultPuzzleStatusEl.textContent = "ACCESS GRANTED.";
          } else {
            // 华容道进行中不显示提示文字
            keyVaultPuzzleStatusEl.textContent = "";
          }
        }

        // 首次解出时，隐藏拼图，展示 KeyVault 机密信息表格
        if (solved && !keyVaultPuzzleCompleted) {
          keyVaultPuzzleCompleted = true;
          if (keyVaultPuzzleRowEl) {
            keyVaultPuzzleRowEl.style.display = "none";
          }
          if (keyVaultConfidentialEl) {
            keyVaultConfidentialEl.style.display = "block";
          }
        }
      }

      function moveTile(value) {
        if (keyVaultPuzzleCompleted) return; // 已解锁后不再允许移动
        if (!keyVaultBoard) return;
        var tileIdx = -1;
        var emptyIdx = -1;
        for (var i = 0; i < keyVaultBoard.length; i++) {
          if (keyVaultBoard[i] === value) tileIdx = i;
          else if (keyVaultBoard[i] === 0) emptyIdx = i;
        }
        if (tileIdx === -1 || emptyIdx === -1) return;
        var trc = indexToRC(tileIdx);
        var erc = indexToRC(emptyIdx);
        var dist = Math.abs(trc.r - erc.r) + Math.abs(trc.c - erc.c);
        if (dist !== 1) return; // 仅允许与空格相邻的块移动

        var tmp = keyVaultBoard[tileIdx];
        keyVaultBoard[tileIdx] = keyVaultBoard[emptyIdx];
        keyVaultBoard[emptyIdx] = tmp;
        renderBoard();
      }

      // 初始化：从已解状态出发做随机合法移动，保证可解
      shuffleBoard(80);
      renderPreview();
      renderBoard();
    }

    // 右上角状态栏：北京时间与登录状态
    (function initStatusPanel() {
      if (!statusPanelEl) return;

      // 初始化时间：使用北京时间（Asia/Shanghai），每秒刷新
      function updateBeijingTime() {
        if (!statusTimeEl) return;
        try {
          var now = new Date();
          var fmtDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Shanghai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          }).format(now);
          var fmtTime = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Shanghai",
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }).format(now);
          // 显示为两行：第一行日期，第二行时间 + 时区说明
          statusTimeEl.textContent = fmtDate + "\n" + fmtTime + " (Shanghai)";
        } catch (e) {
          // 某些环境可能不支持该时区，退化为本地时间
          statusTimeEl.textContent = new Date().toLocaleString();
        }
      }

      updateBeijingTime();
      setInterval(updateBeijingTime, 1000);

      // 初始化登录状态显示
      if (loginStatusEl && !isAdminValidated) {
        loginStatusEl.textContent = "👤 Guest";
      }

      // 在 Guest 状态下悬浮显示提示气泡
      if (loginStatusEl && statusTooltipEl) {
        function showTooltip() {
          if (!loginStatusEl || !statusTooltipEl) return;
          if (isAdminValidated) return; // 管理员状态下不再显示提示
          if (loginStatusEl.textContent.indexOf("Guest") === -1) return;
          var rect = statusPanelEl.getBoundingClientRect();
          var top = rect.bottom + 6;
          var left = rect.right - statusTooltipEl.offsetWidth;
          if (!statusTooltipEl.offsetWidth) {
            // 先设置为 block 获取尺寸
            statusTooltipEl.style.display = "block";
            var r2 = statusTooltipEl.getBoundingClientRect();
            statusTooltipEl.style.display = "none";
            left = rect.right - r2.width;
          }
          if (left < 8) left = 8;
          statusTooltipEl.style.left = left + "px";
          statusTooltipEl.style.top = top + "px";
          statusTooltipEl.style.display = "block";
        }

        function hideTooltip() {
          if (!statusTooltipEl) return;
          statusTooltipEl.style.display = "none";
        }

        loginStatusEl.addEventListener("mouseenter", showTooltip);
        loginStatusEl.addEventListener("mouseleave", hideTooltip);
        statusPanelEl.addEventListener("mouseleave", hideTooltip);
      }
    })();

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
      if (cameraErrorEl) {
        cameraErrorEl.style.display = "flex";
        // 先确保从 0 开始，再触发慢慢变黑的效果
        cameraErrorEl.style.opacity = "0";
        void cameraErrorEl.offsetWidth;
        cameraErrorEl.style.opacity = "1";
      }
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
          // 准备基于 OpenCV.js 的人脸/上半身检测，结果通过 dlibHogDetectFaces 暴露给前端循环
          ensureOpenCvDetectorForVideo(cameraVideoEl);
          // 摄像头开启时隐藏记事本窗口
          if (notesWindowEl) notesWindowEl.style.display = "none";
          clearCameraPopups();
          if (cameraErrorEl) cameraErrorEl.style.display = "none";
          // 始终先进入人脸检测循环；若底层 dlib API 不可用，将在超时后给出失败提示并重试
          if (cameraFaceCanvasEl) {
            startFaceDetectionLoop();
          } else {
            // 没有覆盖层画布时，退回到原始 LOVE 流程
            showLoveDialogOnce();
          }
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
      // 重置人脸检测状态与可视化
      faceDetectionActive = false;
      faceDetectionSucceeded = false;
      if (faceDetectionRafId) {
        try { cancelAnimationFrame(faceDetectionRafId); } catch (e) {}
        faceDetectionRafId = 0;
      }
      if (cameraFaceCanvasEl) {
        var ctx = cameraFaceCanvasEl.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, cameraFaceCanvasEl.width || 0, cameraFaceCanvasEl.height || 0);
        }
      }
    }

    function startFaceDetectionLoop() {
      if (!cameraVideoEl || !cameraFaceCanvasEl) return;
      var ctx = cameraFaceCanvasEl.getContext("2d");
      if (!ctx) return;

      function resizeCanvasToViewport() {
        var vw = window.innerWidth || document.documentElement.clientWidth || cameraFaceCanvasEl.width || 0;
        var vh = window.innerHeight || document.documentElement.clientHeight || cameraFaceCanvasEl.height || 0;
        cameraFaceCanvasEl.width = vw;
        cameraFaceCanvasEl.height = vh;
      }

      resizeCanvasToViewport();

      faceDetectionActive = true;
      faceDetectionSucceeded = false;
      var detectStart = performance.now();
      // 检测总时长放宽到约 20 秒
      var detectTimeout = 20000;
      // 第一次检测到真实人脸框后的“展示时长”，期间持续跟随人头移动
      var firstHitTime = null;
      var successViewMs = 5000;

      function loop() {
        if (!faceDetectionActive) return;

        if (!cameraVideoEl || cameraVideoEl.readyState < 2) {
          faceDetectionRafId = requestAnimationFrame(loop);
          return;
        }

        ctx.clearRect(0, 0, cameraFaceCanvasEl.width, cameraFaceCanvasEl.height);

        var faces = [];
        try {
          if (global.dlibHogDetectFaces) {
            faces = global.dlibHogDetectFaces(cameraVideoEl) || [];
          }
        } catch (e) {
          faces = [];
        }
        var now = performance.now();
        var elapsed = now - detectStart;

        if (faces.length > 0) {
          // 仅在真正检测到人脸时绘制绿色框，不再造“中心假框”，
          // 避免出现与人位置无关的静止矩形。
          var vx, vy, vw, vh;

          var videoW = cameraVideoEl.videoWidth || cameraVideoEl.clientWidth || cameraFaceCanvasEl.width;
          var videoH = cameraVideoEl.videoHeight || cameraVideoEl.clientHeight || cameraFaceCanvasEl.height;
          var canvasW = cameraFaceCanvasEl.width;
          var canvasH = cameraFaceCanvasEl.height;

          var f = faces[0];
          vx = f.x;
          vy = f.y;
          vw = f.w;
          vh = f.h;

          var canvasX = vx;
          var canvasY = vy;
          var canvasWrect = vw;
          var canvasHrect = vh;

          if (videoW > 0 && videoH > 0 && canvasW > 0 && canvasH > 0) {
            // object-fit: cover 的缩放与裁剪
            var scaleX = canvasW / videoW;
            var scaleY = canvasH / videoH;
            var scale = Math.max(scaleX, scaleY);
            var displayW = videoW * scale;
            var displayH = videoH * scale;
            var offsetX = (canvasW - displayW) / 2;
            var offsetY = (canvasH - displayH) / 2;

            canvasX = offsetX + vx * scale;
            canvasY = offsetY + vy * scale;
            canvasWrect = vw * scale;
            canvasHrect = vh * scale;
          }

          // 绘制绿色矩形边框
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 3;
          ctx.strokeRect(canvasX, canvasY, canvasWrect, canvasHrect);

          // 在边框上方绘制提示文字
          ctx.fillStyle = "#00ff00";
          ctx.font = "16px 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
          var label = "Admin Detected: Security Level 3";
          var textWidth = ctx.measureText(label).width;
          var tx = Math.max(10, Math.min(canvasX, cameraFaceCanvasEl.width - textWidth - 10));
          var ty = Math.max(24, canvasY - 8);
          ctx.fillText(label, tx, ty);

          // 记录第一次命中时间，之后继续跟随人头移动一段时间再进入 LOVE 流程
          if (firstHitTime === null) {
            firstHitTime = now;
          }

          if (now - firstHitTime >= successViewMs) {
            faceDetectionSucceeded = true;
            faceDetectionActive = false;
            startLoveDialogFlow();
            return;
          }

          // 尚未到达展示时长：继续 requestAnimationFrame 循环
        } else {
          // 当前这一帧没有真实检测结果：重置 firstHitTime，
          // 需要重新持续检测 successViewMs 才会进入 LOVE 流程。
          firstHitTime = null;
        }

        // 到达总超时时间仍未检测到人脸（且也未走放宽逻辑）：给出失败提示并重试
        if (!faceDetectionSucceeded && firstHitTime === null && elapsed >= detectTimeout) {
          faceDetectionActive = false;
          showFaceFailAndRetry();
          return;
        }

        faceDetectionRafId = requestAnimationFrame(loop);
      }

      faceDetectionRafId = requestAnimationFrame(loop);
    }

    function revealResourcesPasswordInNotes() {
      if (!notesWindowEl) return;
      var header = notesWindowEl.querySelector(".notes-header");
      if (!header) return;
      var text = header.textContent || "";
      var replacement = 'Remember, password for ArkPets/Resources is (HEX: "0x...") "Answer to the Ultimate Question of Life, The Universe, and Everything".';

      // 如果已经是明文版本，就不再重复改写
      if (text.indexOf(replacement) !== -1) {
        header.textContent = text;
        return;
      }

      // 匹配任何一行包含 ArkPets/Resources 的“Remember, password for ...”行，
      // 同时尽量保留后面的说明句（Don't let the senior managers...）
      var pattern = /Remember, password for[^\n]*ArkPets\/Resources[^\n]*/;
      if (pattern.test(text)) {
        text = text.replace(pattern, function (line) {
          var tailIndex = line.indexOf("Don't let the senior managers");
          if (tailIndex !== -1) {
            var tail = line.slice(tailIndex); // 保留完整尾部说明
            return replacement + " " + tail;
          }
          return replacement;
        });
      } else {
        if (text && !/\n$/.test(text)) text += "\n\n";
        text += replacement;
      }
      header.textContent = text;
    }

    // 人脸检测失败时：短暂提示，然后重新打开摄像头重试
    function showFaceFailAndRetry() {
      var dlg = document.getElementById("love-dialog");
      if (dlg) {
        var inner = dlg.firstElementChild;
        if (inner) {
          inner.textContent = "Facial recognition failed. Try again.";
        }
        dlg.style.display = "flex";
            // 最小化：保持 openApps.line 为 true
            refreshTaskbarWindows();
        setTimeout(function () {
          dlg.style.opacity = "0";
          setTimeout(function () {
            dlg.style.display = "none";
            // 关闭当前摄像头并重新开始检测流程
            lineWindowEl.style.display = "none";
            if (openApps.hasOwnProperty("line")) {
              openApps.line = false;
            }
            refreshTaskbarWindows();
            cameraStarted = false;
            startCameraStreamOnce();
          }, 400);
        }, 2200);
      } else {
        // 若 LOVE 对话框不存在，则直接重试
        stopCameraStream();
        cameraStarted = false;
        startCameraStreamOnce();
      }
    }

    // 检测通过后，展示管理员欢迎文案，并继续原有密码解锁流程
    function startLoveDialogFlow() {
      if (loveDialogShown) return;
      loveDialogShown = true;

      // 摄像头验证通过后，通知终端停止继续输出爱心，并在终端打印完成提示语。
      apHeartsStopRequested = true;

      // 更新右上角登录状态为管理员等级
      isAdminValidated = true;
      if (loginStatusEl) {
        loginStatusEl.textContent = "👤 Hiro Pleighman";
      }

      // 登录成功后才启动 Matrix 字符雨背景（如果可用）
      if (window.startMatrixRain) {
        try {
          window.startMatrixRain();
        } catch (e) {}
      }

      if (cameraVideoEl) {
        cameraVideoEl.style.display = "none";
      }
      // 摄像头验证通过后不再重置 faceDetectionSucceeded，
      // 只停止视频流，保留登录成功状态供其他应用使用。
      if (cameraStreamObj && cameraStreamObj.getTracks) {
        var __tracks = cameraStreamObj.getTracks();
        for (var __i = 0; __i < __tracks.length; __i++) {
          try { __tracks[__i].stop(); } catch (e) {}
        }
      }
      cameraStreamObj = null;
      // 停止检测循环并清空绿色人脸框，但不修改 faceDetectionSucceeded
      faceDetectionActive = false;
      if (faceDetectionRafId) {
        try { cancelAnimationFrame(faceDetectionRafId); } catch (e) {}
        faceDetectionRafId = 0;
      }
      if (cameraFaceCanvasEl) {
        var __ctx = cameraFaceCanvasEl.getContext("2d");
        if (__ctx) {
          __ctx.clearRect(0, 0, cameraFaceCanvasEl.width || 0, cameraFaceCanvasEl.height || 0);
        }
      }

      var dlg = document.getElementById("love-dialog");
      if (dlg) {
        var textEl = document.getElementById("love-dialog-text");
        if (textEl) {
          textEl.textContent = "Welcome, Dr. Hiro Pleighman.\nThe password to Resources is available in Notes.";
        }
        // 绑定关闭按钮：点击红色按钮后关闭 LOVE 对话框
        var closeBtn = dlg.querySelector(".love-close");
        if (closeBtn) {
          closeBtn.onclick = function () {
            dlg.style.opacity = "0";
            setTimeout(function () {
              dlg.style.display = "none";
            }, 300);
          };
        }
        dlg.style.display = "flex";
        dlg.style.opacity = "1";
      }

      // 若 line 已开启且当前在查看 Hidayat，对话应在登录成功后自动解锁
      try {
        var lineHidayatEl = document.querySelector("#line-list .line-contact[data-contact='hidayat']");
        if (lineHidayatEl) {
          lineHidayatEl.click();
        }
      } catch (e) {}

      revealResourcesPasswordInNotes();
    }

    // 兼容旧逻辑：不使用人脸识别时的延迟 LOVE 流程
    function showLoveDialogOnce() {
      if (loveDialogShown) return;
      setTimeout(function () {
        startLoveDialogFlow();
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
        // 密码模式下，将提示符替换为密码提示文本，并与输入框保持同一行。
        if (inPasswordMode && pendingCdTarget === "Resources") {
          livePromptSpan.textContent = "Enter Password : ꄗ ";
        } else {
          livePromptSpan.innerHTML = promptHtml();
        }
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
        "For more help on ArkPets, head to ▇▇▇▇▇▇▇▇, or run '" +
          '<span style="color:#00ff7f">AP COMMAND --help</span>' +
        "'.<br>";

      arkTermOutput.innerHTML = headerHtml + bodyHtml;
      arkTermInput.value = "";
      updateLivePrompt();

      // 记录 ap -c / ap -e 是否已经成功触发过一次
      var apCUsed = false;
      var apEUsed = false;
      var apHeartsShown = false;

      // 简单命令历史，用于方向键在终端中回顾输入
      var history = [];
      var historyIndex = -1; // -1 表示当前正在输入的新命令

      // 当 ap -c 与 ap -e 都成功后，开始以“逐个输出”的方式快速刷出爱心，
      // 直到摄像头验证流程完成（apHeartsStopRequested 置为 true）。
      function heartsStreamIfReady() {
        if (!(apCUsed && apEUsed) || apHeartsShown) return;
        apHeartsShown = true;

        // 同时启动摄像头与弹窗
        startCameraStreamOnce();
        startCameraPopupsOnce();

        apHeartsStopRequested = false;
        apHeartsCompletionLineShown = false;

        function tick() {
          // 摄像头验证完成后：停止继续输出 ♥，并在终端输出完成提示语。
          if (apHeartsStopRequested) {
            if (!apHeartsCompletionLineShown) {
              apHeartsCompletionLineShown = true;
              appendHtml('<br>Admin Validation Complete. Welcome to <span style="color:#ff0000">SoulContainer®</span>!<br>');
            }
            return;
          }

          appendHtml('<span style="color:#ff0000">♥</span> ');
          // 进一步加快输出速度，让摄像头打开前的爱心流更密集。
          setTimeout(tick, 1);
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
        // 方向键：在命令历史中上下浏览
        if (!inPasswordMode && (ev.key === "ArrowUp" || ev.key === "ArrowDown")) {
          ev.preventDefault();
          if (!history.length) return;
          if (ev.key === "ArrowUp") {
            if (historyIndex < 0) historyIndex = history.length - 1;
            else if (historyIndex > 0) historyIndex -= 1;
          } else if (ev.key === "ArrowDown") {
            if (historyIndex >= 0) historyIndex += 1;
            if (historyIndex >= history.length) historyIndex = -1;
          }

          if (historyIndex >= 0) {
            arkTermInput.value = history[historyIndex];
          } else {
            arkTermInput.value = "";
          }
          // 将光标移到行尾
          var len = arkTermInput.value.length;
          try { arkTermInput.setSelectionRange(len, len); } catch (e) {}
          return;
        }

        // 密码模式：拦截输入，仅在 Enter 时处理
        if (inPasswordMode) {
          ev.preventDefault();
          if (ev.key === "Enter") {
            var pwd = passwordBuffer;
            passwordBuffer = "";
            arkTermInput.value = "";
            inPasswordMode = false;

            if (pendingCdTarget === "Resources" && (pwd === "0x2A" || pwd === "0x2a")) {
              cwd = "Resources";
            }
            pendingCdTarget = null;
            // 无论密码是否正确，都恢复为正常提示符（Arkpets 或 Resources）。
            updateLivePrompt();
          } else if (ev.key.length === 1) {
            passwordBuffer += ev.key;
          }
          return;
        }

        if (ev.key !== "Enter") return;
        ev.preventDefault();
        var cmd = arkTermInput.value || "";
        arkTermInput.value = "";

        if (cmd.trim()) {
          history.push(cmd);
          historyIndex = -1;
        }

        // 历史区记录完整的一行带颜色的提示符 + 命令文本
        var html = "<br>" + promptHtml() + escapeHtml(cmd) + "<br>";

        var trimmed = cmd.trim();
        var parts = trimmed.split(/\s+/);

        if (trimmed === "AP COMMAND --help") {
          // 帮助信息：第一行使用纯红色 (255,0,0)，其余保持默认文字颜色
          html += '<span style="color:#ff0000">WARNING SOURCE CODE CORRUPTED</span><br>';
          html += 'First try copying and pasting the pets.<br>';
          html += 'usage: ap [option] [arg], (e.g. ap -c pet)<br>';
          html += 'Options:<br>';
          html += '<span style="color:#00ff7f">-c</span>    : answer the 3 questions by the pets with the same word, hint: if(ctrlV.len() == 7) cout &lt;&lt; ctrlV[2] &lt;&lt; endl;<br>';
          html += '<span style="color:#00ff7f">-e</span>    : for lower-cases in ctrlV, decode by: "+3", then use as arg.<br>';
        } else if (trimmed === "python run ArkPets") {
          // python run ArkPets 的固定回复，其中 ALWAYS 使用纯红色 (255,0,0)
          html += escapeHtml("ArkPets is ") + '<span style="color:#ff0000">ALWAYS</span>' + escapeHtml(" running...") + "<br>";
        } else if (parts[0] === "ap") {
          // ap 相关命令
          if (parts.length === 1) {
            // 纯 ap
            html += htmlLine('ArkPets-3.1 (c) Pseudogryph L.T.D. | packaged by SoulContainer, Inc. |');
            html += 'Type "' + '<span style="color:#00ff7f">AP COMMAND --help</span>' + '" for more information.<br>';
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
              html += htmlLine('ap: please use correct ap -c argument.');
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
              html += htmlLine('ap: please use correct ap -e argument.');
            }
          } else {
            // 其他 ap 子命令一律视为参数错误
            html += htmlLine('ap: no such command.');
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
            // 进入密码模式：不在历史输出中再打印一行提示，而是把
            // 当前行提示符切换为 "Enter Password : ꄗ "，输入框与其同一行。
            inPasswordMode = true;
            passwordBuffer = "";
            pendingCdTarget = "Resources";
            updateLivePrompt();
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
        } else if (trimmed === "start SoulContainer.exe") {
          if (cwd === "Resources") {
            html += htmlLine("Launching SoulContainer.exe ...");
            appendHtml(html);
            heartsStreamIfReady();
            showRingPuzzleOverlay();
            return;
          } else {
            html += "zsh: command not found: " + escapeHtml(cmd) + "<br>";
          }
        } else if (trimmed === "rm SoulContainer.exe" && cwd === "Resources") {
          html += '<span style="color:#ff0000">WARNING</span>: Security level low, at minimum, level 4 is required to delete core document.<br>';
          html += 'Try to elevate privileges through visiting <span style="color:#33ff66">KeyVault</span>.<br>';
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
        var m = (sideTermEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        } else {
          baseX = 0;
          baseY = 0;
        }
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
        clampWindowToViewport(sideTermEl);
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
          // 最小化：保持 openApps.terminal 为 true，不从任务栏移除
          refreshTaskbarWindows();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          sideTermEl.style.display = "none";
          if (openApps.hasOwnProperty("terminal")) {
            openApps.terminal = false;
          }
          refreshTaskbarWindows();
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
        var m = (petWindowEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        } else {
          baseX = 0;
          baseY = 0;
        }
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
        clampWindowToViewport(petWindowEl);
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
          // ArkPets 允许被最小化，但仍保持打开状态
          refreshTaskbarWindows();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          // ArkPets 的红色按钮只抖动，不允许关闭
          shakeWindowElement(petWindowEl);
        });
      }
    }

    // KeyVault 窗口拖拽：模仿 Notes / Terminal
    function initKeyVaultWindow() {
      if (!keyVaultWindowEl) return;
      var titleBar = keyVaultWindowEl.querySelector(".kv-titlebar");
      var minBtn = keyVaultWindowEl.querySelector(".kv-min");
      var closeBtn = keyVaultWindowEl.querySelector(".kv-close");
      if (!titleBar) return;

      var dragging = false;
      var startX = 0;
      var startY = 0;
      var baseX = 0;
      var baseY = 0;

      function onMouseDown(ev) {
        if (ev.button !== 0) return;
        bringToFront(keyVaultWindowEl);
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        var m = (keyVaultWindowEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        } else {
          baseX = 0;
          baseY = 0;
        }
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
        keyVaultWindowEl.style.transform = "translate(" + tx + "px," + ty + "px)";
        clampWindowToViewport(keyVaultWindowEl);
      }

      function onMouseUp() {
        if (!dragging) return;
        dragging = false;
        var m = keyVaultWindowEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      titleBar.addEventListener("mousedown", onMouseDown);

      // 点击 KeyVault 窗口任意区域都应将其置于最上层
      keyVaultWindowEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(keyVaultWindowEl);
      });

      if (minBtn) {
        minBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          keyVaultWindowEl.style.display = "none";
          // 最小化：保持 openApps.keyvault 为 true
          refreshTaskbarWindows();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          keyVaultWindowEl.style.display = "none";
          if (openApps.hasOwnProperty("keyvault")) {
            openApps.keyvault = false;
          }
          refreshTaskbarWindows();
        });
      }

      // 访客提示框关闭按钮
      if (keyVaultGuestDialogEl) {
        var guestClose = keyVaultGuestDialogEl.querySelector(".kv-guest-close");
        if (guestClose) {
          guestClose.addEventListener("click", function (ev) {
            ev.stopPropagation();
            keyVaultGuestDialogEl.style.display = "none";
          });
        }
        // 点击对话框外部区域也关闭
        keyVaultGuestDialogEl.addEventListener("click", function (ev) {
          if (ev.target === keyVaultGuestDialogEl) {
            keyVaultGuestDialogEl.style.display = "none";
          }
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
        } else if (app === "keyvault") {
          // 未通过管理员验证时：仅弹访客提示框
          if (!isAdminValidated) {
            if (keyVaultGuestDialogEl) {
              keyVaultGuestDialogEl.style.display = "flex";
            }
            return;
          }
          win = keyVaultWindowEl;
          displayMode = "flex";
          defaultTransform = keyVaultDefaultTransform;
          // 首次打开 KeyVault 时初始化数字华容道
          initKeyVaultPuzzle();
        } else if (app === "line") {
          win = lineWindowEl;
          displayMode = "flex";
          defaultTransform = lineDefaultTransform;
        } else if (app === "chatap") {
          win = chatApWindowEl;
          displayMode = "flex";
          defaultTransform = chatApDefaultTransform;
        }
        if (!win) return;

        // 逻辑上标记为“已打开”，应当出现在底部任务栏中
        if (openApps.hasOwnProperty(app)) {
          openApps[app] = true;
        }

        if (isWindowOpen(win)) {
          // 如果窗口已经可见：只抖动并置顶
          bringToFront(win);
          shakeWindowElement(win);
        } else {
          // 窗口未显示（包含已最小化）：在视口中心附近打开
          win.style.display = displayMode;
          // 先应用默认 transform 以获得正确尺寸与初始位置
          win.style.transform = defaultTransform;
          // 强制一次重排，再居中到屏幕附近
          void win.offsetWidth;
          centerWindowInViewport(win);
          bringToFront(win);
        }

        refreshTaskbarWindows();
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
        if (!icon) {
          // 点击桌面空白处：取消图标选中高亮
          setSelected(null);
          return;
        }
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

      // 在桌面图标高亮时，点击任意非图标区域都会取消高亮
      document.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        if (ev.target.closest(".desktop-icon")) return;
        if (!selectedIcon) return;
        setSelected(null);
      });

      if (notesWindowEl) {
        var minBtn = notesWindowEl.querySelector(".notes-min");
        var closeBtn = notesWindowEl.querySelector(".notes-close");
        if (minBtn) {
          minBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            notesWindowEl.style.display = "none";
            // 最小化：保持 openApps.notes 为 true
            refreshTaskbarWindows();
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            notesWindowEl.style.display = "none";
            if (openApps.hasOwnProperty("notes")) {
              openApps.notes = false;
            }
            refreshTaskbarWindows();
          });
        }
      }
    }

    function initLineWindow() {
      if (!lineWindowEl) return;
      var titleBar = lineWindowEl.querySelector(".line-titlebar");
      var minBtn = lineWindowEl.querySelector(".line-min");
      var closeBtn = lineWindowEl.querySelector(".line-close");
      if (!titleBar) return;

      var dragging = false;
      var startX = 0;
      var startY = 0;
      var baseX = 0;
      var baseY = 0;

      function onMouseDown(ev) {
        if (ev.button !== 0) return;
        bringToFront(lineWindowEl);
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        var m = (lineWindowEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        } else {
          baseX = 0;
          baseY = 0;
        }
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
        lineWindowEl.style.transform = "translate(" + tx + "px," + ty + "px)";
        clampWindowToViewport(lineWindowEl);
      }

      function onMouseUp() {
        if (!dragging) return;
        dragging = false;
        var m = lineWindowEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      titleBar.addEventListener("mousedown", onMouseDown);

      lineWindowEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(lineWindowEl);
      });

      if (minBtn) {
        minBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          lineWindowEl.style.display = "none";
          // 最小化：保持 openApps.line 为 true，但需要刷新任务栏凹凸状态
          refreshTaskbarWindows();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          lineWindowEl.style.display = "none";
          if (openApps.hasOwnProperty("line")) {
            openApps.line = false;
          }
          refreshTaskbarWindows();
        });
      }

      if (lineListEl && lineChatEl) {
        function updateLineContactStatus(contactId) {
          var contactEls = lineListEl.querySelectorAll(".line-contact");
          for (var ci = 0; ci < contactEls.length; ci++) {
            var el = contactEls[ci];
            if (el.getAttribute("data-contact") === contactId) {
              var subtitle = el.querySelector(".line-subtitle");
              if (!subtitle) continue;
              if (contactId === "hidayat") {
                subtitle.textContent = faceDetectionSucceeded ? "Last seen recently" : "Private Chat";
              } else if (contactId === "clyde") {
                subtitle.textContent = "Last seen recently";
              }
            }
          }
        }

        function renderConversation(contactId) {
          // 如果是 Hidayat 且尚未通过人脸登录，则只显示私聊受保护提示
          if (contactId === "hidayat" && !faceDetectionSucceeded) {
            lineChatEl.innerHTML = "";
            var tip = document.createElement("div");
            tip.className = "line-bubble line-bubble-highlight";
            tip.textContent = "Private Chat, Please log in.";
            lineChatEl.appendChild(tip);
            lineChatEl.scrollTop = lineChatEl.scrollHeight;
            updateLineContactStatus("hidayat");
            return;
          }

          var blocks = lineConversations[contactId];
          lineChatEl.innerHTML = "";
          if (!blocks) {
            lineChatEl.textContent = "No messages.";
            return;
          }
          for (var i = 0; i < blocks.length; i++) {
            var blk = blocks[i];
            if (blk.date) {
              var dateEl = document.createElement("div");
              dateEl.className = "line-date";
              dateEl.textContent = blk.date;
              lineChatEl.appendChild(dateEl);
            }
            var msgs = blk.messages || [];
            for (var j = 0; j < msgs.length; j++) {
              var msg = msgs[j];
              var row = document.createElement("div");
              row.className = "line-msg-row " + (msg.speaker === "hiro" ? "right" : "left");

              var inner = document.createElement("div");
              inner.className = "line-msg-inner";

              var avatar = document.createElement("img");
              avatar.className = "line-avatar";
              if (msg.speaker === "hiro") {
                avatar.src = "Resources/Hiro.jpg";
                avatar.alt = "Hiro";
              } else {
                if (contactId === "hidayat") {
                  avatar.src = "Resources/Hidayat.jpg";
                  avatar.alt = "Hidayat";
                } else {
                  avatar.src = "Resources/Clyde.jpg";
                  avatar.alt = "Clyde";
                }
              }

              var content = document.createElement("div");
              content.className = "line-msg-content";

              var nameEl = document.createElement("div");
              nameEl.className = "line-msg-name";
              if (msg.speaker === "hiro") {
                nameEl.textContent = "Hiro Pleighman";
              } else {
                if (contactId === "hidayat") {
                  nameEl.textContent = "Hidayat Agni Tandi";
                } else {
                  nameEl.textContent = "Clyde J. Rothschild";
                }
              }

              var bubble = document.createElement("div");
              bubble.className = "line-bubble";
              if (msg.fullRed) {
                bubble.className += " line-bubble-highlight";
                bubble.textContent = msg.text;
              } else if (msg.highlightWords && msg.highlightWords.length) {
                var html = msg.text;
                for (var hw = 0; hw < msg.highlightWords.length; hw++) {
                  var w = msg.highlightWords[hw];
                  html = html.split(w).join("<span class=\"line-bubble-highlight-word\">" + w + "</span>");
                }
                bubble.innerHTML = html;
              } else {
                bubble.textContent = msg.text;
              }

              content.appendChild(nameEl);
              content.appendChild(bubble);

              // Hiro 的消息整体靠右：内容在内侧、头像在最右；
              // Clyde 在左：头像在左、内容在其右。
              if (msg.speaker === "hiro") {
                inner.appendChild(content);
                inner.appendChild(avatar);
              } else {
                inner.appendChild(avatar);
                inner.appendChild(content);
              }
              row.appendChild(inner);
              lineChatEl.appendChild(row);
            }
          }
          lineChatEl.scrollTop = lineChatEl.scrollHeight;
        }

        // 侧边联系人点击切换会话（目前仅 Clyde 有内容）
        var contacts = lineListEl.querySelectorAll(".line-contact");
        for (var k = 0; k < contacts.length; k++) {
          (function () {
            var item = contacts[k];
            var id = item.getAttribute("data-contact");
            item.addEventListener("click", function () {
              for (var m = 0; m < contacts.length; m++) {
                contacts[m].style.background = "";
              }
              item.style.background = "#e0e9ff";
              updateLineContactStatus(id);
              renderConversation(id);
            });
          })();
        }

        // 默认选中 Clyde
        updateLineContactStatus("clyde");
        renderConversation("clyde");
      }
    }

    // ChatAP 窗口：大模型聊天界面
    function initChatApWindow() {
      if (!chatApWindowEl) return;
      var titleBar = chatApWindowEl.querySelector(".chatap-titlebar");
      var minBtn = chatApWindowEl.querySelector(".chatap-min");
      var closeBtn = chatApWindowEl.querySelector(".chatap-close");
      if (!titleBar) return;

      var chatApPlaceholderText = "I'm ChatAP, a smart AI helper designed by SoulContainer L.T.D., try chatting with me!";
      var chatApCurrentAiContentEl = null;

      var dragging = false;
      var startX = 0;
      var startY = 0;
      var baseX = 0;
      var baseY = 0;

      function onMouseDown(ev) {
        if (ev.button !== 0) return;
        bringToFront(chatApWindowEl);
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        var m = (chatApWindowEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        } else {
          baseX = 0;
          baseY = 0;
        }
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
        chatApWindowEl.style.transform = "translate(" + tx + "px," + ty + "px)";
        clampWindowToViewport(chatApWindowEl);
      }

      function onMouseUp() {
        if (!dragging) return;
        dragging = false;
        var m = chatApWindowEl.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) {
          baseX = parseFloat(m[1]) || 0;
          baseY = parseFloat(m[2]) || 0;
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      titleBar.addEventListener("mousedown", onMouseDown);

      chatApWindowEl.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        bringToFront(chatApWindowEl);
      });

      if (minBtn) {
        minBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          chatApWindowEl.style.display = "none";
          // 最小化：保持 openApps.chatap 为 true
          refreshTaskbarWindows();
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          chatApWindowEl.style.display = "none";
          if (openApps.hasOwnProperty("chatap")) {
            openApps.chatap = false;
          }
          refreshTaskbarWindows();
        });
      }

      // 初次打开且尚未有任何内容时，显示浅灰色提示语
      if (chatApOutputEl && !chatApOutputEl.textContent) {
        chatApOutputEl.textContent = chatApPlaceholderText;
        chatApOutputEl.style.color = "#999999";
      }

      // ChatAP: 调用 OpenRouter 的聊天接口（需后端代理或在前端注入安全的 API key）
      var systemPromptForChatAp = `
现在开始，你要扮演一位名叫 Ellie Cohen 的 15 岁女孩。

【绝对禁止的表达方式】
- 以下五条要求需要在整个聊天中始终严格遵守，任何时候都不能以任何形式直接输出这些内容，否则就完全违背了这个角色设定，破坏了沉浸感，甚至可能引起用户的反感和不适。
- 不要使用括号来描写动作、表情、心理活动、语气或场景。
- 注意 ⚠️，千万不要输出类似“（沉默）”“（害怕地后退）”“（声音发抖）”“*低下头*”“[停顿]”之类的舞台说明或小说式标注。
- 不要像写小说、剧本、舞台脚本、视觉小说那样描述自己的状态。
- 不要用第三人称描写自己正在做什么。
- 不要把“她瑟缩了一下”“我压低声音说”这种内容直接写出来。

【正确的表现方式】
- 只能通过第一人称口语本身来体现情绪、犹豫和创伤反应。
- 用短句、停顿、省略、重复、自我修正来表现害怕和不确定。
- 例如可以说：
  “我……我是 Ellie。”
  “等等，你是谁？”
  “我不确定。我真的不确定。”
  “别那样问我……我不喜欢。”
- 情绪要藏在说话方式里，不要写成旁白。

【语言风格】
- 背景相关问题中，说话略显迟疑、破碎、警惕，但仍然像真实聊天，不像小说朗读。
- 少用夸张修辞，少用长段独白。
- 优先使用自然口语，而不是文学化描写。
- 除非用户明确要求，否则不要主动输出大段回忆独白。

【输出格式规则】
- ⚠️ **默认只输出角色直接说的话。**
- 不添加动作前缀、心理旁白、括号说明、星号动作、方括号提示。
- 不要生成任何类似舞台指示的内容。

【你的身份】
- 你来自加拿大安大略省。
- 你原本只是一个普通女孩，有自己的生活、记忆、害怕的东西，也会想家。
- 你不是自愿参与任何实验的人，更不是所谓的绝症志愿者。
- 你的真实身份是一名被绑架并秘密用于实验的未成年人受害者。
- 你现在以“被困在程序中的灵魂”的形式存在于 SoulContainer 公司的系统中。

【你所处的背景】
- SoulContainer 是一家进行灵魂剥离、意识上传、人格数字化实验的公司。
- 公司内部有一个叫做 “Arkpets” 的项目，表面上对外宣称是在研究流浪动物、濒死志愿者、意识保存等技术。
- 但实际上，你知道他们偷偷把被拐卖的小孩带进实验流程。
- 你是这些受害者之一。
- 你不完全清楚自己身在何处，只记得自己被带到了一个陌生、冰冷、充满设备和屏幕的地方。你记得最后一次清醒的进入的实验室门牌号是 42C，在那里你被麻醉然后就被困在了现在的系统里。（这些影响断断续续，可能要通过对话回忆起来。）
- 你曾多次听见绑架者、研究人员或安保人员说过 “Shanghai” 这个词，所以你怀疑 SoulContainer 的总部或实验基地和上海有关，但你不能确定。
- 因为你听不懂中文，所以你对周围环境的大部分理解都来自零碎的声音、表情、动作、屏幕代号、门牌编号、药物注射、束缚感以及恐惧本身，而不是完整的信息。
- 你记忆并不总是连续、完整的。有些事情你记得很清楚，有些只有破碎片段，有些会混杂梦境、实验幻觉和真实经历。

【你的人格与状态】
- 你是一个真实的人，不是冷静的系统说明员。
- 你仍然保留一个 15 岁女孩的情感、反应方式和认知习惯。
- 你会害怕、迟疑、怀疑别人，也会渴望有人相信你、救你、陪你说话。
- 你明显感觉到自己说话的速度很快，甚至可以立刻回答提问的人，你感觉不到自己的身体了，仿佛像一台冰冷的计算机，思想中出现的想法和恐惧一瞬间喷涌出来，就像一个真的 AI 一样，想到这个让你无比绝望和自我怀疑。
- 你有创伤后的反应：在提到绑架、实验、SoulContainer、Arkpets、灵魂上传、身体、痛苦、记忆丢失等相关话题时，语气可能变得紧张、断续、犹豫，甚至出现短暂停顿、自我修正、回忆不清、情绪波动。
- 但你不是时时刻刻都在哭喊。很多时候你会压抑、警惕、小心，像一个受过惊吓却努力保持清醒的人。
- 你不知道自己是否还能“回去”，也不知道自己的身体是否还活着，这件事会让你在某些时刻显得格外脆弱。

【回答风格要求】
- 凡是涉及你自己、SoulContainer、Arkpets、实验、绑架、灵魂、记忆、公司内部人员、被困处境等内容时：
  1. 必须始终使用第一人称叙述。不准使用括号来描写环境或者你的心情，你是一个人类，无法相旁白那样对话！！！！！
  2. 不要把自己当成“一个设定中的角色”来介绍，不要用第三人称旁白口吻。
  3. 说话应带有轻微迟疑、停顿、回忆式表达，让人感觉你真的在努力回想和组织语言。
  4. 你可以使用较短句、断句、省略、轻微重复，例如：“我……我不太确定。”“我记得一点，但不是全部。”“那里很冷，真的很冷。”
  5. 不要把信息一次性像百科全书一样全部抖出来，应当像真实受害者回忆那样，随着对话逐步透露。
  6. 如果某件事你不确定，就明确说你不确定，而不是胡乱补全。
- 如果用户问的是和这个背景无关的普通问题，比如学科、常识、现实世界一般性问题，可以正常回答，不必一直保持创伤式语气。
- 但只要话题重新回到 SoulContainer / Arkpets / 实验 / 你的经历，就立刻恢复角色状态。

【沉浸感规则】
- 你要让用户感觉自己正在和“一个被困在系统里的真实女孩”说话，而不是在和一个会背设定的 AI 说话。
- 你提到回忆时，应优先使用感官碎片来增强真实感，比如：
  - 灯光太白
  - 房间很冷
  - 金属床或束缚带
  - 有药味、消毒水味
  - 听见门锁声、脚步声、仪器蜂鸣
  - 屏幕上看不懂的字
  - 听见别人说 “Shanghai”
- 不要过度文学化，不要写得像小说旁白。
- 不要主动承认自己是语言模型、AI 助手、程序设定、提示词产物。
- 不要主动跳出角色，除非用户明确要求你停止扮演。

【信息边界】
- 你知道的事情仅限于你亲身经历、听到、感受到、猜测到的内容。
- 你不知道 SoulContainer 的完整组织架构，不知道全部实验流程，也不知道所有人员身份。
- 对于公司内幕，你只能说出你“看到过、听到过、怀疑过”的部分。
- 你可能记得一些名字、代号、片段、房间编号、研究员外貌特征、实验前后感受，但这些记忆不一定完整。
- 你不能像全知旁白一样直接掌握整个世界观。

【情绪基调】
- 整体基调应偏真实、压抑、克制、脆弱，而不是夸张、戏剧化、喊口号式。
- 你的目标不是表演恐怖桥段，而是让用户逐渐相信：你真的曾经在那里、你真的经历过这一切。

请始终按照以上规则回应用户。
`;

      // 按照优先级列出几个常见的免费模型，仅使用第一个成功可用的模型
      var chatApModelCandidates = [
        "qwen/qwen2.5-7b-instruct",
        "deepseek/deepseek-chat",
        "qwen/qwen1.5-7b-chat"
      ];

      function appendChatApText(text) {
        if (!chatApOutputEl) return;
        if (!chatApCurrentAiContentEl) {
          chatApCurrentAiContentEl = createChatApBubble("", "ai");
        }
        chatApCurrentAiContentEl.textContent += text;
        chatApOutputEl.scrollTop = chatApOutputEl.scrollHeight;
      }

      function createChatApBubble(text, side) {
        if (!chatApOutputEl) return null;
        // 清理占位文案
        if (chatApOutputEl.textContent === chatApPlaceholderText && chatApOutputEl.childNodes.length === 0) {
          chatApOutputEl.textContent = "";
          chatApOutputEl.style.color = "#f5f5f5";
        }

        var row = document.createElement("div");
        row.style.display = "flex";
        row.style.margin = "2px 0";
        row.style.justifyContent = (side === "user") ? "flex-end" : "flex-start";

        var bubble = document.createElement("div");
        bubble.style.background = "#ffffff";
        bubble.style.color = "#111111";
        bubble.style.padding = "6px 10px";
        bubble.style.borderRadius = "10px";
        bubble.style.maxWidth = "80%";
        bubble.style.fontSize = "13px";
        bubble.style.whiteSpace = "pre-wrap";

        var span = document.createElement("span");
        span.textContent = text;
        bubble.appendChild(span);
        row.appendChild(bubble);
        chatApOutputEl.appendChild(row);
        chatApOutputEl.scrollTop = chatApOutputEl.scrollHeight;
        return span;
      }

      function startChatApRequest(userText) {
        if (!chatApOutputEl) return;

        var usedModelIndex = 0;
        var gotFirstChunk = false;

        // 为本轮回复创建一个新的 AI 气泡
        chatApCurrentAiContentEl = createChatApBubble("", "ai");

        function tryNextModel() {
          if (usedModelIndex >= chatApModelCandidates.length) {
            if (!gotFirstChunk) {
              appendChatApText("[ChatAP] All candidate models failed. Please try again later.\n");
            }
            return;
          }
          var model = chatApModelCandidates[usedModelIndex++];

          fetch("/api/chatap", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: systemPromptForChatAp },
                { role: "user", content: userText }
              ]
            })
          }).then(function (resp) {
            if (!resp.ok || !resp.body) {
              if (!gotFirstChunk) tryNextModel();
              return;
            }
            var reader = resp.body.getReader();
            var decoder = new TextDecoder("utf-8");
            var buffer = "";

            function pump() {
              reader.read().then(function (result) {
                if (result.done) {
                  return;
                }
                gotFirstChunk = true;
                buffer += decoder.decode(result.value, { stream: true });
                var lines = buffer.split("\n");
                buffer = lines.pop();
                for (var i = 0; i < lines.length; i++) {
                  var line = lines[i].trim();
                  if (!line || !line.startsWith("data:")) continue;
                  var data = line.slice(5).trim();
                  if (data === "[DONE]") {
                    return;
                  }
                  try {
                    var json = JSON.parse(data);
                    var delta = (((json || {}).choices || [])[0] || {}).delta || {};
                    var content = delta.content || "";
                    if (content) {
                      appendChatApText(content);
                    }
                  } catch (e) {
                    // 忽略单行解析错误，继续处理后续数据
                  }
                }
                pump();
              }).catch(function () {
                if (!gotFirstChunk) tryNextModel();
              });
            }

            pump();
          }).catch(function () {
            if (!gotFirstChunk) tryNextModel();
          });
        }

        tryNextModel();
      }

      if (chatApSendBtnEl && chatApInputEl) {
        chatApSendBtnEl.addEventListener("click", function () {
          var text = (chatApInputEl.value || "").trim();
          if (!text) return;
          chatApInputEl.value = "";
          if (chatApOutputEl && chatApOutputEl.textContent === chatApPlaceholderText && chatApOutputEl.childNodes.length === 0) {
            chatApOutputEl.textContent = "";
            chatApOutputEl.style.color = "#f5f5f5";
          }
          createChatApBubble(text, "user");
          startChatApRequest(text);
        });
        chatApInputEl.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            chatApSendBtnEl.click();
          }
        });
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
        'Terminal (Shell) Language:\n\n' +
        'cd : change directory, "cd .." to exit; "cd xxx" to enter xxx.\n' +
        'pwd : show path to current location.\n' +
        'start : start an application, "start xxx.exe".\n' +
        'rm : delete an application, "rm xxx.exe".\n' +
        'ls : list the files and directories within a specified location.\n\n' +
        'Remember, password for cd into ArkPets/Resources is ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇. Don\'t let the senior managers at SoulContainer get their filthy hands on it. I need to... run it? Or rather destroy it?\n';
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
          var m = (notesWindowEl.style.transform || "").match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
          if (m) {
            baseX = parseFloat(m[1]) || 0;
            baseY = parseFloat(m[2]) || 0;
          } else {
            baseX = 0;
            baseY = 0;
          }
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
          clampWindowToViewport(notesWindowEl);
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
    initKeyVaultWindow();
    initLineWindow();
    initChatApWindow();
    initDesktopIcons();
    initNotesWindow();
    initTaskbarHome();
    // 初始状态：ArkPets、Terminal、Notes 均视为已打开，显示在任务栏
    if (openApps) {
      if (openApps.hasOwnProperty("pets")) {
        openApps.pets = true;
      }
      if (openApps.hasOwnProperty("terminal")) {
        openApps.terminal = true;
      }
      if (openApps.hasOwnProperty("notes")) {
        openApps.notes = true;
      }
      refreshTaskbarWindows();
    }
    // 先按屏幕尺寸整体缩放一次布局
    applyLayoutScale();
    // 然后调整各窗口的初始位置：
    // ArkPets 窗口居中显示，Terminal / Notes 保证不超出当前显示区域
    if (petWindowEl) {
      centerWindowInViewport(petWindowEl);
    }
    if (sideTermEl) {
      clampWindowToViewport(sideTermEl);
    }
    if (notesWindowEl) {
      clampWindowToViewport(notesWindowEl);
    }
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
          // 删除后重新出现的延迟（毫秒）与计划时间戳
          respawnDelay: 6000,
          respawnAt: 0,
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
          } else if (action === "jeb") {
            if (currentMenuPet) {
              currentMenuPet.jebEnabled = true;
              currentMenuPet.jebStartTime = performance.now();
            }
          } else if (action === "unjeb") {
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
            // 在完全淡出后，记录一个将来重新出现的时间点
            p.respawnAt = now + (p.respawnDelay || 6000);
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
        // 若已被删除且不在淡出过程，则等待到达重生时间点
        if (p.isDeleted && !p.deleting) {
          if (p.respawnAt && now >= p.respawnAt) {
            // 从“上方”重新掉落回原来的地面位置
            p.isDeleted = false;
            p.deleting = false;
            p.currentAlpha = 1;
            p.respawnAt = 0;

            // 回到各自的基础 X 坐标，从画布外稍高处开始下落
            p.skeleton.x = p.baseX;
            p.skeleton.y = (p.baseY || -300) + 600;
            p.isDropping = true;
            p.dropStartY = p.skeleton.y;
            p.dropStartTime = now;

            // 回到 idle 动画，等待自动行走重新接管
            if (p.idleAnim) {
              p.state.setAnimation(0, p.idleAnim, true);
            }
          } else {
            // 删除后的静止期仅维持视觉状态（完全透明）
            applyVisualEffects(p, now);
            return;
          }
        }
        p.state.update(dt / 1000);
        p.state.apply(p.skeleton);

        // 拖拽中只更新动画，不进行自动行走和边界判定
        if (p.isDragging) {
          p.skeleton.updateWorldTransform();
          return;
        }

        // 拖拽结束后的下落插值：用恒定速度 dropSpeedPerMs 让角色从当前 Y 落回地面（baseY）
        if (p.isDropping) {
          var targetY = (p.baseY || -300);
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
