import { 
  users, downloads, messages, adminUsers, twoFactorTokens,
  type User, type InsertUser, type Download, type InsertDownload, 
  type Message, type InsertMessage, type AdminUser, type InsertAdminUser, 
  type TwoFactorToken, type InsertTwoFactorToken 
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and, gt, desc, gte, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  logDownload(download: InsertDownload): Promise<Download>;
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  
  // Download analytics
  getDownloads(): Promise<Download[]>;
  getDownloadsPaginated(page: number, limit: number): Promise<Download[]>;
  getDownloadsCount(): Promise<number>;
  getRecentDownloads(days: number): Promise<Download[]>;
  getTodayDownloads(): Promise<Download[]>;
  getAnalytics(): Promise<any>;
  
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

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateMessage(id: number, updateData: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set(updateData)
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getDownloads(): Promise<Download[]> {
    const downloadList = await db.select().from(downloads).orderBy(desc(downloads.createdAt));
    return downloadList;
  }

  async getDownloadsPaginated(page: number, limit: number): Promise<Download[]> {
    const offset = (page - 1) * limit;
    const downloadList = await db.select()
      .from(downloads)
      .orderBy(desc(downloads.createdAt))
      .limit(limit)
      .offset(offset);
    return downloadList;
  }

  async getDownloadsCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(downloads);
    return Number(result[0].count);
  }

  async getRecentDownloads(days: number): Promise<Download[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const downloadList = await db.select()
      .from(downloads)
      .where(gte(downloads.createdAt, dateThreshold))
      .orderBy(desc(downloads.createdAt));
    return downloadList;
  }

  async getTodayDownloads(): Promise<Download[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const downloadList = await db.select()
      .from(downloads)
      .where(gte(downloads.createdAt, today));
    return downloadList;
  }

  async getAnalytics(): Promise<any> {
    // Get downloads by message type
    const messageStats = await db.select({
      message: downloads.eyvMessage,
      count: sql`count(*)`
    })
    .from(downloads)
    .groupBy(downloads.eyvMessage);

    // Get downloads by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await db.select({
      date: sql`DATE(${downloads.createdAt})`,
      count: sql`count(*)`
    })
    .from(downloads)
    .where(gte(downloads.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${downloads.createdAt})`)
    .orderBy(sql`DATE(${downloads.createdAt})`);

    return {
      messageStats,
      dailyStats,
      totalDownloads: await this.getDownloadsCount(),
      recentDownloads: (await this.getRecentDownloads(7)).length,
      todayDownloads: (await this.getTodayDownloads()).length,
    };
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
