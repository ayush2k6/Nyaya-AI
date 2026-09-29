'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  FileText,
  Scale,
  Copy,
  Download,
} from 'lucide-react';

type IPCSection = {
  section: string;
  title: string;
  punishment: string;
  applicability: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fir?: string;
  ipcSections?: IPCSection[];
};

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Namaste! I am Nyaya AI, a system-generated legal information prototype. Please describe your matter in detail, including:\n\n• What happened (incident description)\n• When did it happen\n• Who was involved (parties)\n• Any injuries, damages, or evidence\n• Any previous complaints or FIRs filed\n\nI can organise the information into an FIR-style draft and highlight provisions for further review. This is not legal advice. You are advised to consult a qualified legal professional before taking action.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/lawyer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseDescription: input,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate analysis');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I have analyzed your case and generated the following:',
        fir: data.fir,
        ipcSections: data.ipcSections,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate analysis'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadFIR = (fir: string) => {
    const element = document.createElement('a');
    const file = new Blob([fir], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'FIR_Report.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white">
              <img src="/images/nyaya-scales.png" alt="Nyaya scales logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Nyaya AI</h1>
              <p className="text-xs text-slate-400">
                System-generated legal information prototype
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs leading-5 text-yellow-100"><span className="font-semibold">Important:</span> Responses are system-generated and informational only. You are advised to consult a qualified legal professional before taking action.</div>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                    : 'bg-slate-800 text-slate-50 rounded-lg rounded-tl-none'
                } p-4 shadow-lg`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* FIR Display */}
                {message.fir && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-yellow-400" />
                          <h3 className="font-bold text-white">
                            FIR - First Information Report
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(message.fir!)}
                            className="p-2 hover:bg-slate-600 rounded transition-colors"
                            title="Copy FIR"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadFIR(message.fir!)}
                            className="p-2 hover:bg-slate-600 rounded transition-colors"
                            title="Download FIR"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded p-3 max-h-64 overflow-y-auto text-xs whitespace-pre-wrap font-mono text-slate-200">
                        {message.fir}
                      </div>
                    </div>
                  </div>
                )}

                {/* IPC Sections Display */}
                {message.ipcSections && message.ipcSections.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-white">
                        Applicable IPC Sections
                      </h3>
                    </div>

                    {message.ipcSections.map((section, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 cursor-pointer hover:border-purple-500/50 transition-colors"
                        onClick={() =>
                          setActiveMessage(
                            activeMessage === section.section
                              ? null
                              : section.section
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-purple-300 text-sm">
                              Section {section.section}
                            </div>
                            <div className="text-white font-semibold text-sm">
                              {section.title}
                            </div>
                          </div>
                        </div>

                        {activeMessage === section.section && (
                          <div className="mt-3 space-y-2 pt-3 border-t border-slate-600">
                            <div>
                              <p className="text-xs text-slate-300 font-semibold">
                                PUNISHMENT:
                              </p>
                              <p className="text-xs text-slate-200">
                                {section.punishment}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-300 font-semibold">
                                WHY APPLICABLE:
                              </p>
                              <p className="text-xs text-slate-200">
                                {section.applicability}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-50 rounded-lg rounded-tl-none p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Analyzing your case...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-slate-800/50 bg-slate-900/20 backdrop-blur sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe your legal case in detail..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-6 py-3 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press Shift+Enter for new line, Enter to send
          </p>
        </div>
      </footer>
    </div>
  );
}
