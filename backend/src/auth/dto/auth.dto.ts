import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterTenantDto {
  @ApiProperty({ example: 'Mi Restaurante' })
  @IsString()
  @MinLength(2)
  tenantName: string;

  @ApiProperty({ example: 'owner@restaurant.com' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  ownerPassword: string;

  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  ownerFirstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  ownerLastName?: string;
}
