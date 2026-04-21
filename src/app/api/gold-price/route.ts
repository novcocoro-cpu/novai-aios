import {
  fetchGoldPriceFromGemini,
  saveGoldPrice,
  readCachedGoldPrice,
} from "@/lib/gold-price";
import { jsonResponse } from "@/lib/api-response";

const FALLBACK_PRICE = 14820;

export async function GET() {
  try {
    const cached = await readCachedGoldPrice();
    if (cached) {
      return jsonResponse({ ...cached, source: "cache" });
    }

    const price = await fetchGoldPriceFromGemini();
    if (price !== null) {
      const { updated_at } = await saveGoldPrice(price, "gemini");
      return jsonResponse({ price, updated_at, source: "gemini" });
    }

    return jsonResponse({
      price: FALLBACK_PRICE,
      updated_at: null,
      source: "fallback",
    });
  } catch {
    return jsonResponse({
      price: FALLBACK_PRICE,
      updated_at: null,
      source: "fallback",
    });
  }
}
