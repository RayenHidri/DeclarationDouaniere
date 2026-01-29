import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEaDto {
  @IsString()
  @IsNotEmpty()
  ea_number: string;

  @IsDateString()
  export_date: string;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsOptional()
  destination_country?: string;

  @IsString()
  @IsOptional()
  product_ref?: string;

  @IsString()
  @IsOptional()
  product_desc?: string;

  @IsNumber()
  total_quantity: number;

  @IsString()
  @IsNotEmpty()
  quantity_unit: string;

  // éventuellement tu avais déjà un regime_code fixé à 362
  @IsOptional()
  @IsString()
  regime_code?: string;

  /* --------------- NOUVEAUTÉS --------------- */

  /**
   * SA à lier directement à la création de l'EA (optionnel).
   * Si renseigné, on tentera de créer un apurement automatiquement.
   */
  @IsOptional()
  @IsString()
  linked_sa_id?: string;

  /**
   * Quantité EA (en TONNES) à affecter à cette SA.
   * C'est la quantité EA, pas la consommation SA.
   */
  @IsOptional()
  @IsNumber()
  linked_quantity?: number;
}