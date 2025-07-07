import { 
  users, downloads, messages, adminUsers, twoFactorTokens,
  type User, type InsertUser, type Download, type InsertDownload, 
  type Message, type AdminUser, type InsertAdminUser, 
  type TwoFactorToken, type InsertTwoFactorToken 
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and, gt } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  logDownload(download: InsertDownload): Promise<Download>;
  getMessages(): Promise<Message[]>;
  
  // Admin user methods
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserLastLogin(id: number): Promise<void>;
  
  // 2FA methods
  createTwoFactorToken(token: InsertTwoFactorToken): Promise<TwoFactorToken>;
  getTwoFactorToken(email: string, token: string, type: string): Promise<TwoFactorToken | undefined>;
  markTwoFactorTokenUsed(id: number): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async logDownload(insertDownload: InsertDownload): Promise<Download> {
    const [download] = await db
      .insert(downloads)
      .values(insertDownload)
      .returning();
    return download;
  }

  async getMessages(): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.isActive, true))
      .orderBy(asc(messages.sortOrder));
    return messageList;
  }

  // Admin user methods
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async createAdminUser(insertAdminUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db
      .insert(adminUsers)
      .values(insertAdminUser)
      .returning();
    return user;
  }

  async updateAdminUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  // 2FA methods
  async createTwoFactorToken(insertToken: InsertTwoFactorToken): Promise<TwoFactorToken> {
    const [token] = await db
      .insert(twoFactorTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async getTwoFactorToken(email: string, token: string, type: string): Promise<TwoFactorToken | undefined> {
    const [tokenRecord] = await db
      .select()
      .from(twoFactorTokens)
      .where(
        and(
          eq(twoFactorTokens.email, email),
          eq(twoFactorTokens.token, token),
          eq(twoFactorTokens.type, type),
          eq(twoFactorTokens.used, false),
          gt(twoFactorTokens.expiresAt, new Date())
        )
      );
    return tokenRecord || undefined;
  }

  async markTwoFactorTokenUsed(id: number): Promise<void> {
    await db
      .update(twoFactorTokens)
      .set({ used: true })
      .where(eq(twoFactorTokens.id, id));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(twoFactorTokens)
      .where(gt(new Date(), twoFactorTokens.expiresAt));
  }
}

export const storage = new DatabaseStorage();
