export class SaEligibleDto {
  id: string;
  sa_number: string;
  supplier_name: string | null;
  due_date: string;

  // Quantités côté SA
  quantity_initial: number;   // quantité initiale SA
  quantity_apured: number;    // quantité SA déjà consommée
  sa_remaining: number;       // quantité SA restante (initial - apured)

  // Quantité EA maximale encore imputable sur cette SA
  // => sa_remaining / coefficient_famille (1.05 / 1.06 / 1.08)
  remaining_quantity: number;

  quantity_unit: string;

  // Pour information (5, 6, 8…)
  scrap_percent: number;
}