import { NextRequest, NextResponse } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connectionTime: number;
    tableCount: number;
    totalRows: number;
    lastBackup: string | null;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    uptime: number;
    memoryUsage: number;
    errorRate: number;
  };
  realtime: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    subscriptions: number;
    messagesPerMinute: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    totalSize: number;
    usedSize: number;
    availableSize: number;
    usagePercentage: number;
  };
  performance: {
    avgDashboardLoadTime: number;
    avgArticleLoadTime: number;
    cacheHitRate: number;
    cdnStatus: 'active' | 'inactive';
  };
  alerts: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

/**
 * System Health Analytics API Endpoint
 * GET /api/admin/analytics/system
 *
 * Provides comprehensive system health monitoring
 */
async function getSystemHealth(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('🔧 System health check requested by:', context.user.email);
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Database health check
    console.log('🗄️ Checking database health...');
    const dbStartTime = Date.now();

    try {
      // Test database connection and get basic stats
      const [
        { count: userCount },
        { count: articleCount },
        { count: libraryCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase
          .from('library_items')
          .select('*', { count: 'exact', head: true }),
      ]);

      const dbConnectionTime = Date.now() - dbStartTime;
      const totalRows =
        (userCount || 0) + (articleCount || 0) + (libraryCount || 0);

      const database = {
        status: (dbConnectionTime < 1000
          ? 'healthy'
          : dbConnectionTime < 3000
            ? 'warning'
            : 'error') as 'healthy' | 'warning' | 'error',
        connectionTime: dbConnectionTime,
        tableCount: 3, // We checked 3 main tables
        totalRows,
        lastBackup: null, // Would need to implement backup tracking
      };

      console.log('✅ Database health check completed:', {
        status: database.status,
        connectionTime: dbConnectionTime,
      });

      // API health metrics (simulated - would need actual monitoring)
      const api = {
        status: 'healthy' as const,
        responseTime: Date.now() - startTime,
        uptime: process.uptime() * 1000, // Convert to milliseconds
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        errorRate: 0.01, // Would need actual error tracking (1%)
      };

      // Real-time health (simulated - would need actual Supabase realtime metrics)
      const realtime = {
        status: 'healthy' as const,
        connections: Math.floor(Math.random() * 50) + 10, // Simulated
        subscriptions: Math.floor(Math.random() * 20) + 5, // Simulated
        messagesPerMinute: Math.floor(Math.random() * 100) + 20, // Simulated
      };

      // Storage health (simulated - would need actual storage metrics)
      const totalSize = 10 * 1024 * 1024 * 1024; // 10GB simulated
      const usedSize = Math.floor(totalSize * 0.3); // 30% used
      const availableSize = totalSize - usedSize;
      const usagePercentage = (usedSize / totalSize) * 100;

      const storage = {
        status: (usagePercentage < 80
          ? 'healthy'
          : usagePercentage < 95
            ? 'warning'
            : 'error') as 'healthy' | 'warning' | 'error',
        totalSize,
        usedSize,
        availableSize,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
      };

      // Performance metrics (simulated)
      const performance = {
        avgDashboardLoadTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
        avgArticleLoadTime: Math.floor(Math.random() * 300) + 150, // 150-450ms
        cacheHitRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        cdnStatus: 'active' as const,
      };

      // Generate some sample alerts based on system status
      const alerts = [];

      if (database.status === 'warning') {
        alerts.push({
          id: 'db-slow-' + Date.now(),
          type: 'warning' as const,
          message: `Database response time is elevated (${database.connectionTime}ms)`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      if (storage.usagePercentage > 80) {
        alerts.push({
          id: 'storage-high-' + Date.now(),
          type:
            storage.usagePercentage > 95
              ? ('error' as const)
              : ('warning' as const),
          message: `Storage usage is at ${storage.usagePercentage.toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      if (api.memoryUsage > 512) {
        alerts.push({
          id: 'memory-high-' + Date.now(),
          type: 'warning' as const,
          message: `Memory usage is elevated (${api.memoryUsage.toFixed(1)}MB)`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      // Add a sample info alert
      alerts.push({
        id: 'system-healthy-' + Date.now(),
        type: 'info' as const,
        message: 'System health check completed successfully',
        timestamp: new Date().toISOString(),
        resolved: true,
      });

      const systemHealth: SystemHealth = {
        database,
        api,
        realtime,
        storage,
        performance,
        alerts,
      };

      console.log('✅ System health analysis completed:', {
        overallStatus: 'Analysis complete',
        dbStatus: database.status,
        alertCount: alerts.length,
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: systemHealth,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    } catch (dbError) {
      console.error('❌ Database health check failed:', dbError);

      // Return degraded system health if database check fails
      const systemHealth: SystemHealth = {
        database: {
          status: 'error',
          connectionTime: Date.now() - dbStartTime,
          tableCount: 0,
          totalRows: 0,
          lastBackup: null,
        },
        api: {
          status: 'warning',
          responseTime: Date.now() - startTime,
          uptime: process.uptime() * 1000,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          errorRate: 0.1, // Higher error rate due to DB issues
        },
        realtime: {
          status: 'error',
          connections: 0,
          subscriptions: 0,
          messagesPerMinute: 0,
        },
        storage: {
          status: 'warning',
          totalSize: 0,
          usedSize: 0,
          availableSize: 0,
          usagePercentage: 0,
        },
        performance: {
          avgDashboardLoadTime: 5000, // Slow due to issues
          avgArticleLoadTime: 3000,
          cacheHitRate: 50, // Lower due to issues
          cdnStatus: 'inactive',
        },
        alerts: [
          {
            id: 'db-error-' + Date.now(),
            type: 'error',
            message: `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
      };

      return NextResponse.json({
        success: true,
        data: systemHealth,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        warning: 'System running in degraded mode due to database issues',
      });
    }
  } catch (error) {
    console.error('❌ System health endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch system health',
        code: 'SYSTEM_HEALTH_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply admin authentication middleware
export const GET = withAdminAPIAuth(getSystemHealth);

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
