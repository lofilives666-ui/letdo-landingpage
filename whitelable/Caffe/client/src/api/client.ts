import type { Category, MenuItem } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4010";

type MenuResponse = {
  categories: Category[];
  items: MenuItem[];
};

function adminHeaders(adminKey: string) {
  return {
    "Content-Type": "application/json",
    "x-admin-key": adminKey
  };
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Invalid username or password");
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function fetchMenu(category?: string): Promise<MenuResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${API_URL}/api/menu${query}`);
  if (!res.ok) throw new Error("Failed to load menu");
  return res.json();
}

export async function fetchAdminCategories(adminKey: string): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/admin/categories`, {
    headers: adminHeaders(adminKey)
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function createCategory(
  adminKey: string,
  payload: Pick<Category, "name" | "slug" | "sortOrder" | "isActive">
) {
  const res = await fetch(`${API_URL}/api/admin/categories`, {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function updateCategory(
  adminKey: string,
  id: string,
  payload: Partial<Pick<Category, "name" | "slug" | "sortOrder" | "isActive">>
) {
  const res = await fetch(`${API_URL}/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

export async function fetchAdminItems(adminKey: string): Promise<MenuItem[]> {
  const res = await fetch(`${API_URL}/api/admin/items`, {
    headers: adminHeaders(adminKey)
  });
  if (!res.ok) throw new Error("Failed to load items");
  return res.json();
}

export type CreateItemPayload = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  sortOrder: number;
  isAvailable: boolean;
  isActive: boolean;
};

export async function createItem(adminKey: string, payload: CreateItemPayload) {
  const res = await fetch(`${API_URL}/api/admin/items`, {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create item");
  return res.json();
}

export async function updateItem(
  adminKey: string,
  id: string,
  payload: Partial<CreateItemPayload>
) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function toggleItemAvailability(adminKey: string, id: string, isAvailable: boolean) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}/toggle`, {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ isAvailable })
  });
  if (!res.ok) throw new Error("Failed to toggle item");
  return res.json();
}

export async function deleteItem(adminKey: string, id: string) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "DELETE",
    headers: adminHeaders(adminKey)
  });
  if (!res.ok) throw new Error("Failed to delete item");
}
