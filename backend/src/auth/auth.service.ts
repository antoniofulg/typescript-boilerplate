import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { TenantStatus, UserRole, Prisma } from '@prisma/client';
import { safeJwtSign } from '../common/type-helpers';

type UserWithTenant = Prisma.UserGetPayload<{
  include: { tenant: true };
}>;

type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tokenVersion: number;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuário (pode ser SUPER_USER ou usuário normal)
    const user: UserWithTenant | null = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validar tenant ativo (apenas para usuários com tenant)
    if (
      user.tenantId &&
      user.tenant &&
      user.tenant.status !== TenantStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Tenant inativo');
    }

    // Incrementar tokenVersion para invalidar tokens de outros dispositivos
    // Isso garante que apenas o último login seja válido
    const updatedUser: UserWithTenant = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
      include: {
        tenant: true,
      },
    });

    // Gerar token JWT
    const payload: JwtPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,

      role: updatedUser.role,
      tenantId: updatedUser.tenantId || undefined,

      tokenVersion: updatedUser.tokenVersion,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '16h';
    const accessToken = safeJwtSign(this.jwtService, payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,

        role: updatedUser.role,
        tenantId: updatedUser.tenantId || undefined,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, password, role, tenantId } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // If tenantId was provided, validate if it exists and is active
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant não encontrado');
      }

      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new BadRequestException('Tenant inativo');
      }

      // Check if email already exists in this tenant
      const existingUserInTenant = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email,
          },
        },
      });

      if (existingUserInTenant) {
        throw new ConflictException('Email já está em uso neste tenant');
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user

    const user: UserWithTenant = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        tenantId: tenantId || null,
      },
      include: {
        tenant: true,
      },
    });

    // Incrementar tokenVersion para invalidar tokens de outros dispositivos
    // Isso garante que apenas o último login seja válido
    const updatedUser: UserWithTenant = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
      include: {
        tenant: true,
      },
    });

    // Gerar token JWT
    const payload: JwtPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,

      role: updatedUser.role,
      tenantId: updatedUser.tenantId || undefined,

      tokenVersion: updatedUser.tokenVersion,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '16h';
    const accessToken = safeJwtSign(this.jwtService, payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,

        role: updatedUser.role,
        tenantId: updatedUser.tenantId || undefined,
      },
    };
  }

  async refreshToken(userId: string): Promise<AuthResponseDto> {
    // Validate if user still exists and is active
    const user: UserWithTenant | null = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Validar tenant ativo (apenas para usuários com tenant)
    if (
      user.tenantId &&
      user.tenant &&
      user.tenant.status !== TenantStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Tenant inativo');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,

      role: user.role,
      tenantId: user.tenantId || undefined,

      tokenVersion: user.tokenVersion,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '16h';
    const accessToken = safeJwtSign(this.jwtService, payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId || undefined,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Buscar usuário para verificar se existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Incrementar tokenVersion para invalidar todos os tokens anteriores
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user: UserWithTenant | null = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId || undefined,
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            status: user.tenant.status,
          }
        : undefined,
    };
  }
}
