import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDownloadSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get Facebook App ID for frontend
  app.get("/api/config", async (req, res) => {
    res.json({
      facebookAppId: process.env.FACEBOOK_APP_ID || null
    });
  });

  // Get messages for dropdown
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  // Log profile picture download
  app.post("/api/downloads", async (req, res) => {
    try {
      // Extract real client IP from proxy headers (for deployed environments)
      const ipAddress = req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 
                       req.headers['x-client-ip'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       req.ip || 
                       'unknown';
      
      // If x-forwarded-for contains multiple IPs, take the first one (original client)
      const clientIp = typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : ipAddress;
      const downloadData = { 
        ...req.body, 
        ipAddress: clientIp 
      };
      
      const validatedData = insertDownloadSchema.parse(downloadData);
      const download = await storage.logDownload(validatedData);
      
      res.json({ success: true, id: download.id });
    } catch (error) {
      console.error('Error logging download:', error);
      res.status(400).json({ error: 'Failed to log download' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
