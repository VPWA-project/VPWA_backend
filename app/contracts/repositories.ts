declare module '@ioc:Repositories/MessageRepository' {
  export interface SerializedMessage {
    userId: string
    message: string
    channelId: string
    createdAt: string
    updatedAt: string
    id: string
    user: {
      id: string
      email: string
      createdAt: string
      updatedAt: string
    }
  }

  export interface MessageRepositoryContract {
    getAll(channelName: string): Promise<SerializedMessage[]>
    create(channelName: string, userId: string, content: string): Promise<SerializedMessage>
  }

  const MessageRepository: MessageRepositoryContract
  export default MessageRepository
}
