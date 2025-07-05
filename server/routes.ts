import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDownloadSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Log profile picture download
  app.post("/api/downloads", async (req, res) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const downloadData = { 
        ...req.body, 
        ipAddress 
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
