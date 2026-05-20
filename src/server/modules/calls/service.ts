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

    return endedCall;
  }
}
