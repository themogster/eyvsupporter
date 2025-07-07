import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  profileImage: text("profile_image").notNull(),
  ipAddress: text("ip_address").notNull(),
  eyvMessage: text("eyv_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  displayText: text("display_text").notNull(),
  messageText: text("message_text").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), // "user" or "admin"
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const twoFactorTokens = pgTable("two_factor_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  type: text("type").notNull(), // 'registration', 'password_reset', 'login'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).pick({
  profileImage: true,
  ipAddress: true,
  eyvMessage: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  key: true,
  displayText: true,
  messageText: true,
  isActive: true,
  sortOrder: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  email: true,
  password: true,
  role: true,
});

export const insertTwoFactorTokenSchema = createInsertSchema(twoFactorTokens).pick({
  email: true,
  token: true,
  type: true,
  expiresAt: true,
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminRegisterEmailSchema = z.object({
  email: z.string().email(),
});

export const adminSetPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// New schema for step-by-step registration
export const registerStepOneSchema = z.object({
  email: z.string().email(),
});

export const registerStepTwoSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
});

export const registerStepThreeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyTwoFactorSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
  type: z.enum(['registration', 'password_reset', 'login']),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertTwoFactorToken = z.infer<typeof insertTwoFactorTokenSchema>;
export type TwoFactorToken = typeof twoFactorTokens.$inferSelect;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type AdminRegisterEmail = z.infer<typeof adminRegisterEmailSchema>;
export type AdminSetPassword = z.infer<typeof adminSetPasswordSchema>;
export type AdminRegister = z.infer<typeof adminRegisterSchema>;
export type VerifyTwoFactor = z.infer<typeof verifyTwoFactorSchema>;
export type RegisterStepOne = z.infer<typeof registerStepOneSchema>;
export type RegisterStepTwo = z.infer<typeof registerStepTwoSchema>;
export type RegisterStepThree = z.infer<typeof registerStepThreeSchema>;
