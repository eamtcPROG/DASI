import { ApiProperty } from "@nestjs/swagger";

export class SignInDto {
  @ApiProperty({
    example: "example@example.com",
    description: "User email - unique in system",
    type: "string",
  })
  email: string;

  @ApiProperty({
    example: "password",
    description: "User password",
    type: "string",
  })
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
