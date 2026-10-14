import { analyzeThinking, extractText } from "../../services/gemini.js";
import { requireApiKey } from "./KeyModal.js";

function printHtml(title, heading, content) {
  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:sans-serif; line-height:1.65; padding:20px; white-space:pre-wrap;}</style>
    </head><body><h2>${heading}</h2>${content}</body></html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export async function runAnalysis(selectedQuestions) {
  if (!requireApiKey()) return;

  const outputModal = document.getElementById("analysisModal");
  const outputBox = document.getElementById("analysisOutput");
  outputBox.textContent = `⏳ 正在请求 Gemini 深度分析 ${selectedQuestions.length} 道题目并生成小学化解题导图，请稍候约 5~8 秒...`;
  outputModal.classList.add("active");

  try {
    const data = await analyzeThinking(selectedQuestions);
    const text = extractText(data);
    outputBox.textContent = text || "分析失败，API 返回：" + JSON.stringify(data);
  } catch (err) {
    outputBox.textContent = "请求失败，请检查网络（梯子）或 API Key 是否有效：" + err.message;
  }
}

export function initAnalysisModal() {
  document.getElementById("btnCloseAnalysis").addEventListener("click", () => {
    document.getElementById("analysisModal").classList.remove("active");
  });
  document.getElementById("btnCopyAnalysis").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("analysisOutput").textContent).then(() => {
      alert("已将解题思路导图全部复制到剪贴板！");
    });
  });
  document.getElementById("btnPrintAnalysis").addEventListener("click", () => {
    printHtml("奥数解题思路导图", "奥数深度思路分析与名师导图", document.getElementById("analysisOutput").innerHTML);
  });
}
