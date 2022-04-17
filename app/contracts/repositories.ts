declare module '@ioc:Repositories/MessagesRepository' {
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

  export interface MessagesRepositoryContract {
    getAll(id: string): Promise<SerializedMessage[]>
    create(id: string, userId: string, content: string): Promise<SerializedMessage>
  }

  const MessagesRepository: MessagesRepositoryContract
  export default MessagesRepository
}
