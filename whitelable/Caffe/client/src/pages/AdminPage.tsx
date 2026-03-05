import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  createItem,
  deleteItem,
  fetchAdminCategories,
  fetchAdminItems,
  toggleItemAvailability,
  updateItem
} from "../api/client";
import { ADMIN_SESSION_KEY } from "../constants";
import type { Category, MenuItem } from "../types";

type FormState = {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  sortOrder: number;
  isAvailable: boolean;
  imageUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: 0,
  categoryId: "",
  sortOrder: 0,
  isAvailable: true,
  imageUrl: ""
};

export function AdminPage() {
  const navigate = useNavigate();
  const adminKey = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [itemForm, setItemForm] = useState<FormState>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState("");
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorRotate, setEditorRotate] = useState(0);
  const [editorQuality, setEditorQuality] = useState(0.8);
  const [editorSize, setEditorSize] = useState(900);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categoryPills = [
    { slug: "drink", label: "Drink" },
    { slug: "juice", label: "Juice" },
    { slug: "snakes", label: "Snaks" },
    { slug: "evening-special", label: "Evening Special" }
  ];

  useEffect(() => {
    if (adminKey) {
      loadData(adminKey);
    }
  }, [adminKey]);

  async function loadData(key: string) {
    try {
      setLoading(true);
      const [catData, itemData] = await Promise.all([fetchAdminCategories(key), fetchAdminItems(key)]);
      setCategories(catData);
      setItems(itemData);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onAddOpen() {
    setEditingId(null);
    setViewItem(null);
    setItemForm(emptyForm);
    setShowForm(true);
  }

  function onEditOpen(item: MenuItem) {
    setEditingId(item.id);
    setViewItem(null);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      categoryId: item.categoryId,
      sortOrder: item.sortOrder,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || ""
    });
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateItem(adminKey, editingId, {
          ...itemForm,
          imageUrl: itemForm.imageUrl || "",
          isActive: true
        });
        setSuccess("Product updated.");
      } else {
        await createItem(adminKey, {
          ...itemForm,
          imageUrl: itemForm.imageUrl || "",
          isActive: true
        });
        setSuccess("Product added.");
      }
      setShowForm(false);
      setItemForm(emptyForm);
      setEditingId(null);
      await loadData(adminKey);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onDelete(item: MenuItem) {
    const ok = window.confirm(`Delete "${item.name}"?`);
    if (!ok) return;
    try {
      await deleteItem(adminKey, item.id);
      setSuccess("Product deleted.");
      await loadData(adminKey);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onToggle(item: MenuItem) {
    try {
      await toggleItemAvailability(adminKey, item.id, !item.isAvailable);
      await loadData(adminKey);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    navigate("/login");
  }

  if (!adminKey) return <Navigate to="/login" replace />;

  const visibleItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category.slug === activeCategory);

  const groupedItems = categoryPills
    .filter((pill) => activeCategory === "all" || activeCategory === pill.slug)
    .map((pill) => ({
      ...pill,
      items: visibleItems.filter((item) => item.category.slug === pill.slug)
    }))
    .filter((section) => section.items.length > 0);

  function thumbStyle(imageUrl: string | null) {
    if (!imageUrl) return {};
    return { backgroundImage: `url("${imageUrl}")` };
  }

  async function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setEditorSource(dataUrl);
    setEditorZoom(1);
    setEditorRotate(0);
    setEditorOpen(true);
    event.target.value = "";
  }

  async function onApplyEditor() {
    try {
      const edited = await createEditedImage({
        sourceDataUrl: editorSource,
        zoom: editorZoom,
        rotate: editorRotate,
        quality: editorQuality,
        size: editorSize
      });
      setItemForm((prev) => ({ ...prev, imageUrl: edited }));
      setEditorOpen(false);
      setEditorSource("");
    } catch {
      setError("Failed to process image. Try another one.");
    }
  }

  return (
    <main className="mobile-shell user-fullscreen">
      <section className="phone-frame user-fullscreen manage-screen">
        <header className="manage-head">
          <button className="manage-link" type="button" onClick={() => navigate("/admin/home")}>
            Back
          </button>
          <h1>Products</h1>
          <button className="manage-link" type="button" onClick={onLogout}>
            Logout
          </button>
        </header>

        <div className="manage-toolbar">
          <button className="primary-btn" type="button" onClick={onAddOpen}>
            Add Product
          </button>
        </div>

        {loading && <p className="status">Loading...</p>}
        {error && <p className="status error">{error}</p>}
        {success && <p className="status success">{success}</p>}

        {!showForm && (
          <section className="manage-card">
            <h2>Available Product List</h2>
            <div className="category-row">
              <button
                className={activeCategory === "all" ? "chip chip-active" : "chip"}
                type="button"
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {categoryPills.map((pill) => (
                <button
                  key={pill.slug}
                  className={activeCategory === pill.slug ? "chip chip-active" : "chip"}
                  type="button"
                  onClick={() => setActiveCategory(pill.slug)}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {groupedItems.map((section) => (
              <div key={section.slug} className="admin-group">
                <h3 className="admin-group-title">{section.label}</h3>
                <div className="admin-list">
                  {section.items.map((item) => (
                    <article className="admin-list-item" key={item.id}>
                      <div className="admin-item-head">
                        <div className="admin-thumb" style={thumbStyle(item.imageUrl)} />
                        <div className="admin-item-meta">
                          <h3>{item.name}</h3>
                          <p>{item.category.name}</p>
                          <strong>Rs {item.price}</strong>
                        </div>
                      </div>
                      <div className="admin-item-footer">
                        <div className="status-pill">
                          <span className={item.isAvailable ? "status-dot on" : "status-dot"} />
                          {item.isAvailable ? "Available" : "Not Available"}
                        </div>
                        <div className="action-row icon-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            title="View"
                            aria-label="View"
                            onClick={() => setViewItem(item)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M1.5 12s3.5-6 10.5-6 10.5 6 10.5 6-3.5 6-10.5 6S1.5 12 1.5 12Z" />
                              <circle cx="12" cy="12" r="3.2" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => onEditOpen(item)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m3 17.25 9.9-9.9 3.75 3.75-9.9 9.9L3 21Z" />
                              <path d="m14.65 5.6 1.85-1.85a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8L18.45 9.4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => onDelete(item)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16" />
                              <path d="M9 7V4h6v3" />
                              <path d="M7 7l1 13h8l1-13" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={item.isAvailable ? "icon-btn warn" : "icon-btn success"}
                            title={item.isAvailable ? "Disable" : "Enable"}
                            aria-label={item.isAvailable ? "Disable" : "Enable"}
                            onClick={() => onToggle(item)}
                          >
                            {item.isAvailable ? (
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="7" y="6" width="3.5" height="12" rx="1" />
                                <rect x="13.5" y="6" width="3.5" height="12" rx="1" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8 5v14l11-7Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {groupedItems.length === 0 && (
              <p className="status">No products found for this category.</p>
            )}
          </section>
        )}

        {showForm && (
          <section className="manage-card">
            <h2>{editingId ? "Edit Product" : "New Product"}</h2>
            <form className="manage-form" onSubmit={onSubmit}>
              <label className="manage-label" htmlFor="item-name">
                Product Name
              </label>
              <input
                id="item-name"
                required
                placeholder="Caffe Mocha"
                value={itemForm.name}
                onChange={(e) => setItemForm((v) => ({ ...v, name: e.target.value }))}
              />

              <label className="manage-label" htmlFor="item-desc">
                Description
              </label>
              <textarea
                id="item-desc"
                placeholder="Deep foam, rich coffee flavor"
                value={itemForm.description}
                onChange={(e) => setItemForm((v) => ({ ...v, description: e.target.value }))}
              />

              <div className="split-row">
                <div>
                  <label className="manage-label" htmlFor="item-price">
                    Price
                  </label>
                  <input
                    id="item-price"
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((v) => ({ ...v, price: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="manage-label" htmlFor="item-sort">
                    Sort Order
                  </label>
                  <input
                    id="item-sort"
                    type="number"
                    value={itemForm.sortOrder}
                    onChange={(e) =>
                      setItemForm((v) => ({ ...v, sortOrder: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <label className="manage-label" htmlFor="item-category">
                Category
              </label>
              <select
                id="item-category"
                required
                value={itemForm.categoryId}
                onChange={(e) => setItemForm((v) => ({ ...v, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="manage-label">Product Image</label>
              <div className="image-actions">
                <button type="button" onClick={() => uploadInputRef.current?.click()}>
                  Upload
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()}>
                  Capture
                </button>
                <button
                  type="button"
                  disabled={!itemForm.imageUrl}
                  onClick={() => {
                    if (!itemForm.imageUrl) return;
                    setEditorSource(itemForm.imageUrl);
                    setEditorZoom(1);
                    setEditorRotate(0);
                    setEditorOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={!itemForm.imageUrl}
                  onClick={() => setItemForm((prev) => ({ ...prev, imageUrl: "" }))}
                >
                  Remove
                </button>
              </div>
              <input
                ref={uploadInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={onPickImage}
              />
              <input
                ref={cameraInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickImage}
              />

              {itemForm.imageUrl && (
                <div className="image-preview-wrap">
                  <img src={itemForm.imageUrl} alt="Product preview" className="image-preview" />
                </div>
              )}

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={itemForm.isAvailable}
                  onChange={(e) => setItemForm((v) => ({ ...v, isAvailable: e.target.checked }))}
                />
                <span>Product is available</span>
              </label>

              <div className="action-row">
                <button className="primary-btn" type="submit">
                  {editingId ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setItemForm(emptyForm);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {viewItem && (
          <section className="manage-card compact">
            <h2>Product Detail</h2>
            <div className="admin-detail-image" style={thumbStyle(viewItem.imageUrl)} />
            <p>
              <strong>Name:</strong> {viewItem.name}
            </p>
            <p>
              <strong>Category:</strong> {viewItem.category.name}
            </p>
            <p>
              <strong>Price:</strong> Rs {viewItem.price}
            </p>
            <p>
              <strong>Status:</strong> {viewItem.isAvailable ? "Available" : "Not Available"}
            </p>
            {viewItem.description && (
              <p>
                <strong>Description:</strong> {viewItem.description}
              </p>
            )}
            <button type="button" onClick={() => setViewItem(null)}>
              Close
            </button>
          </section>
        )}

        {editorOpen && (
          <div className="editor-modal">
            <div className="editor-card">
              <h2>Edit Image</h2>
              <div className="editor-preview">
                <img
                  src={editorSource}
                  alt="Edit preview"
                  style={{ transform: `scale(${editorZoom}) rotate(${editorRotate}deg)` }}
                />
              </div>

              <label className="manage-label">Zoom: {editorZoom.toFixed(1)}x</label>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.1}
                value={editorZoom}
                onChange={(e) => setEditorZoom(Number(e.target.value))}
              />

              <label className="manage-label">Rotate: {editorRotate}deg</label>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={editorRotate}
                onChange={(e) => setEditorRotate(Number(e.target.value))}
              />

              <label className="manage-label">
                Compression Quality: {Math.round(editorQuality * 100)}%
              </label>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.05}
                value={editorQuality}
                onChange={(e) => setEditorQuality(Number(e.target.value))}
              />

              <label className="manage-label">Output Size: {editorSize}px</label>
              <input
                type="range"
                min={480}
                max={1200}
                step={40}
                value={editorSize}
                onChange={(e) => setEditorSize(Number(e.target.value))}
              />

              <div className="action-row">
                <button className="primary-btn" type="button" onClick={onApplyEditor}>
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorOpen(false);
                    setEditorSource("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = src;
  });
}

async function createEditedImage({
  sourceDataUrl,
  zoom,
  rotate,
  quality,
  size
}: {
  sourceDataUrl: string;
  zoom: number;
  rotate: number;
  quality: number;
  size: number;
}): Promise<string> {
  const image = await loadImage(sourceDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.rotate((rotate * Math.PI) / 180);

  const coverScale = Math.max(size / image.width, size / image.height) * zoom;
  ctx.scale(coverScale, coverScale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return canvas.toDataURL("image/jpeg", quality);
}
