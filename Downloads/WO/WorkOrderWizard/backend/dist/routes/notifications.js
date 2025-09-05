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
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/notifications - Send SMS notification
router.post('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = validation_1.sendNotificationSchema.parse(req.body);
        const workOrder = yield prisma.workOrder.findUnique({
            where: { id: validatedData.work_order_id },
            include: { assigned_user: true }
        });
        if (!workOrder) {
            return res.status(404).json({ error: 'Work order not found' });
        }
        const phoneNumber = validatedData.phone_number || '+13202677242'; // Default to your number
        const result = yield (0, twilio_1.sendSMS)(phoneNumber, validatedData.message);
        // Log the notification
        yield prisma.workOrderLog.create({
            data: {
                work_order_id: validatedData.work_order_id,
                action: 'notification_sent',
                details: `SMS sent to ${phoneNumber}: ${validatedData.message}`
            }
        });
        res.json({
            success: true,
            message_sid: result.sid,
            phone_number: phoneNumber
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        res.status(500).json({ error: 'Failed to send notification' });
    }
}));
exports.default = router;
