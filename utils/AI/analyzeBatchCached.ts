// utils/AI/analyzeBatchCached.ts

import i18n from "../../i18n";
import { analyzeImageCached } from "./analyzeImageCached";
import { preprocessImage } from "./preprocessImage";
import { safeBatchNormalize } from "./safeBatchNormalize";

export async function analyzeBatchCached(uri: string) {
  const { base64, mimeType } = await preprocessImage(uri);

  const ai = await analyzeImageCached(base64, mimeType);
  if (!ai) return null;

  let items: any[] = [];

  if (Array.isArray(ai.items)) {
    items = ai.items;
  } else {
    items = [ai];
  }

  // normalize + filter
  const normalized = items
    .map((it) => safeBatchNormalize(it))
    .filter((x) => x !== null);

  const total = normalized.length;

  // group by fabric
  const groupsMap: Record<string, number> = {};

  normalized.forEach((g) => {
    if (!groupsMap[g.fabric]) groupsMap[g.fabric] = 0;
    groupsMap[g.fabric] += 1;
  });

  const groups = Object.keys(groupsMap).map((fabric) => ({
    fabric,
    count: groupsMap[fabric],
  }));

  // conflicts
  const fabrics = Object.keys(groupsMap);
  const conflicts: string[] = [];

  if (fabrics.includes("wool") && fabrics.some((f) => f !== "wool")) {
    conflicts.push(i18n.t("batchScan.conflict_wool"));
  }

  if (fabrics.includes("delicate") && fabrics.some((f) => f !== "delicate")) {
    conflicts.push(i18n.t("batchScan.conflict_delicate"));
  }

  if (fabrics.includes("cotton") && fabrics.includes("wool")) {
    conflicts.push(i18n.t("batchScan.conflict_cotton_wool"));
  }

  // suggestions
  const suggestions: string[] = [];

  if (fabrics.length === 1 && fabrics.includes("cotton")) {
    suggestions.push(i18n.t("batchScan.suggest_cotton"));
  }

  if (fabrics.length === 1 && fabrics.includes("synthetics")) {
    suggestions.push(i18n.t("batchScan.suggest_synthetics"));
  }

  if (fabrics.length > 1 && conflicts.length === 0) {
    suggestions.push(i18n.t("batchScan.suggest_mixed"));
  }

  return {
    total,
    groups,
    conflicts,
    suggestions,
  };
}