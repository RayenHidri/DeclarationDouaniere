import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScrapPercentToEaDeclaration1670000000000 implements MigrationInterface {
    name = 'AddScrapPercentToEaDeclaration1670000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ea_declarations ADD scrap_percent decimal(5,2) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ea_declarations DROP COLUMN scrap_percent`);
    }
}
