import { Router } from "express";
import { z } from "zod";
import { prisma } from "./db.js";
import {
  getAdminPassword,
  getAdminToken,
  getAdminUsername,
  requireAdmin
} from "./adminAuth.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/api/menu", async (req, res) => {
  const categorySlug = (req.query.category as string | undefined)?.trim();

  const where = {
    isActive: true,
    isAvailable: true,
    category: {
      isActive: true,
      ...(categorySlug ? { slug: categorySlug } : {})
    }
  };

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  const items = await prisma.menuItem.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { category: true }
  });

  res.json({
    categories,
    items: items.map((item) => ({
      ...item,
      price: item.price.toString()
    }))
  });
});

router.post("/api/admin/login", async (req, res) => {
  const parsed = z
    .object({
      username: z.string().min(1),
      password: z.string().min(1)
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const { username, password } = parsed.data;
  if (username !== getAdminUsername() || password !== getAdminPassword()) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  return res.json({ token: getAdminToken() });
});

router.get("/api/admin/categories", requireAdmin, async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  res.json(categories);
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "slug must use lowercase letters, numbers, hyphens"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

router.post("/api/admin/categories", requireAdmin, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const category = await prisma.category.create({ data: parsed.data });
  res.status(201).json(category);
});

router.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const schema = categorySchema.partial();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data
  });
  res.json(category);
});

router.get("/api/admin/items", requireAdmin, async (_req, res) => {
  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  res.json(
    items.map((item) => ({
      ...item,
      price: item.price.toString()
    }))
  );
});

const imageInputSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^https?:\/\//.test(value) ||
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value),
    "imageUrl must be a valid http(s) URL or data image"
  );

const itemSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(300).optional(),
  price: z.coerce.number().nonnegative(),
  imageUrl: imageInputSchema.optional(),
  categoryId: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

router.post("/api/admin/items", requireAdmin, async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }
  const { price, imageUrl, ...rest } = parsed.data;

  const item = await prisma.menuItem.create({
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      price: price.toFixed(2)
    },
    include: { category: true }
  });

  res.status(201).json({ ...item, price: item.price.toString() });
});

router.patch("/api/admin/items/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const payload = { ...parsed.data } as Record<string, unknown>;
  if (typeof parsed.data.price === "number") {
    payload.price = parsed.data.price.toFixed(2);
  }
  if ("imageUrl" in parsed.data) {
    payload.imageUrl = parsed.data.imageUrl || null;
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: payload,
    include: { category: true }
  });

  res.json({ ...item, price: item.price.toString() });
});

router.patch("/api/admin/items/:id/toggle", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = z.object({ isAvailable: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: parsed.data.isAvailable },
    include: { category: true }
  });

  res.json({ ...item, price: item.price.toString() });
});

router.delete("/api/admin/items/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  await prisma.menuItem.delete({
    where: { id }
  });
  res.status(204).send();
});

export default router;
