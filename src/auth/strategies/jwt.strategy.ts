import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extraer token de cookie httpOnly
          const token = request?.cookies?.access_token;

          // Log para debugging
          if (!token) {
            this.logger.warn(`[JWT Strategy] No access_token cookie found. Cookies: ${JSON.stringify(Object.keys(request?.cookies || {}))}`);
          } else {
            this.logger.debug(`[JWT Strategy] Token found in cookies`);
          }

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // payload contiene: { sub: userId, email, role, iat (issued at) }
    this.logger.debug(`[JWT Strategy] Validating token for user: ${payload.sub}`);

    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      this.logger.error(`[JWT Strategy] User not found in database: ${payload.sub}`);
      throw new UnauthorizedException({
        message: 'Usuario no encontrado en la base de datos',
        reason: 'USER_NOT_FOUND',
        userId: payload.sub,
      });
    }

    // Verificar si el token fue emitido antes de tokensValidAfter
    if (user.tokensValidAfter) {
      const tokenIssuedAt = new Date(payload.iat * 1000); // iat está en segundos
      if (tokenIssuedAt < user.tokensValidAfter) {
        this.logger.warn(`[JWT Strategy] Token invalidated for user ${user.email}. Token issued: ${tokenIssuedAt.toISOString()}, Valid after: ${user.tokensValidAfter.toISOString()}`);
        throw new UnauthorizedException({
          message: 'Token invalidado. Por favor, inicia sesión nuevamente.',
          reason: 'TOKEN_INVALIDATED',
          tokenIssuedAt: tokenIssuedAt.toISOString(),
          validAfter: user.tokensValidAfter.toISOString(),
        });
      }
    }

    this.logger.debug(`[JWT Strategy] Token validated successfully for user: ${user.email}`);

    // Esto se agrega al request.user
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}