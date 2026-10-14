import { GEMINI_MODEL, GEMINI_API_KEY_STORAGE } from "../config.js";

export function getApiKey() {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
}

export function saveApiKey(key) {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
}

export function splitDataUrl(dataUrl) {
  const pureBase64 = dataUrl.split(",")[1];
  const mimeType = dataUrl.split(";")[0].split(":")[1] || "image/png";
  return { mimeType, pureBase64 };
}

export function toInlineData(dataUrl) {
  const { mimeType, pureBase64 } = splitDataUrl(dataUrl);
  return { mime_type: mimeType, data: pureBase64 };
}

export async function generateContent(parts) {
  const apiKey = getApiKey();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] })
    }
  );
  return res.json();
}

export function extractText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function analyzeQuestionImage(dataUrl) {
  const { mimeType, pureBase64 } = splitDataUrl(dataUrl);
  const promptText = `你是小学奥数教练。观察题目图片：1.所属模型；2.一两句话题眼；3.小学化直观图解；4.出1道同类变式题。`;
  const data = await generateContent([
    { text: promptText },
    { inline_data: { mime_type: mimeType, data: pureBase64 } }
  ]);
  const text = extractText(data);
  if (!text) throw new Error("识别出错");
  return text;
}

function appendQuestionParts(parts, selectedQuestions, { heading, aiLabel }) {
  selectedQuestions.forEach((q, idx) => {
    parts.push({
      text: `\n\n=== 【第 ${idx + 1} ${heading}】(备注：${q.note || "真题"}，答案：${q.ans || "未填"}) ===`
    });
    if (q.img && q.img.startsWith("data:image")) {
      parts.push({ inline_data: toInlineData(q.img) });
    }
    if (q.ai) {
      parts.push({ text: `${aiLabel}${q.ai}` });
    }
  });
}

export async function analyzeThinking(selectedQuestions) {
  const parts = [
    {
      text: `你是一位经验丰富的小学奥数金牌名师。家长选中了以下 ${selectedQuestions.length} 道孩子做错的数学竞赛真题（附带题目图片与考点信息）。
请为家长和四年级孩子提供一份极其通俗易懂、直击本质的【深度解题思路与启发导图】：

针对每一道题，请按以下 5 个模块规范输出：
1. 🎯【模型本质与考点归纳】：指出它属于哪类经典竞赛模型（如：和差倍分、周期规律、流水行船、方阵、几何割补等）；
2. ⚠️【孩子易错点与思维陷阱】：四年级学生最容易在哪一步卡壳、算错或想偏？
3. 🔑【破题第一步（题眼）】：第一眼应该抓哪个关键条件？辅助线或草稿图应该从哪里下笔？
4. 📐【小学化直观图解与推理】：尽量不用复杂的未知数方程，多用“画线段图、画示意图、设数法、逆推法、打包法”，分步写清算理；
5. 🗣️【家长一句话启发话术】：家长可以用怎样一个简单的提问，引导孩子自己想通（而不是直接报答案）。

语言必须生动、接地气，契合四年级孩子的认知特点。`
    }
  ];
  appendQuestionParts(parts, selectedQuestions, {
    heading: "道题",
    aiLabel: "该题以往记录："
  });
  return generateContent(parts);
}

export async function generateSimilar(selectedQuestions) {
  const parts = [
    {
      text: `你是一位全国顶尖的小学奥数金牌教练。家长选中了以下 ${selectedQuestions.length} 道数学真题（包含题目图片/考点信息）。
请为孩子量身定制一套“举一反三·相似变式训练题”：

【出题与排版要求】：
1. 针对每道题，分别出 1 道【考点模型相同、解题逻辑一致、但题目情境与数字不同】的高仿练习题（难度契合四年级WMO竞赛水平）；
2. 每道变式题必须清晰分为以下三个模块：
   - 📝【相似变式题】：题目叙述清晰，符合四年级阅读习惯；
   - 💡【考点与小学化图解思路】：指出题眼，用通俗易懂的画图法、线段图、数形结合或设数法讲解，尽量少列抽象复杂未知数方程；
   - 🎯【参考答案与关键步骤】：给出明确数值与核心算式。
3. 语言亲切生动，适合打印出来给四年级孩子练习。`
    }
  ];
  appendQuestionParts(parts, selectedQuestions, {
    heading: "道题档案",
    aiLabel: "该题以往分析背景："
  });
  return generateContent(parts);
}
