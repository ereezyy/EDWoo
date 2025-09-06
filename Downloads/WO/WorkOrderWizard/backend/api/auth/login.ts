import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { setCorsHeaders } from '../utils/auth';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    if (!firebaseInitialized) {
      // Development mode - create mock user
      const mockUser = {
        id: 'dev-user-id',
        name: 'Dev User',
        email: 'dev@example.com',
        role: 'admin'
      };
      return res.json({
        user: mockUser,
        token: idToken
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { firebase_uid: decodedToken.uid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown User',
          email: decodedToken.email!,
          role: 'worker', // Default role
          firebase_uid: decodedToken.uid
        }
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: idToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
