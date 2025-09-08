import { NextRequest } from 'next/server';

// Simple mock authentication for now - in production you'd use proper auth

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigned_user_id = searchParams.get('assigned_user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (status) where.status = status;
    if (assigned_user_id) where.assigned_user_id = assigned_user_id;

    const skip = (page - 1) * limit;

    // Mock data for now since we're focusing on deployment
    const mockWorkOrders = [
      {
        id: '1',
        title: 'Fix HVAC System',
        description: 'Repair central air conditioning unit',
        status: 'pending',
        priority: 'high',
        assigned_user_id: 'user1',
        assigned_user: { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'technician' },
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        logs: []
      },
      {
        id: '2',
        title: 'Repair Pool Equipment',
        description: 'Fix pool pump and filter system',
        status: 'in_progress',
        priority: 'medium',
        assigned_user_id: 'user2',
        assigned_user: { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'technician' },
        created_at: new Date('2024-01-14'),
        updated_at: new Date('2024-01-14'),
        logs: []
      }
    ];

    const filteredOrders = mockWorkOrders.filter(order => {
      if (status && order.status !== status) return false;
      if (assigned_user_id && order.assigned_user_id !== assigned_user_id) return false;
      return true;
    });

    const total = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(skip, skip + limit);

    return Response.json({
      work_orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mock creation for now
    const newWorkOrder = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      status: 'open',
      priority: body.priority || 'medium',
      assigned_user_id: body.assigned_user_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    return Response.json(newWorkOrder, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
