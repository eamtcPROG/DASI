import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthProxyService } from "../services/auth-proxy.service";
import { AuthenticatedUser } from "../dto/user.dto";
import { getJwtFromRequest } from "../tools/common.tools";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authProxyService: AuthProxyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Express.Request>();
    const token = getJwtFromRequest(request);
    if (!token) {
      throw new UnauthorizedException("Invalid or missing token");
    }

    const result = await this.authProxyService.validateToken(token);
    if (!result.isValid || !result.user) {
      throw new UnauthorizedException(
        result.error ?? "Invalid or missing token",
      );
    }

    request.user = {
      ...result.user,
      token,
    } as AuthenticatedUser;

    return true;
  }
}
