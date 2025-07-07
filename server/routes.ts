import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDownloadSchema, 
  adminLoginSchema, 
  adminRegisterEmailSchema,
  adminSetPasswordSchema,
  adminRegisterSchema, 
  verifyTwoFactorSchema 
} from "@shared/schema";
import { 
  hashPassword, 
  verifyAdminUser, 
  createTwoFactorToken, 
  verifyTwoFactorToken,
  cleanupExpiredTokens 
} from "./admin-auth";
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
  
  // Admin registration (step 1: email only)
  app.post("/api/admin/register", async (req, res) => {
    try {
      const validatedData = adminRegisterEmailSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getAdminUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create 2FA token for registration
      await createTwoFactorToken(validatedData.email, 'registration');
      
      // Store email temporarily in session for verification
      req.session.pendingRegistration = {
        email: validatedData.email
      };

      res.json({ 
        success: true, 
        message: 'Verification code sent to your email. Please check your email and enter the code.' 
      });
    } catch (error) {
      console.error('Error in admin registration:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  // Admin registration verification (step 2: verify 2FA, ask for password)
  app.post("/api/admin/verify-registration", async (req, res) => {
    try {
      const validatedData = verifyTwoFactorSchema.parse(req.body);
      
      if (!req.session.pendingRegistration) {
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

      // Mark as verified, ready for password setup
      req.session.pendingRegistration.verified = true;

      res.json({ 
        success: true, 
        message: 'Email verified. Please set your password.' 
      });
    } catch (error) {
      console.error('Error verifying registration:', error);
      res.status(400).json({ error: 'Verification failed' });
    }
  });

  // Admin registration (step 3: set password and complete registration)
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

  // Admin login (step 1: verify credentials)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      const user = await verifyAdminUser(validatedData.email, validatedData.password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Create 2FA token for login
      await createTwoFactorToken(validatedData.email, 'login');
      
      // Store user ID temporarily in session for verification
      req.session.pendingLogin = { userId: user.id, email: user.email };

      res.json({ 
        success: true, 
        message: 'Verification code sent to your email. Please check your email and enter the code.' 
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
  app.get("/api/admin/user", (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ 
      user: { id: req.session.adminUser.userId, email: req.session.adminUser.email }
    });
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    if (req.session.adminUser) {
      delete req.session.adminUser;
    }
    if (req.session.pendingLogin) {
      delete req.session.pendingLogin;
    }
    if (req.session.pendingRegistration) {
      delete req.session.pendingRegistration;
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Admin dashboard data (protected route)
  app.get("/api/admin/dashboard", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      // Get basic stats - you can expand this later
      const messages = await storage.getMessages();
      // TODO: Add download stats, user stats, etc.
      
      res.json({
        success: true,
        data: {
          messagesCount: messages.length,
          // downloadCount: downloads.length, // TODO: implement
          // Add more stats as needed
        }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
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
