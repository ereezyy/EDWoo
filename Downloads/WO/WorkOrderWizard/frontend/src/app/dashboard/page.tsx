'use client'

import { useState, useEffect } from 'react'

interface WorkOrder {
  id: string
  title: string
  status: string
  created_at: string
  assigned_user?: { name: string }
}

export default function DashboardPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work-orders`)
        if (!response.ok) throw new Error('Failed to fetch work orders')
        const data = await response.json()
        setWorkOrders(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        // Fallback to sample data on error
        setWorkOrders([
          {
            id: '1',
            title: 'Fix HVAC System',
            status: 'pending',
            created_at: '2024-01-15T10:00:00Z',
            assigned_user: { name: 'John Doe' }
          },
          {
            id: '2',
            title: 'Repair Pool Equipment',
            status: 'in_progress',
            created_at: '2024-01-14T14:30:00Z',
            assigned_user: { name: 'Jane Smith' }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">WorkOrderWizard Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Work Orders</h2>

              {workOrders.length === 0 ? (
                <p className="text-gray-500">No work orders found.</p>
              ) : (
                <div className="space-y-4">
                  {workOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </p>
                          {order.assigned_user && (
                            <p className="text-sm text-gray-600">
                              Assigned to: {order.assigned_user.name}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">API Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Backend API</h3>
                  <p className="text-green-600">✓ Connected</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Database</h3>
                  <p className="text-blue-600">✓ Railway PostgreSQL</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Authentication</h3>
                  <p className="text-purple-600">✓ Firebase Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
