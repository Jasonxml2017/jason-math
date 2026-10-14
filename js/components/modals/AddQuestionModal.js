import { STORE_QUESTIONS, EVENTS, emit } from "../../config.js";
import { dbAdd } from "../../services/db.js";
import { analyzeQuestionImage } from "../../services/gemini.js";
import { requireApiKey } from "./KeyModal.js";

let curSingleImg = "";

export function openAddModal() {
  curSingleImg = "";
  document.getElementById("singlePreviewImg").style.display = "none";
  document.getElementById("singlePasteText").style.display = "block";
  document.getElementById("inpNote").value = "";
  document.getElementById("inpAI").value = "";
  document.getElementById("addModal").classList.add("active");
}

function handleSingleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    curSingleImg = e.target.result;
    document.getElementById("singlePreviewImg").src = curSingleImg;
    document.getElementById("singlePreviewImg").style.display = "block";
    document.getElementById("singlePasteText").style.display = "none";
  };
  reader.readAsDataURL(file);
}

async function callGeminiSingle() {
  if (!requireApiKey()) return;
  if (!curSingleImg) {
    alert("请先上传题目图片！");
    return;
  }
  const aiBox = document.getElementById("inpAI");
  aiBox.value = "🤖 Gemini 正在深度剖析解法与变式题...";
  try {
    aiBox.value = await analyzeQuestionImage(curSingleImg);
  } catch (e) {
    aiBox.value = "识别出错：" + e.message;
  }
}

async function saveSingleQuestion() {
  if (!curSingleImg) {
    alert("请上传原图！");
    return;
  }
  await dbAdd(STORE_QUESTIONS, {
    note: document.getElementById("inpNote").value || "错题",
    ai: document.getElementById("inpAI").value,
    img: curSingleImg,
    updatedAt: new Date().toISOString()
  });
  document.getElementById("addModal").classList.remove("active");
  emit(EVENTS.QUESTIONS_CHANGED);
}

export function initAddQuestionModal() {
  document.getElementById("btnCloseAddModal").addEventListener("click", () => {
    document.getElementById("addModal").classList.remove("active");
  });
  document.getElementById("singleDropzone").addEventListener("click", () => {
    document.getElementById("singleImgFile").click();
  });
  document.getElementById("singleImgFile").addEventListener("change", (e) => {
    handleSingleFile(e.target.files[0]);
  });
  document.getElementById("btnGeminiSingle").addEventListener("click", callGeminiSingle);
  document.getElementById("btnSaveSingleQuestion").addEventListener("click", saveSingleQuestion);
}
