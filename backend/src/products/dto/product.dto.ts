export class CreateProductDto {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  available?: boolean;
  stock?: number;
  minStock?: number;
  trackStock?: boolean;
}

export class UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  available?: boolean;
  stock?: number;
  minStock?: number;
  trackStock?: boolean;
}