import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login - Firebase Auth login
router.post('/login', async (req, res: Response) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
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
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebase_uid: req.user!.firebase_uid },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
