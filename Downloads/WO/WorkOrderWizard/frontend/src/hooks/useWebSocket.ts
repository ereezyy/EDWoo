'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  token?: string
  autoConnect?: boolean
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!autoConnect || !token) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    })

    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
    })

    socket.on('work-order-updated', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'info',
        title: 'Work Order Updated',
        message: `Work order ${data.workOrderId} has been updated`,
        timestamp: data.timestamp
      }
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    })

    socket.on('admin-notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    })

    socket.on('worker-notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50))
    })

    return () => {
      socket.disconnect()
    }
  }, [token, autoConnect])

  const joinWorkOrder = (workOrderId: string) => {
    socketRef.current?.emit('join-work-order', workOrderId)
  }

  const leaveWorkOrder = (workOrderId: string) => {
    socketRef.current?.emit('leave-work-order', workOrderId)
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return {
    isConnected,
    notifications,
    joinWorkOrder,
    leaveWorkOrder,
    clearNotifications,
    removeNotification
  }
}
