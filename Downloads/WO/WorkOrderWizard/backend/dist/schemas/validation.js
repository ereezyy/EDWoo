"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationSchema = exports.createPaymentSchema = exports.updateWorkOrderSchema = exports.createWorkOrderSchema = void 0;
const zod_1 = require("zod");
exports.createWorkOrderSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    assigned_user_id: zod_1.z.string().uuid().optional(),
    shopify_order_id: zod_1.z.string().optional(),
});
exports.updateWorkOrderSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['open', 'in_progress', 'completed']).optional(),
    assigned_user_id: zod_1.z.string().uuid().optional(),
});
exports.createPaymentSchema = zod_1.z.object({
    work_order_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
});
exports.sendNotificationSchema = zod_1.z.object({
    work_order_id: zod_1.z.string().uuid(),
    message: zod_1.z.string().min(1),
    phone_number: zod_1.z.string().optional(),
});
