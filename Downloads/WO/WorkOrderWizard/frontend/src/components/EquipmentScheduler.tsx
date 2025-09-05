'use client'

import { useState, useEffect } from 'react'

interface MaintenanceSchedule {
  id: string
  equipmentName: string
  equipmentType: string
  location: string
  maintenanceType: 'preventive' | 'inspection' | 'calibration' | 'cleaning'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  lastMaintenance: string
  nextDue: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high'
  status: 'scheduled' | 'overdue' | 'completed'
}

export default function EquipmentScheduler() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([
    {
      id: '1',
      equipmentName: 'Pool Filtration System',
      equipmentType: 'HVAC/Pool',
      location: 'pool-area',
      maintenanceType: 'inspection',
      frequency: 'weekly',
      lastMaintenance: '2024-01-08',
      nextDue: '2024-01-15',
      assignedTo: 'John Worker',
      priority: 'high',
      status: 'overdue'
    },
    {
      id: '2',
      equipmentName: 'Gym Treadmill #3',
      equipmentType: 'Fitness Equipment',
      location: 'fitness-center',
      maintenanceType: 'preventive',
      frequency: 'monthly',
      lastMaintenance: '2023-12-15',
      nextDue: '2024-01-15',
      assignedTo: 'Jane Smith',
      priority: 'medium',
      status: 'scheduled'
    },
    {
      id: '3',
      equipmentName: 'Fire Safety System',
      equipmentType: 'Safety',
      location: 'main-gym',
      maintenanceType: 'inspection',
      frequency: 'quarterly',
      lastMaintenance: '2023-10-01',
      nextDue: '2024-01-01',
      assignedTo: 'Safety Inspector',
      priority: 'high',
      status: 'overdue'
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const createWorkOrder = (schedule: MaintenanceSchedule) => {
    // This would integrate with the work order system
    alert(`Creating work order for ${schedule.equipmentName} maintenance`)
  }

  const markCompleted = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, status: 'completed' as const, lastMaintenance: new Date().toISOString().split('T')[0] }
        : schedule
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipment Maintenance Schedule</h2>
          <p className="text-gray-600">Manage preventive maintenance for YMCA equipment</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Equipment Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Equipment</h3>
          <div className="text-2xl font-bold text-gray-900">{schedules.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
          <div className="text-2xl font-bold text-red-600">
            {schedules.filter(s => s.status === 'overdue').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Due This Week</h3>
          <div className="text-2xl font-bold text-yellow-600">
            {schedules.filter(s => {
              const dueDate = new Date(s.nextDue)
              const weekFromNow = new Date()
              weekFromNow.setDate(weekFromNow.getDate() + 7)
              return dueDate <= weekFromNow && s.status !== 'completed'
            }).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Completed This Month</h3>
          <div className="text-2xl font-bold text-green-600">
            {schedules.filter(s => s.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Equipment Schedule Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{schedule.equipmentName}</div>
                      <div className="text-sm text-gray-500">
                        {schedule.maintenanceType} • {schedule.frequency}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.equipmentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.location.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(schedule.nextDue).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(schedule.priority)}`}>
                      {schedule.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => createWorkOrder(schedule)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Create Work Order
                    </button>
                    {schedule.status !== 'completed' && (
                      <button
                        onClick={() => markCompleted(schedule.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add Equipment Maintenance Schedule</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              setShowCreateModal(false)
              alert('Equipment schedule created successfully!')
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="equipment-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Name *
                  </label>
                  <input
                    id="equipment-name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter equipment name"
                  />
                </div>
                <div>
                  <label htmlFor="equipment-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Type
                  </label>
                  <select id="equipment-type" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="hvac">HVAC/Pool</option>
                    <option value="fitness">Fitness Equipment</option>
                    <option value="safety">Safety Equipment</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="facility">Facility Infrastructure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="maintenance-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Type
                  </label>
                  <select id="maintenance-type" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="preventive">Preventive</option>
                    <option value="inspection">Inspection</option>
                    <option value="calibration">Calibration</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select id="frequency" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select id="priority" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
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
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
