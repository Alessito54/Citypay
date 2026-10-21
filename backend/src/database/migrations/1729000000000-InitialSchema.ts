import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1729000000000 implements MigrationInterface {
  name = 'InitialSchema1729000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('citizen', 'municipal_official', 'admin', 'municipal_supervisor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "debts_status_enum" AS ENUM ('pending', 'paid', 'overdue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payments_status_enum" AS ENUM ('conciliado', 'discrepancia', 'pendiente');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "citizen_reports_status_enum" AS ENUM ('Nuevo', 'En proceso', 'Asignado', 'Resuelto');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "citizen_reports_priority_enum" AS ENUM ('Baja', 'Media', 'Alta');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Tables
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "firebase_uid" varchar(128) NOT NULL,
        "email" varchar(255) NOT NULL,
        "display_name" varchar(255) NOT NULL DEFAULT '',
        "role" "users_role_enum" NOT NULL DEFAULT 'citizen',
        "phone" varchar(50),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_firebase_uid" UNIQUE ("firebase_uid"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "municipal_services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(50) NOT NULL,
        "name" varchar(150) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "icon" varchar(50) NOT NULL DEFAULT 'receipt',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_municipal_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_municipal_services_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "folio" varchar(60) NOT NULL,
        "concept" varchar(255) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "due_date" date NOT NULL,
        "status" "debts_status_enum" NOT NULL DEFAULT 'pending',
        "user_id" uuid NOT NULL,
        "service_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_debts_folio" UNIQUE ("folio"),
        CONSTRAINT "FK_debts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_debts_service_id" FOREIGN KEY ("service_id") REFERENCES "municipal_services"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "folio" varchar(60) NOT NULL,
        "bank_reference" varchar(100) NOT NULL DEFAULT '—',
        "concept" varchar(255) NOT NULL,
        "service_slug" varchar(50) NOT NULL,
        "payment_date" date NOT NULL,
        "system_amount" numeric(12,2) NOT NULL,
        "bank_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "status" "payments_status_enum" NOT NULL DEFAULT 'pendiente',
        "citizen_name" varchar(255) NOT NULL,
        "payment_method" varchar(100) NOT NULL DEFAULT 'Transferencia SPEI',
        "bank" varchar(100) NOT NULL DEFAULT 'BBVA México',
        "user_id" uuid,
        "debt_id" uuid,
        "is_simulated" boolean NOT NULL DEFAULT true,
        "reconciled_at" timestamptz,
        "reconciled_by_id" uuid,
        "reconciliation_reason" varchar(255),
        "reconciliation_notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_folio" UNIQUE ("folio"),
        CONSTRAINT "FK_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payments_debt_id" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payments_reconciled_by" FOREIGN KEY ("reconciled_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "citizen_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "address" varchar(255) NOT NULL,
        "date" varchar(50) NOT NULL,
        "status" "citizen_reports_status_enum" NOT NULL DEFAULT 'Nuevo',
        "category" varchar(100) NOT NULL,
        "priority" "citizen_reports_priority_enum" NOT NULL DEFAULT 'Media',
        "icon" varchar(30) NOT NULL DEFAULT '📋',
        "description" text NOT NULL,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "user_id" uuid NOT NULL,
        "assigned_to_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_citizen_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_citizen_reports_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_citizen_reports_assigned_to" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL,
        "secure_url" text NOT NULL,
        "public_id" varchar(255) NOT NULL,
        "format" varchar(30),
        "bytes" integer,
        "width" integer,
        "height" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_report_images_report_id" FOREIGN KEY ("report_id") REFERENCES "citizen_reports"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_status_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL,
        "changed_by_id" uuid NOT NULL,
        "previous_status" varchar(50) NOT NULL,
        "new_status" varchar(50) NOT NULL,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_status_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_report_history_report_id" FOREIGN KEY ("report_id") REFERENCES "citizen_reports"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_report_history_changed_by" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 3. Indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reports_status" ON "citizen_reports" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reports_category" ON "citizen_reports" ("category");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "report_status_history" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_images" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "citizen_reports" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "debts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "municipal_services" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);

    await queryRunner.query(`DROP TYPE IF EXISTS "citizen_reports_priority_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "citizen_reports_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payments_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "debts_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum";`);
  }
}
