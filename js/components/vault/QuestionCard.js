import { escapeHtml } from "../../config.js";

export function renderQuestionCard(q) {
  const preview = q.ai ? escapeHtml(q.ai.substring(0, 90) + "...") : "暂无分析";
  return `
    <div class="q-card">
      <div class="q-card-head">
        <label class="q-card-title">
          <input type="checkbox" class="vault-checkbox" value="${q.id}">
          <span>${escapeHtml(q.note)}</span>
        </label>
        <button class="btn btn-danger" style="padding:2px 6px; font-size:0.75rem;" data-action="delete" data-id="${q.id}">删</button>
      </div>
      <div class="q-img-wrap"><img src="${q.img}" alt=""></div>
      <div style="font-size:0.8rem; color:#64748b; margin-bottom:8px;">${preview}</div>
      <div class="q-card-actions">
        <button class="btn btn-info" style="flex:1; justify-content:center; font-size:0.75rem;" data-action="analyze" data-id="${q.id}">💡 分析思路</button>
        <button class="btn btn-success" style="flex:1; justify-content:center; font-size:0.75rem;" data-action="similar" data-id="${q.id}">🤖 出相似题</button>
      </div>
    </div>`;
}
