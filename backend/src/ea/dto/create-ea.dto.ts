import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
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

  /**
   * ID de la famille de produit choisie.
   * Détermine le pourcentage de déchet et filtre les SAs éligibles.
   */
  @IsOptional()
  @IsString()
  family_id?: string;

  // éventuellement tu avais déjà un regime_code fixé à 362
  @IsOptional()
  @IsString()
  regime_code?: string;

  /**
   * Pourcentage de déchet (copié de la famille SA liée si applicable)
   */
  @IsOptional()
  @IsNumber()
  scrap_percent?: number;

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

  /**
   * Liste des SA à lier (remplace ou complète linked_sa_id).
   * Permet de lier plusieurs SA à une seule EA.
   */
  @IsOptional()
  @IsArray()
  linked_sas?: {
    sa_id: string;
    quantity: number;
  }[];
}