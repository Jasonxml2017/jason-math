import { initDB, exportData, importData } from "./services/db.js";
import { initExamHall, loadExamHall, openUploadExamModal } from "./components/exam/ExamHall.js";
import { initExamRunner } from "./components/exam/ExamRunner.js";
import { initPaperViewer } from "./components/exam/PaperViewer.js";
import { initSnipCropper } from "./components/exam/SnipCropper.js";
import { initQuestionList, loadQuestions } from "./components/vault/QuestionList.js";
import { initExamEditorModal } from "./components/modals/ExamEditorModal.js";
import { initAddQuestionModal, openAddModal } from "./components/modals/AddQuestionModal.js";
import { initAnalysisModal } from "./components/modals/AnalysisModal.js";
import { initSimilarModal } from "./components/modals/SimilarModal.js";
import { initKeyModal, openKeyModal } from "./components/modals/KeyModal.js";

function switchNav(type) {
  document.getElementById("tabExam").classList.toggle("active", type === "exam");
  document.getElementById("tabVault").classList.toggle("active", type === "vault");
  document.getElementById("viewExamHall").style.display = type === "exam" ? "block" : "none";
  document.getElementById("viewVault").style.display = type === "vault" ? "block" : "none";
  const topBtn = document.getElementById("topActionBtn");
  topBtn.textContent = type === "exam" ? "＋ 新真题" : "＋ 录入错题";
  topBtn.dataset.mode = type;
}

function initNav() {
  document.getElementById("tabExam").addEventListener("click", () => switchNav("exam"));
  document.getElementById("tabVault").addEventListener("click", () => switchNav("vault"));
  document.getElementById("btnExport").addEventListener("click", exportData);
  document.getElementById("btnImport").addEventListener("click", importData);
  document.getElementById("btnOpenKey").addEventListener("click", openKeyModal);
  document.getElementById("topActionBtn").addEventListener("click", () => {
    if (document.getElementById("topActionBtn").dataset.mode === "vault") {
      openAddModal();
    } else {
      openUploadExamModal();
    }
  });
}

async function boot() {
  initNav();
  initExamHall();
  initExamRunner();
  initPaperViewer();
  initSnipCropper();
  initQuestionList();
  initExamEditorModal();
  initAddQuestionModal();
  initAnalysisModal();
  initSimilarModal();
  initKeyModal();

  await initDB();
  loadExamHall();
  loadQuestions();
}

boot();
