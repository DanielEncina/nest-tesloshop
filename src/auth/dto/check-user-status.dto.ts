import { IsJWT } from 'class-validator';

export class CheckUserStatusDto {
  @IsJWT()
  token: string;
}
