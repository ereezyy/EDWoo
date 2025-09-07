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
exports.syncWorkOrderWithShopify = exports.getShopifyOrder = void 0;
const shopify_api_1 = require("@shopify/shopify-api");
let shopify = null;
const getShopify = () => {
    if (!shopify) {
        if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
            console.warn('Shopify credentials not configured - Shopify functionality disabled');
            return null;
        }
        shopify = (0, shopify_api_1.shopifyApi)({
            apiKey: process.env.SHOPIFY_API_KEY,
            apiSecretKey: process.env.SHOPIFY_API_SECRET,
            scopes: ['read_orders', 'write_orders'],
            hostName: 'localhost',
            apiVersion: shopify_api_1.LATEST_API_VERSION,
            isEmbeddedApp: false,
        });
    }
    return shopify;
};
const getShopifyOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const shopifyClient = getShopify();
    if (!shopifyClient) {
        console.warn('Shopify not configured - returning mock order data');
        return {
            id: orderId,
            order_number: `#${orderId}`,
            total_price: '250.00',
            customer: {
                first_name: 'YMCA',
                last_name: 'Customer',
                email: 'customer@ymca.org',
            },
            line_items: [
                {
                    title: 'Maintenance Service',
                    quantity: 1,
                    price: '250.00',
                },
            ],
        };
    }
    try {
        // This would typically use a proper Shopify session
        // For now, we'll return mock data even when configured
        return {
            id: orderId,
            order_number: `#${orderId}`,
            total_price: '250.00',
            customer: {
                first_name: 'YMCA',
                last_name: 'Customer',
                email: 'customer@ymca.org',
            },
            line_items: [
                {
                    title: 'Maintenance Service',
                    quantity: 1,
                    price: '250.00',
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`Shopify order fetch failed: ${error}`);
    }
});
exports.getShopifyOrder = getShopifyOrder;
const syncWorkOrderWithShopify = (workOrderId, shopifyOrderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield (0, exports.getShopifyOrder)(shopifyOrderId);
        return {
            work_order_id: workOrderId,
            shopify_order: order,
            synced_at: new Date(),
        };
    }
    catch (error) {
        throw new Error(`Shopify sync failed: ${error}`);
    }
});
exports.syncWorkOrderWithShopify = syncWorkOrderWithShopify;
