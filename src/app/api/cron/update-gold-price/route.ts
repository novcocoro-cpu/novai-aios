import { NextResponse } from "next/server";
import { fetchGoldPriceFromGemini, saveGoldPrice } from "@/lib/gold-price";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const price = await fetchGoldPriceFromGemini();
  if (price === null) {
    return NextResponse.json(
      { ok: false, error: "Gemini fetch returned null" },
      { status: 502 },
    );
  }

  const { updated_at } = await saveGoldPrice(price, "gemini");
  return NextResponse.json({ ok: true, price, updated_at, source: "gemini" });
}
