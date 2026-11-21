import { Module, Global, Inject, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

const databaseProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (configService: ConfigService): Pool => {
    const logger = new Logger('DatabaseModule');
    const dbUrl = configService.get<string>('database.url');

    const poolConfig: PoolConfig = dbUrl
      ? { connectionString: dbUrl }
      : {
          host: configService.get<string>('database.host') || 'localhost',
          port: configService.get<number>('database.port') || 5432,
          user: configService.get<string>('database.username') || 'postgres',
          password: configService.get<string>('database.password') || 'postgres',
          database: configService.get<string>('database.database') || 'student_housing',
        };

    const pool = new Pool({
      ...poolConfig,
      max: configService.get<number>('database.poolMax') || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle unexpected errors on idle pool clients to prevent process termination
    pool.on('error', (err: Error) => {
      logger.error(`Unexpected PostgreSQL idle client error: ${err.message}`, err.stack);
    });

    return pool;
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Closing PostgreSQL connection pool (signal: ${signal || 'shutdown'})...`);
    await this.pool.end();
  }
}
