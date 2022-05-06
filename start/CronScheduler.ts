/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Application from '@ioc:Adonis/Core/Application'

const scheduler = Application.container.use('Adonis/Addons/Scheduler')
scheduler.run()
