'use client'

import { useState, useEffect } from 'react'
import AdvancedFilters from '@/components/AdvancedFilters'
import EquipmentScheduler from '@/components/EquipmentScheduler'
import FileUpload from '@/components/FileUpload'
// Temporarily disabled WebSocket features for deployment
// import NotificationCenter from '@/components/NotificationCenter'
// import { useWebSocket } from '@/hooks/useWebSocket'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({})
  const [activeTab, setActiveTab] = useState<'work-orders' | 'equipment'>('work-orders')
  
  // Temporarily disabled WebSocket features for deployment
  // const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') || '' : ''
  // const { isConnected, notifications, joinWorkOrder } = useWebSocket({ token: userToken })

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
            status: 'open',
            created_at: '2024-01-15',
            assigned_user: { name: 'John Worker' }
          },
          {
            id: '2', 
            title: 'Electrical Maintenance',
            status: 'in_progress',
            created_at: '2024-01-14',
            assigned_user: { name: 'Jane Smith' }
          },
          {
            id: '3',
            title: 'Plumbing Repair', 
            status: 'completed',
            created_at: '2024-01-13',
            assigned_user: { name: 'John Worker' }
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchWorkOrders()
  }, [])

  // Temporarily disabled WebSocket features for deployment
  // useEffect(() => {
  //   if (isConnected) {
  //     workOrders.forEach(order => {
  //       joinWorkOrder(order.id)
  //     })
  //   }
  // }, [isConnected, workOrders, joinWorkOrder])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    // Apply filtering logic here based on newFilters
  }

  const openCount = workOrders.filter(order => order.status === 'open').length
  const inProgressCount = workOrders.filter(order => order.status === 'in_progress').length
  const completedCount = workOrders.filter(order => order.status === 'completed').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">WorkOrderWizard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">admin</span>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Work Order Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage and track YMCA maintenance work orders</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('work-orders')}
                className={`${
                  activeTab === 'work-orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Work Orders
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Equipment Maintenance
              </button>
            </nav>
          </div>

          {/* Work Orders Tab */}
          {activeTab === 'work-orders' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Open</h2>
                  <div className="text-3xl font-bold text-red-600">{openCount}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">In Progress</h2>
                  <div className="text-3xl font-bold text-yellow-600">{inProgressCount}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Completed</h2>
                  <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Work Orders</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Work Order
                </button>
              </div>

              {/* Filters */}
              <AdvancedFilters onFiltersChange={handleFiltersChange} workOrders={workOrders} />

              {/* Work Orders Table */}
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Work Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading work orders...</div>
                  ) : error ? (
                    <div className="p-6 text-center text-red-600">Error: {error}</div>
                  ) : workOrders.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No work orders found.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.assigned_user?.name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Equipment Maintenance Tab */}
          {activeTab === 'equipment' && (
            <EquipmentScheduler />
          )}
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Work Order</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              setShowCreateModal(false)
              alert('Work order created successfully!')
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select aria-label="Category" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="hvac">HVAC</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="equipment">Equipment</option>
                    <option value="facility">Facility</option>
                    <option value="safety">Safety</option>
                    <option value="pool">Pool</option>
                    <option value="gym">Gym</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select aria-label="Priority" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select aria-label="Location" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="main-gym">Main Gym</option>
                    <option value="pool-area">Pool Area</option>
                    <option value="locker-rooms">Locker Rooms</option>
                    <option value="fitness-center">Fitness Center</option>
                    <option value="lobby">Lobby</option>
                    <option value="office">Office</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="exterior">Exterior</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed description of the issue"
                  rows={3}
                ></textarea>
              </div>

              <div className="mb-4 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter estimated hours to complete"
                />
              </div>

              <div className="mb-6 md:col-span-2">
                <FileUpload onFileSelect={() => {}} />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
