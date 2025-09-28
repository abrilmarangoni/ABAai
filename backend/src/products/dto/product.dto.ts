import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Café Americano' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Café negro americano', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 450.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'CAFE-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Café Americano', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Café negro americano', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 450.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 'CAFE-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
