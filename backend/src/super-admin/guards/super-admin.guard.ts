import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserPayload;
    }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.role !== 'SUPER_USER') {
      throw new ForbiddenException(
        'Acesso negado. Apenas Super User pode acessar esta rota.',
      );
    }

    return true;
  }
}
