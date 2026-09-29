'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Send,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

type Document = {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  content: string | null;
  status: string;
  created_at: string;
};

type Summary = {
  id: string;
  summary: string;
  confidence: number | null;
};

type Entity = {
  id: string;
  entity_type: string;
  entity_value: string;
  context?: string | null;
  confidence: number | null;
};

type QAInteraction = {
  id: string;
  question: string;
  answer: string;
  confidence: number | null;
  created_at: string;
};

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const docId = params.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [qaHistory, setQaHistory] = useState<QAInteraction[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'entities' | 'qa'>('summary');

  useEffect(() => {
    if (user) {
      fetchDocument();
      fetchSummary();
      fetchEntities();
      fetchQAHistory();
    }
  }, [user, docId]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setDocument(data);
    } catch (err) {
      console.error('Failed to fetch document:', err);
      startTransition(() => {
        router.push('/dashboard');
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await supabase
        .from('document_summaries')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchEntities = async () => {
    try {
      const { data } = await supabase
        .from('legal_entities')
        .select('*')
        .eq('document_id', docId)
        .order('entity_type', { ascending: true });

      if (data) setEntities(data);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    }
  };

  const fetchQAHistory = async () => {
    try {
      const { data } = await supabase
        .from('qa_interactions')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: false });

      if (data) setQaHistory(data);
    } catch (err) {
      console.error('Failed to fetch Q&A history:', err);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !user || !document) return;

    setAskingQuestion(true);
    try {
      // For MVP, we'll create a mock answer
      // In production, this would call the Python NLP backend
      const mockAnswer =
        'This is a simulated AI response. In production, this would be powered by Hugging Face Transformers and custom NLP models trained on legal documents.';

      const { data, error } = await supabase
        .from('qa_interactions')
        .insert({
          user_id: user.id,
          document_id: docId,
          question: question.trim(),
          answer: mockAnswer,
          confidence: 0.85,
        })
        .select()
        .single();

      if (error) throw error;

      setQaHistory([data, ...qaHistory]);
      setQuestion('');
      setActiveTab('qa');
    } catch (err) {
      console.error('Failed to ask question:', err);
    } finally {
      setAskingQuestion(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-center text-slate-400">Document not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{document.title}</h1>
                  <p className="text-sm text-slate-400">{document.filename}</p>
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                document.status === 'completed'
                  ? 'bg-green-500/10 text-green-400'
                  : document.status === 'processing'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {document.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Q&A */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Ask a Question</h3>
              <div className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about this document..."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none h-24"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={askingQuestion || !question.trim()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {askingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ask AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6 border-b border-slate-700">
              {(['summary', 'entities', 'qa'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-blue-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                {summary ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Document Summary
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-4">{summary.summary}</p>
                    {summary.confidence && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Confidence Score:</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(summary.confidence * 100).toFixed(0)}%`,
                            }}
                          />
                        </div>
                        <span>{(summary.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
                    <p className="text-slate-400">
                      Summary is being generated...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Entities Tab */}
            {activeTab === 'entities' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                {entities.length > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Extracted Legal Entities
                    </h3>
                    <div className="space-y-3">
                      {entities.map((entity) => (
                        <div
                          key={entity.id}
                          className="p-4 bg-slate-700/30 rounded border border-slate-600"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-purple-400" />
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                                {entity.entity_type}
                              </span>
                            </div>
                            {entity.confidence && (
                              <span className="text-xs text-slate-400">
                                {(entity.confidence * 100).toFixed(0)}% confidence
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300">{entity.entity_value}</p>
                          {entity.context && (
                            <p className="text-xs text-slate-500 mt-2 italic">
                              Context: {entity.context.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
                    <p className="text-slate-400">
                      Extracting legal entities...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qa' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                {qaHistory.length > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Q&A History
                    </h3>
                    <div className="space-y-4">
                      {qaHistory.map((qa) => (
                        <div key={qa.id} className="space-y-2">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                            <p className="text-blue-300 text-sm font-medium">Q: {qa.question}</p>
                          </div>
                          <div className="bg-slate-700/30 border border-slate-600 rounded p-3">
                            <p className="text-slate-300 text-sm">A: {qa.answer}</p>
                            {qa.confidence && (
                              <p className="text-xs text-slate-500 mt-2">
                                Confidence: {(qa.confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">
                      No questions asked yet. Ask one in the sidebar to get started!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
