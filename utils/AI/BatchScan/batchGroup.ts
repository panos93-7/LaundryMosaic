import { BatchItemCanonical } from "./batchCanonical";
import { translateBatchText } from "./translateBatch";

export async function batchGroup(
  items: BatchItemCanonical[],
  locale: string
) {
  const map: Record<string, number> = {};

  items.forEach((it) => {
    if (!map[it.fabric]) map[it.fabric] = 0;
    map[it.fabric] += 1;
  });

  return await Promise.all(
    Object.keys(map).map(async (fabric) => {
      const rawLabel = `${fabric} × ${map[fabric]}`;
      const translated = await translateBatchText(rawLabel, locale);
      return {
        fabric: translated,
        count: map[fabric],
      };
    })
  );
}