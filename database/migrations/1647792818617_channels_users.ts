import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelsUsers extends BaseSchema {
  protected tableName = 'channels_users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('channel_id').references('id').inTable('channels').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
