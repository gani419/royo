import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(5, 'Please provide more details about the vehicle symptom (at least 5 characters)')
    .max(1000, 'Message cannot exceed 1000 characters'),
});

export const createChatSessionSchema = z.object({
  vehicleId: z.string().uuid('Please select a valid vehicle'),
  initialMessage: z.string().trim().min(5).max(1000).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;

