import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUser } from "../dto/user.dto";

declare global {
  namespace Express {
    interface Request {
      headers?: Record<string, string>;
      user?: AuthenticatedUser;
    }
  }
}
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
