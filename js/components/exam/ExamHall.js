import { STORE_EXAMS, EVENTS, escapeHtml } from "../../config.js";
import { dbGetAll, dbDelete } from "../../services/db.js";
import { startExam } from "./ExamRunner.js";
import { openEditExamModal, openUploadExamModal } from "../modals/ExamEditorModal.js";

export async function loadExamHall() {
  const exams = await dbGetAll(STORE_EXAMS);
  exams.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN", { numeric: true }));

  const container = document.getElementById("examListContainer");
  container.innerHTML = exams
    .map(
      (ex) => `
    <div class="exam-card">
      <div>
        <h4 style="font-size:1.05rem;">${escapeHtml(ex.title)}</h4>
        <div class="exam-meta">
          <span>⏱ ${ex.duration}分钟</span>
          <span>📄 原卷照片: ${ex.pages ? ex.pages.length : 0}张</span>
        </div>
      </div>
      <div class="exam-card-actions">
        <button class="btn btn-primary" style="flex:1; justify-content:center;" data-action="start" data-id="${ex.id}">🚀 开始模考</button>
        <button class="btn btn-outline" style="padding:6px 10px;" data-action="edit" data-id="${ex.id}">✏️ 编辑</button>
        <button class="btn btn-danger" style="padding:6px 10px;" data-action="delete" data-id="${ex.id}">🗑️</button>
      </div>
    </div>`
    )
    .join("");
}

export function initExamHall() {
  document.getElementById("examListContainer").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "start") startExam(id);
    if (btn.dataset.action === "edit") openEditExamModal(id);
    if (btn.dataset.action === "delete") {
      if (confirm("确定要删除这套试卷吗？")) {
        await dbDelete(STORE_EXAMS, id);
        loadExamHall();
      }
    }
  });

  window.addEventListener(EVENTS.EXAMS_CHANGED, loadExamHall);
}

export { openUploadExamModal };
