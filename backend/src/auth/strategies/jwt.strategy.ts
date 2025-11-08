import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: any): Promise<CurrentUserPayload> {
    const { userId, email, role, tenantId } = payload;

    // Se for SuperAdmin, não precisa validar tenant
    if (role === 'SUPER_ADMIN') {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: userId },
      });

      if (!superAdmin) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return {
        userId: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
      };
    }

    // Para usuários normais, validar se existe e se o tenant está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.tenantId && user.tenant && user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant inativo');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };
  }
}

