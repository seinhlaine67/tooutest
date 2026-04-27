import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAccount } from "../lib/account";
import { getStoredSubscription, getSubscriptionDaysLeft } from "../lib/subscriptions";
import { eggPackages, subscriptionPlans } from "../data/storePackages";
import "../styles/legacy/store.css";

export default function StorePage() {
  const navigate = useNavigate();
  const initialAccount = useMemo(() => getUserAccount(), []);
  const subscription = useMemo(() => getStoredSubscription(), []);
  const [activeTab, setActiveTab] = useState("coins");
  const [userAccount] = useState(initialAccount);

  const daysLeft = getSubscriptionDaysLeft(subscription);
  const subscriptionLabel =
    subscription?.status === "active"
      ? `Subscription active · ${daysLeft} days left`
      : subscription?.status === "expiring_soon"
        ? `Subscription expires soon · ${daysLeft} days left`
        : subscription?.status === "expired"
          ? "Subscription expired · renew to keep access"
          : "No active subscription";

  return (
    <>
      <section className="store-hero">
        <div className="store-hero-copy">
          <div className="store-kicker-row">
            <span className="store-kicker">Store</span>
            <button type="button" className="store-alert" aria-label="Notifications">
              <i className="fa-regular fa-bell" />
              <span>5</span>
            </button>
          </div>
          <h1>Support your reading with eggs and premium access.</h1>
          <p>
            Top up your nest, unlock subscriber perks, and keep the buying flow in the
            same TooU reading universe.
          </p>
        </div>

        <div className="balance-card">
          <div className="balance-header">
            <span>Your Balance</span>
            <span className="premium-badge">
              {subscription?.status === "active" || subscription?.status === "expiring_soon"
                ? subscription?.planName || "Premium"
                : "Reader"}
            </span>
          </div>
          <strong className="balance-total">🥚 {userAccount?.coins ?? 250} Eggs</strong>
          <p>{subscriptionLabel}</p>
        </div>
      </section>

      <section className="store-shell">
        <div className="store-tabs" role="tablist" aria-label="Store tabs">
          <button
            type="button"
            className={`store-tab ${activeTab === "coins" ? "active" : ""}`}
            aria-selected={activeTab === "coins"}
            onClick={() => setActiveTab("coins")}
          >
            Buy Eggs
          </button>
          <button
            type="button"
            className={`store-tab ${activeTab === "sub" ? "active" : ""}`}
            aria-selected={activeTab === "sub"}
            onClick={() => setActiveTab("sub")}
          >
            Subscriptions
          </button>
        </div>

        <div
          className={`store-panel ${activeTab === "coins" ? "active" : ""}`}
          hidden={activeTab !== "coins"}
        >
          <div className="section-heading">
            <div className="section-title">Egg Packages</div>
            <div className="section-copy">
              Pick the top-up that matches how you read, from quick unlocks to longer
              binge sessions.
            </div>
          </div>
          <div className="coin-list">
            {eggPackages.map((item) => (
              <article className="coin-card" key={item.id}>
                <div className="coin-copy">
                  <div className="coin-title-row">
                    <h2>{item.title}</h2>
                    {item.bonus ? <span className="coin-bonus">{item.bonus}</span> : null}
                  </div>
                  <p className="coin-price">{item.price}</p>
                  <p className="coin-note">{item.note}</p>
                </div>
                <button
                  type="button"
                  className="store-btn"
                  onClick={() => navigate(`/payment?type=coins&package=${item.id}`)}
                >
                  Buy Now
                </button>
              </article>
            ))}
          </div>
        </div>

        <div
          className={`store-panel ${activeTab === "sub" ? "active" : ""}`}
          hidden={activeTab !== "sub"}
        >
          <div className="section-heading">
            <div className="section-title">Subscription Plans</div>
            <div className="section-copy">
              Choose a monthly plan, upload your payment receipt, and wait for admin
              confirmation to activate the subscription.
            </div>
          </div>

          {subscription ? (
            <div className="subscription-status-banner">
              <strong>{subscription.planName || "Current subscription"}</strong>
              <span>{subscriptionLabel}</span>
            </div>
          ) : null}

          <div className="plan-list">
            {subscriptionPlans.map((plan) => {
              const isCurrent = subscription?.planId === plan.id &&
                ["active", "expiring_soon"].includes(subscription?.status);

              return (
                <article
                  className={`plan-card ${
                    plan.id.includes("basic")
                      ? "basic-plan"
                      : plan.id.includes("premium")
                        ? "premium-plan"
                        : "pro-plan"
                  }`}
                  key={plan.id}
                >
                  <div className="plan-tag">{isCurrent ? "Current" : plan.badge}</div>
                  <h2>{plan.name}</h2>
                  <p className="plan-price">
                    {plan.amountMmk.toLocaleString()} MMK <span>/ month</span>
                  </p>
                  <ul className="plan-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`plan-btn ${isCurrent ? "current" : plan.id.includes("pro") ? "accent" : ""}`}
                    onClick={() => navigate(`/payment?type=subscription&plan=${plan.id}`)}
                  >
                    {isCurrent ? "Renew Plan" : "Subscribe"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
