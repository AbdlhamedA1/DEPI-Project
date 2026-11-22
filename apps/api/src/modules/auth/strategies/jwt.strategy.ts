import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  userId?: string;
  phone: string;
  role: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwtSecret') ||
        process.env.JWT_SECRET ||
        'sakany-secure-jwt-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || (!payload.sub && !payload.userId)) {
      throw new UnauthorizedException('رمز الدخول غير صالح');
    }

    return {
      id: payload.sub || payload.userId,
      phone: payload.phone,
      role: payload.role,
      isVerified: payload.isVerified ?? payload.verificationStatus === 'VERIFIED',
      verificationStatus:
        payload.verificationStatus || (payload.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
    };
  }
}
