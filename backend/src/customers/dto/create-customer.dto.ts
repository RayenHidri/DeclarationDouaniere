import {IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}