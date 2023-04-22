import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user)
      throw new InternalServerErrorException('User not found in request');

    // if (!data && data === 'email') {
    //   return user.email;
    // }

    return !data ? user : user[data];
  },
);
