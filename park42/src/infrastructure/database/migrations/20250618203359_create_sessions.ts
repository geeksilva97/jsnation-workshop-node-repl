import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("sessions", (table) => {
    table.increments("id").primary();
    table.integer("user_id").references("id").inTable("users").notNullable();
    table.string("ip_address");
    table.string("user_agent");
    table.timestamps(true, true);
    table.string("token").notNullable().unique();
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable("sessions");
}
