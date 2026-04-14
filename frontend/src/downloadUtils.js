/*
This file is used to download the converted text in the desired format depending on the file
Needs to be edited to output in the desired format
  * will need to edit script.py and server.py as well
Assigned to : Shubh + Suhas/Shivaji
Text on discord if you need help with the code or understanding what the file is for.
*/

import { jsPDF } from "jspdf";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} text
 * @param {'txt' | 'pdf' | 'doc'} format
 * @param {string} [baseName] filename without extension
 */

//downloads the converted text in the desired format depending on the file
export function downloadConvertedText(text, format, baseName = "luminara-output") {
  const safeBase = baseName.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "luminara-output";

  if (format === "txt") {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${safeBase}.txt`);
    return;
  }

  if (format === "doc") {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(safeBase)}</title></head><body><pre style="font-family:Calibri, sans-serif;font-size:11pt;white-space:pre-wrap;margin:1in;">${escapeHtml(text)}</pre></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    triggerDownload(blob, `${safeBase}.doc`);
    return;
  }

  if (format === "pdf") {
    const doc = new jsPDF();
    const margin = 14;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, maxWidth);
    let y = margin;
    const lineHeight = 7;
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }
    doc.save(`${safeBase}.pdf`);
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${safeBase}.txt`);
}

//triggers the download of the converted text
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatLabel(format) {
  if (format === "pdf") return "PDF";
  if (format === "doc") return "Word";
  return "TXT";
}
