import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const [source, output] = process.argv.slice(2);

if (!source || !output) {
  throw new Error("Pass a checkerboard mascot PNG and an output PNG path.");
}

const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rgba = Buffer.alloc(info.width * info.height * 4);
const clampByte = (value) => Math.max(0, Math.min(255, value));

for (
  let sourceIndex = 0, targetIndex = 0;
  sourceIndex < data.length;
  sourceIndex += 3
) {
  const red = data[sourceIndex];
  const green = data[sourceIndex + 1];
  const blue = data[sourceIndex + 2];
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const chroma = maximum - minimum;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  const darkAlpha = clampByte(((225 - luminance) / 35) * 255);
  const colorAlpha = clampByte(((chroma - 9) / 23) * 255);
  const alpha = Math.max(darkAlpha, colorAlpha);

  rgba[targetIndex] = red;
  rgba[targetIndex + 1] = green;
  rgba[targetIndex + 2] = blue;
  rgba[targetIndex + 3] = Math.round(alpha);
  targetIndex += 4;
}

await mkdir(dirname(output), { recursive: true });

await sharp(rgba, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 7,
  })
  .extend({
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .resize({ height: 920, withoutEnlargement: true })
  .png()
  .toFile(output);
