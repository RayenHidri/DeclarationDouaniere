export class SaForEaDto {
  id!: string;
  sa_number!: string;
  supplier_name?: string | null;
  family_id?: string | null;
  family_label?: string | null;
  quantity_initial!: number;
  quantity_unit?: string | null;
  quantity_apured!: number;
  sa_remaining!: number;
  max_export_quantity!: number; // net after scrap
  description?: string | null;
  suggested_product_ref?: string | null;
  suggested_product_desc?: string | null;
}