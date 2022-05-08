import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('email', 255).notNullable().unique()
      table.string('password', 180).notNullable()
      table.string('firstname', 255).notNullable()
      table.string('lastname', 255).notNullable()
      table.string('nickname', 255).notNullable().unique()

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo('now')
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo('now')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
