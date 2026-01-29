import { PartialType } from '@nestjs/mapped-types';
import { CreateSaDto } from './create-sa.dto';

export class UpdateSaDto extends PartialType(CreateSaDto) {}
