import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import sgMail from '@sendgrid/mail';
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
  
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const typeDisplayNames = {
    registration: 'Registration Verification',
    login: 'Login Verification',
    password_reset: 'Password Reset'
  };
  
  const msg = {
    to: email,
    from: 'noreply@i-love-eyv.com', // Use your verified sender domain
    subject: `EYV Admin ${typeDisplayNames[type as keyof typeof typeDisplayNames] || 'Verification'} Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #502185;">EYV Admin Verification</h2>
        <p>Your verification code for ${typeDisplayNames[type as keyof typeof typeDisplayNames] || 'verification'} is:</p>
        <div style="background: #f8f9fa; border: 2px solid #502185; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #502185; font-size: 32px; letter-spacing: 8px; margin: 0;">${token}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Early Years Voice Admin System</p>
      </div>
    `,
    text: `Your EYV Admin verification code is: ${token}. This code will expire in 10 minutes.`
  };
  
  try {
    await sgMail.send(msg);
    console.log(`[2FA] Email sent to ${email} for ${type}`);
  } catch (error) {
    console.error('SendGrid email error:', error);
    console.log(`FALLBACK: 2FA Token for ${email}: ${token}`);
    // For development: log the token to console when email fails
    // In production, this should be properly configured with verified domain
    
    // Don't throw error - allow the registration process to continue
    // The user can get the token from the server console logs
  }
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

  try {
    await sendTwoFactorEmail(email, token, type);
  } catch (error) {
    console.log(`2FA Token for ${email} (${type}): ${token}`);
    // Continue even if email fails until SendGrid domain is verified
  }
  
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