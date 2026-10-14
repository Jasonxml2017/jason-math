import { getApiKey, saveApiKey } from "../../services/gemini.js";

export function openKeyModal() {
  document.getElementById("inpApiKey").value = getApiKey();
  document.getElementById("keyModal").classList.add("active");
}

export function requireApiKey() {
  const apiKey = getApiKey();
  if (!apiKey) {
    alert("请先在顶部【🔑 Key】中配置您的 Gemini API Key！");
    openKeyModal();
    return false;
  }
  return true;
}

export function initKeyModal() {
  document.getElementById("btnCloseKeyModal").addEventListener("click", () => {
    document.getElementById("keyModal").classList.remove("active");
  });
  document.getElementById("btnSaveApiKey").addEventListener("click", () => {
    saveApiKey(document.getElementById("inpApiKey").value);
    document.getElementById("keyModal").classList.remove("active");
    alert("Key 已保存！");
  });
}
