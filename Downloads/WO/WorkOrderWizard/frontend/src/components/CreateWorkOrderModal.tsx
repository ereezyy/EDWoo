'use client'

import { useState } from 'react'

interface CreateWorkOrderModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateWorkOrderModal({ onClose, onSuccess }: CreateWorkOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [shopifyOrderId, setShopifyOrderId] = useState('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Simple validation
    const newErrors: {[key: string]: string} = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) newErrors.description = 'Description is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Creating work order:', { title, description, shopifyOrderId })
      onSuccess()
    } catch (error) {
      console.error('Failed to create work order:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Create Work Order</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter work order title"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the work to be done"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Shopify Order ID (Optional)</label>
              <input
                type="text"
                value={shopifyOrderId}
                onChange={(e) => setShopifyOrderId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Shopify order ID if applicable"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
