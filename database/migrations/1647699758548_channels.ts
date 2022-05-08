import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Channels extends BaseSchema {
  protected tableName = 'channels'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('administrator_id').references('id').inTable('users').onDelete('SET NULL')

      table.string('name', 255).notNullable()
      table.enum('type', ['PUBLIC', 'PRIVATE']).defaultTo('PUBLIC')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
