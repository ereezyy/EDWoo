import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock users data
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'technician',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'technician',
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-02')
      },
      {
        id: '3',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    ];

    return Response.json({
      users: mockUsers,
      total: mockUsers.length
    });
  } catch (error) {
    console.error('Users API Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mock user creation
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'technician',
      created_at: new Date(),
      updated_at: new Date()
    };

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Users API Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
