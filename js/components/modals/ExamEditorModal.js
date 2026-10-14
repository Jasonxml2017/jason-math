import { STORE_EXAMS, EVENTS, emit } from "../../config.js";
import { dbAdd, dbGetAll } from "../../services/db.js";
import { filesToPageDataUrls } from "../../services/pdfHelper.js";

let editingExamId = null;
let tempNewExamPages = [];

function renderExamPreview() {
  const preview = document.getElementById("newExamPreview");
  preview.innerHTML = tempNewExamPages
    .map(
      (src, idx) => `
    <div class="preview-thumb-box">
      <img src="${src}" class="preview-thumb-img" alt="">
      <span class="preview-thumb-del" data-remove-page="${idx}">×</span>
    </div>`
    )
    .join("");
}

export function openUploadExamModal() {
  editingExamId = null;
  document.getElementById("modalExamTitleText").textContent = "上传新真题试卷";
  document.getElementById("newExamTitle").value = "";
  document.getElementById("newExamDuration").value = 90;
  document.getElementById("newExamKeys").value = "";
  document.getElementById("newExamFaqAns").value = "";
  tempNewExamPages = [];
  renderExamPreview();
  document.getElementById("uploadExamModal").classList.add("active");
}

export async function openEditExamModal(id) {
  const exams = await dbGetAll(STORE_EXAMS);
  const ex = exams.find((x) => x.id === id);
  if (!ex) return;

  editingExamId = id;
  document.getElementById("modalExamTitleText").textContent = "编辑真题试卷";
  document.getElementById("newExamTitle").value = ex.title || "";
  document.getElementById("newExamDuration").value = ex.duration || 90;
  document.getElementById("newExamKeys").value = ex.keys || (ex.keysFull ? ex.keysFull.join("") : "");
  document.getElementById("newExamFaqAns").value = (ex.faqAns || []).join("\n");
  tempNewExamPages = [...(ex.pages || [])];
  renderExamPreview();
  document.getElementById("uploadExamModal").classList.add("active");
}

async function handleExamFiles(files) {
  const hint = document.getElementById("pdfLoadingHint");
  try {
    const pages = await filesToPageDataUrls(
      files,
      () => {
        hint.style.display = "block";
      },
      () => {
        hint.style.display = "none";
      }
    );
    tempNewExamPages.push(...pages);
    renderExamPreview();
  } catch (err) {
    hint.style.display = "none";
    alert("PDF 解析失败：" + err.message);
  }
}

async function saveNewExam() {
  const title = document.getElementById("newExamTitle").value.trim();
  const keysStr = document.getElementById("newExamKeys").value.trim().toUpperCase().replace(/[^A-D]/g, "");
  if (!title) {
    alert("请输入试卷名称！");
    return;
  }

  const examItem = {
    title,
    duration: Number(document.getElementById("newExamDuration").value) || 90,
    keys: keysStr,
    keysFull: keysStr.split(""),
    faqAns: document.getElementById("newExamFaqAns").value.split("\n").filter((s) => s.trim() !== ""),
    pages: tempNewExamPages
  };

  if (editingExamId) examItem.id = editingExamId;

  await dbAdd(STORE_EXAMS, examItem);
  document.getElementById("uploadExamModal").classList.remove("active");
  emit(EVENTS.EXAMS_CHANGED);
  alert(editingExamId ? "修改保存成功！" : "试卷添加成功！");
}

export function initExamEditorModal() {
  document.getElementById("btnCloseExamModal").addEventListener("click", () => {
    document.getElementById("uploadExamModal").classList.remove("active");
  });
  document.getElementById("btnSaveExam").addEventListener("click", saveNewExam);
  document.getElementById("newExamFiles").addEventListener("change", (e) => handleExamFiles(e.target.files));
  document.getElementById("newExamPreview").addEventListener("click", (e) => {
    const del = e.target.closest("[data-remove-page]");
    if (!del) return;
    tempNewExamPages.splice(Number(del.dataset.removePage), 1);
    renderExamPreview();
  });
}
