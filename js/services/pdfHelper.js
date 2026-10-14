export function readImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

export async function parsePdfToPages(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF 组件加载中，请确保网络通畅。");
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas.toDataURL("image/jpeg", 0.88));
  }

  return pages;
}

export async function filesToPageDataUrls(files, onPdfStart, onPdfEnd) {
  const pages = [];
  for (const file of Array.from(files)) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      onPdfStart?.();
      try {
        const pdfPages = await parsePdfToPages(file);
        pages.push(...pdfPages);
      } finally {
        onPdfEnd?.();
      }
    } else {
      pages.push(await readImageFile(file));
    }
  }
  return pages;
}
