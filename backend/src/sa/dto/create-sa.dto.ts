import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSaDto {
  /**
   * Numéro saisi par l'utilisateur.
   * Soit "250001" (6 chiffres),
   * soit déjà "SA250001".
   * Le service normalisera en "SAxxxxxx".
   */
  @IsString()
  @IsNotEmpty()
  sa_number: string;

  @IsDateString()
  declaration_date: string;

  @IsDateString()
  due_date: string;

  /**
   * Quantité facturée en TONNES.
   */
  @IsNumber()
  quantity_invoiced_ton: number;

  /**
   * Identifiant du fournisseur (liste déroulante).
   */
  @IsOptional()
  @IsString()
  supplier_id?: string;

  /**
   * Identifiant de la famille (Rond à béton / Fils machine / Fer carré).
   */
  @IsOptional()
  @IsString()
  family_id?: string;

  /**
   * Montant facture dans la devise d'origine.
   */
  @IsOptional()
  @IsNumber()
  invoice_amount?: number;

  /**
   * Devise de la facture (EUR, USD, TND, ...).
   */
  @IsOptional()
  @IsString()
  currency_code?: string;

  /**
   * Taux de change vers la devise société.
   */
  @IsOptional()
  @IsNumber()
  fx_rate?: number;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Régime douanier (par défaut 532).
   */
  @IsOptional()
  @IsString()
  regime_code?: string;
}
