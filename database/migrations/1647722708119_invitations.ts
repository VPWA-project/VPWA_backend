import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Invitations extends BaseSchema {
  protected tableName = 'invitations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').index('user_id')
      table.uuid('invited_by_id').references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('channel_id')
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
        .index('channel_id')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
