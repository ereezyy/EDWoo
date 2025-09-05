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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWorkOrderNotification = exports.sendSMS = void 0;
const twilio_1 = __importDefault(require("twilio"));
let client = null;
const getClient = () => {
    if (!client) {
        if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.warn('Twilio credentials not configured - SMS functionality disabled');
            return null;
        }
        client = (0, twilio_1.default)(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return client;
};
const sendSMS = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
    const twilioClient = getClient();
    if (!twilioClient) {
        console.warn('SMS not sent - Twilio not configured:', message);
        return { sid: 'mock-message-id', status: 'mock-sent' };
    }
    try {
        const result = yield twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });
        return result;
    }
    catch (error) {
        throw new Error(`SMS sending failed: ${error}`);
    }
});
exports.sendSMS = sendSMS;
const sendWorkOrderNotification = (workOrderId, action, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const message = `WorkOrderWizard: Work Order #${workOrderId.slice(-8)} ${action}. Check your dashboard for details.`;
    return yield (0, exports.sendSMS)(phoneNumber, message);
});
exports.sendWorkOrderNotification = sendWorkOrderNotification;
