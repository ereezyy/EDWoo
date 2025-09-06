import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, setCorsHeaders } from '../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            work_orders: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
