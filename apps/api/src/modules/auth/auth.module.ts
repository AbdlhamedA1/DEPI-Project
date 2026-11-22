import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SmsService } from '../../common/services/sms.service';
import { DatabaseModule } from '../../database/database.module';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('auth.jwtSecret') ||
          process.env.JWT_SECRET ||
          'sakany-secure-jwt-secret-key-2026',
        signOptions: {
          expiresIn: configService.get<string>('auth.jwtExpiresIn') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SmsService],
  exports: [AuthService, JwtStrategy, SmsService, JwtModule, PassportModule],
})
export class AuthModule {}
