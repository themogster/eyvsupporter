import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Middleware to check if user has admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.session.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Middleware to check if user is at least a regular user
export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Both 'user' and 'admin' roles can access user-level features
  if (!['user', 'admin'].includes(req.session.adminUser.role)) {
    return res.status(403).json({ error: 'User access required' });
  }
  
  next();
}