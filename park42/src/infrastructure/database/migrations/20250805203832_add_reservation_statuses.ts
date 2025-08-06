import type { Knex } from "knex";

const table = "reservations";
const enumName = "payment_statuses";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, (table) => {
    table.dropColumn("payment_status");
  });

  await knex.schema.alterTable(table, (table) => {
    table
      .enum("payment_status", ["PENDING", "CONFIRMED", "EXPIRED", "FAILED"], {
        enumName: "payment_statuses",
        useNative: true,
      })
      .notNullable()
      .defaultTo("PENDING");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, (table) => {
    table.dropColumn("payment_status");
  });

  await knex.schema.alterTable(table, (table) => {
    table.enum("payment_status", ["PENDING", "CONFIRMED"]).notNullable().defaultTo('PENDING');
  });

  await knex.raw(`DROP TYPE IF EXISTS ${enumName}`);
}
