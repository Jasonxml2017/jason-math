import { isSnippingMode } from "./SnipCropper.js";

let currentZoom = 1.0;
let pinchStartDist = 0;
let pinchStartZoom = 1.0;
let pinchBound = false;

export function applyZoom(z) {
  currentZoom = Math.min(Math.max(z, 0.8), 3.5);
  const wrapper = document.getElementById("paperContentWrapper");
  if (wrapper) {
    wrapper.style.width = currentZoom * 100 + "%";
  }
  const label = document.getElementById("zoomLevelText");
  if (label) {
    label.textContent = Math.round(currentZoom * 100) + "%";
  }
}

export function zoomPaper(delta) {
  applyZoom(currentZoom + delta);
}

export function resetZoomPaper() {
  applyZoom(1.0);
}

export function renderPaperPages(pages) {
  const wrapper = document.getElementById("paperContentWrapper");
  resetZoomPaper();

  if (pages && pages.length > 0) {
    wrapper.innerHTML = pages
      .map(
        (p, idx) => `
      <div class="page-container">
        <img src="${p}" class="paper-page-img" data-page-idx="${idx}" alt="第${idx + 1}页" style="width:100%; display:block;">
        <canvas class="crop-overlay-canvas" data-page-idx="${idx}"></canvas>
      </div>`
      )
      .join("");
    return true;
  }

  wrapper.innerHTML = `
    <div class="paper-empty">
      <h4>本卷暂未上传原卷 PDF</h4>
      <p style="font-size:0.85rem; margin-top:6px;">您可看纸卷直接涂卡；也可在大厅点击【✏️ 编辑】上传对应的试卷PDF！</p>
    </div>`;
  return false;
}

export function initPaperViewer() {
  document.getElementById("btnZoomOut").addEventListener("click", () => zoomPaper(-0.25));
  document.getElementById("btnZoomIn").addEventListener("click", () => zoomPaper(0.25));
  document.getElementById("btnZoomReset").addEventListener("click", resetZoomPaper);
  initPinchZoom();
}

function initPinchZoom() {
  const container = document.getElementById("paperGalleryContainer");
  if (!container || pinchBound) return;
  pinchBound = true;

  container.addEventListener(
    "touchstart",
    (e) => {
      if (isSnippingMode()) return;
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoom = currentZoom;
      }
    },
    { passive: true }
  );

  container.addEventListener(
    "touchmove",
    (e) => {
      if (isSnippingMode()) return;
      if (e.touches.length === 2 && pinchStartDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        applyZoom(pinchStartZoom * (currentDist / pinchStartDist));
      }
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (e) => {
      if (e.touches.length < 2) pinchStartDist = 0;
    },
    { passive: true }
  );
}
