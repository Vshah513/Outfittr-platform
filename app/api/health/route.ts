import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
    },
  };

  // Check database connection
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { error } = await supabase.from('users').select('id').limit(1);
      checks.services.database = error ? 'unhealthy' : 'healthy';
    } else {
      checks.services.database = 'not_configured';
    }
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(checks, { status: statusCode });
}
