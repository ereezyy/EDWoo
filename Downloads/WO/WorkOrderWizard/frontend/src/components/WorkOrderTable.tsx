'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, MessageSquare } from 'lucide-react'
import { WorkOrderDetailModal } from '@/components/WorkOrderDetailModal'
import { UpdateWorkOrderModal } from '@/components/UpdateWorkOrderModal'

interface WorkOrder {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed'
  created_at: string
  assigned_user?: {
    name: string
    email: string
  }
  shopify_order_id?: string
}

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  isLoading: boolean
  onRefetch: () => void
}

export function WorkOrderTable({ workOrders, isLoading, onRefetch }: WorkOrderTableProps) {
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      completed: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const handleViewDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setShowDetailModal(true)
  }

  const handleEdit = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder)
    setShowUpdateModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No work orders found.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workOrders.map((workOrder) => (
              <tr key={workOrder.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{workOrder.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {workOrder.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(workOrder.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {workOrder.assigned_user?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(workOrder.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(workOrder)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(workOrder)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedWorkOrder && (
        <WorkOrderDetailModal
          workOrder={selectedWorkOrder}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedWorkOrder(null)
          }}
        />
      )}

      {showUpdateModal && selectedWorkOrder && (
        <UpdateWorkOrderModal
          workOrder={selectedWorkOrder}
          onClose={() => {
            setShowUpdateModal(false)
            setSelectedWorkOrder(null)
          }}
          onSuccess={() => {
            setShowUpdateModal(false)
            setSelectedWorkOrder(null)
            onRefetch()
          }}
        />
      )}
    </>
  )
}
