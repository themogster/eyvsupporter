import { 
  downloads, messages, adminUsers, twoFactorTokens,
  type Download, type InsertDownload, 
  type Message, type InsertMessage, type AdminUser, type InsertAdminUser, 
  type TwoFactorToken, type InsertTwoFactorToken 
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and, gt, desc, gte, sql, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  logDownload(download: InsertDownload): Promise<Download>;
  getDownloadByUniqueId(uniqueId: string): Promise<Download | undefined>;
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
  deleteDownload(id: number): Promise<void>;
  
  // Admin user methods
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserLastLogin(id: number): Promise<void>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: number): Promise<void>;
  
  // 2FA methods
  createTwoFactorToken(token: InsertTwoFactorToken): Promise<TwoFactorToken>;
  getTwoFactorToken(email: string, token: string, type: string): Promise<TwoFactorToken | undefined>;
  markTwoFactorTokenUsed(id: number): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  
  // Analytics methods
  getTopMessages(): Promise<any[]>;
  getUsersCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async logDownload(insertDownload: InsertDownload): Promise<Download> {
    const uniqueId = nanoid(12); // Generate 12-character unique ID
    const [download] = await db
      .insert(downloads)
      .values({ ...insertDownload, uniqueId })
      .returning();
    return download;
  }

  async getDownloadByUniqueId(uniqueId: string): Promise<Download | undefined> {
    const [download] = await db
      .select()
      .from(downloads)
      .where(eq(downloads.uniqueId, uniqueId));
    return download || undefined;
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
    // Get downloads by message type with consolidation of empty/none values
    const messageStats = await db.select({
      message: sql<string>`CASE 
        WHEN ${downloads.eyvMessage} = 'none' OR ${downloads.eyvMessage} = '' OR ${downloads.eyvMessage} IS NULL 
        THEN 'No Text' 
        ELSE ${downloads.eyvMessage} 
      END`,
      count: sql`count(*)`
    })
    .from(downloads)
    .groupBy(sql`CASE 
      WHEN ${downloads.eyvMessage} = 'none' OR ${downloads.eyvMessage} = '' OR ${downloads.eyvMessage} IS NULL 
      THEN 'No Text' 
      ELSE ${downloads.eyvMessage} 
    END`);

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
      usersCount: await this.getUsersCount(),
    };
  }

  async deleteDownload(id: number): Promise<void> {
    await db.delete(downloads).where(eq(downloads.id, id));
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
      .values({
        ...insertAdminUser,
        role: insertAdminUser.role || 'user' // Default to user role
      })
      .returning();
    return user;
  }

  async updateAdminUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    const usersList = await db
      .select()
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));
    return usersList;
  }

  async updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [user] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await db
      .delete(adminUsers)
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

  async getTopMessages(): Promise<any[]> {
    const topMessages = await db
      .select({
        message: downloads.eyvMessage,
        count: sql<number>`COUNT(*)`
      })
      .from(downloads)
      .where(isNotNull(downloads.eyvMessage))
      .groupBy(downloads.eyvMessage)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    return topMessages.map(item => ({
      text: item.message,
      count: item.count
    }));
  }

  async getUsersCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(adminUsers);
    return result.count;
  }
}

export const storage = new DatabaseStorage();
