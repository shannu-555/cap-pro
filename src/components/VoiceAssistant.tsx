import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Send, Bot, User, Volume2, Download, BarChart3, Trash2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: 'generate_report' | 'show_comparison' | 'show_trends';
}

interface VoiceAssistantProps {
  onQueryGenerated?: (queryId: string) => void;
  onComparisonRequested?: () => void;
}

export function VoiceAssistant({ onQueryGenerated, onComparisonRequested }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI research assistant powered by OpenAI. You can ask me questions like "Show me sentiment trends for iPhone this quarter" or "Generate a competitor report comparing Amazon and Flipkart pricing". How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (voiceEnabled && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [voiceEnabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processNaturalLanguageQuery = async (query: string): Promise<Message> => {
    try {
      // First, try to understand if the user is asking for specific data
      const lowerQuery = query.toLowerCase();
      let realDataContext = '';

      // Check if we can provide real data context
      if (lowerQuery.includes('competitor') || lowerQuery.includes('price') || lowerQuery.includes('comparison')) {
        try {
          const { data: competitorData } = await supabase
            .from('competitor_data')
            .select(`
              competitor_name,
              price,
              rating,
              features,
              research_queries!inner(query_text, query_type)
            `)
            .limit(5);

          if (competitorData && competitorData.length > 0) {
            realDataContext = `\n\nBased on recent market research data:\n${competitorData.map(c => 
              `• ${c.competitor_name}: $${c.price || 'N/A'}, Rating: ${c.rating || 'N/A'}/5`
            ).join('\n')}`;
          }
        } catch (error) {
          console.error('Error fetching competitor context:', error);
        }
      }

      if (lowerQuery.includes('sentiment') || lowerQuery.includes('opinion')) {
        try {
          const { data: sentimentData } = await supabase
            .from('sentiment_analysis')
            .select(`
              sentiment,
              confidence,
              source,
              research_queries!inner(query_text)
            `)
            .limit(5);

          if (sentimentData && sentimentData.length > 0) {
            const avgSentiment = sentimentData.reduce((acc, s) => acc + s.confidence, 0) / sentimentData.length;
            realDataContext += `\n\nRecent sentiment analysis shows:\n• Average confidence: ${avgSentiment.toFixed(1)}%\n• Sources analyzed: ${sentimentData.map(s => s.source).join(', ')}`;
          }
        } catch (error) {
          console.error('Error fetching sentiment context:', error);
        }
      }

      // Call the Gemini AI assistant with enhanced context
      const enhancedQuery = `${query}${realDataContext}

Please provide a helpful response that:
1. Directly addresses the user's question
2. Uses the real data context if provided
3. Suggests actionable next steps
4. Mentions specific features like comparison dashboard, sentiment analysis, or PDF reports when relevant`;

      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: { 
          message: enhancedQuery,
          userId: 'user-' + Date.now()
        }
      });

      if (error) {
        console.error('Gemini assistant error:', error);
        // Enhanced fallback response based on query content
        let fallbackResponse = `I'm here to help with market research analysis. `;
        
        if (lowerQuery.includes('competitor')) {
          fallbackResponse += `For competitor analysis, I can help you:\n• Compare pricing and features across competitors\n• Generate comprehensive competitor reports\n• Analyze market positioning`;
        } else if (lowerQuery.includes('sentiment')) {
          fallbackResponse += `For sentiment analysis, I can:\n• Track customer opinions across social media\n• Monitor brand sentiment trends\n• Provide sentiment breakdowns by source`;
        } else if (lowerQuery.includes('trend')) {
          fallbackResponse += `For trend analysis, I can:\n• Identify emerging market patterns\n• Track search volume changes\n• Predict market direction`;
        } else if (lowerQuery.includes('report') || lowerQuery.includes('pdf')) {
          fallbackResponse += `I can generate comprehensive PDF reports including:\n• Executive summary with key insights\n• Detailed competitor analysis\n• Sentiment trends and market data\n• Actionable recommendations`;
        } else {
          fallbackResponse += `I can assist with:\n🔍 Market research and competitor analysis\n📊 Sentiment tracking and trend analysis\n📑 Professional PDF report generation\n🎯 Strategic recommendations`;
        }

        return {
          id: Date.now().toString(),
          type: 'assistant',
          content: fallbackResponse,
          timestamp: new Date()
        };
      }

      const responseText = data?.response || data?.fallback || 
        `I can help analyze "${query}" for you. What specific market research would you like me to perform?`;

      // Determine if we should trigger any actions based on the query
      let action: 'generate_report' | 'show_comparison' | 'show_trends' | undefined;
      
      if (lowerQuery.includes('competitor') && (lowerQuery.includes('report') || lowerQuery.includes('comparison'))) {
        action = 'show_comparison';
      } else if (lowerQuery.includes('sentiment') && lowerQuery.includes('trend')) {
        action = 'show_trends';
      } else if (lowerQuery.includes('report') || lowerQuery.includes('pdf')) {
        action = 'generate_report';
      }

      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
        action
      };
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I'm experiencing some technical difficulties, but I'm still here to help! You can ask me about:\n\n• Market sentiment analysis\n• Competitor research and pricing\n• Trend analysis and forecasting\n• Professional report generation\n\nWhat would you like to explore?`,
        timestamp: new Date()
      };
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Process the natural language query
      const assistantMessage = await processNaturalLanguageQuery(messageText);
      
      // Add assistant response after delay
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        
        // Handle actions
        if (assistantMessage.action === 'show_comparison' && onComparisonRequested) {
          setTimeout(() => onComparisonRequested(), 1000);
        }
      }, 1000);

    } catch (error) {
      console.error('Error processing query:', error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Could not process your request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: 'Hello! I\'m your AI research assistant. You can ask me questions like "Show me sentiment trends for iPhone this quarter" or "Generate a competitor report comparing Amazon and Flipkart pricing". How can I help you today?',
        timestamp: new Date()
      }
    ]);
    toast({
      title: "Chat Cleared",
      description: "Chat history has been cleared.",
    });
  };

  return (
    <Card className="professional-card border-primary/20 animate-slide-up h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Research Assistant
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Voice Enabled
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearChatHistory}
            className="ml-auto h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 pb-2">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 border border-border/50'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.type === 'assistant' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => speakMessage(message.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                          {message.action === 'generate_report' && (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          {message.action === 'show_comparison' && (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <BarChart3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about market research, competitors, or trends..."
                className="pr-12"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                  isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputText.trim() || isProcessing}
              className="btn-professional hover:shadow-soft transition-smooth"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-muted-foreground mt-2 animate-pulse">
              🎤 Listening... Speak your question now
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}