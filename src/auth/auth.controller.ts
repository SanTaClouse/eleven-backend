import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token, refreshTokenExpiry, rememberMe, user } =
      await this.authService.login(loginDto);

    // Duración dinámica según rememberMe
    const refreshMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 días
      : 7 * 24 * 60 * 60 * 1000;  // 7 días

    // Guardar access token en httpOnly cookie (15 minutos)
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    // Guardar refresh token en httpOnly cookie (7 o 30 días)
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: refreshMaxAge,
    });

    // Guardar flag rememberMe en cookie normal (accesible desde JS)
    if (rememberMe) {
      response.cookie('remember_me', 'true', {
        httpOnly: false, // Accesible desde JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: refreshMaxAge,
      });
    }

    // Retornar solo datos del usuario (NO los tokens)
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de usuario' })
  async logout(@Res({ passthrough: true }) response: Response) {
    // Configuración para limpiar cookies (debe coincidir con la configuración al crearlas)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    };

    // Limpiar cookies httpOnly
    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);

    // Limpiar cookie remember_me (no es httpOnly)
    response.clearCookie('remember_me', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token usando refresh token' })
  async refresh(
    @GetUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.refreshTokens(user.id);

    // Actualizar ambas cookies
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return { message: 'Tokens refrescados correctamente' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión en todos los dispositivos' })
  async logoutAll(
    @GetUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAllDevices(user.id);

    // Configuración para limpiar cookies (debe coincidir con la configuración al crearlas)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    };

    // Limpiar cookies httpOnly
    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);

    // Limpiar cookie remember_me (no es httpOnly)
    response.clearCookie('remember_me', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    });

    return { message: 'Sesión cerrada en todos los dispositivos' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario actual' })
  async getMe(@GetUser() user: any) {
    return { user };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario actual' })
  async changePassword(
    @GetUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }
}