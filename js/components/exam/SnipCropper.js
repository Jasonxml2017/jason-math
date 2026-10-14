import { STORE_QUESTIONS, EVENTS, emit } from "../../config.js";
import { dbAdd } from "../../services/db.js";

let snipping = false;
let currentSnipTarget = null;
let currentSnipRect = null;
let isPointerDown = false;
let startX = 0;
let startY = 0;
let snipPageIdx = 0;
let activeExam = null;

export function isSnippingMode() {
  return snipping;
}

export function setActiveExamForSnip(exam) {
  activeExam = exam;
}

export function startSnipping(num, userOpt, correctOpt) {
  if (!activeExam?.pages || activeExam.pages.length === 0) {
    alert("本套试卷尚未上传原卷 PDF 或图片，无法截图！请先在模考大厅点击【编辑】上传试卷 PDF。");
    return;
  }

  snipping = true;
  currentSnipTarget = { num, userOpt, correctOpt };
  currentSnipRect = null;

  document.getElementById("snipTopBanner").style.display = "flex";
  document.getElementById("snipBannerText").textContent =
    `✂️ 正在框选【第 ${num} 题】：请在左侧试卷上用鼠标或手指拖拽画框，圈出题目区域`;
  document.getElementById("snipConfirmBar").style.display = "none";
  document.getElementById("zoomFloatingBar").style.display = "none";

  document.querySelectorAll(".crop-overlay-canvas").forEach((canvas) => {
    canvas.style.display = "block";
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

export function bindOverlayCanvases() {
  document.querySelectorAll(".crop-overlay-canvas").forEach(initOverlayCanvasListeners);
}

function initOverlayCanvasListeners(canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    if (!snipping) return;
    isPointerDown = true;
    snipPageIdx = Number(canvas.dataset.pageIdx);
    startX = e.offsetX;
    startY = e.offsetY;
    canvas.setPointerCapture(e.pointerId);
    document.getElementById("snipConfirmBar").style.display = "none";
    document.querySelectorAll(".crop-overlay-canvas").forEach((c) => {
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
    });
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!isPointerDown) return;
    const curX = e.offsetX;
    const curY = e.offsetY;
    const rectX = Math.min(startX, curX);
    const rectY = Math.min(startY, curY);
    const rectW = Math.abs(curX - startX);
    const rectH = Math.abs(curY - startY);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(37, 99, 235, 0.25)";
    ctx.fillRect(rectX, rectY, rectW, rectH);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(rectX, rectY, rectW, rectH);
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    canvas.releasePointerCapture(e.pointerId);
    const curX = e.offsetX;
    const curY = e.offsetY;
    const rectX = Math.min(startX, curX);
    const rectY = Math.min(startY, curY);
    const rectW = Math.abs(curX - startX);
    const rectH = Math.abs(curY - startY);
    if (rectW > 20 && rectH > 20) {
      currentSnipRect = {
        pageIdx: snipPageIdx,
        x: rectX,
        y: rectY,
        w: rectW,
        h: rectH,
        canvasW: canvas.offsetWidth,
        canvasH: canvas.offsetHeight
      };
      document.getElementById("snipConfirmBar").style.display = "flex";
    }
  });
}

export function exitSnippingMode() {
  snipping = false;
  currentSnipTarget = null;
  currentSnipRect = null;
  document.getElementById("snipTopBanner").style.display = "none";
  document.getElementById("snipConfirmBar").style.display = "none";
  document.getElementById("zoomFloatingBar").style.display = "flex";

  document.querySelectorAll(".crop-overlay-canvas").forEach((canvas) => {
    canvas.style.display = "none";
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
}

export function confirmSaveSnip() {
  if (!currentSnipRect || !currentSnipTarget || !activeExam) return;

  const pageImgSrc = activeExam.pages[currentSnipRect.pageIdx];
  const img = new Image();
  img.onload = async () => {
    const scaleX = img.naturalWidth / currentSnipRect.canvasW;
    const scaleY = img.naturalHeight / currentSnipRect.canvasH;
    const cropX = Math.max(0, currentSnipRect.x * scaleX);
    const cropY = Math.max(0, currentSnipRect.y * scaleY);
    const cropW = Math.min(img.naturalWidth - cropX, currentSnipRect.w * scaleX);
    const cropH = Math.min(img.naturalHeight - cropY, currentSnipRect.h * scaleY);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    cropCanvas.getContext("2d").drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const base64Data = cropCanvas.toDataURL("image/jpeg", 0.9);

    await dbAdd(STORE_QUESTIONS, {
      comp: activeExam.title.includes("WMO") ? "WMO" : "真题",
      grade: "四年级",
      note: `${activeExam.title} 第${currentSnipTarget.num}题`,
      ans: currentSnipTarget.correctOpt,
      ai: `模考作答：错选 ${currentSnipTarget.userOpt}，正解为 ${currentSnipTarget.correctOpt}。已精准截取原题。`,
      img: base64Data,
      updatedAt: new Date().toISOString()
    });

    const btn = document.getElementById(`snip-btn-${currentSnipTarget.num}`);
    if (btn) {
      btn.textContent = "✅ 已保存";
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline");
      btn.disabled = true;
    }

    alert(`🎉 第 ${currentSnipTarget.num} 题已精准截图并成功收录到【错题管家】！`);
    exitSnippingMode();
    emit(EVENTS.QUESTIONS_CHANGED);
  };
  img.src = pageImgSrc;
}

export function initSnipCropper() {
  document.getElementById("btnCancelSnipBanner").addEventListener("click", exitSnippingMode);
  document.getElementById("btnCancelSnipBar").addEventListener("click", exitSnippingMode);
  document.getElementById("btnConfirmSnip").addEventListener("click", confirmSaveSnip);
}
