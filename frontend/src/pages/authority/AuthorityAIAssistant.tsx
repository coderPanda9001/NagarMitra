import React, { useState } from 'react';
import { Bot, Send, Info, CheckCircle2, HelpCircle, AlertTriangle, RefreshCcw, Users } from 'lucide-react';
import { authService } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface AssistantMeta {
  intent: string;
  confidence: number;
  paramsValidated: boolean;
  rowCountUsed: number;
  primarySqlQuery: string;
  clarification?: boolean;
  dbBacked: boolean;
}

interface AssistantResponse {
  answerText: string;
  structured?: any;
  meta: AssistantMeta;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  meta?: AssistantMeta;
}

const SUGGESTION_CHIPS = [
  { label: 'How many Roads & Potholes in Ward K-West',
    query: 'How many Roads & Potholes issues are there in Ward K-West?' },
  { label: 'Show In Progress count',
    query: 'How many issues are currently In Progress?' },
  { label: 'SLA summary last 7 days',
    query: 'Summarize SLA status across departments for the last 7 days.' },
  { label: 'List open in Ward K-West',
    query: 'List open issues in Ward K-West.' },
  { label: 'Air Quality Ward A count',
    query: 'How many Air Quality issues are there in Ward A?' },
  { label: 'Priority queue by department workload',
    query: 'Show department workload and priority queue.' },
];

function buildConfidenceLabel(conf: number): string {
  if (conf >= 0.9) return 'High';
  if (conf >= 0.75) return 'Moderate';
  return 'Low';
}

export const AuthorityAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Hello Officer! I am NagarMitra, your ward operations assistant. I only answer from real database queries. Ask about workloads, SLA, counts, duplicates, or priorities.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthHeader = (): Record<string, string> => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const camelizeMeta = (raw: any): AssistantMeta => ({
    intent: raw.intent ?? 'unknown',
    confidence: Number(raw.confidence ?? 0),
    paramsValidated: Boolean(raw.params_validated ?? raw.paramsValidated),
    rowCountUsed: Number(raw.row_count_used ?? raw.rowCountUsed ?? 0),
    primarySqlQuery: raw.primary_sql_query ?? raw.primarySqlQuery ?? '',
    clarification: Boolean(raw.clarification),
    dbBacked: Boolean(raw.db_backed ?? raw.dbBacked ?? true),
  });

  const runQuery = async (userText: string): Promise<AssistantResponse | null> => {
    if (USE_MOCK) {
      const clarification = !userText.match(/(roads|pothole|garbage|sanitation|ward|sla|count|workload|in progress|open)/i);
      return {
        answerText: clarification
          ? 'Could you clarify? Please specify the ward, category, or status you would like to query about. You can use the suggestion chips below.'
          : `Demo mode: In live mode, I would answer this from real DB rows. Row count used 0 in mock environment.`,
        structured: null,
        meta: {
          intent: 'count_issues',
          confidence: clarification ? 0.55 : 0.82,
          paramsValidated: !clarification,
          rowCountUsed: 0,
          primarySqlQuery: '-- Mock Mode: Live SQL not executed --',
          clarification,
          dbBacked: false,
        },
      };
    }
    try {
      const user = authService.getCurrentUser();
      const response = await fetch(`${API_BASE_URL}/ai/assistant/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          user_id: user?.id ?? '',
          text: userText,
          role: user?.role ?? 'Authority',
        }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return {
          answerText: `I had trouble reaching the AI service. ${errText ? 'Reason: ' + errText : ''}`,
          meta: {
            intent: 'error',
            confidence: 0,
            paramsValidated: false,
            rowCountUsed: 0,
            primarySqlQuery: '',
            dbBacked: false,
          },
        };
      }
      const raw = await response.json();
      return {
        answerText: raw.answer_text ?? raw.answerText ?? '(no answer)',
        structured: raw.structured,
        meta: camelizeMeta(raw.meta ?? {}),
      };
    } catch (err: any) {
      return {
        answerText: 'I encountered an error contacting the backend: ' + (err?.message ?? String(err)),
        meta: {
          intent: 'error',
          confidence: 0,
          paramsValidated: false,
          rowCountUsed: 0,
          primarySqlQuery: '',
          dbBacked: false,
        },
      };
    }
  };

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    const userMsg: ChatMessage = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    void (async () => {
      const res = await runQuery(trimmed);
      if (!res) {
        setLoading(false);
        return;
      }
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: res.answerText,
        meta: res.meta,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    })();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Authority AI Triage Assistant</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> LIVE DB-BACKED
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Natural-language queries execute validated, structured queries only — never made-up numbers.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-700 text-white'
                    : 'bg-sky-100 text-sky-900'
                }`}
              >
                {m.sender === 'user' ? <Send className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2 max-w-md">
                <div
                  className={`p-3.5 rounded-2xl text-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>

                {m.meta && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                      <Users className="w-3 h-3" /> rows: {m.meta.rowCountUsed}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                      intent: {m.meta.intent.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.meta.confidence >= 0.75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.meta.confidence >= 0.5
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      confidence: {buildConfidenceLabel(m.meta.confidence)} ({m.meta.confidence.toFixed(2)})
                    </span>
                    {m.meta.clarification && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <HelpCircle className="w-3 h-3" /> clarification needed
                      </span>
                    )}
                    {!m.meta.paramsValidated && !m.meta.clarification && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> slots not validated
                      </span>
                    )}
                    {!m.meta.dbBacked && m.meta.intent !== 'error' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-300">
                        <Info className="w-3 h-3" /> MOCK
                      </span>
                    )}
                    {m.meta.primarySqlQuery && (
                      <details className="text-[10px] text-slate-500 ml-1 max-w-[320px]">
                        <summary className="cursor-pointer underline decoration-dotted">view query</summary>
                        <pre className="mt-1 whitespace-pre-wrap break-all bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-700">
                          {m.meta.primarySqlQuery}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-sky-100 text-sky-900">
                <RefreshCcw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl text-xs bg-slate-100 text-slate-600 rounded-tl-none border border-slate-200 italic">
                Validating slots and running real DB query…
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-2 border-t border-slate-100 flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(chip.query)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="p-4 border-t border-slate-100 flex gap-3">
          <input
            type="text"
            placeholder='Ask AI assistant about ward reports, e.g. "How many potholes in Ward K-West?"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}{' '}
            {loading ? 'Running' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
