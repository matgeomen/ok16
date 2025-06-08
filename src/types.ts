export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  attachment?: ChatAttachment;
}

export interface ChatAttachment {
  name: string;
  mime: string;
  contentString: string;
}

export interface ApiResponse {
  id: string;
  type: 'abort' | 'textResponse';
  textResponse: string;
  sources: {
    title: string;
    chunk: string;
  }[];
  close: boolean;
  error: string | null;
}

export interface Source {
  title: string;
  chunk: string;
}