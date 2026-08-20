import sampleCreatives from "../fixtures/sample-creatives.json";
import type { RawCreativeInput } from "./types";

export function getSampleCreatives(): RawCreativeInput[] {
  return sampleCreatives.map((item) => ({
    ...item,
    metadata: { ...(item.metadata ?? {}), demo: true, importedFrom: "bundled-fixture" },
  }));
}
