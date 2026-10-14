import { STORE_EXAMS, escapeHtml } from "../../config.js";
import { dbGetAll } from "../../services/db.js";
import { renderPaperPages } from "./PaperViewer.js";
import {
  bindOverlayCanvases,
  setActiveExamForSnip,
  startSnipping,
  exitSnippingMode
} from "./SnipCropper.js";

let activeExam = null;
let examTimer = null;
let examSecondsRemaining = 0;
let userExamAnswers = {};
let lastWrongQuestionsToSync = [];

export function getActiveExam() {
  return activeExam;
}

export async function startExam(examId) {
  const exams = await dbGetAll(STORE_EXAMS);
  activeExam = exams.find((x) => x.id === examId);
  if (!activeExam) return;

  setActiveExamForSnip(activeExam);
  document.getElementById("runningExamTitle").textContent = activeExam.title;
  document.getElementById("examView").style.display = "flex";
  document.getElementById("examResultPanel").style.display = "none";
  document.getElementById("runningSubmitBtn").style.display = "inline-flex";

  const hasPages = renderPaperPages(activeExam.pages);
  if (hasPages) bindOverlayCanvases();

  userExamAnswers = {};
  const bubbleSheet = document.getElementById("bubbleSheet");
  bubbleSheet.innerHTML = Array.from({ length: 16 }, (_, i) => i + 1)
    .map(
      (num) => `
    <div class="bubble-item">
      <span style="font-weight:700; font-size:0.8rem;">第${num}题</span>
      <div class="bubble-opts">
        ${["A", "B", "C", "D"]
          .map((opt) => `<div class="bubble-btn" data-num="${num}" data-opt="${opt}">${opt}</div>`)
          .join("")}
      </div>
    </div>`
    )
    .join("");

  const faqSheet = document.getElementById("faqSheet");
  faqSheet.innerHTML = [17, 18, 19, 20]
    .map(
      (num) => `
    <div style="margin-bottom:10px;">
      <label style="font-size:0.8rem; font-weight:700;">第 ${num} 题草稿/结果：</label>
      <input type="text" id="faq-input-${num}" style="width:100%; margin-top:2px;">
      <div class="ans-reveal" id="faq-reveal-${num}"></div>
    </div>`
    )
    .join("");

  examSecondsRemaining = activeExam.duration * 60;
  clearInterval(examTimer);
  examTimer = setInterval(() => {
    if (examSecondsRemaining <= 0) {
      clearInterval(examTimer);
      submitRunningExam();
      return;
    }
    examSecondsRemaining--;
    const m = String(Math.floor(examSecondsRemaining / 60)).padStart(2, "0");
    const s = String(examSecondsRemaining % 60).padStart(2, "0");
    document.getElementById("runningTimer").textContent = `${m}:${s}`;
  }, 1000);
}

function pickBubble(num, opt) {
  userExamAnswers[num] = opt;
  document.querySelectorAll(`.bubble-btn[data-num="${num}"]`).forEach((el) => el.classList.remove("selected"));
  document.querySelector(`.bubble-btn[data-num="${num}"][data-opt="${opt}"]`)?.classList.add("selected");
}

function submitRunningExam() {
  clearInterval(examTimer);
  document.getElementById("runningSubmitBtn").style.display = "none";
  let mcqScore = 0;
  lastWrongQuestionsToSync = [];
  const standardKeys =
    activeExam.keysFull || (activeExam.keys ? activeExam.keys.replace(/[^A-D]/g, "").split("") : []);

  for (let i = 1; i <= 16; i++) {
    const userOpt = userExamAnswers[i];
    const correctOpt = standardKeys[i - 1] || "";
    document.querySelectorAll(`.bubble-btn[data-num="${i}"]`).forEach((el) => el.classList.remove("selected"));

    if (userOpt && userOpt === correctOpt) {
      mcqScore += 5;
      document.querySelector(`.bubble-btn[data-num="${i}"][data-opt="${userOpt}"]`)?.classList.add("correct");
    } else {
      if (userOpt) {
        document.querySelector(`.bubble-btn[data-num="${i}"][data-opt="${userOpt}"]`)?.classList.add("wrong");
      }
      if (correctOpt) {
        document.querySelector(`.bubble-btn[data-num="${i}"][data-opt="${correctOpt}"]`)?.classList.add("correct");
      }
      lastWrongQuestionsToSync.push({ num: i, userOpt: userOpt || "未填", correctOpt });
    }
  }

  [17, 18, 19, 20].forEach((num, idx) => {
    const box = document.getElementById(`faq-reveal-${num}`);
    box.classList.add("show");
    box.innerHTML = `<b>参考答案：</b><br>${escapeHtml((activeExam.faqAns && activeExam.faqAns[idx]) || "见原卷答案")}`;
  });

  document.getElementById("finalScoreText").textContent = `选择题得分：${mcqScore} / 80`;
  document.getElementById("examResultPanel").style.display = "block";

  const container = document.getElementById("wrongItemsContainer");
  if (lastWrongQuestionsToSync.length === 0) {
    container.innerHTML = `<div class="all-correct-hint">🎉 恭喜！本卷选择题全部答对！</div>`;
    return;
  }

  container.innerHTML = `
    <div style="font-weight:bold; font-size:0.85rem; color:#b91c1c; margin-bottom:8px;">
      本次共做错 ${lastWrongQuestionsToSync.length} 道选择题，请点击下方按钮分别在试卷上框选截图保存：
    </div>
    ${lastWrongQuestionsToSync
      .map(
        (item) => `
      <div class="wrong-item-row">
        <span style="font-size:0.85rem;">
          <b>第 ${item.num} 题</b> (错选: <span style="color:#dc2626;">${escapeHtml(item.userOpt)}</span> / 正解: <span style="color:#16a34a;">${escapeHtml(item.correctOpt)}</span>)
        </span>
        <button class="btn btn-primary" id="snip-btn-${item.num}" data-snip-num="${item.num}" data-user-opt="${escapeHtml(item.userOpt)}" data-correct-opt="${escapeHtml(item.correctOpt)}" style="padding:4px 10px; font-size:0.75rem;">
          ✂️ 框选保存
        </button>
      </div>`
      )
      .join("")}`;
}

function exitExam() {
  if (confirm("确定退出当前考试界面吗？")) {
    clearInterval(examTimer);
    exitSnippingMode();
    document.getElementById("examView").style.display = "none";
  }
}

export function initExamRunner() {
  document.getElementById("bubbleSheet").addEventListener("click", (e) => {
    const btn = e.target.closest(".bubble-btn");
    if (!btn) return;
    pickBubble(Number(btn.dataset.num), btn.dataset.opt);
  });

  document.getElementById("wrongItemsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-snip-num]");
    if (!btn || btn.disabled) return;
    startSnipping(Number(btn.dataset.snipNum), btn.dataset.userOpt, btn.dataset.correctOpt);
  });

  document.getElementById("btnExitExam").addEventListener("click", exitExam);
  document.getElementById("runningSubmitBtn").addEventListener("click", submitRunningExam);
}
