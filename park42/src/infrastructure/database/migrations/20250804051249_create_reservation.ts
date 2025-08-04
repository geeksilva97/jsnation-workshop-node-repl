import type { Knex } from "knex";

const table = "reservations";

export async function up(knex: Knex) {
  await knex.schema.createTable(table, (table) => {
    table.increments("id").primary();
    table.integer("user_id").references("id").inTable("users").notNullable();
    table.string("price_token").notNullable();
    table.string("payment_token").notNullable();
    table.timestamp("start_at").notNullable();
    table.timestamp("end_at").notNullable();
    table.integer("amount").notNullable();
    table.timestamps(true, true);
    table.enum("payment_status", ["PENDING", "CONFIRMED"]).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(table);
}
