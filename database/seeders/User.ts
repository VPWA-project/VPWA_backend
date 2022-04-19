import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        email: 'john@gmail.com',
        password: 'password',
        firstname: 'John',
        lastname: 'Doe',
        nickname: 'john',
      },
      {
        email: 'frank@gmail.com',
        password: 'password',
        firstname: 'Frank',
        lastname: 'Doe',
        nickname: 'frank',
      },
      {
        email: 'martin@gmail.com',
        password: 'password',
        firstname: 'Martin',
        lastname: 'Doe',
        nickname: 'martin',
      },
    ])
  }
}
