'use client'

import { useState } from 'react'

interface FilterOptions {
  status: string[]
  category: string[]
  priority: string[]
  location: string[]
  assignedUser: string[]
  dateRange: {
    start: string
    end: string
  }
  searchTerm: string
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  workOrders: any[]
}

export default function AdvancedFilters({ onFiltersChange, workOrders }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    category: [],
    priority: [],
    location: [],
    assignedUser: [],
    dateRange: { start: '', end: '' },
    searchTerm: ''
  })

  const statusOptions = ['open', 'in_progress', 'completed', 'cancelled']
  const categoryOptions = ['hvac', 'plumbing', 'electrical', 'equipment', 'facility', 'safety', 'pool', 'gym']
  const priorityOptions = ['low', 'medium', 'high', 'urgent']
  const locationOptions = ['main-gym', 'pool-area', 'locker-rooms', 'fitness-center', 'lobby', 'office', 'kitchen', 'exterior']

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMultiSelectChange = (filterType: keyof FilterOptions, value: string) => {
    const currentValues = filters[filterType] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    handleFilterChange(filterType, newValues)
  }

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      status: [],
      category: [],
      priority: [],
      location: [],
      assignedUser: [],
      dateRange: { start: '', end: '' },
      searchTerm: ''
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length
      if (typeof value === 'object' && value.start && value.end) return count + 1
      if (typeof value === 'string' && value) return count + 1
      return count
    }, 0)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search work orders..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
        
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {statusOptions.map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleMultiSelectChange('status', status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2">
                {categoryOptions.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => handleMultiSelectChange('category', category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {category === 'hvac' ? 'HVAC' : category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="space-y-2">
                {priorityOptions.map(priority => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleMultiSelectChange('priority', priority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="space-y-2">
                {locationOptions.map(location => (
                  <label key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.location.includes(location)}
                      onChange={() => handleMultiSelectChange('location', location)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {location.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Date Range Filter */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="date-start" className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  id="date-start"
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="date-end" className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  id="date-end"
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
