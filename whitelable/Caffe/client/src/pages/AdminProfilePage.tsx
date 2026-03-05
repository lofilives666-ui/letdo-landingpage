import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { fetchAdminCategories, fetchAdminItems } from "../api/client";
import { ADMIN_SESSION_KEY } from "../constants";
import type { Category, MenuItem } from "../types";

export function AdminProfilePage() {
  const navigate = useNavigate();
  const adminKey = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!adminKey) return;
    loadData();
  }, [adminKey]);

  useEffect(() => {
    const fixedMenuUrl = `${window.location.origin}/home`;
    setMenuUrl(fixedMenuUrl);
    QRCode.toDataURL(fixedMenuUrl, {
      width: 1000,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" }
    }).then(setQrDataUrl);
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [catData, itemData] = await Promise.all([
        fetchAdminCategories(adminKey),
        fetchAdminItems(adminKey)
      ]);
      setCategories(catData);
      setItems(itemData);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const enabledCount = useMemo(() => items.filter((item) => item.isAvailable).length, [items]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy link.");
    }
  }

  function onLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    navigate("/login");
  }

  if (!adminKey) return <Navigate to="/login" replace />;

  return (
    <main className="mobile-shell user-fullscreen">
      <section className="phone-frame user-fullscreen profile-screen">
        <header className="manage-head">
          <button className="icon-head-btn" type="button" onClick={() => navigate("/admin/home")} aria-label="Back">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
          <h1>Profile</h1>
          <span className="head-placeholder" />
        </header>

        <section className="manage-card">
          <div className="profile-head">
            <div className="profile-avatar">N</div>
            <div>
              <h2>NIKKIS Admin</h2>
              <p>Manage menu and availability</p>
            </div>
          </div>

          <div className="profile-stats">
            <article>
              <strong>{categories.length}</strong>
              <span>Categories</span>
            </article>
            <article>
              <strong>{items.length}</strong>
              <span>Total Items</span>
            </article>
            <article>
              <strong>{enabledCount}</strong>
              <span>Enabled</span>
            </article>
          </div>
        </section>

        <section className="manage-card qr-main-card">
          <h2>Customer Scan QR</h2>
          <p className="qr-help">This fixed QR opens your live user menu. New products will appear automatically.</p>
          <div className="profile-qr-wrap">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="User menu QR code" className="profile-qr-img" />
            ) : (
              <p className="status">Generating QR...</p>
            )}
          </div>
          <p className="qr-url">{menuUrl}</p>
          <div className="profile-icon-row">
            <button type="button" className="profile-icon-btn" onClick={onCopy} aria-label="Copy Link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <rect x="4" y="4" width="11" height="11" rx="2" />
              </svg>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button type="button" className="profile-icon-btn" onClick={() => navigate("/home")} aria-label="Open User UI">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                <path d="M9 5v14" />
              </svg>
              <span>User UI</span>
            </button>
          </div>
        </section>

        {loading && <p className="status">Loading profile data...</p>}
        {error && <p className="status error">{error}</p>}

        <section className="manage-card">
          <div className="profile-icon-row">
            <button
              className="profile-icon-btn primary"
              type="button"
              onClick={() => navigate("/admin/manage")}
              aria-label="Manage Products"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3.3" />
                <path d="m19.4 15-1.1 1.9-2.1-.3a5.8 5.8 0 0 1-1.5.9L14.2 20H9.8l-.5-2.5a5.8 5.8 0 0 1-1.5-.9l-2.1.3L4.6 15l1.6-1.5a6 6 0 0 1 0-2.9L4.6 9l1.1-1.9 2.1.3a5.8 5.8 0 0 1 1.5-.9L9.8 4h4.4l.5 2.5a5.8 5.8 0 0 1 1.5.9l2.1-.3L19.4 9l-1.6 1.5a6 6 0 0 1 0 2.9Z" />
              </svg>
              <span>Manage</span>
            </button>
            <button className="profile-icon-btn danger" type="button" onClick={onLogout} aria-label="Logout">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                <path d="M13 8l5 4-5 4" />
                <path d="M18 12H9" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
