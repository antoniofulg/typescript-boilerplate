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
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Tentar encontrar como User primeiro
    let user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    // Se não encontrar, tentar como SuperAdmin
    if (!user) {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { email },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        superAdmin.passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const payload = {
        userId: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
      };

      const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
      const accessToken = this.jwtService.sign(payload, {
        expiresIn,
      } as any);

      return {
        accessToken,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'SUPER_ADMIN',
        },
      };
    }

    // Validar tenant ativo
    if (user.tenantId && user.tenant && user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant inativo');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role as string,
      tenantId: user.tenantId || undefined,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    } as any);

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

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, password, role, tenantId } = registerDto;

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Se tenantId foi fornecido, validar se existe e está ativo
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant não encontrado');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new BadRequestException('Tenant inativo');
      }

      // Verificar se email já existe neste tenant
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

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await this.prisma.user.create({
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

    // Gerar token JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role as string,
      tenantId: user.tenantId || undefined,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    } as any);

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

  async getProfile(userId: string, role: string) {
    if (role === 'SUPER_ADMIN') {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: userId },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'SUPER_ADMIN',
      };
    }

    const user = await this.prisma.user.findUnique({
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

