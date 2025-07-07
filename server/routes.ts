import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDownloadSchema,
  insertMessageSchema,
  adminLoginSchema, 
  adminRegisterEmailSchema,
  adminSetPasswordSchema,
  adminRegisterSchema, 
  verifyTwoFactorSchema,
  registerStepOneSchema,
  registerStepTwoSchema,
  registerStepThreeSchema
} from "@shared/schema";
import { 
  hashPassword, 
  verifyAdminUser, 
  createTwoFactorToken, 
  verifyTwoFactorToken,
  cleanupExpiredTokens 
} from "./admin-auth";
import { requireAuth, requireAdmin, requireUser } from "./auth-middleware";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {


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

  // Admin authentication routes
  
  // Registration Step 1: Email submission
  app.post("/api/register/step1", async (req, res) => {
    try {
      const validatedData = registerStepOneSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getAdminUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Generate and send 2FA token
      const token = await createTwoFactorToken(validatedData.email, 'registration');
      
      // Store email temporarily in session
      req.session.pendingRegistration = {
        email: validatedData.email,
        step: 1
      };

      res.json({ 
        success: true, 
        message: 'Verification code sent! Check your email or server console for the code.' 
      });
    } catch (error) {
      console.error('Registration Step 1 error:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  // Registration Step 2: Verify 2FA token
  app.post("/api/register/step2", async (req, res) => {
    try {
      const validatedData = registerStepTwoSchema.parse(req.body);
      
      if (!req.session.pendingRegistration || req.session.pendingRegistration.step !== 1) {
        return res.status(400).json({ error: 'No pending registration found' });
      }

      const isTokenValid = await verifyTwoFactorToken(
        validatedData.email, 
        validatedData.token, 
        'registration'
      );

      if (!isTokenValid) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      // Mark as verified, ready for password
      req.session.pendingRegistration = {
        email: validatedData.email,
        step: 2,
        verified: true
      };

      res.json({ 
        success: true, 
        message: 'Email verified! Please set your password.' 
      });
    } catch (error) {
      console.error('Registration Step 2 error:', error);
      res.status(400).json({ error: 'Verification failed' });
    }
  });

  // Registration Step 3: Set password and complete registration
  app.post("/api/register/step3", async (req, res) => {
    try {
      console.log('Registration Step 3 started:', { body: req.body });
      console.log('Session state:', { 
        hasPendingRegistration: !!req.session.pendingRegistration,
        step: req.session.pendingRegistration?.step,
        verified: req.session.pendingRegistration?.verified,
        email: req.session.pendingRegistration?.email
      });
      
      const validatedData = registerStepThreeSchema.parse(req.body);
      
      if (!req.session.pendingRegistration || 
          req.session.pendingRegistration.step !== 2 || 
          !req.session.pendingRegistration.verified) {
        console.log('Invalid registration state detected');
        return res.status(400).json({ error: 'Invalid registration state' });
      }

      if (req.session.pendingRegistration.email !== validatedData.email) {
        console.log('Email mismatch:', req.session.pendingRegistration.email, 'vs', validatedData.email);
        return res.status(400).json({ error: 'Email mismatch' });
      }

      // Create the user with 'user' role by default
      console.log('Creating user with email:', validatedData.email);
      const hashedPassword = await hashPassword(validatedData.password);
      const adminUser = await storage.createAdminUser({
        email: validatedData.email,
        password: hashedPassword,
        role: 'user'
      });
      console.log('User created successfully:', adminUser.id);

      // Clear pending registration and log the user in
      delete req.session.pendingRegistration;
      req.session.adminUser = { 
        id: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      };
      
      console.log('Updating last login for user:', adminUser.id);
      await storage.updateAdminUserLastLogin(adminUser.id);
      console.log('Registration Step 3 completed successfully');

      res.json({ 
        success: true, 
        user: { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        message: 'Registration completed! You are now logged in.' 
      });
    } catch (error) {
      console.error('Registration Step 3 error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Registration completion failed: ' + (error.message || 'Unknown error') });
    }
  });

  // Admin registration (step 3: set password and complete registration) - LEGACY
  app.post("/api/admin/set-password", async (req, res) => {
    try {
      const validatedData = adminSetPasswordSchema.parse(req.body);
      
      if (!req.session.pendingRegistration || !req.session.pendingRegistration.verified) {
        return res.status(400).json({ error: 'No verified registration found' });
      }

      if (req.session.pendingRegistration.email !== validatedData.email) {
        return res.status(400).json({ error: 'Email mismatch' });
      }

      // Create the admin user
      const hashedPassword = await hashPassword(validatedData.password);
      const adminUser = await storage.createAdminUser({
        email: validatedData.email,
        password: hashedPassword
      });

      // Clear pending registration
      delete req.session.pendingRegistration;

      // Log the user in
      req.session.adminUser = { id: adminUser.id, email: adminUser.email };
      await storage.updateAdminUserLastLogin(adminUser.id);

      res.json({ 
        success: true, 
        user: { id: adminUser.id, email: adminUser.email },
        message: 'Registration completed successfully' 
      });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(400).json({ error: 'Password setup failed' });
    }
  });

  // Admin login - direct login without 2FA
  app.post("/api/admin/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      const user = await verifyAdminUser(validatedData.email, validatedData.password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login timestamp
      await storage.updateAdminUserLastLogin(user.id);
      
      // Log user in directly - no 2FA required for login
      req.session.adminUser = { id: user.id, email: user.email };

      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email },
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('Error in admin login:', error);
      res.status(400).json({ error: 'Login failed' });
    }
  });

  // Admin login verification (step 2: verify 2FA and complete login)
  app.post("/api/admin/verify-login", async (req, res) => {
    try {
      const validatedData = verifyTwoFactorSchema.parse(req.body);
      
      if (!req.session.pendingLogin) {
        return res.status(400).json({ error: 'No pending login found' });
      }

      const isTokenValid = await verifyTwoFactorToken(
        validatedData.email, 
        validatedData.token, 
        'login'
      );

      if (!isTokenValid) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      // Complete the login
      req.session.adminUser = req.session.pendingLogin;
      delete req.session.pendingLogin;
      
      await storage.updateAdminUserLastLogin(req.session.adminUser.userId);

      res.json({ 
        success: true, 
        user: { id: req.session.adminUser.userId, email: req.session.adminUser.email },
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('Error verifying login:', error);
      res.status(400).json({ error: 'Verification failed' });
    }
  });

  // Get current admin user
  app.get("/api/admin/user", requireAuth, (req, res) => {
    res.json(req.session.adminUser);
  });

  // Admin logout
  app.post("/api/admin/logout", requireAuth, (req, res) => {
    delete req.session.adminUser;
    if (req.session.pendingLogin) {
      delete req.session.pendingLogin;
    }
    if (req.session.pendingRegistration) {
      delete req.session.pendingRegistration;
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Admin dashboard data (protected route - admin role required)
  app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      const downloads = await storage.getDownloads();
      const recentDownloads = await storage.getRecentDownloads(7); // Last 7 days
      const todayDownloads = await storage.getTodayDownloads();
      const topMessages = await storage.getTopMessages();
      
      res.json({
        success: true,
        data: {
          messagesCount: messages.length,
          totalDownloads: downloads.length,
          recentDownloads: recentDownloads.slice(0, 10),
          todayDownloads: todayDownloads.length,
          weekDownloads: recentDownloads.length,
          messages,
          topMessages,
        }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  });

  // Admin message management
  app.get("/api/admin/messages", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const messages = await storage.getMessages();
      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  app.post("/api/admin/messages", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json({ success: true, data: message });
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ error: 'Failed to create message' });
    }
  });

  app.put("/api/admin/messages/:id", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const id = parseInt(req.params.id);
      const messageData = insertMessageSchema.partial().parse(req.body);
      const message = await storage.updateMessage(id, messageData);
      res.json({ success: true, data: message });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(400).json({ error: 'Failed to update message' });
    }
  });

  app.delete("/api/admin/messages/:id", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(400).json({ error: 'Failed to delete message' });
    }
  });

  // Admin download analytics
  app.get("/api/admin/downloads", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const downloads = await storage.getDownloadsPaginated(page, limit);
      const total = await storage.getDownloadsCount();
      
      res.json({ 
        success: true, 
        data: downloads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting downloads:', error);
      res.status(500).json({ error: 'Failed to get downloads' });
    }
  });

  // Admin analytics
  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const analytics = await storage.getAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  });

  // Cleanup expired tokens periodically
  setInterval(async () => {
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  const httpServer = createServer(app);

  return httpServer;
}
