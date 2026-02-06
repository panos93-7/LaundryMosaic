import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { aiLaundryCache } from "./aiLaundryCache";

export async function generateLaundryAdviceCached(
  locale: string,
  fabric: string,
  query: string,
  history?: any
) {
  const cached = await aiLaundryCache.get(locale, fabric, query, history);
  if (cached) {
    console.log("⚡ Using cached Laundry Assistant result");
    return cached;
  }

  const result = await generateCareInstructionsPro(query);

  await aiLaundryCache.set(locale, fabric, query, history, result);

  return result;
}