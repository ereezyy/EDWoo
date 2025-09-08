import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock authentication - in production you'd validate against a database
    if (email && password) {
      const mockUser = {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'admin',
        token: 'mock-jwt-token'
      };

      return Response.json({
        success: true,
        user: mockUser,
        token: mockUser.token
      });
    }

    return Response.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth API Error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Mock user info endpoint
  return Response.json({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin'
  });
}
