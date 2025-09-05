import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// Initialize Firebase Admin (optional for development)
let firebaseInitialized = false;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
  if (serviceAccount.project_id && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
  }
} catch (error) {
  console.warn('Firebase Admin not initialized:', error instanceof Error ? error.message : 'Unknown error');
  console.warn('Authentication middleware will be disabled');
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firebase_uid: string;
  };
}
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Skip authentication if Firebase is not initialized (development mode)
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized - using mock authentication');
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'admin',
      firebase_uid: 'dev-firebase-uid',
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Here you would typically fetch user from database using firebase_uid
    // For now, we'll mock this
    req.user = {
      id: 'user-id',
      email: decodedToken.email || '',
      role: 'worker', // This should come from your database
      firebase_uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
