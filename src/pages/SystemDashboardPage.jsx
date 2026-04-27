import { useMemo, useState } from "react";
import { creators as mockCreators, series as mockSeries } from "../data/mockData";
import { eggPackages } from "../data/storePackages";
import { getStoredUserAccount, setUserAccount } from "../lib/account";
import { getStoredSubscription, setStoredSubscription } from "../lib/subscriptions";
import { getStoredList, getStoredMap, setStoredList, setStoredMap } from "../lib/storage";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/company.css";

const COPY = {
  en: {
    admin: "TooU Admin",
    subtitle: "Purchase review and creator approval",
    langEn: "English",
    langMm: "Myanmar",
    overview: "Overview",
    pendingPayments: "Pending Payments",
    creatorVerification: "Creator Verification",
    confirmedPayments: "Confirmed Payments",
    settings: "Settings",
    dashboard: "Dashboard",
    pendingReceipts: "Pending receipts",
    waitingCoins: "Coins waiting",
    verifiedCreators: "Verified creators",
    clearedRevenue: "Revenue cleared",
    buyerPayments: "Buyer payments",
    creatorQueue: "Creator queue",
    latestQueue: "Latest payment queue",
    needsReview: "Needs review",
    userPurchaseReview: "User purchase review",
    creatorIdentity: "Creator identity review",
    approvedPurchases: "Approved purchases",
    rejectedPayments: "Rejected payments",
    reviewSettings: "Review settings",
    manualReview: "Manual review only",
    websiteUpload: "Receipt upload on website",
    creatorApproval: "Creator approval by admin",
    publishingUnlock: "Publishing unlock after approval",
    confirmHook: "Connect confirm button to Supabase coin crediting",
    paymentPending: "Pending",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusUnderReview: "Under review",
    buyer: "Buyer",
    phone: "Phone",
    package: "Package",
    provider: "Provider",
    amount: "Amount",
    coins: "Coins",
    creditCoins: "Coins to credit",
    receipt: "Receipt",
    submitted: "Submitted",
    confirmPayment: "Confirm",
    rejectPayment: "Reject",
    approveCreator: "Approve creator",
    markReview: "Under review",
    typeStudio: "Studio",
    typeCreator: "Creator",
    totalPending: "Pending total",
    approvedWeek: "Approved this week",
    approvedMonth: "Approved this month",
    rejectedTotal: "Rejected total",
    totalPayments: "Total payments",
    totalMmk: "Total MMK",
    paymentDetails: "Payment details",
    creatorDetails: "Creator details",
    selectedPayment: "Selected payment",
    selectedCreator: "Selected creator",
    noPendingReceipts: "No pending receipts right now.",
    noRejected: "No rejected payments yet.",
    pendingCreatorTotal: "Pending creators",
    underReviewTotal: "Under review",
    approvedCreatorTotal: "Approved creators",
    creatorTotal: "Total creators",
    studios: "Studios",
    individuals: "Individuals",
    profileSummary: "Profile summary",
    publishedSeries: "Published series",
    verificationNote: "Verification note",
    selectPayment: "Select a payment to inspect details.",
    selectCreator: "Select a creator to inspect the account.",
    open: "Open",
    accountStatus: "Account status"
  },
  mm: {
    admin: "TooU အက်ဒ်မင်",
    subtitle: "ငွေပေးချေမှု စစ်ဆေးခြင်းနှင့် creator အတည်ပြုခြင်း",
    langEn: "English",
    langMm: "မြန်မာ",
    overview: "အကျဉ်းချုပ်",
    pendingPayments: "စောင့်ဆိုင်းနေသော ငွေပေးချေမှုများ",
    creatorVerification: "Creator အတည်ပြုခြင်း",
    confirmedPayments: "အတည်ပြုပြီးသော ငွေပေးချေမှုများ",
    settings: "ဆက်တင်များ",
    dashboard: "ဒက်ရှ်ဘုတ်",
    pendingReceipts: "စောင့်ဆိုင်းနေသော receipt များ",
    waitingCoins: "စောင့်ဆိုင်းနေသော coins",
    verifiedCreators: "အတည်ပြုပြီး creator များ",
    clearedRevenue: "အတည်ပြုပြီး ဝင်ငွေ",
    buyerPayments: "ဝယ်သူ ငွေပေးချေမှုများ",
    creatorQueue: "Creator queue",
    latestQueue: "နောက်ဆုံး payment queue",
    needsReview: "စစ်ဆေးရန်လိုအပ်သည်",
    userPurchaseReview: "User purchase စစ်ဆေးခြင်း",
    creatorIdentity: "Creator အတည်ပြု စစ်ဆေးခြင်း",
    approvedPurchases: "အတည်ပြုပြီး ဝယ်ယူမှုများ",
    rejectedPayments: "ငြင်းပယ်ထားသော payments",
    reviewSettings: "စစ်ဆေးမှု ဆက်တင်များ",
    manualReview: "လက်ဖြင့်စစ်ဆေးမှုသာ",
    websiteUpload: "Website မှ receipt တင်သွင်းခြင်း",
    creatorApproval: "Admin မှ creator အတည်ပြုခြင်း",
    publishingUnlock: "အတည်ပြုပြီးမှ publish လုပ်ခွင့်",
    confirmHook: "Confirm button ကို Supabase coin crediting နဲ့ ချိတ်ရန်",
    paymentPending: "စောင့်ဆိုင်းနေသည်",
    statusApproved: "အတည်ပြုပြီး",
    statusRejected: "ငြင်းပယ်ထားသည်",
    statusUnderReview: "စစ်ဆေးနေသည်",
    buyer: "ဝယ်သူ",
    phone: "ဖုန်း",
    package: "ပက်ကေ့ချ်",
    provider: "ပေးချေမှုစနစ်",
    amount: "ငွေပမာဏ",
    coins: "Coins",
    creditCoins: "ထည့်ပေးမည့် coins",
    receipt: "Receipt",
    submitted: "တင်သွင်းထားသည့်အချိန်",
    confirmPayment: "အတည်ပြုမည်",
    rejectPayment: "ငြင်းမည်",
    approveCreator: "Creator ကို အတည်ပြုမည်",
    markReview: "ထပ်မံစစ်ဆေးမည်",
    typeStudio: "Studio",
    typeCreator: "Creator",
    totalPending: "စောင့်ဆိုင်းနေသော စုစုပေါင်း",
    approvedWeek: "ဒီအပတ် အတည်ပြုပြီး",
    approvedMonth: "ဒီလ အတည်ပြုပြီး",
    rejectedTotal: "ငြင်းပယ်ထားသော စုစုပေါင်း",
    totalPayments: "Payments စုစုပေါင်း",
    totalMmk: "MMK စုစုပေါင်း",
    paymentDetails: "Payment အသေးစိတ်",
    creatorDetails: "Creator အသေးစိတ်",
    selectedPayment: "ရွေးထားသော payment",
    selectedCreator: "ရွေးထားသော creator",
    noPendingReceipts: "စောင့်ဆိုင်းနေသော receipt မရှိပါ။",
    noRejected: "ငြင်းပယ်ထားသော payment မရှိသေးပါ။",
    pendingCreatorTotal: "စောင့်ဆိုင်းနေသော creator များ",
    underReviewTotal: "စစ်ဆေးနေသော အရေအတွက်",
    approvedCreatorTotal: "အတည်ပြုပြီး creator များ",
    creatorTotal: "Creator စုစုပေါင်း",
    studios: "Studios",
    individuals: "Individuals",
    profileSummary: "Profile အကျဉ်းချုပ်",
    publishedSeries: "Published series",
    verificationNote: "Verification note",
    selectPayment: "အသေးစိတ်ကြည့်ရန် payment တစ်ခုရွေးပါ။",
    selectCreator: "Account ကြည့်ရန် creator တစ်ယောက်ရွေးပါ။",
    open: "ဖွင့်ထားသည်",
    accountStatus: "Account status"
  }
};

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function formatCurrency(value) {
  return `${Math.round(Number(value) || 0).toLocaleString()} MMK`;
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
}

function makeInitialPayments() {
  return [
    { id: "payment-1001", username: "May Thu", handle: "@maythu.reads", packageId: "eggs-120", provider: "KBZ Pay", amountMmk: 20000, coins: 140, submittedAt: "2026-04-26T08:25:00.000Z", receiptCode: "KBZ-22184", phone: "09 420 222 111", status: "pending" },
    { id: "payment-1002", username: "Zin Linn", handle: "@zinlinn", packageId: "eggs-300", provider: "Wave Pay", amountMmk: 40000, coins: 350, submittedAt: "2026-04-26T07:10:00.000Z", receiptCode: "WAVE-88321", phone: "09 788 230 601", status: "pending" },
    { id: "payment-1003", username: "Htet Naing", handle: "@htetnaing_story", packageId: "eggs-50", provider: "AYA Pay", amountMmk: 10000, coins: 50, submittedAt: "2026-04-25T16:40:00.000Z", receiptCode: "AYA-40772", phone: "09 750 908 110", status: "pending" },
    { id: "payment-1004", username: "Su Myat", handle: "@sumyat.chapter", packageId: "eggs-650", provider: "CB Pay", amountMmk: 80000, coins: 800, submittedAt: "2026-04-25T11:15:00.000Z", receiptCode: "CB-19011", phone: "09 443 202 887", status: "confirmed", reviewedAt: "2026-04-25T11:40:00.000Z" }
  ];
}

function makeInitialVerificationMap(creators = []) {
  return creators.reduce((accumulator, creator, index) => {
    accumulator[creator.id] = {
      status: index < 2 ? "approved" : index < 4 ? "pending" : "under-review",
      note: index < 2 ? "Identity verified and publishing access granted." : index < 4 ? "Waiting for admin ID check." : "Cross-checking creator profile details.",
      submittedAt: `2026-04-${String(20 + index).padStart(2, "0")}T08:00:00.000Z`,
      reviewedAt: index < 2 ? `2026-04-${String(22 + index).padStart(2, "0")}T11:00:00.000Z` : ""
    };
    return accumulator;
  }, {});
}

function getStatusLabel(status, copy) {
  if (status === "approved" || status === "confirmed") return copy.statusApproved;
  if (status === "rejected") return copy.statusRejected;
  if (status === "under-review") return copy.statusUnderReview;
  return copy.paymentPending;
}

function startOfWeek(now) {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

function startOfMonth(now) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  return date;
}

export default function SystemDashboardPage() {
  useBodyPage("company");

  const [language, setLanguage] = useState("en");
  const [activeSection, setActiveSection] = useState("pending-payments");
  const copy = COPY[language];

  const [paymentQueue, setPaymentQueue] = useState(() => {
    const stored = getStoredList("toouPendingPayments");
    if (stored.length) return stored;
    const initial = makeInitialPayments();
    setStoredList("toouPendingPayments", initial);
    return initial;
  });

  const creatorPool = useMemo(() => {
    const localCreators = getStoredList("toouLocalCreators");
    const merged = [...mockCreators, ...localCreators];
    const seen = new Set();
    return merged.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, []);

  const [verificationMap, setVerificationState] = useState(() => {
    const stored = getStoredMap("toouCreatorVerificationMap");
    if (Object.keys(stored).length) return stored;
    const initial = makeInitialVerificationMap(creatorPool);
    setStoredMap("toouCreatorVerificationMap", initial);
    return initial;
  });

  const packageMap = useMemo(() => new Map(eggPackages.map((item) => [item.id, item])), []);

  const creatorRows = useMemo(
    () =>
      creatorPool.map((creator) => {
        const relatedSeries = mockSeries.filter((item) => item.creatorId === creator.id);
        const verification = verificationMap[creator.id] || {
          status: "pending",
          note: "Waiting for review.",
          submittedAt: new Date().toISOString(),
          reviewedAt: ""
        };

        return {
          ...creator,
          seriesCount: relatedSeries.length,
          primaryFormat: relatedSeries[0]?.type || "creator",
          relatedSeries,
          verificationStatus: verification.status,
          verificationNote: verification.note,
          verificationSubmittedAt: verification.submittedAt,
          verificationReviewedAt: verification.reviewedAt
        };
      }),
    [creatorPool, verificationMap]
  );

  const pendingPayments = paymentQueue.filter((item) => item.status === "pending");
  const confirmedPayments = paymentQueue.filter((item) => item.status === "confirmed");
  const rejectedPayments = paymentQueue.filter((item) => item.status === "rejected");
  const creatorReviewQueue = creatorRows.filter((item) =>
    ["pending", "under-review"].includes(item.verificationStatus)
  );

  const [selectedPaymentId, setSelectedPaymentId] = useState(
    () => pendingPayments[0]?.id || paymentQueue[0]?.id || ""
  );
  const [selectedCreatorId, setSelectedCreatorId] = useState(
    () => creatorReviewQueue[0]?.id || creatorRows[0]?.id || ""
  );

  const selectedPayment =
    paymentQueue.find((item) => item.id === selectedPaymentId) || pendingPayments[0] || null;
  const selectedCreator =
    creatorRows.find((item) => item.id === selectedCreatorId) || creatorRows[0] || null;

  const totalRevenue = confirmedPayments.reduce((sum, item) => sum + Number(item.amountMmk || 0), 0);
  const totalCoinsWaiting = pendingPayments.reduce((sum, item) => sum + Number(item.coins || 0), 0);

  const now = new Date("2026-04-26T12:00:00.000Z");
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const approvedThisWeek = confirmedPayments.filter((item) => {
    const reviewedAt = new Date(item.reviewedAt || item.submittedAt || 0);
    return reviewedAt >= weekStart;
  }).length;

  const approvedThisMonth = confirmedPayments.filter((item) => {
    const reviewedAt = new Date(item.reviewedAt || item.submittedAt || 0);
    return reviewedAt >= monthStart;
  }).length;

  const summaryCards = [
    [copy.pendingReceipts, formatCompactCount(pendingPayments.length)],
    [copy.waitingCoins, formatCompactCount(totalCoinsWaiting)],
    [copy.verifiedCreators, formatCompactCount(creatorRows.filter((item) => item.verificationStatus === "approved").length)],
    [copy.clearedRevenue, formatCurrency(totalRevenue)]
  ];

  const paymentStats = [
    [copy.totalPending, formatCompactCount(pendingPayments.length)],
    [copy.approvedWeek, formatCompactCount(approvedThisWeek)],
    [copy.approvedMonth, formatCompactCount(approvedThisMonth)],
    [copy.rejectedTotal, formatCompactCount(rejectedPayments.length)],
    [copy.totalPayments, formatCompactCount(paymentQueue.length)],
    [copy.totalMmk, formatCurrency(paymentQueue.reduce((sum, item) => sum + Number(item.amountMmk || 0), 0))]
  ];

  const creatorStats = [
    [copy.pendingCreatorTotal, formatCompactCount(creatorRows.filter((item) => item.verificationStatus === "pending").length)],
    [copy.underReviewTotal, formatCompactCount(creatorRows.filter((item) => item.verificationStatus === "under-review").length)],
    [copy.approvedCreatorTotal, formatCompactCount(creatorRows.filter((item) => item.verificationStatus === "approved").length)],
    [copy.creatorTotal, formatCompactCount(creatorRows.length)],
    [copy.studios, formatCompactCount(creatorRows.filter((item) => item.type === "studio").length)],
    [copy.individuals, formatCompactCount(creatorRows.filter((item) => item.type !== "studio").length)]
  ];

  const navItems = [
    ["overview", copy.overview, "fa-table-columns"],
    ["pending-payments", copy.pendingPayments, "fa-wallet"],
    ["creator-verification", copy.creatorVerification, "fa-user-check"],
    ["confirmed-payments", copy.confirmedPayments, "fa-circle-check"],
    ["settings", copy.settings, "fa-sliders"]
  ];

  function persistPayments(nextPayments) {
    setPaymentQueue(nextPayments);
    setStoredList("toouPendingPayments", nextPayments);
  }

  function persistVerification(nextMap) {
    setVerificationState(nextMap);
    setStoredMap("toouCreatorVerificationMap", nextMap);
  }

  function updatePaymentStatus(paymentId, status) {
    const reviewedAt = new Date().toISOString();
    const nextPayments = paymentQueue.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            status,
            reviewedAt
          }
        : item
    );
    persistPayments(nextPayments);

    if (status !== "confirmed") return;

    const approvedPayment = nextPayments.find((item) => item.id === paymentId);
    const storedAccount = getStoredUserAccount();
    if (!approvedPayment || !storedAccount) return;

    const matchesAccount =
      (approvedPayment.userSupabaseId && approvedPayment.userSupabaseId === storedAccount.supabaseUserId) ||
      (approvedPayment.userEmail && approvedPayment.userEmail === storedAccount.email) ||
      approvedPayment.username === storedAccount.username;

    if (!matchesAccount) return;

    if (approvedPayment.paymentType === "subscription") {
      const currentSubscription = getStoredSubscription();
      const now = new Date();
      const currentExpiry =
        currentSubscription?.expiresAt && new Date(currentSubscription.expiresAt) > now
          ? new Date(currentSubscription.expiresAt)
          : now;
      const nextExpiry = new Date(currentExpiry);
      nextExpiry.setDate(
        nextExpiry.getDate() + Number(approvedPayment.subscriptionDurationDays || 30)
      );

      setStoredSubscription({
        planId: approvedPayment.subscriptionPlanId,
        planName: approvedPayment.subscriptionPlanName,
        status: "active",
        startedAt: now.toISOString(),
        expiresAt: nextExpiry.toISOString(),
        nextDueAt: nextExpiry.toISOString(),
        lastPaidAt: now.toISOString(),
        bonusCoins: Number(approvedPayment.coins || 0)
      });

      if (Number(approvedPayment.coins || 0) > 0) {
        setUserAccount({
          ...storedAccount,
          coins: Number(storedAccount.coins || 0) + Number(approvedPayment.coins || 0),
          eggsPurchasedTotal:
            Number(storedAccount.eggsPurchasedTotal || 0) + Number(approvedPayment.coins || 0)
        });
      }
      return;
    }

    setUserAccount({
      ...storedAccount,
      coins: Number(storedAccount.coins || 0) + Number(approvedPayment.coins || 0),
      eggsPurchasedTotal:
        Number(storedAccount.eggsPurchasedTotal || 0) + Number(approvedPayment.coins || 0)
    });
  }

  function updateVerificationStatus(creatorId, status, note) {
    persistVerification({
      ...verificationMap,
      [creatorId]: {
        ...(verificationMap[creatorId] || {}),
        status,
        note,
        reviewedAt: new Date().toISOString()
      }
    });
  }

  return (
    <main className="company-admin-shell">
      <div className="company-admin-frame">
        <aside className="company-admin-sidebar">
          <div className="company-brand-card">
            <img src="/images/logo.png" alt="TooU logo" className="company-logo" />
            <div className="company-brand-copy">
              <strong>{copy.admin}</strong>
              <span>{copy.subtitle}</span>
            </div>
          </div>

          <div className="company-language-toggle" role="group" aria-label="Language switch">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              {copy.langEn}
            </button>
            <button
              type="button"
              className={language === "mm" ? "active" : ""}
              onClick={() => setLanguage("mm")}
            >
              {copy.langMm}
            </button>
          </div>

          <nav className="company-admin-nav" aria-label="Admin dashboard sections">
            {navItems.map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                className={`company-admin-nav-link ${activeSection === key ? "active" : ""}`}
                onClick={() => setActiveSection(key)}
              >
                <i className={`fa-solid ${icon}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="company-admin-workspace">
          <div className="company-admin-scroll">
            <section className="company-section">
              <div className="company-workspace-topbar">
                <div>
                  <p className="company-overline">{copy.dashboard}</p>
                  <h1>{activeSection === "pending-payments" ? copy.userPurchaseReview : activeSection === "creator-verification" ? copy.creatorIdentity : activeSection === "confirmed-payments" ? copy.approvedPurchases : activeSection === "settings" ? copy.reviewSettings : copy.overview}</h1>
                </div>
                <div className="company-topbar-actions">
                  <span className="company-topbar-pill">
                    {pendingPayments.length + creatorReviewQueue.length} {copy.open}
                  </span>
                </div>
              </div>

              {activeSection === "overview" ? (
                <>
                  <div className="company-kpi-grid">
                    {summaryCards.map(([label, value]) => (
                      <article className="company-kpi-card" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="company-admin-grid company-admin-grid-overview">
                    <article className="company-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.buyerPayments}</div>
                          <h2>{copy.latestQueue}</h2>
                        </div>
                      </div>
                      <div className="company-list">
                        {pendingPayments.slice(0, 4).map((payment) => {
                          const selectedPackage = packageMap.get(payment.packageId);
                          return (
                            <div className="company-list-row" key={payment.id}>
                              <div>
                                <strong>{payment.username}</strong>
                                <p>{`${selectedPackage?.title || payment.packageId} / ${payment.provider}`}</p>
                              </div>
                              <span className="status-chip pending">{copy.paymentPending}</span>
                            </div>
                          );
                        })}
                      </div>
                    </article>

                    <article className="company-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.creatorQueue}</div>
                          <h2>{copy.needsReview}</h2>
                        </div>
                      </div>
                      <div className="company-list">
                        {creatorReviewQueue.slice(0, 4).map((creator) => (
                          <div className="company-list-row" key={creator.id}>
                            <div>
                              <strong>{creator.name}</strong>
                              <p>{`${creator.type === "studio" ? copy.typeStudio : copy.typeCreator} / ${creator.primaryFormat}`}</p>
                            </div>
                            <span className={`status-chip ${creator.verificationStatus}`}>
                              {getStatusLabel(creator.verificationStatus, copy)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </>
              ) : null}

              {activeSection === "pending-payments" ? (
                <>
                  <div className="company-stat-grid">
                    {paymentStats.map(([label, value]) => (
                      <article className="company-kpi-card" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="company-admin-grid company-admin-grid-main">
                    <article className="company-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.pendingPayments}</div>
                          <h2>{copy.userPurchaseReview}</h2>
                        </div>
                      </div>

                      <div className="payment-review-list">
                        {pendingPayments.length ? (
                          pendingPayments.map((payment) => {
                            const selectedPackage = packageMap.get(payment.packageId);
                            return (
                              <button
                                type="button"
                                className={`payment-review-card selectable ${selectedPaymentId === payment.id ? "active" : ""}`}
                                key={payment.id}
                                onClick={() => setSelectedPaymentId(payment.id)}
                              >
                                <div className="payment-review-head">
                                  <div>
                                    <strong>{payment.username}</strong>
                                    <p>{`${copy.receipt} ${payment.receiptCode} / ${formatTime(payment.submittedAt)}`}</p>
                                  </div>
                                  <span className="status-chip pending">{copy.paymentPending}</span>
                                </div>
                                <div className="payment-data-grid compact">
                                  <div className="payment-data-cell">
                                    <span>{copy.package}</span>
                                    <strong>{selectedPackage?.title || payment.packageId}</strong>
                                  </div>
                                  <div className="payment-data-cell">
                                    <span>{copy.amount}</span>
                                    <strong>{formatCurrency(payment.amountMmk)}</strong>
                                  </div>
                                  <div className="payment-data-cell">
                                    <span>{copy.coins}</span>
                                    <strong>{payment.coins}</strong>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="company-empty">{copy.noPendingReceipts}</div>
                        )}
                      </div>
                    </article>

                    <article className="company-panel detail-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.paymentDetails}</div>
                          <h2>{copy.selectedPayment}</h2>
                        </div>
                      </div>

                      {selectedPayment ? (
                        <div className="detail-stack">
                          <div className="detail-card">
                            <strong>{selectedPayment.username}</strong>
                            <p>{selectedPayment.handle}</p>
                          </div>
                          {selectedPayment.receiptImage ? (
                            <div className="receipt-detail-preview">
                              <img src={selectedPayment.receiptImage} alt="Uploaded receipt" />
                            </div>
                          ) : null}
                          <div className="detail-table">
                            <div className="detail-row"><span>{copy.package}</span><strong>{packageMap.get(selectedPayment.packageId)?.title || selectedPayment.packageId}</strong></div>
                            <div className="detail-row"><span>{copy.provider}</span><strong>{selectedPayment.provider}</strong></div>
                            <div className="detail-row"><span>{copy.amount}</span><strong>{formatCurrency(selectedPayment.amountMmk)}</strong></div>
                            <div className="detail-row"><span>{copy.creditCoins}</span><strong>{selectedPayment.coins}</strong></div>
                            <div className="detail-row"><span>{copy.phone}</span><strong>{selectedPayment.phone}</strong></div>
                            <div className="detail-row"><span>{copy.submitted}</span><strong>{formatTime(selectedPayment.submittedAt)}</strong></div>
                          </div>
                          <div className="approval-actions">
                            <button type="button" className="company-action-btn" onClick={() => updatePaymentStatus(selectedPayment.id, "confirmed")}>
                              {copy.confirmPayment}
                            </button>
                            <button type="button" className="company-action-btn secondary danger" onClick={() => updatePaymentStatus(selectedPayment.id, "rejected")}>
                              {copy.rejectPayment}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="company-empty">{copy.selectPayment}</div>
                      )}
                    </article>
                  </div>
                </>
              ) : null}

              {activeSection === "creator-verification" ? (
                <>
                  <div className="company-stat-grid">
                    {creatorStats.map(([label, value]) => (
                      <article className="company-kpi-card" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="company-admin-grid company-admin-grid-main">
                    <article className="company-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.creatorVerification}</div>
                          <h2>{copy.creatorIdentity}</h2>
                        </div>
                      </div>

                      <div className="verification-list">
                        {creatorRows.map((creator) => (
                          <button
                            type="button"
                            className={`verification-card selectable ${selectedCreatorId === creator.id ? "active" : ""}`}
                            key={creator.id}
                            onClick={() => setSelectedCreatorId(creator.id)}
                          >
                            <div className="verification-card-main">
                              <img src={creator.avatar} alt={creator.name} />
                              <div>
                                <strong>{creator.name}</strong>
                                <p>{`${creator.type === "studio" ? copy.typeStudio : copy.typeCreator} / ${creator.primaryFormat}`}</p>
                              </div>
                            </div>
                            <span className={`status-chip ${creator.verificationStatus}`}>
                              {getStatusLabel(creator.verificationStatus, copy)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </article>

                    <article className="company-panel detail-panel">
                      <div className="company-panel-head">
                        <div>
                          <div className="company-panel-kicker">{copy.creatorDetails}</div>
                          <h2>{copy.selectedCreator}</h2>
                        </div>
                      </div>

                      {selectedCreator ? (
                        <div className="detail-stack">
                          <div className="creator-profile-card">
                            <img src={selectedCreator.avatar} alt={selectedCreator.name} />
                            <div>
                              <strong>{selectedCreator.name}</strong>
                              <p>{selectedCreator.bio}</p>
                            </div>
                          </div>
                          <div className="detail-table">
                            <div className="detail-row"><span>{copy.profileSummary}</span><strong>{selectedCreator.type === "studio" ? copy.typeStudio : copy.typeCreator}</strong></div>
                            <div className="detail-row"><span>{copy.accountStatus}</span><strong>{getStatusLabel(selectedCreator.verificationStatus, copy)}</strong></div>
                            <div className="detail-row"><span>{copy.submitted}</span><strong>{formatTime(selectedCreator.verificationSubmittedAt)}</strong></div>
                            <div className="detail-row"><span>{copy.publishedSeries}</span><strong>{selectedCreator.seriesCount}</strong></div>
                            <div className="detail-row"><span>{copy.verificationNote}</span><strong>{selectedCreator.verificationNote}</strong></div>
                          </div>

                          <div className="series-mini-list">
                            {selectedCreator.relatedSeries.slice(0, 4).map((series) => (
                              <div className="series-mini-item" key={series.id}>
                                <strong>{series.title}</strong>
                                <span>{series.type}</span>
                              </div>
                            ))}
                          </div>

                          <div className="verification-actions">
                            <button type="button" className="company-action-btn" onClick={() => updateVerificationStatus(selectedCreator.id, "approved", "Creator identity approved for publishing.")}>
                              {copy.approveCreator}
                            </button>
                            <button type="button" className="company-action-btn secondary" onClick={() => updateVerificationStatus(selectedCreator.id, "under-review", "Admin requested another document check.")}>
                              {copy.markReview}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="company-empty">{copy.selectCreator}</div>
                      )}
                    </article>
                  </div>
                </>
              ) : null}

              {activeSection === "confirmed-payments" ? (
                <div className="company-admin-grid company-admin-grid-overview">
                  <article className="company-panel">
                    <div className="company-panel-head">
                      <div>
                        <div className="company-panel-kicker">{copy.confirmedPayments}</div>
                        <h2>{copy.approvedPurchases}</h2>
                      </div>
                    </div>
                    <div className="company-list">
                      {confirmedPayments.map((payment) => (
                        <div className="company-list-row" key={payment.id}>
                          <div>
                            <strong>{payment.username}</strong>
                            <p>{`${payment.provider} / ${formatCurrency(payment.amountMmk)}`}</p>
                          </div>
                          <span className="status-chip approved">{payment.coins} {copy.coins}</span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="company-panel">
                    <div className="company-panel-head">
                      <div>
                        <div className="company-panel-kicker">{copy.rejectedPayments}</div>
                        <h2>{copy.rejectedPayments}</h2>
                      </div>
                    </div>
                    <div className="company-list">
                      {rejectedPayments.length ? (
                        rejectedPayments.map((payment) => (
                          <div className="company-list-row" key={payment.id}>
                            <div>
                              <strong>{payment.username}</strong>
                              <p>{`${payment.provider} / ${formatCurrency(payment.amountMmk)}`}</p>
                            </div>
                            <span className="status-chip rejected">{copy.statusRejected}</span>
                          </div>
                        ))
                      ) : (
                        <div className="company-empty">{copy.noRejected}</div>
                      )}
                    </div>
                  </article>
                </div>
              ) : null}

              {activeSection === "settings" ? (
                <div className="company-admin-grid company-admin-grid-single">
                  <article className="company-panel">
                    <div className="company-list">
                      {[copy.manualReview, copy.websiteUpload, copy.creatorApproval, copy.publishingUnlock, copy.confirmHook].map((item) => (
                        <div className="company-list-row single" key={item}>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
