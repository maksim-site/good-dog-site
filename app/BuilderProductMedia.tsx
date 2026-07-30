"use client";

import type { CrunchKind, LinkKind, SauceKind } from "./product-types";

type BuilderProductMediaProps = {
  link: LinkKind;
  sauce: SauceKind;
  crunch: CrunchKind;
  paused: boolean;
};

type SauceAsset = {
  start: string;
  end: string;
  clip?: string;
};

const productAssets: Record<LinkKind, Record<SauceKind, SauceAsset>> = {
  classic: {
    ketchup: {
      start: "/images/builder-classic-plain-v4-cutout.webp",
      end: "/images/builder-classic-ketchup-v4-cutout.webp",
    },
    mustard: {
      start: "/images/builder-classic-plain-v4-cutout.webp",
      end: "/images/builder-classic-mustard-v4-cutout.webp",
    },
  },
  smoked: {
    ketchup: {
      start: "/images/builder-smoked-plain-v4-cutout.webp",
      end: "/images/builder-smoked-ketchup-v4-cutout.webp",
    },
    mustard: {
      start: "/images/builder-smoked-plain-v4-cutout.webp",
      end: "/images/builder-smoked-mustard-v4-cutout.webp",
    },
  },
  plant: {
    ketchup: {
      start: "/images/builder-plant-plain-v4-cutout.webp",
      end: "/images/builder-plant-ketchup-v4-cutout.webp",
    },
    mustard: {
      start: "/images/builder-plant-plain-v4-cutout.webp",
      end: "/images/builder-plant-mustard-v4-cutout.webp",
    },
  },
};

const toppingAssets: Record<CrunchKind, string | null> = {
  none: null,
  onion: "/images/topping-onion-v2-cutout.webp",
  herb: "/images/topping-herb-v1-cutout.webp",
};

export function getBuilderProductImages(
  link: LinkKind,
  sauce: SauceKind,
  crunch: CrunchKind,
) {
  return {
    product: productAssets[link][sauce].end,
    topping: toppingAssets[crunch],
  };
}

export const builderImageSources = Array.from(
  new Set([
    ...Object.values(productAssets).flatMap((sauces) =>
      Object.values(sauces).flatMap(({ start, end }) => [start, end]),
    ),
    ...Object.values(toppingAssets).filter(
      (source): source is string => source !== null,
    ),
  ]),
);

export function BuilderProductMedia({
  link,
  sauce,
  crunch,
  paused,
}: BuilderProductMediaProps) {
  const asset = productAssets[link][sauce];
  const topping = toppingAssets[crunch];
  const mediaKey = `${link}-${sauce}-${crunch}`;

  return (
    <div
      className={`builder-product-media ${paused ? "is-paused" : ""}`}
      data-link={link}
      data-sauce={sauce}
      data-crunch={crunch}
      aria-hidden="true"
    >
      <img
        className="builder-product-frame builder-product-start"
        src={asset.start}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {asset.clip ? (
        <video
          key={mediaKey}
          className="builder-product-frame builder-product-clip"
          src={asset.clip}
          poster={asset.start}
          autoPlay
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          key={`${link}-${sauce}`}
          className="builder-product-frame builder-product-end"
          src={asset.end}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      )}
      {topping ? (
        <img
          key={mediaKey}
          className="builder-product-frame builder-topping-frame"
          src={topping}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      ) : null}
      <div className="builder-product-glint" />
    </div>
  );
}
