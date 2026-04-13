import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAccount } from "../lib/account";
import { eggPackages } from "../data/storePackages";
import "../styles/legacy/store.css";

export default function StorePage() {
  const navigate = useNavigate();
  const initialAccount = useMemo(() => getUserAccount(), []);
  const [activeTab, setActiveTab] = useState("coins");
  const [userAccount] = useState(initialAccount);

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
            <span className="premium-badge">Premium</span>
          </div>
          <strong className="balance-total">🥚 {userAccount?.coins ?? 250} Eggs</strong>
          <p>Subscription expires: March 18, 2026</p>
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
                  onClick={() => navigate(`/payment?package=${item.id}`)}
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
              Choose the tier that fits your reading rhythm while keeping the same
              structure from your original page.
            </div>
          </div>
          <div className="plan-list">
            <article className="plan-card basic-plan">
              <div className="plan-tag">Basic</div>
              <h2>Basic</h2>
              <p className="plan-price">
                16,000 MMK <span>/ month</span>
              </p>
              <ul className="plan-features">
                <li>Access to select premium content</li>
                <li>Ad-free reading</li>
                <li>50 bonus eggs monthly</li>
              </ul>
              <button type="button" className="plan-btn">
                Subscribe
              </button>
            </article>
            <article className="plan-card premium-plan">
              <div className="plan-tag">Current</div>
              <h2>Premium</h2>
              <p className="plan-price">
                30,000 MMK <span>/ month</span>
              </p>
              <ul className="plan-features">
                <li>Unlimited access to all content</li>
                <li>Ad-free reading</li>
                <li>150 bonus eggs monthly</li>
                <li>Early access to new releases</li>
                <li>Exclusive subscriber badges</li>
              </ul>
              <button type="button" className="plan-btn current">
                Current Plan
              </button>
            </article>
            <article className="plan-card pro-plan">
              <div className="plan-tag">Pro</div>
              <h2>Pro</h2>
              <p className="plan-price">
                50,000 MMK <span>/ month</span>
              </p>
              <ul className="plan-features">
                <li>Everything in Premium</li>
                <li>300 bonus eggs monthly</li>
                <li>Direct messaging with authors</li>
                <li>Vote on upcoming content</li>
                <li>Custom profile themes</li>
              </ul>
              <button type="button" className="plan-btn accent">
                Subscribe
              </button>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
