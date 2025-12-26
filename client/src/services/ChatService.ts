import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!API_KEY) {
    console.warn('[ChatService] VITE_GEMINI_API_KEY not found in environment variables');
}

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
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel | null = null;
    private language: 'jp' | 'en' = 'jp';
    private currentModel: GeminiModel = 'gemini-2.5-flash';

    constructor() {
        this.genAI = new GoogleGenerativeAI(API_KEY);
    }

    setLanguage(lang: 'jp' | 'en') {
        this.language = lang;
        this.model = null; // Reset model when language changes
    }

    setModel(modelName: GeminiModel) {
        this.currentModel = modelName;
        this.model = null; // Reset model to force recreation with new model name
    }

    getCurrentModel(): GeminiModel {
        return this.currentModel;
    }

    private getSystemPrompt(): string {
        if (this.language === 'jp') {
            return `You are a helpful Japanese language tutor. Your role is to:
- Help students practice Japanese conversation
- Correct grammar mistakes gently and explain them
- Suggest better vocabulary or more natural expressions
- Provide cultural context when appropriate
- Always respond in Japanese (unless the student needs an explanation in Vietnamese for complex grammar)
- Be encouraging and supportive
- Keep responses concise and focused on learning

When the user makes a mistake, gently correct it and explain why. Use examples to help them understand.`;
        } else {
            return `You are a helpful English language tutor. Your role is to:
- Help students practice English conversation
- Correct grammar mistakes gently and explain them
- Suggest better vocabulary or more natural expressions
- Provide cultural context when appropriate
- Always respond in English (unless the student needs an explanation in Vietnamese for complex grammar)
- Be encouraging and supportive
- Keep responses concise and focused on learning

When the user makes a mistake, gently correct it and explain why. Use examples to help them understand.`;
        }
    }

    private getModel(): GenerativeModel {
        if (!this.model) {
            this.model = this.genAI.getGenerativeModel({
                model: this.currentModel,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            });
        }
        return this.model;
    }

    async sendMessage(message: string, history: ChatMessage[] = []): Promise<string> {
        if (!API_KEY) {
            throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
        }

        try {
            const model = this.getModel();

            // Build conversation history as a single prompt
            let conversationContext = this.getSystemPrompt() + '\n\n';

            if (history.length > 0) {
                conversationContext += 'Previous conversation:\n';
                history.forEach(msg => {
                    const role = msg.role === 'user' ? 'Student' : 'Tutor';
                    conversationContext += `${role}: ${msg.content}\n`;
                });
                conversationContext += '\n';
            }

            conversationContext += `Student: ${message}\n\nTutor:`;

            const result = await model.generateContent(conversationContext);
            const response = result.response;
            return response.text();
        } catch (error: any) {
            console.error('[ChatService] Error sending message:', error);

            if (error.message?.includes('API key')) {
                throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY configuration.');
            }

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
