"use client";

import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type OrderItem = {
  name: string;
  summary: string;
  unitPrice: number;
};

type OrderDrawerProps = {
  item: OrderItem | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onClose: () => void;
  onBuild: () => void;
  onComplete: () => void;
};

type OrderStep = "cart" | "delivery" | "success";
type DeliveryMethod = "delivery" | "pickup";
type FieldErrors = Partial<Record<"name" | "phone" | "address", string>>;

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
  const submitTimerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const [step, setStep] = useState<OrderStep>("cart");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = deliveryMethod === "delivery" ? 3 : 0;
  const subtotal = item ? item.unitPrice * quantity : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) {
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
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Tell us who gets the good dog.";
    }

    if (phone.replace(/\D/g, "").length < 7) {
      nextErrors.phone = "Enter a phone number we could actually call.";
    }

    if (deliveryMethod === "delivery" && address.trim().length < 5) {
      nextErrors.address = "Add a delivery address.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    submitTimerRef.current = window.setTimeout(() => {
      submittingRef.current = false;
      setSubmitting(false);
      setStep("success");
    }, 900);
  };

  const stopPanelClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="order-overlay"
      role="presentation"
      onMouseDown={() => {
        if (!submitting) onClose();
      }}
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
              {step === "cart"
                ? "YOUR BAG."
                : step === "delivery"
                  ? "WHERE TO?"
                  : "GOOD CALL."}
            </h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close order"
            disabled={submitting}
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
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="order-product">
              <div className="order-product-image">
                <img
                  src="/images/hotdog-hero-v2.webp"
                  alt="The selected GOOD DOG hot dog"
                />
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
                onClick={() => setStep("delivery")}
              >
                <span>CHOOSE DELIVERY</span>
                <span aria-hidden="true">→</span>
              </button>
              <p>DEMO CHECKOUT — NO PAYMENT WILL BE TAKEN.</p>
            </div>
          </>
        ) : step === "delivery" ? (
          <form className="delivery-form" onSubmit={placeOrder} noValidate>
            <button
              className="order-back"
              type="button"
              onClick={() => setStep("cart")}
              disabled={submitting}
            >
              ← BACK TO BAG
            </button>

            <fieldset className="delivery-switch">
              <legend>HOW DO YOU WANT IT?</legend>
              <button
                type="button"
                className={
                  deliveryMethod === "delivery" ? "is-selected" : ""
                }
                onClick={() => setDeliveryMethod("delivery")}
                aria-pressed={deliveryMethod === "delivery"}
              >
                DELIVERY <span>+$3</span>
              </button>
              <button
                type="button"
                className={deliveryMethod === "pickup" ? "is-selected" : ""}
                onClick={() => setDeliveryMethod("pickup")}
                aria-pressed={deliveryMethod === "pickup"}
              >
                PICKUP <span>FREE</span>
              </button>
            </fieldset>

            <label className="order-field">
              <span>NAME</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "order-name-error" : undefined}
              />
              {errors.name ? (
                <small id="order-name-error" role="alert">
                  {errors.name}
                </small>
              ) : null}
            </label>

            <label className="order-field">
              <span>PHONE</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setErrors((current) => ({ ...current, phone: undefined }));
                }}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "order-phone-error" : undefined
                }
              />
              {errors.phone ? (
                <small id="order-phone-error" role="alert">
                  {errors.phone}
                </small>
              ) : null}
            </label>

            {deliveryMethod === "delivery" ? (
              <label className="order-field">
                <span>DELIVERY ADDRESS</span>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      address: undefined,
                    }));
                  }}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address ? "order-address-error" : undefined
                  }
                />
                {errors.address ? (
                  <small id="order-address-error" role="alert">
                    {errors.address}
                  </small>
                ) : null}
              </label>
            ) : (
              <div className="pickup-point">
                <span className="eyebrow">PICKUP POINT</span>
                <strong>74 BUN STREET / COUNTER 01</strong>
                <small>READY IN ABOUT 12 MINUTES</small>
              </div>
            )}

            <div className="delivery-summary">
              <p>
                <span>{quantity} × {item.name}</span>
                <strong>{formatMoney(subtotal)}</strong>
              </p>
              <p>
                <span>
                  {deliveryMethod === "delivery" ? "DELIVERY" : "PICKUP"}
                </span>
                <strong>
                  {deliveryFee ? formatMoney(deliveryFee) : "FREE"}
                </strong>
              </p>
              <p>
                <span>TOTAL</span>
                <strong>{formatMoney(total)}</strong>
              </p>
            </div>

            <div className="order-drawer-action">
              <button
                className="primary-button order-main-button"
                type="submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "ENGINEERING YOUR DOG…"
                    : `PLACE DEMO ORDER — ${formatMoney(total)}`}
                </span>
                <span aria-hidden="true">{submitting ? "…" : "↗"}</span>
              </button>
              <p>DEMO ONLY — NO PAYMENT OR REAL DELIVERY.</p>
            </div>
          </form>
        ) : (
          <div className="order-success" aria-live="polite">
            <span className="order-success-number">74</span>
            <p className="eyebrow">DEMO ORDER / CONFIRMED</p>
            <h3>YOUR GOOD DOG IS BEING OVER-ENGINEERED.</h3>
            <p>
              {deliveryMethod === "delivery"
                ? "Fictional delivery is headed your way."
                : "Fictional pickup will be ready at Counter 01."}
            </p>
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
