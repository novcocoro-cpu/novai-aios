export const runtime = "nodejs";

import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CONTENT_LENGTH = 50_000;

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  switch (ext) {
    case "txt":
    case "md":
    case "csv": {
      return buffer.toString("utf-8");
    }

    case "pdf": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PDFParse } = await import("pdf-parse") as any;
      if (PDFParse) {
        const parser = new PDFParse();
        const result = await parser.loadPDF(buffer);
        return result.getAllText();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import("pdf-parse") as any;
      const fn = mod.default || mod;
      const data = await fn(buffer);
      return data.text || "";
    }

    case "xlsx":
    case "xls": {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const lines: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        lines.push(`--- ${sheetName} ---`);
        const csv = XLSX.utils.sheet_to_csv(sheet);
        lines.push(csv);
      }
      return lines.join("\n");
    }

    case "docx": {
      const text = buffer.toString("utf-8");
      const matches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (matches) {
        return matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
      }
      return "（テキスト抽出に失敗しました）";
    }

    default:
      throw new Error(`未対応のファイル形式です: .${ext}`);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "other";
    const title = (formData.get("title") as string) || "";

    if (!file) {
      return jsonResponse({ error: "ファイルが選択されていません" }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: "ファイルサイズは10MB以下にしてください" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name;

    let content = await extractText(buffer, fileName);

    if (content.length > MAX_CONTENT_LENGTH) {
      console.warn(`[knowledge/upload] Content truncated: ${content.length} → ${MAX_CONTENT_LENGTH} chars`);
      content = content.slice(0, MAX_CONTENT_LENGTH) + "\n\n...（以下省略：文字数上限に達しました）";
    }

    const itemTitle = title || fileName.replace(/\.[^.]+$/, "");
    const fileType = fileName.toLowerCase().split(".").pop() || "";

    const supabase = createServerClient("mekki_shared");
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        category,
        title: itemTitle,
        content,
        file_name: fileName,
        file_type: fileType,
        tags: [],
      })
      .select("*")
      .single();

    if (error) {
      console.error("[knowledge/upload] insert failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[knowledge/upload] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
