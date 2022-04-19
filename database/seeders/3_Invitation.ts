import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'

export default class InvitationSeeder extends BaseSeeder {
  public async run() {
    const johnUser = await User.findBy('firstname', 'John')
    const adminUser = await User.findBy('email', 'admin@gmail.com')

    const public1Channel = await Channel.findBy('name', 'Public_1')
    const private1Channel = await Channel.findBy('name', 'Private_1')

    await Invitation.createMany([
      {
        channelId: public1Channel?.id,
        userId: johnUser?.id,
        invitedById: adminUser?.id,
      },
      {
        channelId: private1Channel?.id,
        userId: johnUser?.id,
        invitedById: adminUser?.id,
      },
    ])
  }
}
