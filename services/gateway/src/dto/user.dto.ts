import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty({
    example: 1,
    description: "Unique identifier for the user",
    type: "number",
  })
  id: number;

  @ApiProperty({
    example: "example@example.com",
    description: "User email - unique in system",
    type: "string",
  })
  email: string;

  @ApiProperty({
    example: "John",
    description: "User first name",
    type: "string",
  })
  firstName: string | null;

  @ApiProperty({
    example: "Doe",
    description: "User last name",
    type: "string",
  })
  lastName: string | null;

  constructor(
    id: number,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName ?? null;
    this.lastName = lastName ?? null;
  }
}

export type AuthenticatedUser = UserDto & {
  token: string;
};
