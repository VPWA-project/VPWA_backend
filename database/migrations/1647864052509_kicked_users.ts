import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class KickedUsers extends BaseSchema {
  protected tableName = 'kicked_users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('kicked_user_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('kicked_by_user_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('channel_id').references('id').inTable('channels').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
