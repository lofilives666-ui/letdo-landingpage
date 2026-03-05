import { useEffect, useMemo, useState } from "react";
import { fetchMenu } from "../api/client";
import type { Category, MenuItem } from "../types";

export function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      setLoading(true);
      const data = await fetchMenu();
      setCategories(data.categories);
      setItems(data.items);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        !activeCategory || item.category.slug === activeCategory;
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, search, activeCategory]);

  const eveningSpecialItems = useMemo(() => {
    const evening = items.filter((item) => item.category.slug === "evening-special");
    if (evening.length > 0) return evening;
    return items.slice(0, 5);
  }, [items]);

  function cardImageStyle(imageUrl: string | null) {
    if (!imageUrl) return {};
    return {
      background: `linear-gradient(180deg, rgba(0, 0, 0, 0.10), rgba(0, 0, 0, 0.38)), url("${imageUrl}") center/cover no-repeat`
    };
  }

  return (
    <main className="mobile-shell user-fullscreen home-shell">
      <section className="phone-frame home-frame user-fullscreen user-screen">
        <div className="home-top">
          <div className="user-top-row">
            <div>
              <p className="meta">Canteen Location</p>
              <h1>NIKKIS, Coimbatore</h1>
            </div>
            <div className="user-brand-badge">
              <span className="badge-dot" />
              NIKKIS
            </div>
          </div>

          <div className="search-row">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu item"
            />
            <button
              className="filter-btn"
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("");
                loadMenu();
              }}
              aria-label="Reset filters"
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 5h18" />
                <path d="M6 12h12" />
                <path d="M10 19h4" />
              </svg>
            </button>
          </div>

          <section className="swipe-banner-wrap top-swipe-wrap">
            <div className="swipe-banner-row">
              {eveningSpecialItems.map((item) => (
                <article
                  key={item.id}
                  className="swipe-banner-card top-swipe-card"
                  style={cardImageStyle(item.imageUrl)}
                >
                  <div className="swipe-banner-overlay">
                    <span className="top-banner-tag">Evening Special</span>
                    <p>{item.name}</p>
                    <small>Check available items live and enjoy quick service.</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="home-body">
          <div className="category-row">
            <button
              className={activeCategory === "" ? "chip chip-active" : "chip"}
              onClick={() => {
                setActiveCategory("");
              }}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={activeCategory === category.slug ? "chip chip-active" : "chip"}
                onClick={() => {
                  setActiveCategory(category.slug);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loading && <p className="status">Loading menu...</p>}
          {error && <p className="status error">{error}</p>}

          {!loading && !error && (
            <div className="product-grid">
              {filteredItems.map((item) => (
                <article key={item.id} className="product-card">
                  <div className="product-image" style={cardImageStyle(item.imageUrl)} />
                  <div className="product-head">
                    <h3>{item.name}</h3>
                    <span className="mini-chip">{item.category.name}</span>
                  </div>
                  <p>{item.description || item.category.name}</p>
                  <div className="product-foot">
                    <strong>Rs {item.price}</strong>
                    <span className="mini-chip">Available</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
