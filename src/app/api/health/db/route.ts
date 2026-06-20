import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';

export async function GET() {
  try {
    await dbConnect();
    const isConnected = mongoose.connection.readyState === 1;

    return NextResponse.json(
      {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Database connection is active' : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: isConnected ? 200 : 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unable to reach database',
        error: error.message
      },
      { status: 500 }
    );
  }
}
