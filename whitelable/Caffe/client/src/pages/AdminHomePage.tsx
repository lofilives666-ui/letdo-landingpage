import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { fetchAdminCategories, fetchAdminItems } from "../api/client";
import { ADMIN_SESSION_KEY } from "../constants";
import type { Category, MenuItem } from "../types";

export function AdminHomePage() {
  const navigate = useNavigate();
  const adminKey = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "enabled" | "disabled">("all");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [menuUrl, setMenuUrl] = useState("");

  useEffect(() => {
    if (!adminKey) return;
    loadData();
  }, [adminKey]);

  useEffect(() => {
    const fixedMenuUrl = `${window.location.origin}/home`;
    setMenuUrl(fixedMenuUrl);
    QRCode.toDataURL(fixedMenuUrl, {
      width: 900,
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

  if (!adminKey) return <Navigate to="/login" replace />;

  const enabledCount = items.filter((item) => item.isAvailable).length;

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => {
        if (activeTab === "enabled") return item.isAvailable;
        if (activeTab === "disabled") return !item.isAvailable;
        return true;
      })
      .filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [items, activeTab, search]);

  function cardImageStyle(imageUrl: string | null) {
    if (!imageUrl) return {};
    return {
      background: `linear-gradient(180deg, rgba(0, 0, 0, 0.10), rgba(0, 0, 0, 0.38)), url("${imageUrl}") center/cover no-repeat`
    };
  }

  return (
    <main className="mobile-shell user-fullscreen">
      <section className="phone-frame home-frame user-fullscreen admin-screen">
        <div className="home-top">
          <div className="admin-top-row">
            <div>
              <p className="meta">Admin Location</p>
              <h1>NIKKIS, Tanjungbalai</h1>
            </div>
            <button className="qr-icon-btn" type="button" onClick={() => setQrOpen(true)} aria-label="Open QR">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
                <path d="M14 14h3v3h-3zM18 14h3v3h-3zM14 18h3v3h-3zM19 19h2v2h-2z" />
              </svg>
            </button>
          </div>

          <div className="search-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item/category"
            />
            <button className="filter-btn" type="button" onClick={() => navigate("/admin/manage")}>
              Add
            </button>
          </div>

          <article className="promo-card">
            <span>Admin</span>
            <h2>Manage menu in one place</h2>
            <button className="qr-open-btn" type="button" onClick={() => setQrOpen(true)}>
              Show QR
            </button>
          </article>
        </div>

        <div className="home-body">
          <div className="category-row">
            <button
              className={activeTab === "all" ? "chip chip-active" : "chip"}
              onClick={() => setActiveTab("all")}
            >
              All {items.length}
            </button>
            <button
              className={activeTab === "enabled" ? "chip chip-active" : "chip"}
              onClick={() => setActiveTab("enabled")}
            >
              Enabled {enabledCount}
            </button>
            <button
              className={activeTab === "disabled" ? "chip chip-active" : "chip"}
              onClick={() => setActiveTab("disabled")}
            >
              Disabled {items.length - enabledCount}
            </button>
            <button className="chip" onClick={() => navigate("/admin/manage")}>
              Categories {categories.length}
            </button>
          </div>

          {loading && <p className="status">Loading...</p>}
          {error && <p className="status error">{error}</p>}

          {!loading && !error && (
            <div className="product-grid">
              {visibleItems.map((item) => (
                <article key={item.id} className="product-card admin-card">
                  <div className="product-image" style={cardImageStyle(item.imageUrl)} />
                  <h3>{item.name}</h3>
                  <p>{item.category.name}</p>
                  <div className="product-foot">
                    <strong>{item.isAvailable ? "Enabled" : "Disabled"}</strong>
                    <button className="plus-btn" type="button" onClick={() => navigate("/admin/manage")}>
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <nav className="bottom-nav fixed-home-nav">
          <button className="nav-item nav-active">
            <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M6 10.5V20h12v-9.5" />
            </svg>
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/manage")}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3.3" />
              <path d="m19.4 15-1.1 1.9-2.1-.3a5.8 5.8 0 0 1-1.5.9L14.2 20H9.8l-.5-2.5a5.8 5.8 0 0 1-1.5-.9l-2.1.3L4.6 15l1.6-1.5a6 6 0 0 1 0-2.9L4.6 9l1.1-1.9 2.1.3a5.8 5.8 0 0 1 1.5-.9L9.8 4h4.4l.5 2.5a5.8 5.8 0 0 1 1.5.9l2.1-.3L19.4 9l-1.6 1.5a6 6 0 0 1 0 2.9Z" />
            </svg>
            <span>Manage</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/home")}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
              <path d="M9 5v14" />
            </svg>
            <span>User UI</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/admin/profile")}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {qrOpen && (
          <div className="qr-modal qr-full-modal">
            <div className="qr-card qr-full-card">
              <p className="qr-brand">NIKKIS</p>
              <h2>Scan Menu QR</h2>
              <p>Customer can scan this QR to open live menu.</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Menu QR code" className="qr-image" />
              ) : (
                <p className="status">Generating QR...</p>
              )}
              <p className="qr-url">{menuUrl}</p>
              <button className="primary-btn" type="button" onClick={() => setQrOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
