'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Scale,
  Copy,
  Download,
  FileText,
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

export default function LawyerChatbot() {
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
        content: 'I have organised the information into the following system-generated draft:',
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
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#07101d] text-slate-100 selection:bg-amber-300/30">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -left-40 top-24 size-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 bottom-24 size-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <header className="relative z-10 border-b border-white/[0.08] bg-[#0b1728]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white shadow-[0_0_24px_rgba(251,191,36,0.16)]">
              <img
                src="/images/nyaya-scales.png"
                alt="Nyaya AI logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Nyaya AI</h1>
              <p className="text-xs text-slate-400">System-generated legal information prototype</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Prototype mode
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
          <div className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-[#12243b] via-[#0d1b2e] to-[#0a1524] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_58%)]" />
            <div className="relative max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300"><span className="h-px w-7 bg-amber-300/70" /> Private case workspace</div>
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Explain your matter.<br /><span className="text-slate-400">Get a structured legal brief.</span></h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Share the facts in your own words. This prototype will organise the incident, identify information gaps, prepare an FIR draft, and show provisions for further review.</p>
              <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-xs leading-5 text-amber-100/80"><span className="font-semibold text-amber-200">Important:</span> This is a system-generated response for informational purposes only. You are advised to consult a qualified legal professional before taking action.</div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5">Incident facts</span>
                <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5">People involved</span>
                <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5">Evidence & witnesses</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-blue-950/30'
                    : 'bg-[#102035]/90 text-slate-100 rounded-2xl rounded-tl-md border border-white/[0.08] shadow-xl shadow-black/15 backdrop-blur'
                } p-5`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* FIR Display */}
                {message.fir && (
                  <div className="mt-6 space-y-4">
                    <div className="mt-5 rounded-xl border border-slate-700 bg-[#0a1524] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-amber-400/10 p-2"><FileText className="w-5 h-5 text-amber-300" /></div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Draft document</p>
                            <h3 className="font-semibold text-white">First Information Report</h3>
                          </div>
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
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-lg bg-violet-400/10 p-2"><Scale className="w-5 h-5 text-violet-300" /></div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Legal assessment</p>
                        <h3 className="font-semibold text-white">Potentially relevant provisions</h3>
                      </div>
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
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] bg-[#0b1728]/80 backdrop-blur-xl sticky bottom-0">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4">
          <div className="flex items-end gap-3 rounded-[1.35rem] border border-white/[0.1] bg-[#102035]/95 p-2 shadow-2xl shadow-black/20 transition-colors focus-within:border-amber-300/60 focus-within:ring-4 focus-within:ring-amber-300/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe what happened, when, who was involved, and what evidence you have..."
              aria-label="Describe your legal case"
              rows={2}
              className="min-h-14 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white placeholder-slate-500 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send case details"
              className="h-12 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-xl px-5 transition-colors flex items-center gap-2"
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
          <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Shift+Enter for a new line · Enter to send</p>
            <p>System-generated information only · Consult a qualified legal professional before acting.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
