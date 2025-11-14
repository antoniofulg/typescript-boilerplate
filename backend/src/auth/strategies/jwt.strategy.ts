import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { TenantStatus, UserRole, Prisma } from '@prisma/client';

type UserWithTenant = Prisma.UserGetPayload<{
  include: { tenant: true };
}>;

type JwtPayload = {
  userId: string;
  email?: string;
  role: UserRole;
  tenantId?: string;
  tokenVersion?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required. Please set it in your environment configuration.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const { userId, tokenVersion } = payload;

    // Validate if user exists
    const user: UserWithTenant | null = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Validar tokenVersion: se o token foi revogado (logout), o tokenVersion do token
    // será menor que o tokenVersion atual do usuário no banco
    if (tokenVersion !== undefined && tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Token inválido ou revogado');
    }

    // For SUPER_USER, no need to validate tenant (tenantId is null)
    // For regular users, validate if tenant is active
    if (
      user.tenantId &&
      user.tenant &&
      user.tenant.status !== TenantStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Tenant inativo');
    }

    return {
      userId: user.id,
      email: user.email,

      role: user.role,
      tenantId: user.tenantId || undefined,

      tokenVersion: user.tokenVersion,
    };
  }
}
