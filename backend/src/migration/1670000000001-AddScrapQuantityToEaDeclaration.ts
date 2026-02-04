import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScrapQuantityToEaDeclaration1670000000001 implements MigrationInterface {
    name = 'AddScrapQuantityToEaDeclaration1670000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ea_declarations ADD scrap_quantity decimal(18,3) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ea_declarations DROP COLUMN scrap_quantity`);
    }
}
