'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkOrderTable } from '@/components/WorkOrderTable'
import { CreateWorkOrderModal } from '@/components/CreateWorkOrderModal'
import { Navbar } from '@/components/Navbar'
import axios from 'axios'

export function Dashboard() {
  const { userProfile } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: workOrders, isLoading, refetch } = useQuery({
    queryKey: ['workOrders', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/work-orders`, {
        params,
        headers: {
          Authorization: `Bearer ${await userProfile?.getIdToken()}`
        }
      })
      return response.data
    },
    enabled: !!userProfile
  })

  const { data: stats } = useQuery({
    queryKey: ['workOrderStats'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/work-orders`, {
        headers: {
          Authorization: `Bearer ${await userProfile?.getIdToken()}`
        }
      })
      const orders = response.data.work_orders || []
      return {
        total: orders.length,
        open: orders.filter((wo: any) => wo.status === 'open').length,
        inProgress: orders.filter((wo: any) => wo.status === 'in_progress').length,
        completed: orders.filter((wo: any) => wo.status === 'completed').length
      }
    },
    enabled: !!userProfile
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Work Order Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage and track YMCA maintenance work orders</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.open || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('open')}
              >
                Open
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
            </div>
            
            {userProfile?.role === 'admin' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create Work Order
              </Button>
            )}
          </div>

          {/* Work Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>
                {statusFilter === 'all' ? 'All work orders' : `${statusFilter.replace('_', ' ')} work orders`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkOrderTable 
                workOrders={workOrders?.work_orders || []} 
                isLoading={isLoading}
                onRefetch={refetch}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
