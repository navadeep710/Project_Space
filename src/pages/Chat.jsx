import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send } from 'lucide-react';

// MUI components for formatted responses
import { Box, Typography, Divider, IconButton, useMediaQuery } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Syntax highlighter for code blocks
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- HELPER COMPONENTS & FUNCTIONS FOR FORMATTED RESPONSE ---

// Fix for a common benign ResizeObserver error in development
if (typeof window !== "undefined" && !window.__resizeObserverErrorPatched) {
  window.__resizeObserverErrorPatched = true;
  const origConsoleError = window.console.error;
  window.console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes("ResizeObserver loop")) {
      return;
    }
    origConsoleError.apply(window.console, args);
  };
}

// Simple code block component
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const detectedLanguage = language || 'javascript';

  return (
    <Box sx={{ position: 'relative', my: 1.5, backgroundColor: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.5, backgroundColor: '#2d2f3b' }}>
        <Typography variant="caption" sx={{ color: '#ccc', textTransform: 'lowercase' }}>
          {detectedLanguage}
        </Typography>
        <IconButton onClick={copyToClipboard} size="small" sx={{ color: copied ? '#4caf50' : '#fff' }}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <SyntaxHighlighter language={detectedLanguage} style={atomDark} customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }} PreTag="div">
        {String(code).replace(/\n$/, '')}
      </SyntaxHighlighter>
      {copied && (
         <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(76, 175, 80, 0.9)', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: '12px' }}>
          Copied!
        </Box>
      )}
    </Box>
  );
};


// Component to process and format the AI's response text
const FormattedResponse = ({ text }) => {
  // Regex to find code blocks like: ```language\n...code...\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Push the text part before the code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    // Push the code block
    parts.push({ type: 'code', content: match[2].trim(), language: match[1] || 'javascript' });
    lastIndex = match.index + match[0].length;
  }

  // Push the remaining text after the last code block
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  // Helper to format simple markdown-like text within a text part
  const formatText = (content) => {
    // Split by newlines to process line-by-line
    return content.split('\n').map((line, index) => {
      // Bold text: **text**
      const boldedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Headings: ###, ##, #
      if (line.startsWith('### ')) {
        return <Typography key={index} variant="h6" component="h3" sx={{ mt: 1.5, mb: 1, fontWeight: '600' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(4) }} />;
      }
      if (line.startsWith('## ')) {
        return <Typography key={index} variant="h5" component="h2" sx={{ mt: 2, mb: 1.5, fontWeight: '700' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(3) }} />;
      }
      if (line.startsWith('# ')) {
        return <Typography key={index} variant="h4" component="h1" sx={{ mt: 2.5, mb: 2, fontWeight: '800' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(2) }} />;
      }
      // Unordered lists: * or -
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={index} style={{ marginLeft: '20px' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(2) }} />;
      }
       // Horizontal Rule
      if (line.match(/^(---|===)$/)) {
        return <Divider key={index} sx={{ my: 2 }} />;
      }

      // Regular paragraph
      return <p key={index} dangerouslySetInnerHTML={{ __html: boldedLine }} style={{ margin: 0, padding: 0 }} />;
    });
  };

  return (
    <Box sx={{ wordBreak: 'break-word', 'strong': { fontWeight: '700' } }}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return <CodeBlock key={index} code={part.content} language={part.language} />;
        }
        return <React.Fragment key={index}>{formatText(part.content)}</React.Fragment>;
      })}
    </Box>
  );
};


// --- MAIN CHAT COMPONENT ---

const initialMessages = [
  {
    content: "Hello! I'm your AI Copilot. I can help you with code, answer questions, or assist with your work. For example, try asking me to 'write a javascript function to sort an array'.",
    role: 'assistant',
  },
];

export const Chat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage = { content: text, role: 'user' };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          model: 'llama3-8b-8192',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'An API error occurred.');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message;

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-white dark:bg-[#0f0f11] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-[#2e2e33]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-base">AI Copilot</h2>
          <p className="text-green-200 text-xs">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-[#f4f4f6] dark:bg-[#1a1c22]">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              
              <div className={`px-4 py-3 text-sm rounded-2xl shadow-md ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none dark:bg-[#2d2f3b] dark:text-white'
              }`}>
                {/* --- INTEGRATION POINT --- */}
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <FormattedResponse text={msg.content} />
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 text-sm bg-white text-gray-900 rounded-2xl shadow dark:bg-[#2d2f3b] dark:text-white">
              <div className="flex space-x-1 animate-pulse">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {error && (
            <div className="flex justify-start">
                 <div className="px-4 py-3 text-sm rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white dark:bg-[#1f212a] border-t border-gray-200 dark:border-[#2e2e33]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask me anything..."
            className="flex-1 px-5 py-2.5 rounded-full bg-gray-100 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#2a2d36] dark:text-white dark:border-[#3d3d42]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 transition rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;