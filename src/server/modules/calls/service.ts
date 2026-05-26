import prisma from '@/server/db';
import { z } from 'zod';
import { startCallSchema, endCallSchema } from './validation';

export class CallService {
  static async startCall(callerId: string, data: z.infer<typeof startCallSchema>) {
    const call = await prisma.callHistory.create({
      data: {
        callerId,
        receiverId: data.receiverId,
        isVideo: data.isVideo,
        status: 'ONGOING',
      },
    });

    return call;
  }

  static async endCall(userId: string, data: z.infer<typeof endCallSchema>) {
    const call = await prisma.callHistory.findUnique({ where: { id: data.callId } });
    if (!call) throw new Error('Call not found');
    
    // Ensure the user ending the call is either caller or receiver
    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new Error('Not authorized to end this call');
    }

    const endedCall = await prisma.callHistory.update({
      where: { id: data.callId },
      data: {
        status: data.status,
        endedAt: new Date(),
        duration: data.duration,
      },
    });

    // Create system message for this call in the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        members: {
          some: { userId: call.callerId }
        }
      }
    });

    // Since we can't easily query exact two members in many-to-many with prisma findFirst natively easily without advanced filters,
    // let's fetch conversations of callerId and filter in memory, or use a better query.
    // Actually, simpler query:
    const conversations = await prisma.conversation.findMany({
      where: { isGroup: false },
      include: { members: true }
    });

    const targetConv = conversations.find(c => 
      c.members.some(m => m.userId === call.callerId) && 
      c.members.some(m => m.userId === call.receiverId)
    );

    if (targetConv) {
      await prisma.message.create({
        data: {
          conversationId: targetConv.id,
          senderId: call.callerId, // Record it under the caller
          content: JSON.stringify({ 
            type: 'CALL', 
            status: data.status, 
            duration: data.duration || 0, 
            isVideo: call.isVideo 
          }),
          type: 'SYSTEM',
        }
      });
    }

    return endedCall;
  }
}
