import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Municipal departments: the offices that administer taxes and services, the
 * link from a staff account to its office, and the routing of a citizen report
 * to the department that must attend it.
 */
export class Departments1763000000000 implements MigrationInterface {
  name = 'Departments1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "departments_area_enum" AS ENUM ('recaudacion', 'operacion', 'control');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(60) NOT NULL,
        "name" varchar(150) NOT NULL,
        "short_name" varchar(60) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "icon" varchar(16) NOT NULL DEFAULT '🏛️',
        "area" "departments_area_enum" NOT NULL DEFAULT 'operacion',
        "service_slugs" text NOT NULL DEFAULT '',
        "report_categories" text NOT NULL DEFAULT '',
        "head_name" varchar(150) NOT NULL DEFAULT '',
        "contact_email" varchar(180) NOT NULL DEFAULT '',
        "contact_phone" varchar(50) NOT NULL DEFAULT '',
        "office" varchar(180) NOT NULL DEFAULT '',
        "schedule_label" varchar(120) NOT NULL DEFAULT '',
        "is_consolidator" boolean NOT NULL DEFAULT false,
        "sla_days" integer NOT NULL DEFAULT 5,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_departments_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_departments_area" ON "departments" ("area");`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department_id" uuid;`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users"
          ADD CONSTRAINT "FK_users_department_id"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_department_id" ON "users" ("department_id");`,
    );

    await queryRunner.query(
      `ALTER TABLE "citizen_reports" ADD COLUMN IF NOT EXISTS "department_id" uuid;`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "citizen_reports"
          ADD CONSTRAINT "FK_citizen_reports_department_id"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reports_department_id" ON "citizen_reports" ("department_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "citizen_reports" DROP CONSTRAINT IF EXISTS "FK_citizen_reports_department_id";`,
    );
    await queryRunner.query(
      `ALTER TABLE "citizen_reports" DROP COLUMN IF EXISTS "department_id";`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_department_id";`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "department_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "departments_area_enum";`);
  }
}
