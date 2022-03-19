import { BaseCommand, Kernel } from '@adonisjs/ace'
import { inject } from '@adonisjs/fold'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'

@inject([null, null, 'Adonis/Lucid/Database'])
export default class MigrationFresh extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'migration:fresh'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  constructor(app: ApplicationContract, kernel: Kernel, private db: DatabaseContract) {
    super(app, kernel)
  }

  public async run() {
    this.logger.info('Recreating database schema...')

    await this.db.rawQuery('DROP SCHEMA public CASCADE')
    await this.db.rawQuery('CREATE SCHEMA public')

    this.logger.success('All tables drop successfully')

    await this.kernel.exec('migration:run', [])

    this.logger.success('All migrations run successfully')
  }
}
