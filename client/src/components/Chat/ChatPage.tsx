import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../routes/LanguageContext';
import { chatService, type ChatMessage, AVAILABLE_MODELS, type GeminiModel } from '../../services/ChatService';
import ChatLayout from '../../components/Chat/ChatLayout';

export default function ChatPage() {
    const { lang } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.5-flash');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initialize chat when component mounts or language changes
    useEffect(() => {
        const initChat = async () => {
            try {
                const greeting = await chatService.startConversation(lang as 'jp' | 'en');
                setMessages([{
                    role: 'assistant',
                    content: greeting,
                    timestamp: Date.now(),
                }]);
            } catch (error: any) {
                console.error('Failed to initialize chat:', error);
                setMessages([{
                    role: 'assistant',
                    content: `Error: ${error.message}`,
                    timestamp: Date.now(),
                }]);
            }
        };

        initChat();
    }, [lang]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage(userMessage.content, messages);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Failed to send message:', error);

            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleVoiceInput = () => {
        setIsSpeaking(!isSpeaking);
        // TODO: Implement voice input using Web Speech API
        alert('Voice input feature coming soon!');
    };

    return (
        <ChatLayout>
            <div className="h-full flex flex-col mx-auto w-full max-w-[1600px] md:p-6 overflow-hidden">
                <div className="flex-1 flex overflow-hidden bg-[#F7F7F5] md:rounded-2xl md:border md:border-gray-200 md:shadow-sm relative">
                    <div className="flex-1 flex flex-col min-w-0 relative">
                        <div className="flex flex-col h-full bg-white relative">
                            {/* Model Selector & Settings */}
                            <div className="absolute top-4 right-4 z-50 hidden md:flex items-center gap-2">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => {
                                        const newModel = e.target.value as GeminiModel;
                                        setSelectedModel(newModel);
                                        chatService.setModel(newModel);
                                    }}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                >
                                    {AVAILABLE_MODELS.map(model => (
                                        <option key={model} value={model}>
                                            {model.replace('gemini-', '').replace('-', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <button className="p-2 text-gray-500 hover:text-gray-700 bg-white shadow-sm border border-gray-100 rounded-full transition-all" title="Cài đặt">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto px-4 scroll-smooth z-40">
                                <div className="max-w-4xl mx-auto py-6 space-y-6">
                                    {messages.length === 0 && (
                                        <div className="text-center py-16 opacity-60">
                                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-2xl mx-auto flex items-center justify-center mb-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                                                    <path d="M20 2v4"></path>
                                                    <path d="M22 4h-4"></path>
                                                    <circle cx="4" cy="20" r="2"></circle>
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-800 mb-1">Bắt đầu trò chuyện</h3>
                                            <p className="text-sm text-gray-500">Hỏi về ngữ pháp, từ vựng hoặc luyện hội thoại</p>
                                        </div>
                                    )}

                                    {messages.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="pb-6 z-40 w-full max-w-3xl mx-auto sticky">
                                <div className="relative flex items-end gap-2 bg-white border border-gray-200 shadow-xl rounded-[26px] p-2 transition-all duration-300 focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-100">
                                    <button
                                        className={`p-3 rounded-full flex-shrink-0 transition-all active:scale-95 ${isSpeaking
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                            }`}
                                        title="Nói chuyện"
                                        onClick={handleVoiceInput}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 19v3"></path>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                            <rect x="9" y="2" width="6" height="13" rx="3"></rect>
                                        </svg>
                                    </button>

                                    <textarea
                                        ref={textareaRef}
                                        placeholder="Nhập tin nhắn..."
                                        className="w-full py-3 px-1 bg-transparent border-none focus:outline-none focus:ring-0 text-base resize-none max-h-48 placeholder:text-gray-400"
                                        rows={1}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        style={{ minHeight: '46px' }}
                                    />

                                    <button
                                        disabled={!inputValue.trim() || isLoading}
                                        className={`p-3 rounded-full flex-shrink-0 transition-all active:scale-95 mb-0.5 ${inputValue.trim() && !isLoading
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            }`}
                                        title="Gửi tin nhắn"
                                        onClick={handleSendMessage}
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                                                <path d="m21.854 2.147-10.94 10.939"></path>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Sidebar (Optional - shown on desktop) */}
                    <div className="fixed inset-y-0 left-0 z-[110] w-[280px] bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out -translate-x-full md:translate-x-0 md:static md:h-full flex flex-col shadow-2xl md:shadow-none">
                        <div className="p-2 flex-shrink-0">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                <span>Trò chuyện mới</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            <div className="mb-4">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cũ hơn</div>
                                <div className="space-y-0.5">
                                    <div className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm bg-[#F7F7F5] text-indigo-600 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-70">
                                            <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <span className="block truncate">Cuộc trò chuyện mới</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border-t border-gray-200 flex-shrink-0">
                            <div className="text-xs text-gray-400 text-center">Dữ liệu được lưu cục bộ</div>
                        </div>
                    </div>
                </div>
            </div>
        </ChatLayout>
    );
}
