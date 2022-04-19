import Factory from '@ioc:Adonis/Lucid/Factory'
import { ChannelTypes } from 'App/Controllers/Http/ChannelsController'
import Channel from 'App/Models/Channel'
import Message from 'App/Models/Message'
import User from 'App/Models/User'

export const UserFactory = Factory.define(User, ({ faker }) => {
  const firstname = faker.name.firstName()

  return {
    email: faker.internet.email(),
    password: 'password',
    firstname: firstname,
    lastname: faker.name.lastName(),
    nickname: faker.internet.userName(firstname),
  }
})
  .relation('bannedChannels', () => ChannelFactory)
  .relation('channels', () => ChannelFactory)
  .relation('ownChannels', () => ChannelFactory)
  .relation('messages', () => MessageFactory)
  .build()

export const ChannelFactory = Factory.define(Channel, ({ faker }) => {
  return {
    name: faker.internet.domainName(),
    type: faker.random.arrayElement([ChannelTypes.Public, ChannelTypes.Private]),
  }
})
  .after('create', async (_, model) => {
    await model.related('users').attach([model.administratorId])
  })
  .relation('administrator', () => UserFactory)
  .relation('users', () => UserFactory)
  .relation('messages', () => MessageFactory)
  .relation('bannedUsers', () => UserFactory)
  .relation('kickedUsers', () => UserFactory)
  .build()

export const MessageFactory = Factory.define(Message, ({ faker }) => {
  return {
    message: faker.lorem.words(8),
  }
})
  .relation('channel', () => ChannelFactory)
  .relation('user', () => UserFactory)
  .build()
