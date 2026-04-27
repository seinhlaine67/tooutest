import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { getUserAccount, readFileAsDataUrl } from "../lib/account";
import { eggPackages, paymentProviders, subscriptionPlans } from "../data/storePackages";
import { useAppSettings } from "../lib/appSettings";
import { getStoredList, setStoredList } from "../lib/storage";
import "../styles/legacy/payment.css";

const stepLabels = ["Check Out", "Choose Wallet", "Upload Receipt"];
const CUSTOMER_SUPPORT_LINK = "https://example.com/support";

const RECEIVING_ACCOUNTS = {
  "kbz-pay": { name: "KBZ Pay", accountName: "TooU Official", accountNumber: "09 777 222 111" },
  "aya-pay": { name: "AYA Pay", accountName: "TooU Official", accountNumber: "09 770 888 444" },
  "uab-pay": { name: "UAB Pay", accountName: "TooU Official", accountNumber: "09 765 220 505" },
  "cb-pay": { name: "CB Pay", accountName: "TooU Official", accountNumber: "09 443 202 887" },
  "wave-pay": { name: "Wave Pay", accountName: "TooU Official", accountNumber: "09 788 230 601" },
  onepay: { name: "Onepay", accountName: "TooU Official", accountNumber: "09 420 222 111" }
};

function formatMmk(value) {
  return `${Number(value || 0).toLocaleString()} MMK`;
}

function buildReceiptCode(providerId) {
  const prefix = String(providerId || "PAY")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase();
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}

export default function PaymentPage() {
  const { language, setLanguage, t } = useAppSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentType = searchParams.get("type") === "subscription" ? "subscription" : "coins";
  const packageId = searchParams.get("package");
  const planId = searchParams.get("plan");
  const selectedPackage = useMemo(
    () => eggPackages.find((item) => item.id === packageId) || null,
    [packageId]
  );
  const selectedPlan = useMemo(
    () => subscriptionPlans.find((item) => item.id === planId) || null,
    [planId]
  );
  const selectedItem = paymentType === "subscription" ? selectedPlan : selectedPackage;
  const account = useMemo(() => getUserAccount(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [providerId, setProviderId] = useState(paymentProviders[0].id);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formState, setFormState] = useState(() => ({
    fullName: account?.username || "",
    phone: account?.phone_number || "",
    email: account?.email || "",
    transferName: account?.username || "",
    receiptCode: "",
    receiptFileName: ""
  }));

  const provider = paymentProviders.find((item) => item.id === providerId) || paymentProviders[0];
  const receivingAccount = RECEIVING_ACCOUNTS[providerId] || RECEIVING_ACCOUNTS["kbz-pay"];

  if (!selectedItem) return <Navigate to="/store" replace />;

  const displayTitle =
    paymentType === "subscription" ? `${selectedItem.name} Monthly Subscription` : selectedItem.title;
  const displayPrice =
    paymentType === "subscription" ? selectedItem.priceLabel : selectedItem.price;
  const displayNote =
    paymentType === "subscription" ? selectedItem.note : selectedItem.note;
  const totalAmountMmk = paymentType === "subscription" ? selectedItem.amountMmk : selectedItem.amountMmk;

  function goNext() {
    setCurrentStep((value) => Math.min(2, value + 1));
  }

  async function handleReceiptChange(event) {
    const file = event.target.files?.[0];
    setReceiptPreview(await readFileAsDataUrl(file, ""));
    setFormState((current) => ({
      ...current,
      receiptFileName: file?.name || ""
    }));
  }

  async function handlePayment() {
    if (!receiptPreview) {
      setSubmitMessage("Please upload the receipt before submitting.");
      return;
    }

    setIsSubmitting(true);
    const paymentRecord = {
      id: `payment-${Date.now()}`,
      paymentType,
      username: formState.fullName || account?.username || "Reader",
      handle: account?.username ? `@${account.username}` : `@guest-${Date.now()}`,
      userSupabaseId: account?.supabaseUserId || "",
      userEmail: formState.email || account?.email || "",
      packageId: paymentType === "coins" ? selectedItem.id : "",
      subscriptionPlanId: paymentType === "subscription" ? selectedItem.id : "",
      subscriptionPlanName: paymentType === "subscription" ? selectedItem.name : "",
      subscriptionDurationDays: paymentType === "subscription" ? selectedItem.durationDays : 0,
      provider: provider.name,
      providerId: provider.id,
      amountMmk: totalAmountMmk,
      coins: paymentType === "coins" ? selectedItem.total : Number(selectedItem.bonusCoins || 0),
      submittedAt: new Date().toISOString(),
      receiptCode: formState.receiptCode.trim() || buildReceiptCode(provider.id),
      phone: formState.phone || "",
      transferName: formState.transferName || formState.fullName || "",
      receiptImage: receiptPreview,
      receiptFileName: formState.receiptFileName || "receipt-upload",
      receivingAccountName: receivingAccount.accountName,
      receivingAccountNumber: receivingAccount.accountNumber,
      status: "pending"
    };

    const existingPayments = getStoredList("toouPendingPayments").filter(
      (item) => item.id !== paymentRecord.id
    );
    setStoredList("toouPendingPayments", [paymentRecord, ...existingPayments]);

    setIsSubmitting(false);
    setSubmitMessage("Receipt submitted successfully.");
    setShowSuccessModal(true);
  }

  return (
    <main className="payment-shell">
      <section className="payment-card">
        <header className="payment-topbar">
          <button type="button" className="payment-back-btn" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="payment-topbar-copy">
            <div className="payment-kicker">
              {paymentType === "subscription" ? "TooU Subscription" : "TooU Checkout"}
            </div>
            <h1>{paymentType === "subscription" ? "Activate your monthly plan" : t("Top up your eggs")}</h1>
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
              <strong>{displayTitle}</strong>
              <span>{displayNote}</span>
            </div>
          </div>
          <div className="payment-hero-amount">
            <span>Total due</span>
            <strong>{displayPrice}</strong>
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
                <span>{paymentType === "subscription" ? displayTitle : `1 x ${displayTitle}`}</span>
                <strong>{displayPrice}</strong>
              </div>
              <div className="checkout-row">
                <span>{paymentType === "subscription" ? "Cycle" : "Bonus"}</span>
                <strong>
                  {paymentType === "subscription"
                    ? `${selectedItem.durationDays} days`
                    : selectedItem.bonus || "Included"}
                </strong>
              </div>
              <div className="checkout-row">
                <span>{paymentType === "subscription" ? "Bonus eggs" : "Total eggs"}</span>
                <strong>
                  {paymentType === "subscription"
                    ? selectedItem.bonusCoins
                    : selectedItem.total}
                </strong>
              </div>
              <div className="checkout-divider" />
              <div className="checkout-row total">
                <span>Total due</span>
                <strong>{displayPrice}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 1 ? (
          <section className="payment-stage">
            <div className="payment-section-title">{t("Choose payment provider")}</div>
            <div className="payment-section-copy">
              Pick the wallet, then transfer the amount to the TooU receiving account shown below.
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
                <strong>Pay to {receivingAccount.name}</strong>
                <span>{`${receivingAccount.accountName} / ${receivingAccount.accountNumber}`}</span>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="payment-stage">
            <div className="payment-section-title">Upload receipt</div>
            <div className="payment-section-copy">
              Transfer the money first, then upload the screenshot so the admin can confirm and activate your {paymentType === "subscription" ? "subscription" : "eggs"}.
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
              <label className="payment-field">
                <span>Name used for transfer</span>
                <input
                  type="text"
                  value={formState.transferName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, transferName: event.target.value }))
                  }
                />
              </label>
              <label className="payment-field">
                <span>Receipt code or transaction ID</span>
                <input
                  type="text"
                  value={formState.receiptCode}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, receiptCode: event.target.value }))
                  }
                />
              </label>
              <label className="payment-field payment-field-wide">
                <span>Upload receipt screenshot</span>
                <input type="file" accept="image/*" onChange={handleReceiptChange} />
              </label>
              {receiptPreview ? (
                <div className="receipt-preview-upload">
                  <img src={receiptPreview} alt="Receipt preview" />
                  <div>
                    <strong>{formState.receiptFileName || "Receipt attached"}</strong>
                    <span>{`Waiting to submit ${formatMmk(totalAmountMmk)}`}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="checkout-summary compact">
              <div className="checkout-row">
                <span>Provider</span>
                <strong>{provider.name}</strong>
              </div>
              <div className="checkout-row">
                <span>Pay to</span>
                <strong>{receivingAccount.accountNumber}</strong>
              </div>
              <div className="checkout-row total">
                <span>Total due</span>
                <strong>{formatMmk(totalAmountMmk)}</strong>
              </div>
            </div>
            {submitMessage ? <div className="payment-submit-note">{submitMessage}</div> : null}
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
            <button
              type="button"
              className="payment-primary-btn"
              onClick={handlePayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Receipt"}
            </button>
          )}
        </div>
      </section>

      {showSuccessModal ? (
        <div className="payment-success-modal" role="dialog" aria-modal="true">
          <div className="payment-success-backdrop" />
          <div className="payment-success-card">
            <div className="payment-success-icon">
              <i className="fa-solid fa-clock" />
            </div>
            <h2>Receipt submitted</h2>
            <p>
              {paymentType === "subscription"
                ? `Your ${selectedItem.name} monthly plan will be activated within 1 to 2 hours after admin confirmation.`
                : `Your ${selectedItem.total} eggs will be filled within 1 to 2 hours after admin confirmation.`}
            </p>
            <p>
              If the {paymentType === "subscription" ? "subscription" : "coins"} do not enter within 24 hours, please contact customer support.
            </p>
            <a
              className="payment-support-link"
              href={CUSTOMER_SUPPORT_LINK}
              target="_blank"
              rel="noreferrer"
            >
              Contact Customer Support
            </a>
            <button
              type="button"
              className="payment-primary-btn payment-modal-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/store");
              }}
            >
              Yes, I know
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
