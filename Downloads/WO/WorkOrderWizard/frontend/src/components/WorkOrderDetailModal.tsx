'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, MessageSquare } from 'lucide-react'
import axios from 'axios'

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

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder
  onClose: () => void
}

export function WorkOrderDetailModal({ workOrder, onClose }: WorkOrderDetailModalProps) {
  const { userProfile } = useAuth()

  const { data: fullWorkOrder } = useQuery({
    queryKey: ['workOrder', workOrder.id],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/work-orders/${workOrder.id}`,
        {
          headers: {
            Authorization: `Bearer ${await userProfile?.getIdToken()}`
          }
        }
      )
      return response.data
    },
    enabled: !!userProfile
  })

  const sendNotification = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
        {
          work_order_id: workOrder.id,
          message: `Update on Work Order: ${workOrder.title}`
        },
        {
          headers: {
            Authorization: `Bearer ${await userProfile?.getIdToken()}`
          }
        }
      )
      alert('Notification sent successfully!')
    } catch (error) {
      alert('Failed to send notification')
    }
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Order Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p className="text-lg font-semibold">{workOrder.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                {getStatusBadge(workOrder.status)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="mt-1 text-gray-900">{workOrder.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Assigned To</label>
              <p className="mt-1">{workOrder.assigned_user?.name || 'Unassigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Created</label>
              <p className="mt-1">{new Date(workOrder.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {workOrder.shopify_order_id && (
            <div>
              <label className="text-sm font-medium text-gray-600">Shopify Order ID</label>
              <p className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {workOrder.shopify_order_id}
              </p>
            </div>
          )}

          {fullWorkOrder?.logs && fullWorkOrder.logs.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Activity Log</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {fullWorkOrder.logs.map((log: any) => (
                  <div key={log.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{log.action}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={sendNotification} className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
