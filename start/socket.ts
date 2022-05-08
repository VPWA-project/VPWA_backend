/*
|--------------------------------------------------------------------------
| Websocket events
|--------------------------------------------------------------------------
|
| This file is dedicated for defining websocket namespaces and event handlers.
|
*/

import Ws from '@ioc:Ruby184/Socket.IO/Ws'

Ws.namespace('/')
  .connected('ActivityController.onConnected')
  .disconnected('ActivityController.onDisconnected')
  .on('user:sendStatus', 'ActivityController.changeStatus')

Ws.namespace('invitations')
  .connected('InvitationsController.onConnected')
  .on('invitation:create', 'InvitationsController.createInvitation')

// this is dynamic namespace, in controller methods we can use params.name
Ws.namespace('channels/:name')
  .middleware('channel')
  .connected('ChannelsController.onConnected')
  .disconnected('ChannelsController.onDisconnected')
  .on('loadMessages', 'MessagesController.loadMessages')
  .on('addMessage', 'MessagesController.addMessage')
  .on('user:sendKick', 'ChannelsController.kick')
  .on('channel:sendTyping', 'MessagesController.sendTypingMessage')
  .on('channel:leave', 'ChannelsController.leave')
