import { ApiResponse, ChatAttachment } from './types';

const API_URL = 'https://suxr2ydt.rpcl.host/api/v1/workspace/okulyapayzeka/chat';
const API_KEY = import.meta.env.VITE_API_KEY;

export class ChatApiError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ChatApiError';
  }
}

export const sendChatMessage = async (
  message: string, 
  mode: 'query' | 'chat' = 'chat',
  sessionId: string = 'user-session-1',
  attachments?: ChatAttachment[],
  reset: boolean = false
): Promise<ApiResponse> => {
  try {
    const requestBody: any = {
      message,
      mode,
      sessionId,
      reset
    };

    // Only add attachments if they exist and have content
    if (attachments && attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = `API yanıt hatası: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (response.status === 403) {
          errorMessage = 'Geçersiz API anahtarı. Lütfen API anahtarınızı kontrol edin.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the default message
      }

      throw new ChatApiError(errorMessage, { status: response.status });
    }

    const data = await response.json();
    
    if (data.error && data.error !== 'null' && data.error !== null) {
      throw new ChatApiError(data.error, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ChatApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ChatApiError('Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin.', error);
    }
    
    throw new ChatApiError('Beklenmeyen bir hata oluştu', error);
  }
};