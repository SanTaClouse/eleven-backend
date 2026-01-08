import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FirebaseService } from '../config/firebase.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password, rememberMe = false } = loginDto;

    try {
      // Buscar usuario activo
      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
      });

      if (!user) {
        this.logger.warn(`Login fallido: Usuario no encontrado - ${email}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login fallido: Contraseña incorrecta - ${email}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar tokens con duración dinámica
      const tokens = await this.generateTokens(user, rememberMe);

      // Generar Firebase Custom Token para acceso a Storage
      let firebaseToken: string | null = null;
      try {
        firebaseToken = await this.firebaseService.createCustomToken(user.id, {
          email: user.email,
          role: user.role,
        });
        this.logger.debug(`Firebase custom token created for user: ${user.id}`);
      } catch (error) {
        this.logger.error(`Failed to create Firebase token for ${email}:`, error.message);
        // No fallar el login si Firebase falla, solo loggear
      }

      this.logger.log(`Login exitoso: ${email}${rememberMe ? ' (Recuérdame activado)' : ''}`);

      // Retornar tokens y datos del usuario (sin password)
      return {
        ...tokens,
        firebaseToken,
        rememberMe,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error en login: ${error.message}`, error.stack);
      throw new UnauthorizedException('Error en el proceso de autenticación');
    }
  }

  async generateTokens(user: User, rememberMe: boolean = false) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutos (siempre igual por seguridad)
    });

    // Duración del refresh token según rememberMe
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret:
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
        expiresIn: refreshTokenExpiry,
      },
    );

    return { access_token, refresh_token, refreshTokenExpiry };
  }

  async refreshTokens(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const tokens = await this.generateTokens(user);

    // Generar nuevo Firebase Custom Token
    let firebaseToken: string | null = null;
    try {
      firebaseToken = await this.firebaseService.createCustomToken(user.id, {
        email: user.email,
        role: user.role,
      });
      this.logger.debug(`Firebase custom token refreshed for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to refresh Firebase token for ${user.email}:`, error.message);
    }

    this.logger.log(`Tokens refrescados: ${user.email}`);

    return {
      ...tokens,
      firebaseToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    user.password = await hash(newPassword, 10);

    // Invalidar todos los tokens existentes
    user.tokensValidAfter = new Date();

    await this.userRepository.save(user);

    this.logger.log(`Contraseña cambiada y tokens invalidados: ${user.email}`);

    return { message: 'Contraseña actualizada correctamente. Todos los dispositivos fueron desconectados.' };
  }

  async logoutAllDevices(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Invalidar todos los tokens emitidos antes de este momento
    user.tokensValidAfter = new Date();
    await this.userRepository.save(user);

    this.logger.log(`Logout de todos los dispositivos: ${user.email}`);

    return { message: 'Sesión cerrada en todos los dispositivos' };
  }
}