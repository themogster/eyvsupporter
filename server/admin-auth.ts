import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { AdminUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateTwoFactorToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendTwoFactorEmail(email: string, token: string, type: string): Promise<void> {
  // For now, just log the token to console for development
  // In production, this would integrate with an email service like SendGrid or AWS SES
  console.log(`[2FA] ${type.toUpperCase()} token for ${email}: ${token}`);
  
  // In a real implementation, you would send an email here:
  // await emailService.send({
  //   to: email,
  //   subject: `Your EYV Admin ${type} verification code`,
  //   text: `Your verification code is: ${token}\n\nThis code will expire in 10 minutes.`,
  // });
}

export async function verifyAdminUser(email: string, password: string): Promise<AdminUser | null> {
  const user = await storage.getAdminUserByEmail(email);
  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await comparePasswords(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  return user;
}

export async function createTwoFactorToken(email: string, type: 'registration' | 'password_reset' | 'login'): Promise<string> {
  const token = generateTwoFactorToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await storage.createTwoFactorToken({
    email,
    token,
    type,
    expiresAt,
  });

  await sendTwoFactorEmail(email, token, type);
  return token;
}

export async function verifyTwoFactorToken(email: string, token: string, type: string): Promise<boolean> {
  const tokenRecord = await storage.getTwoFactorToken(email, token, type);
  if (!tokenRecord) {
    return false;
  }

  await storage.markTwoFactorTokenUsed(tokenRecord.id);
  return true;
}

// Cleanup expired tokens periodically
export async function cleanupExpiredTokens(): Promise<void> {
  await storage.cleanupExpiredTokens();
}