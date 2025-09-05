"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../schemas/validation");
const twilio_1 = require("../services/twilio");
const shopify_1 = require("../services/shopify");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/work-orders - List all work orders with filters
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, assigned_user_id, page = '1', limit = '10' } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (assigned_user_id)
            where.assigned_user_id = assigned_user_id;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const workOrders = yield prisma.workOrder.findMany({
            where,
            include: {
                assigned_user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                logs: {
                    orderBy: { created_at: 'desc' },
                    take: 5
                }
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: parseInt(limit)
        });
        const total = yield prisma.workOrder.count({ where });
        res.json({
            work_orders: workOrders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch work orders' });
    }
}));
// GET /api/work-orders/:id - Get specific work order
router.get('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const workOrder = yield prisma.workOrder.findUnique({
            where: { id },
            include: {
                assigned_user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                logs: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!workOrder) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        res.json(workOrder);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch work order' });
    }
}));
// POST /api/work-orders - Create work order (admin only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const validatedData = validation_1.createWorkOrderSchema.parse(req.body);
        const workOrder = yield prisma.workOrder.create({
            data: Object.assign(Object.assign({}, validatedData), { status: 'open' }),
            include: {
                assigned_user: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });
        // Log the creation
        yield prisma.workOrderLog.create({
            data: {
                work_order_id: workOrder.id,
                action: 'created',
                details: `Work order created by ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.email}`
            }
        });
        // Sync with Shopify if order ID provided
        if (validatedData.shopify_order_id) {
            try {
                yield (0, shopify_1.syncWorkOrderWithShopify)(workOrder.id, validatedData.shopify_order_id);
                yield prisma.workOrderLog.create({
                    data: {
                        work_order_id: workOrder.id,
                        action: 'shopify_synced',
                        details: `Synced with Shopify order ${validatedData.shopify_order_id}`
                    }
                });
            }
            catch (error) {
                console.error('Shopify sync failed:', error);
            }
        }
        // Send notification if assigned to user
        if (workOrder.assigned_user_id) {
            try {
                yield (0, twilio_1.sendWorkOrderNotification)(workOrder.id, 'has been assigned to you', '+13202677242');
            }
            catch (error) {
                console.error('SMS notification failed:', error);
            }
        }
        res.status(201).json(workOrder);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        res.status(500).json({ error: 'Failed to create work order' });
    }
}));
// PATCH /api/work-orders/:id - Update work order
router.patch('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const validatedData = validation_1.updateWorkOrderSchema.parse(req.body);
        const existingWorkOrder = yield prisma.workOrder.findUnique({
            where: { id },
            include: { assigned_user: true }
        });
        if (!existingWorkOrder) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        const workOrder = yield prisma.workOrder.update({
            where: { id },
            data: validatedData,
            include: {
                assigned_user: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });
        // Log the update
        const changes = Object.keys(validatedData).map(key => `${key}: ${existingWorkOrder[key]} → ${validatedData[key]}`).join(', ');
        yield prisma.workOrderLog.create({
            data: {
                work_order_id: workOrder.id,
                action: 'updated',
                details: `Updated by ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.email}: ${changes}`
            }
        });
        // Send notification on status change
        if (validatedData.status && validatedData.status !== existingWorkOrder.status) {
            try {
                yield (0, twilio_1.sendWorkOrderNotification)(workOrder.id, `status changed to ${validatedData.status}`, '+13202677242');
            }
            catch (error) {
                console.error('SMS notification failed:', error);
            }
        }
        res.json(workOrder);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        res.status(500).json({ error: 'Failed to update work order' });
    }
}));
exports.default = router;
