import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from './roles.decorator';
  import { User } from '../users/user.entity';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles =
        this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
  
      // Si aucun rôle requis, on laisse passer (le JwtAuthGuard gère l’auth)
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user as User;
  
      if (!user || !user.roles || user.roles.length === 0) {
        throw new ForbiddenException('No roles assigned');
      }
  
      const userRoleCodes = user.roles.map((r) => r.code);
      const hasRole = requiredRoles.some((role) =>
        userRoleCodes.includes(role),
      );
  
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role');
      }
  
      return true;
    }
  }
  