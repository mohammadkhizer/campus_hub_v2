import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const dbState = mongoose.connection.readyState;

  const metrics = `
# HELP process_uptime_seconds Total process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime.toFixed(2)}

# HELP nodejs_heap_size_total_bytes Total allocated heap memory
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${memoryUsage.heapTotal}

# HELP nodejs_heap_size_used_bytes Used heap memory
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${memoryUsage.heapUsed}

# HELP nodejs_external_memory_bytes External C++ memory allocations
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${memoryUsage.external}

# HELP mongodb_connection_state MongoDB connection state (1=connected, 0=disconnected, 2=connecting)
# TYPE mongodb_connection_state gauge
mongodb_connection_state ${dbState}
`.trim();

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
