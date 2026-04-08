import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonResponse({ error: "ファイルが選択されていません" }, 400);
    }

    // 10MB制限
    if (file.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: "ファイルサイズが10MBを超えています" }, 400);
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".csv")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        sheets.push(`【シート: ${sheetName}】\n${XLSX.utils.sheet_to_csv(sheet)}`);
      }
      text = sheets.join("\n\n");
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return jsonResponse({ error: "対応していないファイル形式です。txt/csv/pdf/xlsx/docxに対応しています。" }, 400);
    }

    // テキストが長すぎる場合は切り詰め（トークン節約）
    const MAX_CHARS = 30000;
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n（※ファイルが長いため、先頭30,000文字のみ抽出しました）";
    }

    return jsonResponse({ text, fileName: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload/parse] error:", message);
    return jsonResponse({ error: `ファイル解析エラー: ${message}` }, 500);
  }
}
