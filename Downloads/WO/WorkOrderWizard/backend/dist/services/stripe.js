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
exports.confirmPayment = exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
const createPaymentIntent = (amount, workOrderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentIntent = yield stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                work_order_id: workOrderId,
            },
        });
        return paymentIntent;
    }
    catch (error) {
        throw new Error(`Stripe payment creation failed: ${error}`);
    }
});
exports.createPaymentIntent = createPaymentIntent;
const confirmPayment = (paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    }
    catch (error) {
        throw new Error(`Stripe payment confirmation failed: ${error}`);
    }
});
exports.confirmPayment = confirmPayment;
