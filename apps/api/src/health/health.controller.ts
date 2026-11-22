import { Controller, Get, HttpStatus, Inject, Optional, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from '../database/database.module';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  database: {
    status: 'up' | 'down';
    responseTimeMs: number;
    pingResult: 'healthy' | 'unhealthy';
    error?: string;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
    external: string;
    raw: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    responseTimeMs: number;
    pingResult: 'healthy' | 'unhealthy';
    error?: string;
  }> {
    if (!this.pool) {
      return {
        status: 'down',
        responseTimeMs: 0,
        pingResult: 'unhealthy',
        error: 'Database connection pool not configured',
      };
    }

    const start = Date.now();
    try {
      const res = await Promise.race([
        this.pool.query('SELECT 1 as ping'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database ping timeout (3000ms)')), 3000),
        ),
      ]);
      const latency = Date.now() - start;
      if (res && res.rows && res.rows[0]?.ping === 1) {
        return {
          status: 'up',
          responseTimeMs: latency,
          pingResult: 'healthy',
        };
      }
      return {
        status: 'down',
        responseTimeMs: latency,
        pingResult: 'unhealthy',
        error: 'Unexpected ping response',
      };
    } catch (err: any) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        pingResult: 'unhealthy',
        error: err.message,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Comprehensive system health check with DB & memory telemetry' })
  @ApiResponse({ status: 200, description: 'System healthy or degraded' })
  @ApiResponse({ status: 503, description: 'Core system components down' })
  async check(@Res({ passthrough: true }) res?: Response): Promise<HealthCheckResponse> {
    const db = await this.checkDatabase();
    const mem = process.memoryUsage();
    const uptimeSec = process.uptime();

    const overallStatus: 'ok' | 'degraded' | 'down' = db.status === 'up' ? 'ok' : 'degraded';

    if (overallStatus !== 'ok' && res) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: overallStatus,
      service: 'student-housing-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.round(uptimeSec * 100) / 100,
        formatted: this.formatUptime(uptimeSec),
      },
      database: db,
      memory: {
        heapUsed: this.formatBytes(mem.heapUsed),
        heapTotal: this.formatBytes(mem.heapTotal),
        rss: this.formatBytes(mem.rss),
        external: this.formatBytes(mem.external),
        raw: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
          external: mem.external,
        },
      },
    };
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Container liveness probe (checks process responsiveness)' })
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Container readiness probe (checks database connectivity)' })
  async readiness(@Res({ passthrough: true }) res?: Response) {
    const db = await this.checkDatabase();
    const isReady = db.status === 'up';

    if (!isReady && res) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isReady ? 'ok' : 'down',
      database: db,
      timestamp: new Date().toISOString(),
    };
  }
}
