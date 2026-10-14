import {
  DB_NAME,
  DB_VERSION,
  STORE_QUESTIONS,
  STORE_EXAMS,
  DEFAULT_EXAMS,
  EVENTS,
  emit
} from "../config.js";

let db = null;

export function getDb() {
  return db;
}

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_QUESTIONS)) {
        database.createObjectStore(STORE_QUESTIONS, { keyPath: "id", autoIncrement: true });
      }
      if (!database.objectStoreNames.contains(STORE_EXAMS)) {
        database.createObjectStore(STORE_EXAMS, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = async (e) => {
      db = e.target.result;
      await preseedAllExams();
      resolve(db);
    };
  });
}

async function preseedAllExams() {
  const currentExams = await dbGetAll(STORE_EXAMS);
  for (const def of DEFAULT_EXAMS) {
    const existing = currentExams.find((x) => x.title.includes(def.title.slice(0, 5)));
    if (!existing) {
      await dbAdd(STORE_EXAMS, def);
    }
  }
}

export function dbAdd(storeName, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export function dbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = () => reject(req.error);
  });
}

export function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function exportData() {
  const questions = await dbGetAll(STORE_QUESTIONS);
  const exams = await dbGetAll(STORE_EXAMS);
  const backup = {
    version: 4,
    exportTime: new Date().toISOString(),
    questions,
    exams
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `奥数管家全量备份_${new Date().getMonth() + 1}月${new Date().getDate()}日.json`;
  a.click();
}

export function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.questions) {
          for (const q of data.questions) {
            await dbAdd(STORE_QUESTIONS, q);
          }
        }
        if (data.exams) {
          for (const ex of data.exams) {
            await dbAdd(STORE_EXAMS, ex);
          }
        }
        alert("🎉 题库与真题全部恢复成功！");
        emit(EVENTS.EXAMS_CHANGED);
        emit(EVENTS.QUESTIONS_CHANGED);
      } catch (err) {
        alert("备份文件解析失败：" + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
