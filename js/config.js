export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_API_KEY_STORAGE = "GEMINI_API_KEY";

export const DB_NAME = "MathVaultDB";
export const DB_VERSION = 4;
export const STORE_QUESTIONS = "questions";
export const STORE_EXAMS = "exams";

export const EVENTS = {
  EXAMS_CHANGED: "mathvault:exams-changed",
  QUESTIONS_CHANGED: "mathvault:questions-changed"
};

/** 31~35 届预置真题（不含原卷图片，与旧单文件数据结构完全一致） */
export const DEFAULT_EXAMS = [
  {
    title: "第31届 WMO 地方省测 (四年级)",
    duration: 90,
    keys: "BBADDCACBACA" + "BABC",
    keysFull: ["B", "B", "A", "D", "D", "C", "A", "C", "B", "A", "C", "A", "B", "A", "B", "C"],
    faqAns: [
      "17. (1) 6条; (2) 最少710元",
      "18. 1元10枚、5角40枚、1角50枚",
      "19. (1) 2800米; (2) 8点50分",
      "20. (1) 891; (2) 10个"
    ],
    pages: []
  },
  {
    title: "第32届 WMO 地方省测 (四年级)",
    duration: 90,
    keys: "ACCACB CDBBA BBACB",
    keysFull: ["A", "C", "C", "A", "C", "B", "C", "D", "B", "B", "A", "B", "B", "A", "C", "B"],
    faqAns: [
      "17. (1) 6人; (2) 7人; (3) 6人",
      "18. (1) C; (2) 185",
      "19. (1) 1班; (2) 汉堡; (3) 欧欧",
      "20. (1) E; (2) O"
    ],
    pages: []
  },
  {
    title: "第33届 WMO 地方省测 (四年级)",
    duration: 90,
    keys: "DBCCCD CCBAD BBDCB",
    keysFull: ["D", "B", "C", "C", "C", "D", "C", "C", "B", "A", "D", "B", "B", "D", "C", "B"],
    faqAns: [
      "17. (1) 20只; (2) 32只",
      "18. (1) 540°; (2) 4次; (3) 三角形",
      "19. (1) 40厘米; (2) 30厘米",
      "20. (3)→(1)→(2)→(4)→(5) 或 (3)→(1)→(2)→(5)→(4)"
    ],
    pages: []
  },
  {
    title: "第34届 WMO 地方省测 (四年级)",
    duration: 90,
    keys: "CDD BDDD CCBB CBB CB",
    keysFull: ["C", "D", "D", "B", "D", "D", "D", "C", "C", "B", "B", "C", "B", "B", "C", "B"],
    faqAns: [
      "17. (1) 5400元; (2) 5640元; (3) 5616元",
      "18. (1) 400米; (2) 40秒",
      "19. (1) 小正方形边长6厘米，大正方形边长21厘米; (2) 300平方厘米",
      "20. (1) C; (2) 先, 右, 2格"
    ],
    pages: []
  },
  {
    title: "第35届 WMO 地方省测 (四年级)",
    duration: 90,
    keys: "ACBBAC ABBADC ACBC",
    keysFull: ["A", "C", "B", "B", "A", "C", "A", "B", "B", "A", "D", "C", "A", "C", "B", "C"],
    faqAns: [
      "17. (1) 6分钟; (2) 54分钟",
      "18. (1) B; (2) 640平方厘米, 52厘米",
      "19. (1) 星期三; (2) 风之店; (3) 土之店",
      "20. (1) 6; (2) 5; (3) 3"
    ],
    pages: []
  }
];

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
