import { generateSimilar, extractText } from "../../services/gemini.js";
import { requireApiKey } from "./KeyModal.js";

export async function runSimilar(selectedQuestions) {
  if (!requireApiKey()) return;

  const outputModal = document.getElementById("similarModal");
  const outputBox = document.getElementById("similarOutput");
  outputBox.textContent = `⏳ 正在请求 Gemini 针对您选中的 ${selectedQuestions.length} 道错题生成同难度举一反三变式题，请稍候约 5~10 秒...`;
  outputModal.classList.add("active");

  try {
    const data = await generateSimilar(selectedQuestions);
    const text = extractText(data);
    outputBox.textContent = text || "生成失败，API 返回：" + JSON.stringify(data);
  } catch (err) {
    outputBox.textContent = "请求失败，请检查网络或 API Key 是否有效：" + err.message;
  }
}

export function initSimilarModal() {
  document.getElementById("btnCloseSimilar").addEventListener("click", () => {
    document.getElementById("similarModal").classList.remove("active");
  });
  document.getElementById("btnCopySimilar").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("similarOutput").textContent).then(() => {
      alert("已将生成的相似题全部复制到剪贴板！可直接粘贴到微信或Word。");
    });
  });
  document.getElementById("btnPrintSimilar").addEventListener("click", () => {
    const content = document.getElementById("similarOutput").innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html><head><title>奥数相似题强化练习卷</title>
      <style>body{font-family:sans-serif; line-height:1.6; padding:20px; white-space:pre-wrap;}</style>
      </head><body><h2>奥数举一反三·相似变式强化练习</h2>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });
}
