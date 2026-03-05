import type { Category, MenuItem } from "../types";

const LOCAL_DEFAULT_API = "http://localhost:4010";
let cachedApiUrl: string | null = null;

function trimSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function joinApi(base: string, path: string) {
  return `${trimSlash(base)}${path}`;
}

async function resolveApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;

  const envApi = import.meta.env.VITE_API_URL?.trim();
  if (envApi) {
    cachedApiUrl = trimSlash(envApi);
    return cachedApiUrl;
  }

  try {
    const configRes = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-store" });
    if (configRes.ok) {
      const config = (await configRes.json()) as { apiUrl?: string };
      if (config.apiUrl?.trim()) {
        cachedApiUrl = trimSlash(config.apiUrl.trim());
        return cachedApiUrl;
      }
    }
  } catch {
    // Ignore config fetch errors and continue to fallback chain.
  }

  const queryApi = new URLSearchParams(window.location.search).get("api")?.trim();
  if (queryApi) {
    cachedApiUrl = trimSlash(queryApi);
    localStorage.setItem("canteen_api_url", cachedApiUrl);
    return cachedApiUrl;
  }

  const storedApi = localStorage.getItem("canteen_api_url")?.trim();
  if (storedApi) {
    cachedApiUrl = trimSlash(storedApi);
    return cachedApiUrl;
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    cachedApiUrl = LOCAL_DEFAULT_API;
    return cachedApiUrl;
  }

  // Live default: call same-origin backend if reverse proxy is configured.
  cachedApiUrl = trimSlash(window.location.origin);
  return cachedApiUrl;
}

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
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, "/api/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Invalid username or password");
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function fetchMenu(category?: string): Promise<MenuResponse> {
  const api = await resolveApiUrl();
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(joinApi(api, `/api/menu${query}`));
  if (!res.ok) throw new Error("Failed to load menu");
  return res.json();
}

export async function fetchAdminCategories(adminKey: string): Promise<Category[]> {
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, "/api/admin/categories"), {
    headers: adminHeaders(adminKey)
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function createCategory(
  adminKey: string,
  payload: Pick<Category, "name" | "slug" | "sortOrder" | "isActive">
) {
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, "/api/admin/categories"), {
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
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, `/api/admin/categories/${id}`), {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

export async function fetchAdminItems(adminKey: string): Promise<MenuItem[]> {
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, "/api/admin/items"), {
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
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, "/api/admin/items"), {
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
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, `/api/admin/items/${id}`), {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function toggleItemAvailability(adminKey: string, id: string, isAvailable: boolean) {
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, `/api/admin/items/${id}/toggle`), {
    method: "PATCH",
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ isAvailable })
  });
  if (!res.ok) throw new Error("Failed to toggle item");
  return res.json();
}

export async function deleteItem(adminKey: string, id: string) {
  const api = await resolveApiUrl();
  const res = await fetch(joinApi(api, `/api/admin/items/${id}`), {
    method: "DELETE",
    headers: adminHeaders(adminKey)
  });
  if (!res.ok) throw new Error("Failed to delete item");
}
