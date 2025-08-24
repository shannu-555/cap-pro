import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Bot, User, Volume2, Download, BarChart3 } from 'lucide-react';
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
      content: 'Hello! I\'m your AI research assistant. You can ask me questions like "Show me sentiment trends for iPhone this quarter" or "Generate a competitor report comparing Amazon and Flipkart pricing". How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
  }, []);

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
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for different types of queries
    if (lowerQuery.includes('sentiment') && lowerQuery.includes('trend')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I'll show you sentiment trends analysis. Based on recent data, here are the key insights:\n\n📈 iPhone sentiment has increased by 12% this quarter\n😊 Positive mentions up 25% (mainly about camera quality)\n😔 Negative feedback down 8% (battery life improvements noted)\n\nWould you like me to generate a detailed report or show competitor comparisons?`,
        timestamp: new Date(),
        action: 'show_trends'
      };
    }
    
    if (lowerQuery.includes('competitor') && (lowerQuery.includes('report') || lowerQuery.includes('comparison'))) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I'll generate a competitor analysis report comparing pricing and features:\n\n🏢 Amazon: $899 (4.3★) - Strong logistics, competitive pricing\n🏢 Flipkart: $849 (4.1★) - Local market advantage, festival offers\n📊 Key differences: Amazon leads in customer service, Flipkart in regional pricing\n\nShall I create a comprehensive PDF report or open the interactive comparison dashboard?`,
        timestamp: new Date(),
        action: 'show_comparison'
      };
    }
    
    if (lowerQuery.includes('price') && lowerQuery.includes('drop')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I recommend the following actions for the price drop scenario:\n\n💡 Launch bundle discounts (15-20% off accessories)\n📧 Create urgency with limited-time offers\n📱 Highlight unique features competitors lack\n🎯 Target price-sensitive customer segments\n\nWould you like me to run a "What-if Analysis" to predict market response?`,
        timestamp: new Date(),
        action: 'generate_report'
      };
    }
    
    // Default intelligent response
    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: `I understand you're asking about "${query}". Let me analyze this for you:\n\n🔍 I can help you with:\n• Market sentiment analysis\n• Competitor pricing and features\n• Trend predictions and insights\n• Strategic recommendations\n\nWhat specific aspect would you like me to focus on?`,
      timestamp: new Date()
    };
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

  return (
    <Card className="glass-effect border-primary/20 animate-slide-up h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Research Assistant
          <Badge variant="outline" className="ml-auto">
            Voice Enabled
          </Badge>
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
              className="hover:shadow-soft transition-smooth"
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