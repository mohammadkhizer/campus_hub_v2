import { NextRequest, NextResponse } from 'next/server';
import { runPaymentReconciliation } from '@/app/actions/billing';

/**
 * @route  POST /api/cron/reconcile-payments
 * @desc   Triggered by Vercel/Netlify cron or an external scheduler (e.g. cron-job.org).
 *         Protected by a shared secret — NOT by user session.
 *
 * Invoke via:
 *   curl -X POST https://your-domain.com/api/cron/reconcile-payments \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * Netlify cron (netlify.toml):
 *   [[scheduled-functions]]
 *   name = "reconcile-payments"
 *   cron = "0 2 * * *"   # 02:00 UTC daily
 */
export async function POST(req: NextRequest) {
  // 1. Validate cron secret — reject unauthenticated calls immediately
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET env var not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Run the reconciliation job
  const result = await runPaymentReconciliation(cronSecret);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      processed: result.data.processed,
      mismatches: result.data.mismatches,
      runId: result.data.runId,
    },
    { status: 200 }
  );
}

// Block non-POST methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
