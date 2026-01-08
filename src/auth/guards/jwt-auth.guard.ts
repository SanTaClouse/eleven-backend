import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`[JWT Guard] Checking authentication for ${request.method} ${request.url}`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Si hay un error de passport o no hay usuario
    if (err || !user) {
      // Casos específicos de error
      if (info?.name === 'TokenExpiredError') {
        this.logger.warn(`[JWT Guard] Token expired for ${request.method} ${request.url}`);
        throw new UnauthorizedException({
          message: 'Tu sesión ha expirado',
          reason: 'TOKEN_EXPIRED',
          expiredAt: info.expiredAt,
        });
      }

      if (info?.name === 'JsonWebTokenError') {
        this.logger.error(`[JWT Guard] Invalid token for ${request.method} ${request.url}: ${info.message}`);
        throw new UnauthorizedException({
          message: 'Token inválido',
          reason: 'INVALID_TOKEN',
          details: info.message,
        });
      }

      if (info?.message === 'No auth token') {
        this.logger.warn(`[JWT Guard] No token provided for ${request.method} ${request.url}`);
        throw new UnauthorizedException({
          message: 'No se proporcionó token de autenticación',
          reason: 'NO_TOKEN',
          hint: 'Las cookies httpOnly pueden no estar siendo enviadas. Verifica la configuración de CORS y cookies.',
        });
      }

      // Error genérico
      this.logger.error(`[JWT Guard] Authentication failed for ${request.method} ${request.url}. Error: ${err?.message || 'Unknown'}, Info: ${info?.message || 'Unknown'}`);
      throw err || new UnauthorizedException({
        message: 'Autenticación fallida',
        reason: 'AUTHENTICATION_FAILED',
        error: err?.message,
        info: info?.message,
      });
    }

    this.logger.debug(`[JWT Guard] Authentication successful for user: ${user.email}`);
    return user;
  }
}