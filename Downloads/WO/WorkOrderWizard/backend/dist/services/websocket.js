"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class WebSocketService {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.uid;
                socket.userRole = decoded.role;
                next();
            }
            catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.userId} connected`);
            // Join user to their role-based room
            socket.join(`role:${socket.userRole}`);
            socket.join(`user:${socket.userId}`);
            socket.on('join-work-order', (workOrderId) => {
                socket.join(`work-order:${workOrderId}`);
            });
            socket.on('leave-work-order', (workOrderId) => {
                socket.leave(`work-order:${workOrderId}`);
            });
            socket.on('disconnect', () => {
                console.log(`User ${socket.userId} disconnected`);
            });
        });
    }
    // Notify about work order updates
    notifyWorkOrderUpdate(workOrderId, update) {
        this.io.to(`work-order:${workOrderId}`).emit('work-order-updated', {
            workOrderId,
            update,
            timestamp: new Date().toISOString()
        });
    }
    // Notify specific user
    notifyUser(userId, notification) {
        this.io.to(`user:${userId}`).emit('notification', Object.assign(Object.assign({}, notification), { timestamp: new Date().toISOString() }));
    }
    // Notify all admins
    notifyAdmins(notification) {
        this.io.to('role:admin').emit('admin-notification', Object.assign(Object.assign({}, notification), { timestamp: new Date().toISOString() }));
    }
    // Notify all workers
    notifyWorkers(notification) {
        this.io.to('role:worker').emit('worker-notification', Object.assign(Object.assign({}, notification), { timestamp: new Date().toISOString() }));
    }
    // Send real-time status updates
    broadcastStatusUpdate(status) {
        this.io.emit('system-status', Object.assign(Object.assign({}, status), { timestamp: new Date().toISOString() }));
    }
}
exports.WebSocketService = WebSocketService;
exports.default = WebSocketService;
