import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

let shopify: any = null;

const getShopify = () => {
  if (!shopify) {
    if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
      console.warn('Shopify credentials not configured - Shopify functionality disabled');
      return null;
    }
    shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: ['read_orders', 'write_orders'],
      hostName: 'localhost',
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false,
    });
  }
  return shopify;
};

export const getShopifyOrder = async (orderId: string) => {
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
  } catch (error) {
    throw new Error(`Shopify order fetch failed: ${error}`);
  }
};

export const syncWorkOrderWithShopify = async (workOrderId: string, shopifyOrderId: string) => {
  try {
    const order = await getShopifyOrder(shopifyOrderId);
    return {
      work_order_id: workOrderId,
      shopify_order: order,
      synced_at: new Date(),
    };
  } catch (error) {
    throw new Error(`Shopify sync failed: ${error}`);
  }
};
