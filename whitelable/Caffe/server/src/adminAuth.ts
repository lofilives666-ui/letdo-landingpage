import type { NextFunction, Request, Response } from "express";

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "Nikkis";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "Nikkis@1234";
}

export function getAdminToken() {
  return process.env.ADMIN_KEY || "nikkis-admin-token";
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-admin-key");
  const bearer = req.header("authorization")?.replace("Bearer ", "");
  const token = key || bearer;

  if (!token || token !== getAdminToken()) {
    return res.status(401).json({ message: "Unauthorized admin access" });
  }
  next();
}
