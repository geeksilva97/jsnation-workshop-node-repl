import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("facts_of_life", (table) => {
    table.increments("id").primary();
    table.string("question").notNullable().unique();
    table.string("answer").notNullable();
    // setting third option to create columns as camel case
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("facts_of_life");
}
