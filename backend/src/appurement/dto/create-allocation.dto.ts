import { IsNumber, IsString } from 'class-validator';

export class CreateAllocationDto {
  @IsString()
  sa_id: string;

  @IsString()
  ea_id: string;

  @IsNumber()
  quantity: number;
}
