import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { ChannelTypes } from 'App/Controllers/Http/ChannelsController'
import Message from 'App/Models/Message'
import User from 'App/Models/User'
import { ChannelFactory, MessageFactory, UserFactory } from 'Database/factories'
import { DateTime } from 'luxon'

export default class ChannelSeeder extends BaseSeeder {
  public async run() {
    const johnUser = await User.findBy('firstname', 'John')

    const johnsPublic = await johnUser?.related('ownChannels').create({
      name: "John's public channel",
      type: ChannelTypes.Public,
    })

    const johnsPrivate = await johnUser?.related('ownChannels').create({
      name: "John's private channel",
      type: ChannelTypes.Private,
    })

    if (johnsPublic) await johnUser?.related('channels').attach([johnsPublic.id])
    if (johnsPrivate) await johnUser?.related('channels').attach([johnsPrivate.id])

    const frankUser = await User.findBy('firstname', 'Frank')

    if (johnsPublic && johnsPrivate)
      await frankUser?.related('channels').attach([johnsPublic.id, johnsPrivate.id])

    const franksPublic = await frankUser?.related('ownChannels').create({
      name: "Frank's channel",
      type: ChannelTypes.Public,
    })

    if (franksPublic) await frankUser?.related('channels').attach([franksPublic.id])

    const adminUser = await User.findBy('email', 'admin@gmail.com')

    const adminsChannels = await adminUser?.related('ownChannels').createMany([
      {
        name: 'Public_1',
        type: ChannelTypes.Public,
      },
      {
        name: 'Public_2',
        type: ChannelTypes.Public,
      },
      {
        name: 'Private_1',
        type: ChannelTypes.Private,
      },
      {
        name: 'Private_2',
        type: ChannelTypes.Private,
      },
    ])

    if (adminsChannels) {
      await adminUser?.related('channels').attach(adminsChannels.map((channel) => channel.id))
      await johnUser?.related('channels').attach(adminsChannels.map((channel) => channel.id))
      await frankUser?.related('channels').attach(adminsChannels.map((channel) => channel.id))
    }

    if (adminsChannels && johnUser)
      adminsChannels?.forEach(async (channel) => {
        Array.from({ length: 10 }).forEach(async () => {
          const startTime = new Date(2022, 4, 1)
          const endTime = new Date()

          const time = new Date(
            startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime())
          )

          await MessageFactory.merge({
            channelId: channel.id,
            userId: johnUser.id,
            createdAt: DateTime.fromJSDate(time),
            updatedAt: DateTime.fromJSDate(time),
          }).create()
        })
      })

    // empty channels
    await ChannelFactory.with('administrator').createMany(3)

    // channel with 5 users
    await ChannelFactory.with('administrator').with('users', 5).createMany(3)
  }
}
