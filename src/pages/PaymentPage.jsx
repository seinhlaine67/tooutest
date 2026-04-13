import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { getUserAccount, setUserAccount } from "../lib/account";
import { eggPackages, paymentProviders } from "../data/storePackages";
import { useAppSettings } from "../lib/appSettings";
import "../styles/legacy/payment.css";

const stepLabels = ["Check Out", "Choose Wallet", "Fill Information"];

function formatMmk(value) {
  return `${Number(value || 0).toLocaleString()} MMK`;
}

export default function PaymentPage() {
  const { language, setLanguage, t } = useAppSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const selectedPackage = useMemo(
    () => eggPackages.find((item) => item.id === packageId) || null,
    [packageId]
  );
  const account = useMemo(() => getUserAccount(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [providerId, setProviderId] = useState(paymentProviders[0].id);
  const [formState, setFormState] = useState(() => ({
    fullName: account?.username || "",
    phone: account?.phone_number || "",
    email: account?.email || ""
  }));

  const provider = paymentProviders.find((item) => item.id === providerId) || paymentProviders[0];

  if (!selectedPackage) return <Navigate to="/store" replace />;

  function goNext() {
    setCurrentStep((value) => Math.min(2, value + 1));
  }

  function handlePayment() {
    const nextAccount = account
      ? {
          ...account,
          coins: Number(account.coins || 0) + selectedPackage.total,
          eggsPurchasedTotal:
            Number(account.eggsPurchasedTotal || 0) + selectedPackage.total
        }
      : {
          username: formState.fullName || "Guest",
          email: formState.email || "",
          phone_number: formState.phone || "",
          coins: selectedPackage.total,
          eggsPurchasedTotal: selectedPackage.total,
          createdAt: Date.now(),
          plan: "Reader",
          bio: "TooU reader"
        };

    setUserAccount(nextAccount);
    navigate("/store");
  }

  return (
    <main className="payment-shell">
      <section className="payment-card">
        <header className="payment-topbar">
          <button type="button" className="payment-back-btn" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="payment-topbar-copy">
            <div className="payment-kicker">TooU Checkout</div>
            <h1>{t("Top up your eggs")}</h1>
          </div>
          <label className="payment-language">
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="eng">English</option>
              <option value="my">Myanmar</option>
            </select>
            <i className="fa-solid fa-angle-down" />
          </label>
        </header>

        <div className="payment-hero">
          <div className="payment-brand">
            <div className="payment-brand-mark">TooU</div>
            <div>
              <strong>{selectedPackage.title}</strong>
              <span>{selectedPackage.note}</span>
            </div>
          </div>
          <div className="payment-hero-amount">
            <span>Total due</span>
            <strong>{selectedPackage.price}</strong>
          </div>
        </div>

        <div className="payment-security">
          <i className="fa-solid fa-shield-halved" />
          <span>{t("All transactions are secure and encrypted.")}</span>
        </div>

        <div className="payment-steps" aria-label="Payment progress">
          {stepLabels.map((label, index) => (
            <div key={label} className="payment-step">
              <div
                className={`payment-step-dot ${
                  index < currentStep ? "completed" : index === currentStep ? "current" : ""
                }`}
              >
                {index < currentStep ? <i className="fa-solid fa-check" /> : null}
              </div>
              {index < stepLabels.length - 1 ? (
                <div className={`payment-step-line ${index < currentStep ? "active" : ""}`} />
              ) : null}
              <span>{label}</span>
            </div>
          ))}
        </div>

        {currentStep === 0 ? (
          <section className="payment-stage">
            <div className="payment-section-title">{t("Checkout summary")}</div>
            <div className="checkout-summary">
              <div className="checkout-row">
                <span>1 x {selectedPackage.title}</span>
                <strong>{selectedPackage.price}</strong>
              </div>
              <div className="checkout-row">
                <span>Bonus</span>
                <strong>{selectedPackage.bonus || "Included"}</strong>
              </div>
              <div className="checkout-row">
                <span>Total eggs</span>
                <strong>{selectedPackage.total}</strong>
              </div>
              <div className="checkout-divider" />
              <div className="checkout-row total">
                <span>Total due</span>
                <strong>{selectedPackage.price}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 1 ? (
          <section className="payment-stage">
            <div className="payment-section-title">{t("Choose payment provider")}</div>
            <div className="payment-section-copy">
              Pick the wallet you want to use for this TooU top-up.
            </div>
            <div className="provider-grid">
              {paymentProviders.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`provider-card ${item.accent} ${
                    providerId === item.id ? "active" : ""
                  }`}
                  onClick={() => setProviderId(item.id)}
                >
                  <div className="provider-logo">{item.icon}</div>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            <div className="chosen-provider">
              <div className={`provider-logo ${provider.accent}`}>{provider.icon}</div>
              <div>
                <strong>Chosen Provider</strong>
                <span>{provider.name}</span>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="payment-stage">
            <div className="payment-section-title">{t("Fill information")}</div>
            <div className="payment-section-copy">
              Add your contact details so the purchase record is attached to this account.
            </div>
            <div className="payment-form">
              <label className="payment-field">
                <span>Full name</span>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
              </label>
              <label className="payment-field">
                <span>Phone number</span>
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="payment-field">
                <span>Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="checkout-summary compact">
              <div className="checkout-row">
                <span>Provider</span>
                <strong>{provider.name}</strong>
              </div>
              <div className="checkout-row">
                <span>Subtotal</span>
                <strong>{formatMmk(selectedPackage.amountMmk)}</strong>
              </div>
              <div className="checkout-row total">
                <span>Total due</span>
                <strong>{formatMmk(selectedPackage.amountMmk)}</strong>
              </div>
            </div>
          </section>
        ) : null}

        <div className="payment-actions">
          {currentStep > 0 ? (
            <button
              type="button"
              className="payment-secondary-btn"
              onClick={() => setCurrentStep((value) => Math.max(0, value - 1))}
            >
              Back
            </button>
          ) : (
            <Link to="/store" className="payment-secondary-btn link-btn">
              {t("Cancel")}
            </Link>
          )}

          {currentStep < 2 ? (
            <button type="button" className="payment-primary-btn" onClick={goNext}>
              {t("Continue Payment")}
            </button>
          ) : (
            <button type="button" className="payment-primary-btn" onClick={handlePayment}>
              {t("Complete Purchase")}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
