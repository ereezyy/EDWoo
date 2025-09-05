import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_user_id: z.string().uuid().optional(),
  shopify_order_id: z.string().optional(),
});

export const updateWorkOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['open', 'in_progress', 'completed']).optional(),
  assigned_user_id: z.string().uuid().optional(),
});

export const createPaymentSchema = z.object({
  work_order_id: z.string().uuid(),
  amount: z.number().positive(),
});

export const sendNotificationSchema = z.object({
  work_order_id: z.string().uuid(),
  message: z.string().min(1),
  phone_number: z.string().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
