import { apiPost } from '../apiClient';

export const AVAILABLE_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash"] as const;
export type GeminiModel = typeof AVAILABLE_MODELS[number];

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

class ChatService {
    private language: 'jp' | 'en' = 'jp';
    private currentModel: GeminiModel = 'gemini-2.5-flash';

    constructor() {}

    setLanguage(lang: 'jp' | 'en') {
        this.language = lang;
    }

    setModel(modelName: GeminiModel) {
        this.currentModel = modelName;
    }

    getCurrentModel(): GeminiModel {
        return this.currentModel;
    }

    async sendMessage(message: string, history: ChatMessage[] = []): Promise<string> {
        try {
            const token = localStorage.getItem('token');
            const data = {
                message,
                history,
                language: this.language,
                modelName: this.currentModel
            };

            const response = await apiPost<string>('/gemini/chat', data, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            return response;
        } catch (error: any) {
            console.error('[ChatService] Error sending message:', error);
            throw new Error(`Failed to get response from AI: ${error.message || 'Unknown error'}`);
        }
    }

    async startConversation(language: 'jp' | 'en'): Promise<string> {
        this.setLanguage(language);

        const greeting = language === 'jp'
            ? 'こんにちは！日本語の練習を始めましょう。何でも聞いてください！'
            : 'Hello! Let\'s practice English together. Feel free to ask me anything!';

        return greeting;
    }
}

export const chatService = new ChatService();
