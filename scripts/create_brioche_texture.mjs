import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const outputPath = path.join(
  rootDir,
  "public",
  "models",
  "brioche-albedo.png",
);
const width = 512;
const height = 256;
const pixels = Buffer.alloc(width * height * 3);

for (let y = 0; y < height; y += 1) {
  const v = y / (height - 1);
  for (let x = 0; x < width; x += 1) {
    const u = x / (width - 1);
    const broad =
      Math.sin(u * Math.PI * 2 * 2.2) * 5 +
      Math.sin(u * Math.PI * 2 * 6.7 + v * 2.1) * 4 +
      Math.sin(v * Math.PI * 2 * 3.3 - u * 4) * 3;
    const rawHash =
      Math.sin((x + 7) * 12.9898 + (y + 3) * 78.233) * 43758.5453;
    const hash = rawHash - Math.floor(rawHash);
    const pore = hash > 0.992 ? -18 : 0;
    const toast = 5 * (1 - Math.cos(v * Math.PI * 2));
    const index = (y * width + x) * 3;

    pixels[index] = Math.max(0, Math.min(255, 211 + broad + pore));
    pixels[index + 1] = Math.max(
      0,
      Math.min(255, 151 + broad * 0.72 + pore * 0.4 - toast),
    );
    pixels[index + 2] = Math.max(
      0,
      Math.min(255, 79 + broad * 0.38 + pore * 0.18),
    );
  }
}

await sharp(pixels, {
  raw: {
    width,
    height,
    channels: 3,
  },
})
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(`BRIOCHE_TEXTURE=${outputPath}`);
