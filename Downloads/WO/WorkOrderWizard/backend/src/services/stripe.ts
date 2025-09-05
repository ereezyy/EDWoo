import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createPaymentIntent = async (amount: number, workOrderId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        work_order_id: workOrderId,
      },
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe payment creation failed: ${error}`);
  }
};

export const confirmPayment = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe payment confirmation failed: ${error}`);
  }
};
