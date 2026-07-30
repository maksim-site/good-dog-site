"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BuilderProductMedia,
  builderImageSources,
  getBuilderProductImages,
} from "./BuilderProductMedia";
import { OrderDrawer, type OrderItem } from "./OrderDrawer";
import type { CrunchKind, LinkKind, SauceKind } from "./product-types";
import { SmoothScroll } from "./SmoothScroll";

const links: Array<{
  id: LinkKind;
  name: string;
  note: string;
}> = [
  { id: "classic", name: "Classic", note: "snappy · bright · honest" },
  { id: "smoked", name: "Smoke Show", note: "deep · charred · dramatic" },
  { id: "plant", name: "Green Machine", note: "earthy · crisp · no apology" },
];

const signatures: Array<{
  name: string;
  number: string;
  line: string;
  link: LinkKind;
  sauce: SauceKind;
  crunch: CrunchKind;
}> = [
  {
    name: "THE CLASSIC",
    number: "01",
    line: "Classic link · ketchup · bare",
    link: "classic",
    sauce: "ketchup",
    crunch: "none",
  },
  {
    name: "SMOKE SHOW",
    number: "02",
    line: "Smoked link · mustard · crispy onion",
    link: "smoked",
    sauce: "mustard",
    crunch: "onion",
  },
  {
    name: "GREEN MACHINE",
    number: "03",
    line: "Plant link · mustard · fresh herb",
    link: "plant",
    sauce: "mustard",
    crunch: "herb",
  },
];

export function GoodDogExperience() {
  const [introOpen, setIntroOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [link, setLink] = useState<LinkKind>("classic");
  const [sauce, setSauce] = useState<SauceKind>("ketchup");
  const [crunch, setCrunch] = useState<CrunchKind>("none");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItem, setCartItem] = useState<OrderItem | null>(null);
  const [cartQuantity, setCartQuantity] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const preloadedImages: HTMLImageElement[] = [];
    const timer = window.setTimeout(() => {
      builderImageSources.forEach((source) => {
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "low";
        image.src = source;
        void image.decode().catch(() => undefined);
        preloadedImages.push(image);
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      preloadedImages.length = 0;
    };
  }, []);

  const linkIndex = links.findIndex((item) => item.id === link);
  const activeLink = links[linkIndex];
  const recipeSummary = useMemo(
    () =>
      `${activeLink.name} link, ${sauce}, ${
        crunch === "none" ? "no crunch" : crunch
      }`,
    [activeLink, sauce, crunch],
  );
  const recipePrice = useMemo(() => {
    const linkPrice: Record<LinkKind, number> = {
      classic: 12,
      smoked: 14,
      plant: 13,
    };
    return linkPrice[link] + (crunch === "none" ? 0 : 1);
  }, [crunch, link]);

  useEffect(() => {
    if (!introOpen) return;

    const previousOverflow = document.body.style.overflow;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(
      () => setIntroOpen(false),
      reducedMotion ? 650 : 4100,
    );

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [introOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeMenuRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!builderOpen) return;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      right: document.body.style.right,
      left: document.body.style.left,
      width: document.body.style.width,
      overscrollBehavior: document.body.style.overscrollBehavior,
    };
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.right = "0";
    document.body.style.left = "0";
    document.body.style.width = "100%";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.right = previousBodyStyles.right;
      document.body.style.left = previousBodyStyles.left;
      document.body.style.width = previousBodyStyles.width;
      document.body.style.overscrollBehavior =
        previousBodyStyles.overscrollBehavior;
      document.documentElement.style.overflow = previousRootOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [builderOpen]);

  const moveLink = (direction: -1 | 1) => {
    const next = (linkIndex + direction + links.length) % links.length;
    setLink(links[next].id);
  };

  const openBuilder = () => {
    window.__goodDogLenis?.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setBuilderOpen(true);
  };

  const applySignature = (signature: (typeof signatures)[number]) => {
    setLink(signature.link);
    setSauce(signature.sauce);
    setCrunch(signature.crunch);
    openBuilder();
  };

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const closeCart = useCallback(() => {
    setCartOpen(false);
    window.setTimeout(() => cartButtonRef.current?.focus(), 0);
  }, []);

  const openCart = useCallback(() => {
    setMenuOpen(false);
    setCartOpen(true);
  }, []);

  const addItemToBag = (item: OrderItem) => {
    setCartQuantity((current) =>
      cartItem?.summary === item.summary ? Math.min(9, current + 1) : 1,
    );
    setCartItem(item);
    setBuilderOpen(false);
    setMenuOpen(false);
    setCartOpen(true);
  };

  const addCurrentToBag = () => {
    const productImages = getBuilderProductImages(link, sauce, crunch);
    addItemToBag({
      name: activeLink.name.toUpperCase(),
      summary: recipeSummary,
      unitPrice: recipePrice,
      imageSrc: productImages.product,
      toppingSrc: productImages.topping,
    });
  };

  const buildFromCart = () => {
    setCartOpen(false);
    openBuilder();
  };

  const completeOrder = () => {
    setCartItem(null);
    setCartQuantity(0);
    setCartOpen(false);
  };

  return (
    <main>
      <SmoothScroll />
      <div
        className={`intro-loader ${
          introOpen ? "is-playing" : "is-complete"
        }`}
        aria-hidden="true"
        onClick={() => setIntroOpen(false)}
      >
        <div className="intro-stage">
          <div className="intro-lockup">
            <div className="intro-top-word">
              <span className="intro-hot">HOT</span>
              <img
                className="intro-good-mark"
                src="/brand/good-dog-goodword-large.png"
                alt=""
              />
            </div>
            <div className="intro-bottom-word">
              <span className="intro-dog-text">
                <i className="intro-d-letter">D</i>
                <i className="intro-o-letter">O</i>
                <i className="intro-g-letter">G</i>
              </span>
              <img
                className="intro-dog-mark"
                src="/brand/good-dog-dogmark-large.png"
                alt=""
              />
            </div>
          </div>
        </div>
        <span className="intro-skip">CLICK TO SKIP</span>
      </div>

      <section
        id="top"
        className={`hero ${builderOpen ? "builder-is-open" : ""}`}
      >
        <header className="top-layer">
          <a className="brand-logo" href="#top" aria-label="GOOD DOG home">
            <img src="/brand/good-dog-logo.png" alt="GOOD DOG" />
          </a>
          <div className="top-actions">
            <button
              ref={cartButtonRef}
              className="cart-trigger"
              type="button"
              aria-haspopup="dialog"
              onClick={openCart}
            >
              BAG <span>({cartItem ? cartQuantity : 0})</span>
            </button>
            <button
              ref={menuButtonRef}
              className="menu-trigger"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => {
                setCartOpen(false);
                setMenuOpen(true);
              }}
            >
              <span>MENU</span>
              <span className="menu-glyph" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </header>

        <h1 className="hero-title" aria-label="Built different">
          <span>BUILT</span>
          <span>DIFFERENT.</span>
        </h1>

        <div className="hero-spec" aria-label="Served at 74 degrees">
          <strong>74°</strong>
          <i aria-hidden="true" />
          <span>
            CORE TEMP
            <br />
            MADE TO ORDER
          </span>
        </div>

        <div className="hero-object">
          <div className="hotdog-shadow" aria-hidden="true" />
          <div className="hero-steam" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <img
            className={`hotdog-poster ${builderOpen ? "is-hidden" : ""}`}
            src="/images/hotdog-hero-v2.webp"
            alt=""
          />
          {builderOpen ? (
            <BuilderProductMedia
              link={link}
              sauce={sauce}
              crunch={crunch}
              paused={menuOpen}
            />
          ) : null}
        </div>

        <div className="hero-mascot" aria-hidden="true">
          <img src="/mascot/waving-dog-04.png" alt="" />
        </div>

        <div className="hero-action">
          <div className="hero-action-label">
            <p className="eyebrow">HOT DOGS, REPROGRAMMED</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={openBuilder}
          >
            <span>BUILD YOURS</span>
            <span aria-hidden="true">↗︎</span>
          </button>
        </div>

        <aside
          className={`builder-panel ${builderOpen ? "is-open" : ""}`}
          aria-hidden={!builderOpen}
        >
          <div className="builder-head">
            <div>
              <p className="eyebrow">YOUR DOG</p>
              <p className="builder-summary" aria-live="polite">
                {recipeSummary}
              </p>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => setBuilderOpen(false)}
              aria-label="Close builder"
              tabIndex={builderOpen ? 0 : -1}
            >
              ×
            </button>
          </div>

          <div className="control-row link-row">
            <span className="control-label">LINK</span>
            <button
              type="button"
              className="arrow-button"
              onClick={() => moveLink(-1)}
              aria-label="Previous link"
              tabIndex={builderOpen ? 0 : -1}
            >
              ←
            </button>
            <div className="link-copy">
              <strong>{activeLink.name}</strong>
              <small>{activeLink.note}</small>
            </div>
            <button
              type="button"
              className="arrow-button"
              onClick={() => moveLink(1)}
              aria-label="Next link"
              tabIndex={builderOpen ? 0 : -1}
            >
              →
            </button>
          </div>

          <fieldset className="control-group">
            <legend>SAUCE</legend>
            <button
              type="button"
              className={sauce === "ketchup" ? "is-selected" : ""}
              onClick={() => setSauce("ketchup")}
              tabIndex={builderOpen ? 0 : -1}
              aria-pressed={sauce === "ketchup"}
            >
              Ketchup
            </button>
            <button
              type="button"
              className={sauce === "mustard" ? "is-selected" : ""}
              onClick={() => setSauce("mustard")}
              tabIndex={builderOpen ? 0 : -1}
              aria-pressed={sauce === "mustard"}
            >
              Mustard
            </button>
          </fieldset>

          <fieldset className="control-group">
            <legend>CRUNCH</legend>
            {(
              [
                ["none", "Bare"],
                ["onion", "Onion"],
                ["herb", "Herb"],
              ] as Array<[CrunchKind, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={crunch === value ? "is-selected" : ""}
                onClick={() => setCrunch(value)}
                tabIndex={builderOpen ? 0 : -1}
                aria-pressed={crunch === value}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <button
            className="builder-add"
            type="button"
            onClick={addCurrentToBag}
            tabIndex={builderOpen ? 0 : -1}
          >
            <span>ADD TO BAG</span>
            <strong>${recipePrice}</strong>
          </button>
        </aside>

        <div className="hero-meta" aria-hidden="true">
          <span>GOOD DOG / 2026</span>
          <span>01 — 04</span>
        </div>
      </section>

      <section id="story" className="manifesto section-pad">
        <p className="eyebrow light">OUR WHOLE PHILOSOPHY</p>
        <h2>
          NO RULES.
          <br />
          JUST A REALLY
          <br />
          GOOD DOG.
        </h2>
        <div className="ingredient-orbit" aria-hidden="true">
          <span>BUN</span>
          <span>HEAT</span>
          <span>SNAP</span>
          <span>SAUCE</span>
          <span>CRUNCH</span>
        </div>
      </section>

      <section id="signatures" className="signatures section-pad">
        <div className="section-intro">
          <p className="eyebrow">HOUSE DOGS</p>
          <h2>Three ways in. No wrong answer.</h2>
        </div>
        <div className="signature-list">
          {signatures.map((signature) => (
            <button
              key={signature.number}
              type="button"
              className="signature"
              onClick={() => applySignature(signature)}
            >
              <span className="signature-number">{signature.number}</span>
              <span className="signature-name">{signature.name}</span>
              <span className="signature-line">{signature.line}</span>
              <span className="signature-arrow" aria-hidden="true">
                ↗︎
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="dog-runway" aria-label="A very good dog">
        <div className="dog-runway-meta" aria-hidden="true">
          <span>A VERY GOOD DOG</span>
          <span>LONG BY DESIGN</span>
        </div>
        <div className="walking-dog" aria-hidden="true">
          <div className="walking-dog-stride">
            <svg
              className="dachshund-mark"
              viewBox="0 0 520 148"
              role="presentation"
            >
            <path
              className="bun bun-back"
              d="M92 49C145 20 365 21 418 47C431 54 437 64 433 73C375 63 154 63 84 75C81 64 84 55 92 49Z"
            />
            <g className="dog-shape">
              <path
                className="dog-tail"
                d="M103 63C68 60 48 44 54 19"
              />
              <path
                className="dog-leg dog-leg-phase-0 dog-leg-far"
                d="M125 76C128 88 127 101 121 116L115 129C112 135 117 139 125 139H136C142 139 144 134 140 131L136 128C144 112 148 94 145 78Z"
              />
              <path
                className="dog-leg dog-leg-phase-2"
                d="M157 76C160 88 159 101 153 116L147 129C144 135 149 139 157 139H168C174 139 176 134 172 131L168 128C176 112 180 94 177 78Z"
              />
              <path
                className="dog-leg dog-leg-phase-1 dog-leg-far"
                d="M344 76C347 88 346 101 340 116L334 129C331 135 336 139 344 139H355C361 139 363 134 359 131L355 128C363 112 367 94 364 78Z"
              />
              <path
                className="dog-leg dog-leg-phase-3"
                d="M376 76C379 88 378 101 372 116L366 129C363 135 368 139 376 139H387C393 139 395 134 391 131L387 128C395 112 399 94 396 78Z"
              />
              <g className="dog-torso">
                <path d="M99 52C160 43 330 44 397 50C414 52 424 60 422 70C420 80 408 86 390 86H119C100 86 87 78 87 67C87 60 91 55 99 52Z" />
                <path
                  className="dog-head"
                  d="M388 53C399 35 419 27 437 33C450 37 454 48 464 52C475 55 484 54 491 59C484 66 474 70 463 69C452 68 445 75 439 85C431 98 411 97 403 82L388 63Z"
                />
                <path
                  className="dog-ear"
                  d="M414 33C433 30 442 44 438 64C435 82 420 85 414 70Z"
                />
                <circle className="dog-eye" cx="453" cy="49" r="2.8" />
                <circle className="dog-nose" cx="489" cy="59" r="3.2" />
              </g>
              <g className="dog-hat">
                <path
                  className="dog-hat-crown"
                  d="M408 9C421 3 447 4 460 12L463 30L409 27Z"
                />
                <path
                  className="dog-hat-band"
                  d="M409 21L462 25L463 31L409 28Z"
                />
                <path
                  className="dog-hat-brim"
                  d="M401 29C421 26 452 28 471 34C468 39 461 40 453 38L409 35C403 35 398 33 401 29Z"
                />
              </g>
            </g>
            <path
              className="bun bun-front"
              d="M80 81C145 69 370 70 434 82C440 92 437 103 427 111C371 121 147 121 91 112C81 104 77 92 80 81Z"
            />
            <path
              className="bun-highlight"
              d="M98 87C162 79 363 80 417 88"
            />
            </svg>
          </div>
        </div>
      </section>

      <section id="ingredients" className="kitchen section-pad">
        <div className="kitchen-copy">
          <p className="eyebrow light">THE SERIOUS BIT</p>
          <h2>
            <span className="kitchen-title-line">HOT. HONEST.</span>{" "}
            <span className="kitchen-title-line">A LITTLE</span>{" "}
            <span className="kitchen-title-line kitchen-title-engineered">
              <span>OVER-</span>
              <span>ENGINEERED.</span>
            </span>
          </h2>
          <p>
            A soft brioche shell, a link with proper snap, raised sauce geometry
            and exactly enough crunch to make the whole thing make sense.
          </p>
          <button className="text-button" type="button" onClick={openBuilder}>
            TAKE IT APART <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="kitchen-visual">
          <div className="poster-halo" aria-hidden="true" />
          <img
            src="/images/hotdog-hero-v2.webp"
            alt="A long brioche hot dog with ketchup, shown from the side"
          />
          <div className="heat-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <section id="build" className="final-build section-pad">
        <p className="eyebrow light">ENOUGH LOOKING</p>
        <h2>
          <span>YOUR</span>{" "}
          <span>MOVE.</span>
        </h2>
        <button className="primary-button cream" type="button" onClick={openBuilder}>
          <span>ORDER A GOOD DOG</span>
          <span aria-hidden="true">↗︎</span>
        </button>
      </section>

      <footer>
        <a className="footer-brand" href="#top" aria-label="GOOD DOG home">
          <img src="/brand/good-dog-logo.png" alt="GOOD DOG" />
        </a>
        <a
          className="credit-link"
          href="https://maksim-site.ru/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>DESIGNED &amp; BUILT BY MAKSIM</span>
          <small>MAKSIM-SITE.RU ↗︎</small>
        </a>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>

      {cartOpen ? (
        <OrderDrawer
          item={cartItem}
          quantity={cartQuantity}
          onQuantityChange={setCartQuantity}
          onClose={closeCart}
          onBuild={buildFromCart}
          onComplete={completeOrder}
        />
      ) : null}

      <div
        id="site-menu"
        className={`menu-overlay ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!menuOpen}
      >
        <div className="menu-overlay-head">
          <span className="wordmark light">GOOD DOG</span>
          <button
            ref={closeMenuRef}
            type="button"
            className="menu-close"
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            CLOSE <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Main navigation">
          {[
            ["01", "BUILD", "#top"],
            ["02", "SIGNATURES", "#signatures"],
            ["03", "INGREDIENTS", "#ingredients"],
            ["04", "STORY", "#story"],
          ].map(([number, label, href]) => (
            <a
              key={href}
              href={href}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                if (href === "#top") setBuilderOpen(true);
              }}
            >
              <span>{number}</span>
              {label}
              <i aria-hidden="true">↗︎</i>
            </a>
          ))}
        </nav>
        <p className="menu-foot">HOT DOGS, REPROGRAMMED / 2026</p>
      </div>
    </main>
  );
}
