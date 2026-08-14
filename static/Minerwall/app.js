const assetFiles = [
  "ada1.jpeg",
  "ada2.jpeg",
  "ada3.jpeg",
  "ada4.jpeg",
  "ada5.jpeg",
  "ada6.jpeg",
  "ana1.jpeg",
  "ana2.jpeg",
  "ana3.jpeg",
  "ann1.jpeg",
  "ann2.jpeg",
  "ann3.jpeg",
  "bra1.jpeg",
  "bra2.jpeg",
  "dio1.jpeg",
  "dio2.jpeg",
  "hem1.jpeg",
  "rhd1.jpeg",
  "rhd2.jpeg",
  "rhd3.jpeg",
  "rhs1.jpeg",
  "rhs2.JPG",
  "rhs3.jpeg",
  "uva1.jpeg",
  "uva2.jpeg",
  "wul1.jpeg",
  "wul2.jpeg",
  "xhf1.png",
  "xhf2.jpeg"
];

const viewport = document.getElementById("viewport");
const wall = document.getElementById("wall");
const detailModal = document.getElementById("detail-modal");

const galleryMain = document.getElementById("gallery-main");
const galleryMainWrap = document.getElementById("gallery-main-wrap");
const thumbStrip = document.getElementById("thumb-strip");
const closeModalBtn = document.getElementById("close-modal");
const prevImageBtn = document.getElementById("prev-image");
const nextImageBtn = document.getElementById("next-image");

const mineralCodeEl = document.getElementById("mineral-code");
const mineralNameEl = document.getElementById("mineral-name");
const mineralFormulaEl = document.getElementById("mineral-formula");
const mineralSizeEl = document.getElementById("mineral-size");
const mineralPriceEl = document.getElementById("mineral-price");
const mineralRarityEl = document.getElementById("mineral-rarity");
const mineralCrystalSystemEl = document.getElementById("mineral-crystal-system");
const mineralGroupEl = document.getElementById("mineral-group");
const mineralSummaryEl = document.getElementById("mineral-summary");
const slideIndicatorEl = document.getElementById("slide-indicator");
const wallStatsEl = document.getElementById("wall-stats");
const topbarEl = document.querySelector(".topbar");

const modalState = {
  mineral: null,
  imageIndex: 0,
  timer: null
};

const layoutState = {
  minerals: [],
  positioned: []
};

const AUTO_PLAY_MS = 3400;
const CARD_FRAME = {
  side: 10,
  top: 18,
  bottom: 40
};
const VIEWPORT_PADDING = 12;

function pickMeta(meta, key, fallbackValue) {
  if (Object.prototype.hasOwnProperty.call(meta, key)) {
    return meta[key];
  }

  return fallbackValue;
}

function normalizeMetaMap(rawMeta) {
  if (!rawMeta || typeof rawMeta !== "object") {
    return {};
  }

  const normalized = {};

  Object.entries(rawMeta).forEach(([key, value]) => {
    if (typeof key !== "string" || !value || typeof value !== "object") {
      return;
    }

    normalized[key.toLowerCase()] = value;
  });

  return normalized;
}

async function loadMineralMeta() {
  try {
    const response = await fetch("minerals.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load minerals.json: ${response.status}`);
    }

    const rawMeta = await response.json();
    return normalizeMetaMap(rawMeta);
  } catch (error) {
    console.warn("minerals.json load failed, fallback to defaults.", error);
    return {};
  }
}

function parseAssets(files, metaMap = {}) {
  const groups = new Map();
  const matcher = /^([a-zA-Z]{3})(\d+)\.(jpe?g|png|webp|gif)$/i;

  files.forEach((fileName) => {
    const match = fileName.match(matcher);
    if (!match) {
      return;
    }

    const id = match[1].toLowerCase();
    const index = Number.parseInt(match[2], 10);
    const src = `assets/${fileName}`;

    if (!groups.has(id)) {
      groups.set(id, []);
    }

    groups.get(id).push({ id, index, fileName, src });
  });

  return [...groups.entries()]
    .map(([id, images]) => {
      images.sort((a, b) => a.index - b.index || a.fileName.localeCompare(b.fileName));
      const cover = images.find((item) => item.index === 1) ?? images[0];
      const meta = metaMap[id] || {};

      return {
        id,
        code: id.toUpperCase(),
        name: pickMeta(meta, "name", cover.fileName),
        chemicalFormula: pickMeta(meta, "chemicalFormula", ""),
        size: pickMeta(meta, "size", ""),
        marketPrice: pickMeta(meta, "marketPrice", ""),
        rarity: pickMeta(meta, "rarity", ""),
        crystalSystem: pickMeta(meta, "crystalSystem", ""),
        group: pickMeta(meta, "group", ""),
        summary: pickMeta(meta, "summary", ""),
        cover,
        images
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function loadImageDimension(src) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1
      });
    };

    image.onerror = () => {
      resolve({ width: 4, height: 3 });
    };

    image.src = src;
  });
}

async function enrichMinerals(minerals) {
  const dimensions = await Promise.all(minerals.map((item) => loadImageDimension(item.cover.src)));

  return minerals.map((item, index) => ({
    ...item,
    cover: {
      ...item.cover,
      width: dimensions[index].width,
      height: dimensions[index].height
    }
  }));
}

function ratioOf(item) {
  return item.cover.width / item.cover.height;
}

function photoHeightForRow(rowItems, containerWidth, gap) {
  const ratioSum = rowItems.reduce((sum, item) => sum + ratioOf(item), 0);
  const fixed = rowItems.length * CARD_FRAME.side * 2 + (rowItems.length - 1) * gap;
  const dynamic = containerWidth - fixed;

  if (dynamic <= 0 || ratioSum <= 0) {
    return 60;
  }

  return dynamic / ratioSum;
}

function buildRows(minerals, containerWidth, targetPhotoHeight, gap) {
  const rows = [];
  let currentRow = [];

  function pushRow(items) {
    const photoHeight = Math.max(56, photoHeightForRow(items, containerWidth, gap));
    rows.push({
      items: [...items],
      photoHeight,
      cardHeight: photoHeight + CARD_FRAME.top + CARD_FRAME.bottom
    });
  }

  minerals.forEach((item) => {
    currentRow.push(item);

    if (currentRow.length === 1) {
      return;
    }

    const withCurrent = photoHeightForRow(currentRow, containerWidth, gap);
    if (withCurrent >= targetPhotoHeight) {
      return;
    }

    const withCurrentDiff = Math.abs(withCurrent - targetPhotoHeight);
    const last = currentRow.pop();
    const withoutCurrent = photoHeightForRow(currentRow, containerWidth, gap);
    const withoutCurrentDiff = Math.abs(withoutCurrent - targetPhotoHeight);

    if (currentRow.length === 0 || withCurrentDiff <= withoutCurrentDiff) {
      currentRow.push(last);
      pushRow(currentRow);
      currentRow = [];
      return;
    }

    pushRow(currentRow);
    currentRow = [last];
  });

  if (currentRow.length > 0) {
    pushRow(currentRow);
  }

  return rows;
}

function totalRowsHeight(rows, gap) {
  if (rows.length === 0) {
    return 0;
  }

  const cardsHeight = rows.reduce((sum, row) => sum + row.cardHeight, 0);
  return cardsHeight + gap * (rows.length - 1);
}

function findBestRows(minerals, containerWidth, containerHeight, gap) {
  let low = 72;
  let high = Math.max(140, containerHeight);
  let bestRows = buildRows(minerals, containerWidth, 180, gap);
  let bestDiff = Math.abs(totalRowsHeight(bestRows, gap) - containerHeight);

  for (let i = 0; i < 28; i += 1) {
    const target = (low + high) / 2;
    const rows = buildRows(minerals, containerWidth, target, gap);
    const totalHeight = totalRowsHeight(rows, gap);
    const diff = Math.abs(totalHeight - containerHeight);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestRows = rows;
    }

    if (totalHeight > containerHeight) {
      high = target;
    } else {
      low = target;
    }
  }

  return bestRows;
}

function stableAngleFromId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997;
  }
  return ((hash % 11) - 5) * 0.35;
}

function getTopSafeArea() {
  if (!topbarEl) {
    return VIEWPORT_PADDING;
  }

  const rect = topbarEl.getBoundingClientRect();
  return Math.max(VIEWPORT_PADDING, Math.ceil(rect.bottom + 14));
}

function layoutFullscreen(minerals, viewportWidth, viewportHeight) {
  const topSafeArea = getTopSafeArea();
  const innerWidth = Math.max(180, viewportWidth - VIEWPORT_PADDING * 2);
  const innerHeight = Math.max(180, viewportHeight - topSafeArea - VIEWPORT_PADDING);
  const gap = Math.max(8, Math.round(Math.min(viewportWidth, viewportHeight) * 0.012));
  const shouldAllowOverflow = viewportWidth <= 980;

  const rows = findBestRows(minerals, innerWidth, innerHeight, gap);
  if (rows.length === 0) {
    return {
      positioned: [],
      contentHeight: topSafeArea + VIEWPORT_PADDING
    };
  }

  let workingRows = rows;
  if (shouldAllowOverflow) {
    const minPhotoHeight = Math.max(118, Math.round(viewportWidth * 0.17));
    workingRows = rows.map((row) => {
      if (row.photoHeight >= minPhotoHeight) {
        return row;
      }

      const scale = minPhotoHeight / row.photoHeight;
      return {
        ...row,
        photoHeight: minPhotoHeight,
        cardHeight: row.cardHeight * scale
      };
    });
  }

  const cardHeights = workingRows.reduce((sum, row) => sum + row.cardHeight, 0);
  let dynamicGap =
    workingRows.length > 1
      ? Math.max(6, (innerHeight - cardHeights) / (workingRows.length - 1))
      : 0;

  if (shouldAllowOverflow) {
    dynamicGap = gap;
  }

  const usedHeight = cardHeights + dynamicGap * (workingRows.length - 1);
  const startY = shouldAllowOverflow
    ? topSafeArea
    : topSafeArea + Math.max(0, (innerHeight - usedHeight) / 2);

  const positioned = [];
  let y = startY;

  workingRows.forEach((row, rowIndex) => {
    let x = VIEWPORT_PADDING;
    const lastIndex = row.items.length - 1;

    row.items.forEach((item, index) => {
      const photoHeight = row.photoHeight;
      const photoWidth = ratioOf(item) * photoHeight;
      let cardWidth = photoWidth + CARD_FRAME.side * 2;
      const cardHeight = row.cardHeight;

      // Make the final card absorb rounding leftovers so every row is truly full width.
      if (index === lastIndex) {
        const rowEnd = VIEWPORT_PADDING + innerWidth;
        cardWidth = Math.max(120, rowEnd - x);
      }

      positioned.push({
        ...item,
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        delay: `${Math.min((rowIndex * 7 + index) * 70, 1100)}ms`,
        angle: stableAngleFromId(item.id)
      });

      x += cardWidth + gap;
    });

    y += row.cardHeight + dynamicGap;
  });

  const contentHeight = Math.max(
    viewportHeight,
    Math.ceil(y - dynamicGap + VIEWPORT_PADDING)
  );

  return {
    positioned,
    contentHeight
  };
}

function updateModalFrameAspect(mineral) {
  if (!galleryMainWrap || !mineral?.cover) {
    return;
  }

  const ratio = mineral.cover.width / mineral.cover.height;
  galleryMainWrap.style.setProperty("--cover-ratio", `${ratio}`);
}

function renderIslands(minerals) {
  wall.innerHTML = "";

  minerals.forEach((mineral) => {
    const island = document.createElement("button");
    island.type = "button";
    island.className = "island";
    island.style.left = `${mineral.x}px`;
    island.style.top = `${mineral.y}px`;
    island.style.width = `${mineral.width}px`;
    island.style.height = `${mineral.height}px`;
    island.style.setProperty("--delay", mineral.delay);
    island.style.setProperty("--card-angle", `${mineral.angle}deg`);
    island.dataset.mineralId = mineral.id;

    island.innerHTML = `
      <div class="polaroid-card">
        <span class="pin-dot" aria-hidden="true"></span>
        <div class="photo-window">
          <img class="island-cover" src="${mineral.cover.src}" alt="${mineral.code} 主图" loading="lazy" />
        </div>
      </div>
    `;

    island.addEventListener("click", () => {
      openModal(mineral);
    });

    wall.appendChild(island);
  });
}

function renderWallStats(minerals) {
  if (!wallStatsEl) {
    return;
  }

  const totalImages = minerals.reduce((sum, mineral) => sum + mineral.images.length, 0);
  wallStatsEl.textContent = `${minerals.length} 种矿物 / ${totalImages} 张图片`;
}

function stopAutoPlay() {
  if (modalState.timer) {
    window.clearInterval(modalState.timer);
    modalState.timer = null;
  }
}

function startAutoPlay() {
  stopAutoPlay();

  if (!modalState.mineral || modalState.mineral.images.length < 2) {
    return;
  }

  modalState.timer = window.setInterval(() => {
    stepImage(1);
  }, AUTO_PLAY_MS);
}

function renderThumbs() {
  const mineral = modalState.mineral;
  if (!mineral) {
    thumbStrip.innerHTML = "";
    return;
  }

  thumbStrip.innerHTML = "";

  mineral.images.forEach((image, index) => {
    const thumb = document.createElement("button");
    thumb.className = `thumb-btn ${index === modalState.imageIndex ? "active" : ""}`;
    thumb.type = "button";
    thumb.innerHTML = `<img src="${image.src}" alt="${mineral.code} 图像 ${index + 1}" loading="lazy" />`;

    thumb.addEventListener("click", () => {
      modalState.imageIndex = index;
      renderModalImage();
      startAutoPlay();
    });

    thumbStrip.appendChild(thumb);
  });
}

function renderModalImage() {
  const mineral = modalState.mineral;
  if (!mineral) {
    return;
  }

  const current = mineral.images[modalState.imageIndex];
  galleryMain.src = current.src;
  galleryMain.alt = `${mineral.code} 图像 ${modalState.imageIndex + 1}`;
  slideIndicatorEl.textContent = `${modalState.imageIndex + 1} / ${mineral.images.length}`;
  renderThumbs();
}

function stepImage(step) {
  const mineral = modalState.mineral;
  if (!mineral) {
    return;
  }

  const total = mineral.images.length;
  modalState.imageIndex = (modalState.imageIndex + step + total) % total;
  renderModalImage();
}

function openModal(mineral) {
  modalState.mineral = mineral;
  modalState.imageIndex = 0;

  mineralCodeEl.textContent = `SPECIMEN ${mineral.code}`;
  mineralNameEl.textContent = mineral.name;
  mineralFormulaEl.textContent = mineral.chemicalFormula;
  mineralSizeEl.textContent = mineral.size;
  mineralPriceEl.textContent = mineral.marketPrice;
  mineralRarityEl.textContent = mineral.rarity;
  mineralCrystalSystemEl.textContent = mineral.crystalSystem;
  mineralGroupEl.textContent = mineral.group;
  mineralSummaryEl.textContent = mineral.summary;

  updateModalFrameAspect(mineral);
  renderModalImage();
  startAutoPlay();

  detailModal.classList.add("active");
  detailModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  stopAutoPlay();
  modalState.mineral = null;
  detailModal.classList.remove("active");
  detailModal.setAttribute("aria-hidden", "true");
}

function bindModalEvents() {
  closeModalBtn.addEventListener("click", closeModal);
  prevImageBtn.addEventListener("click", () => {
    stepImage(-1);
    startAutoPlay();
  });
  nextImageBtn.addEventListener("click", () => {
    stepImage(1);
    startAutoPlay();
  });

  detailModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (!detailModal.classList.contains("active")) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "ArrowLeft") {
      stepImage(-1);
      startAutoPlay();
    }

    if (event.key === "ArrowRight") {
      stepImage(1);
      startAutoPlay();
    }
  });
}

function renderAdaptiveWall() {
  if (layoutState.minerals.length === 0) {
    return;
  }

  wall.style.width = `${viewport.clientWidth}px`;

  const { positioned, contentHeight } = layoutFullscreen(
    layoutState.minerals,
    viewport.clientWidth,
    viewport.clientHeight
  );
  wall.style.height = `${contentHeight}px`;

  layoutState.positioned = positioned;
  renderIslands(positioned);
  renderWallStats(positioned);
}

async function init() {
  const mineralMeta = await loadMineralMeta();
  const minerals = parseAssets(assetFiles, mineralMeta);
  layoutState.minerals = await enrichMinerals(minerals);

  bindModalEvents();
  renderAdaptiveWall();

  let resizeRaf = null;
  window.addEventListener("resize", () => {
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
    resizeRaf = requestAnimationFrame(() => {
      renderAdaptiveWall();
      resizeRaf = null;
    });
  });
}

init();
