import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUser } from "../dto/user.dto";

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
