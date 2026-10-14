import { STORE_QUESTIONS, EVENTS } from "../../config.js";
import { dbGetAll, dbDelete } from "../../services/db.js";
import { renderQuestionCard } from "./QuestionCard.js";
import { runAnalysis } from "../modals/AnalysisModal.js";
import { runSimilar } from "../modals/SimilarModal.js";
import { openAddModal } from "../modals/AddQuestionModal.js";

export async function loadQuestions() {
  const list = await dbGetAll(STORE_QUESTIONS);
  const container = document.getElementById("qList");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-hint">暂无错题。在模考交卷后可框选截图保存错题，或点击右上角录入！</div>`;
    return;
  }
  container.innerHTML = list.map(renderQuestionCard).join("");
}

async function getQuestionsByIds(ids) {
  const all = await dbGetAll(STORE_QUESTIONS);
  return all.filter((q) => ids.includes(q.id));
}

async function getCheckedQuestions() {
  const checkedBoxes = document.querySelectorAll(".vault-checkbox:checked");
  const ids = Array.from(checkedBoxes).map((b) => Number(b.value));
  return getQuestionsByIds(ids);
}

function toggleSelectAllVault() {
  const boxes = document.querySelectorAll(".vault-checkbox");
  if (boxes.length === 0) return;
  const anyUnchecked = Array.from(boxes).some((b) => !b.checked);
  boxes.forEach((b) => {
    b.checked = anyUnchecked;
  });
}

export function initQuestionList() {
  document.getElementById("qList").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "delete") {
      if (confirm("确定要删除此错题吗？")) {
        await dbDelete(STORE_QUESTIONS, id);
        loadQuestions();
      }
    }
    if (btn.dataset.action === "analyze") {
      const qs = await getQuestionsByIds([id]);
      if (qs[0]) runAnalysis(qs);
    }
    if (btn.dataset.action === "similar") {
      const qs = await getQuestionsByIds([id]);
      if (qs[0]) runSimilar(qs);
    }
  });

  document.getElementById("btnSelectAllVault").addEventListener("click", toggleSelectAllVault);
  document.getElementById("btnBatchAnalyze").addEventListener("click", async () => {
    const selected = await getCheckedQuestions();
    if (selected.length === 0) {
      alert("请先勾选需要分析思路的错题（可多选），或者直接点击卡片底部的【💡 分析思路】！");
      return;
    }
    runAnalysis(selected);
  });
  document.getElementById("btnBatchSimilar").addEventListener("click", async () => {
    const selected = await getCheckedQuestions();
    if (selected.length === 0) {
      alert("请先勾选需要出相似题的错题（可多选），或者直接点击卡片底部的【🤖 出相似题】！");
      return;
    }
    runSimilar(selected);
  });
  document.getElementById("btnOpenAddModal").addEventListener("click", openAddModal);

  window.addEventListener(EVENTS.QUESTIONS_CHANGED, loadQuestions);
}
