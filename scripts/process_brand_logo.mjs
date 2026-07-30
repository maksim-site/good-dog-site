import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const source = process.argv[2];

if (!source) {
  throw new Error("Pass the selected square logo PNG as the first argument.");
}

await mkdir("public/brand", { recursive: true });

const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rgba = Buffer.alloc(info.width * info.height * 4);

for (let sourceIndex = 0, targetIndex = 0; sourceIndex < data.length; sourceIndex += 3) {
  const red = data[sourceIndex];
  const green = data[sourceIndex + 1];
  const blue = data[sourceIndex + 2];
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const alpha = Math.max(0, Math.min(255, ((158 - luminance) / 88) * 255));

  rgba[targetIndex] = 33;
  rgba[targetIndex + 1] = 26;
  rgba[targetIndex + 2] = 22;
  rgba[targetIndex + 3] = Math.round(alpha);
  targetIndex += 4;
}

const transparentSource = await sharp(rgba, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 8,
  })
  .extend({
    top: 18,
    right: 18,
    bottom: 18,
    left: 18,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(transparentSource)
  .resize({ width: 360 })
  .png()
  .toFile("public/brand/good-dog-logo.png");

await sharp(transparentSource)
  .resize({ width: 1180, withoutEnlargement: true })
  .png()
  .toFile("public/brand/good-dog-logo-large.png");

const goodWordRegion = await sharp(rgba, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
  })
  .extract({
    left: Math.round(info.width * 0.2),
    top: Math.round(info.height * 0.24),
    width: Math.round(info.width * 0.62),
    height: Math.round(info.height * 0.242),
  })
  .png()
  .toBuffer();

const goodWordCrop = await sharp(goodWordRegion)
  .trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 8,
  })
  .extend({
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(goodWordCrop)
  .resize({ width: 980, withoutEnlargement: true })
  .png()
  .toFile("public/brand/good-dog-goodword-large.png");

const dogRegionLeft = Math.round(info.width * 0.1);
const dogRegionTop = Math.round(info.height * 0.43);
const dogRegionWidth = Math.round(info.width * 0.8);
const dogRegionHeight = Math.round(info.height * 0.35);

const {
  data: dogMarkRegion,
  info: dogMarkRegionInfo,
} = await sharp(rgba, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .extract({
    left: dogRegionLeft,
    top: dogRegionTop,
    width: dogRegionWidth,
    height: dogRegionHeight,
  })
  .raw()
  .toBuffer({ resolveWithObject: true });

const upperWordCutoff = Math.round(info.height * 0.485);
const tailKeepFrom = Math.round(info.width * 0.81);

for (let y = 0; y < dogMarkRegionInfo.height; y += 1) {
  for (let x = 0; x < dogMarkRegionInfo.width; x += 1) {
    const globalX = dogRegionLeft + x;
    const globalY = dogRegionTop + y;

    if (globalY < upperWordCutoff && globalX < tailKeepFrom) {
      dogMarkRegion[(y * dogMarkRegionInfo.width + x) * 4 + 3] = 0;
    }
  }
}

const dogMarkCrop = await sharp(dogMarkRegion, {
  raw: {
    width: dogMarkRegionInfo.width,
    height: dogMarkRegionInfo.height,
    channels: 4,
  },
})
  .trim({
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    threshold: 8,
  })
  .extend({
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(dogMarkCrop)
  .resize({ width: 1100, withoutEnlargement: true })
  .png()
  .toFile("public/brand/good-dog-dogmark-large.png");

const faviconLogo = await sharp("public/brand/good-dog-logo.png")
  .resize({ width: 244, height: 232, fit: "inside" })
  .toBuffer();

await sharp({
  create: {
    width: 256,
    height: 256,
    channels: 3,
    background: "#e7c58c",
  },
})
  .composite([{ input: faviconLogo, gravity: "center" }])
  .png()
  .toFile("app/icon.png");
