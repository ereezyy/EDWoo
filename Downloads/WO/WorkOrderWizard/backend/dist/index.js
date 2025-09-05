"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const workOrders_1 = __importDefault(require("./routes/workOrders"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Import WebSocket service
const websocket_1 = __importDefault(require("./services/websocket"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const port = process.env.PORT || 3001;
// Initialize WebSocket service
const wsService = new websocket_1.default(server);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'WorkOrderWizard Backend is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use('/api/work-orders', workOrders_1.default);
app.use('/api/users', users_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/notifications', notifications_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
server.listen(port, () => {
    console.log(`🚀 WorkOrderWizard Backend is running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}`);
    console.log(`🔧 API endpoints: http://localhost:${port}/api`);
});
