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

  export interface PageMetaData {
    total: number
    per_page: number
    current_page: number
    last_page: number
    first_page: number
    first_page_url: string
    last_page_url: string
    next_page_url: string | null
    previous_page_url: string | null
  }

  export interface PaginatedResponse<T> {
    meta: PageMetaData
    data: T
  }

  export interface MessagesRepositoryContract {
    getMessages(
      id: string,
      page?: number,
      limit?: number
    ): Promise<PaginatedResponse<SerializedMessage[]>>
    create(id: string, userId: string, content: string): Promise<SerializedMessage>
  }

  const MessagesRepository: MessagesRepositoryContract
  export default MessagesRepository
}
