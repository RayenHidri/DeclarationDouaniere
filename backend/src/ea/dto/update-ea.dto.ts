import { PartialType } from '@nestjs/mapped-types';
import { CreateEaDto } from './create-ea.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEaDto extends PartialType(CreateEaDto) {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string; 
}
