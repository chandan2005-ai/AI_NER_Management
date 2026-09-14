/**
 * Hazard image analysis interface.
 *
 * This is a documented placeholder inference module, NOT a production-accurate
 * computer-vision model. It derives a deterministic pseudo-classification from
 * image metadata (dimensions, byte size, aspect ratio, filename hints) so the
 * end-to-end reporting flow — capture, classify, suggest severity, submit — is
 * fully demonstrable offline.
 *
 * To plug in a real model, replace `analyseHazardImage` with a call to a served
 * classifier (e.g. an ONNX / TF.js model or a server function wrapping a
 * fine-tuned CNN). The return contract must stay the same.
 */

export interface ImageAnalysisResult {
  detected: string;
  confidence: number;
  suggestedSeverity: "LOW" | "MEDIUM" | "HIGH";
  model: string;
  note: string;
}

const CLASSES = [
  { label: "Possible landslide debris", severity: "HIGH" as const },
  { label: "Possible road blockage", severity: "HIGH" as const },
  { label: "Possible slope cracks", severity: "MEDIUM" as const },
  { label: "Possible rockfall", severity: "MEDIUM" as const },
  { label: "Possible mudflow", severity: "HIGH" as const },
  { label: "Possible flooding / waterlogging", severity: "MEDIUM" as const },
  { label: "No clear hazard signature", severity: "LOW" as const },
];

const HINTS: [RegExp, number][] = [
  [/slide|debris|slip/i, 0],
  [/road|block|traffic|highway/i, 1],
  [/crack|fissure/i, 2],
  [/rock|boulder|fall/i, 3],
  [/mud|flow/i, 4],
  [/flood|water|logging/i, 5],
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB upload limit
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG or WebP images are accepted.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image exceeds the 8 MB upload limit. Please capture a smaller photo.";
  }
  return null;
}

export async function analyseHazardImage(file: File): Promise<ImageAnalysisResult> {
  const buffer = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let checksum = 0;
  for (let i = 0; i < bytes.length; i += 7) checksum = (checksum + bytes[i]!) % 100003;

  const hint = HINTS.find(([re]) => re.test(file.name));
  const index = hint ? hint[1] : checksum % CLASSES.length;
  const cls = CLASSES[index]!;

  // Confidence band 58–94 %, deterministic from the checksum.
  const confidence = 58 + (checksum % 37);

  return {
    detected: cls.label,
    confidence,
    suggestedSeverity: cls.severity,
    model: "demo-heuristic-v1 (placeholder inference)",
    note: "Placeholder inference for demonstration. Not a validated hazard classifier — a trained model must be attached before operational use.",
  };
}
