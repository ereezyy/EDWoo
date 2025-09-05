'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'
import axios from 'axios'

const updateWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  status: z.enum(['open', 'in_progress', 'completed']).optional(),
})

type UpdateWorkOrderForm = z.infer<typeof updateWorkOrderSchema>

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
}

interface UpdateWorkOrderModalProps {
  workOrder: WorkOrder
  onClose: () => void
  onSuccess: () => void
}

export function UpdateWorkOrderModal({ workOrder, onClose, onSuccess }: UpdateWorkOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const { userProfile } = useAuth()
  
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateWorkOrderForm>({
    resolver: zodResolver(updateWorkOrderSchema),
    defaultValues: {
      title: workOrder.title,
      description: workOrder.description,
      status: workOrder.status,
    }
  })

  const onSubmit = async (data: UpdateWorkOrderForm) => {
    setLoading(true)
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/work-orders/${workOrder.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${await userProfile?.getIdToken()}`
          }
        }
      )
      onSuccess()
    } catch (error) {
      console.error('Failed to update work order:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Update Work Order</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                {...register('title')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                {...register('status')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
