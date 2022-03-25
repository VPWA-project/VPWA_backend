/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.post('login', 'UsersController.login')
Route.post('register', 'UsersController.register')
Route.post('logout', 'UsersController.logout')

Route.group(() => {
  Route.get('users', 'UsersController.index')

  Route.get('channels', 'ChannelsController.index')
  Route.post('channels', 'ChannelsController.create')
  Route.post('channels/:id/join', 'ChannelsController.join')
  Route.post('channels/:id/leave', 'ChannelsController.leave')
  Route.post('channels/:id/kick', 'ChannelsController.kick')
  Route.delete('channels/:id', 'ChannelsController.destroy')

  Route.post('channels/:id/messages', 'MessagesController.create')

  Route.get('invitations', 'InvitationsController.index')
  Route.post('invitations', 'InvitationsController.createInvitation')
  Route.post('invitations/:id', 'InvitationsController.resolve')
  Route.delete('invitations/:id', 'InvitationsController.destroy')

  Route.get('me', 'MeController.index')
  Route.put('me', 'MeController.update')
  Route.get('me/channels', 'MeController.getChannels')
  Route.get('me/invitations', 'MeController.getInvitations')
}).middleware('auth')

// GET channels - index - fetch all public channels - search - paginated
// POST channels - create - create new channel
// **GET channels/:id - show - fetch info about channel
// *DELETE channels/:id - destroy - delete channel

// POST channels/:id/join - create - join channel
// *POST channels/:id/leave - create - leave channel

// # GET invitations - index - fetch all user's invitations
// POST invitations - create - creates new invitation (data must contain user and server)
// POST invitations/:id - create - accept or decline
// DELETE invitations/:id - destroy - deletes invitation (can send only user who invited the other user)

// GET channels/:id/users - index - fetch all channel users (user must be part of channel)
// POST channels/:id/users/:id/kick - create - kick user (must be public for normal users)

// **GET channels/:id/messages - index - fetch all messages of given channel - paginated
// POST channels/:id/messages - create - create new message in channel

// GET users - fetch all users - search - paginated

// GET me - index - fetch data about currently logged in user
// UPDATE me - update - update user's data
// GET me/channels - index - fetch all user's channels
// GET me/invitations - index - fetch all user's invitations
