import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Channel from 'App/Models/Channel'
import Invitation from 'App/Models/Invitation'
import User from 'App/Models/User'

export default class InvitationSeeder extends BaseSeeder {
  public async run() {
    const adminUser = await User.findBy('email', 'admin@gmail.com')
    const frankUser = await User.findBy('firstname', 'Frank')
    const public1Channel = await Channel.findBy('name', 'Public_1')

    await Invitation.create({
      channelId: public1Channel?.id,
      invitedById: adminUser?.id,
      userId: frankUser?.id,
    })
  }
}
