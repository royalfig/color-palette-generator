import { createContext } from 'react'

export type MessageType = 'error' | 'success' | 'info'

export interface MessageContextType {
  message: string | null
  messageType: MessageType | null
  showMessage: (msg: string, msgType: MessageType) => void
}

export const MessageContext = createContext<MessageContextType>({
  message: null,
  messageType: null,
  showMessage: () => {},
})
