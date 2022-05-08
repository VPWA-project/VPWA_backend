import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Tags extends BaseSchema {
  protected tableName = 'tags'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.integer('message_id').references('id').inTable('messages').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo('now')
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo('now')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
