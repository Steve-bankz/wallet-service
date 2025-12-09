import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1765323452882 implements MigrationInterface {
    name = 'InitialSchema1765323452882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "api_key" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "name" character varying NOT NULL, "permissions" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb080786c16de6ace7ed0b69f7d" UNIQUE ("key"), CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_type_enum" AS ENUM('deposit', 'transfer')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transaction_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'pending', "reference" character varying, "description" character varying NOT NULL, "walletId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0b12a144bdc7678b6ddb0b913fc" UNIQUE ("reference"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletNumber" character varying NOT NULL, "balance" numeric(12,2) NOT NULL DEFAULT '0', "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_154f4b079f741fb301897739da0" UNIQUE ("walletNumber"), CONSTRAINT "REL_35472b1fe48b6330cd34970956" UNIQUE ("userId"), CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "googleId" character varying, "email" character varying NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_277972f4944205eb29127f9bb6c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_900eb6b5efaecf57343e4c0e79d" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet" ADD CONSTRAINT "FK_35472b1fe48b6330cd349709564" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_35472b1fe48b6330cd349709564"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_900eb6b5efaecf57343e4c0e79d"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_277972f4944205eb29127f9bb6c"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "wallet"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "api_key"`);
    }

}
