import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { RedirectIfAuthenticatedGuard } from './guards/redirect-if-authenticated.guard';
import { SuperUserGuard } from './guards/super-user.guard';
import ms from 'ms';

type ExpiresIn = number | ms.StringValue | undefined;

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET environment variable is required. Please set it in your environment configuration.',
          );
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '16h';
        return {
          secret: jwtSecret,
          signOptions: {
            // JwtModuleOptions expects expiresIn as number | StringValue | undefined
            // StringValue is a type from jsonwebtoken library, but string works at runtime

            expiresIn: expiresIn as ExpiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RedirectIfAuthenticatedGuard,
    SuperUserGuard,
  ],
  exports: [AuthService, SuperUserGuard],
})
export class AuthModule {}
