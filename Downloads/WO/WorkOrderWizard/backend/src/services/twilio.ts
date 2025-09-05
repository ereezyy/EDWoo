import twilio from 'twilio';

let client: any = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not configured - SMS functionality disabled');
      return null;
    }
    client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

export const sendSMS = async (to: string, message: string) => {
  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn('SMS not sent - Twilio not configured:', message);
    return { sid: 'mock-message-id', status: 'mock-sent' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: to,
    });

    return result;
  } catch (error) {
    throw new Error(`SMS sending failed: ${error}`);
  }
};

export const sendWorkOrderNotification = async (workOrderId: string, action: string, phoneNumber: string) => {
  const message = `WorkOrderWizard: Work Order #${workOrderId.slice(-8)} ${action}. Check your dashboard for details.`;
  return await sendSMS(phoneNumber, message);
};
