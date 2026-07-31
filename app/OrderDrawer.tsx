"use client";

import {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type OrderItem = {
  name: string;
  summary: string;
  unitPrice: number;
  imageSrc: string;
  toppingSrc: string | null;
};

type OrderDrawerProps = {
  item: OrderItem | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onClose: () => void;
  onBuild: () => void;
  onComplete: () => void;
};

type OrderStep = "cart" | "success";

const PACKING_DURATION = 3600;

const formatMoney = (value: number) => `$${value.toFixed(0)}`;

export function OrderDrawer({
  item,
  quantity,
  onQuantityChange,
  onClose,
  onBuild,
  onComplete,
}: OrderDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const packingTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<OrderStep>("cart");
  const [packing, setPacking] = useState(false);

  const subtotal = item ? item.unitPrice * quantity : 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (packingTimerRef.current) {
        window.clearTimeout(packingTimerRef.current);
      }
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const stopPanelClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const packAndOrder = () => {
    if (packing) return;
    setPacking(true);
    packingTimerRef.current = window.setTimeout(() => {
      setPacking(false);
      setStep("success");
    }, PACKING_DURATION);
  };

  return (
    <div
      className="order-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        ref={drawerRef}
        className="order-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        onMouseDown={stopPanelClick}
      >
        <header className="order-head">
          <div>
            <p className="eyebrow">GOOD DOG / DEMO ORDER</p>
            <h2 id="order-title">
              {step === "cart" ? "YOUR BAG." : "GOOD CALL."}
            </h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close order"
          >
            ×
          </button>
        </header>

        {!item ? (
          <div className="order-empty">
            <p className="eyebrow">BAG (0)</p>
            <h3>NO DOG YET.</h3>
            <p>Build one first. We&apos;ll keep the imaginary grill hot.</p>
            <button className="primary-button" type="button" onClick={onBuild}>
              <span>BUILD A GOOD DOG</span>
              <span aria-hidden="true">↗︎</span>
            </button>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="order-product">
              <div
                className={`order-product-image ${
                  packing ? "is-packing" : ""
                }`}
              >
                <span className="order-pack-sheet" />
                <div className="order-product-stack">
                  <img
                    src={item.imageSrc}
                    alt="The selected GOOD DOG hot dog"
                  />
                  {item.toppingSrc ? (
                    <img
                      className="order-product-topping"
                      src={item.toppingSrc}
                      alt=""
                    />
                  ) : null}
                </div>
                <span className="order-pack-flap order-pack-flap-back" />
                <span className="order-pack-flap order-pack-flap-front" />
                <span className="order-pack-label">
                  <b>GOOD DOG</b>
                  <small>PACKED AT 74°</small>
                </span>
              </div>
              <div className="order-product-copy">
                <p className="eyebrow">MADE AT 74°</p>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                <strong>{formatMoney(item.unitPrice)}</strong>
              </div>
            </div>

            <div className="order-quantity">
              <span className="eyebrow">QUANTITY</span>
              <div>
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <strong aria-live="polite">{quantity}</strong>
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.min(9, quantity + 1))}
                  aria-label="Increase quantity"
                  disabled={quantity >= 9}
                >
                  +
                </button>
              </div>
            </div>

            <div className="order-totals">
              <span>SUBTOTAL</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>

            <div className="order-drawer-action">
              <button
                className="primary-button order-main-button"
                type="button"
                onClick={packAndOrder}
                disabled={packing}
              >
                <span>{packing ? "PACKING YOUR DOG…" : "ORDER THIS DOG"}</span>
                <span aria-hidden="true">{packing ? "…" : "→"}</span>
              </button>
              <p>DEMO CHECKOUT — NO PAYMENT WILL BE TAKEN.</p>
            </div>
          </>
        ) : (
          <div className="order-success" aria-live="polite">
            <p className="eyebrow">DEMO ORDER / CONFIRMED</p>
            <h3>YOUR GOOD DOG IS BEING OVER-ENGINEERED.</h3>
            <p>Bag loaded. Dachshund dispatched. Your dog is on the move.</p>
            <div className="order-courier-track" aria-hidden="true">
              <span>DACHSHUND DISPATCH</span>
              <div className="order-courier">
                <div className="order-courier-rig">
                  <div className="order-courier-payload">
                    <img src={item.imageSrc} alt="" />
                    {item.toppingSrc ? (
                      <img src={item.toppingSrc} alt="" />
                    ) : null}
                  </div>
                  <span className="order-courier-sprite" />
                  <span className="order-courier-bag-lid" />
                </div>
              </div>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={onComplete}
            >
              <span>KEEP EXPLORING</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
