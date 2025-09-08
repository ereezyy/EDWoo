import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

export class WebSocketService {
  private io: SocketIOServer

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.io.use((socket: any, next) => {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error'))
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        socket.userId = decoded.uid
        socket.userRole = decoded.role
        next()
      } catch (err) {
        next(new Error('Authentication error'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket & { userId?: string; userRole?: string }) => {
      console.log('User connected:', socket.userId)

      // Join user-specific rooms
      if (socket.userRole) socket.join(`role:${socket.userRole}`)
      if (socket.userId) socket.join(`user:${socket.userId}`)

      socket.on('join-work-order', (workOrderId: string) => {
        socket.join(`work-order:${workOrderId}`)
      })

      socket.on('leave-work-order', (workOrderId: string) => {
        socket.leave(`work-order:${workOrderId}`)
      })

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`)
      })
    })
  }

  // Notify about work order updates
  notifyWorkOrderUpdate(workOrderId: string, update: any) {
    this.io.to(`work-order:${workOrderId}`).emit('work-order-updated', {
      workOrderId,
      update,
      timestamp: new Date().toISOString()
    })
  }

  // Notify specific user
  notifyUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    })
  }

  // Notify all admins
  notifyAdmins(notification: any) {
    this.io.to('role:admin').emit('admin-notification', {
      ...notification,
      timestamp: new Date().toISOString()
    })
  }

  // Notify all workers
  notifyWorkers(notification: any) {
    this.io.to('role:worker').emit('worker-notification', {
      ...notification,
      timestamp: new Date().toISOString()
    })
  }

  // Send real-time status updates
  broadcastStatusUpdate(status: any) {
    this.io.emit('system-status', {
      ...status,
      timestamp: new Date().toISOString()
    })
  }
}

export default WebSocketService
