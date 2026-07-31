import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the GOOD DOG experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>GOOD DOG — Built Different<\/title>/i);
  assert.match(html, /A playful hot dog builder and demo ordering experience/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/good-dog\.site\/icon\.png"/i,
  );
  assert.match(
    html,
    /<meta property="og:site_name" content="GOOD DOG"/i,
  );
  assert.match(html, /aria-label="Built different"/);
  assert.match(html, /BUILD YOURS/);
  assert.match(html, /HOT DOGS, REPROGRAMMED/);
  assert.match(html, /ORDER A GOOD DOG/);
  assert.match(html, /https:\/\/maksim-site\.ru\//);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps the mobile builder fixed and ships its production assets", async () => {
  const [experience, builder, css] = await Promise.all([
    readFile(new URL("../app/GoodDogExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/BuilderProductMedia.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /document\.body\.style\.position = "fixed"/);
  assert.match(experience, /document\.documentElement\.style\.overflow = "hidden"/);
  assert.match(experience, /const scrollToTop = useCallback/);
  assert.match(experience, /event\.preventDefault\(\)/);
  assert.match(experience, /clearTopHash\(\)/);
  assert.match(experience, /const navigateFromMenu =/);
  assert.match(
    experience,
    /lenis\.scrollTo\(target,[\s\S]*lock:\s*!reducedMotion/,
  );
  assert.match(
    experience,
    /onClick=\{\(event\) => navigateFromMenu\(event, href\)\}/,
  );
  assert.match(experience, /lenis\.scrollTo\(0/);
  assert.match(css, /\.hero\.builder-is-open\s*\{[^}]*height:\s*100dvh/s);
  assert.match(css, /\.builder-is-open \.hero-object\s*\{[^}]*top:\s*23\.5%/s);
  assert.match(css, /\.builder-panel\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(
    css,
    /\.order-courier-track\s*\{[^}]*--courier-departure-delay:\s*2800ms/s,
  );
  assert.match(
    css,
    /\.order-courier-sprite\s*\{[^}]*var\(--courier-departure-delay\)[^}]*8[^}]*forwards/s,
  );
  assert.match(
    css,
    /@keyframes order-courier-walk-frames\s*\{\s*0%,\s*24\.99%\s*\{[^}]*background-position-x:\s*33\.333%/s,
  );
  assert.match(builder, /topping-onion-v2-cutout\.webp/);
  assert.match(builder, /topping-herb-v1-cutout\.webp/);

  await Promise.all([
    access(
      new URL(
        "../public/images/topping-onion-v2-cutout.webp",
        import.meta.url,
      ),
    ),
    access(
      new URL("../public/mascot/courier-dog-walk.webp", import.meta.url),
    ),
  ]);
});
