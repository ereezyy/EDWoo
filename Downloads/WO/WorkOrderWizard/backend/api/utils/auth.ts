import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

const prisma = new PrismaClient();

// Initialize Firebase Admin
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
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firebase_uid: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function authenticateRequest(req: VercelRequest): Promise<AuthResult> {
  // Skip authentication if Firebase is not initialized (development mode)
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized - using mock authentication');
    return {
      success: true,
      user: {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'admin',
        firebase_uid: 'dev-firebase-uid',
      }
    };
  }

  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return {
      success: false,
      error: 'Access token required'
    };
  }

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { firebase_uid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        role: true,
        firebase_uid: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firebase_uid: user.firebase_uid,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token'
    };
  }
}

export function requireRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}
