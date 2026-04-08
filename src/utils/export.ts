import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import type { ChatMessage } from "@/hooks/useChat";

function timestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stripMarkdown(text: string): string {
  // Remove file attachment context
  const fileCtxStart = text.indexOf("\n\n【添付ファイル：");
  const cleaned = fileCtxStart >= 0 ? text.slice(0, fileCtxStart) : text;
  return cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
}

// --- Copy ---
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(stripMarkdown(text));
}

// --- CSV (single message) ---
export function exportSingleCsv(
  roomName: string,
  question: string,
  answer: string,
  answerTime: string,
) {
  const bom = "\uFEFF";
  const header = "日時,部屋名,質問,回答";
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const row = [esc(answerTime), esc(roomName), esc(stripMarkdown(question)), esc(stripMarkdown(answer))].join(",");
  const csv = bom + header + "\n" + row + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `NOVAI_回答_${timestamp()}.csv`);
}

// --- CSV (all messages) ---
export function exportAllCsv(roomName: string, messages: ChatMessage[]) {
  const bom = "\uFEFF";
  const header = "日時,部屋名,質問,回答";
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "assistant") {
      const question = i > 0 && messages[i - 1].role === "user" ? stripMarkdown(messages[i - 1].content) : "";
      rows.push(
        [esc(messages[i].timestamp), esc(roomName), esc(question), esc(stripMarkdown(messages[i].content))].join(","),
      );
    }
  }

  const csv = bom + header + "\n" + rows.join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `NOVAI_全会話_${timestamp()}.csv`);
}

// --- Word (single message) ---
export async function exportSingleWord(
  roomName: string,
  question: string,
  answer: string,
  answerTime: string,
) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: roomName, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `日時: ${answerTime}`, italics: true, size: 20 })] }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "【質問】", heading: HeadingLevel.HEADING_2 }),
          ...stripMarkdown(question).split("\n").map((line) => new Paragraph({ text: line })),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "【回答】", heading: HeadingLevel.HEADING_2 }),
          ...stripMarkdown(answer).split("\n").map((line) => new Paragraph({ text: line })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `NOVAI_回答_${timestamp()}.docx`);
}

// --- Word (all messages) ---
export async function exportAllWord(roomName: string, messages: ChatMessage[]) {
  const children: Paragraph[] = [
    new Paragraph({ text: `${roomName} — 全会話履歴`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: `出力日時: ${new Date().toLocaleString("ja-JP")}`, italics: true, size: 20 })] }),
    new Paragraph({ text: "" }),
  ];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      children.push(new Paragraph({ text: `【質問】 ${msg.timestamp}`, heading: HeadingLevel.HEADING_2 }));
      stripMarkdown(msg.content).split("\n").forEach((line) => children.push(new Paragraph({ text: line })));
    } else {
      children.push(new Paragraph({ text: `【回答】 ${msg.timestamp}`, heading: HeadingLevel.HEADING_2 }));
      stripMarkdown(msg.content).split("\n").forEach((line) => children.push(new Paragraph({ text: line })));
    }
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `NOVAI_全会話_${timestamp()}.docx`);
}
