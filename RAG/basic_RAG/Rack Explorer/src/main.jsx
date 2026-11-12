import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Command, Database, FileText, Layers3, LoaderCircle,
  MessageSquareText, Network, RefreshCw, Search, Send, Sparkles, Zap,
} from 'lucide-react';
import './style.css';

const API = '/api';
const steps = [
  { id: 1, title: 'Source document', caption: 'PDF loaded', icon: FileText },
  { id: 2, title: 'Chunking', caption: 'Semantic splits', icon: Layers3 },
  { id: 3, title: 'Embeddings', caption: 'Nomic Embed', icon: Network },
  { id: 4, title: 'Vector store', caption: 'ChromaDB', icon: Database },
  { id: 5, title: 'Retrieval', caption: 'Top 4 matches', icon: Search },
  { id: 6, title: 'Generation', caption: 'Groq · LLM', icon: Sparkles },
];
const suggestions = [
  'What are the main goals of this product?',
  'Who are the target users for VWO.com?',
  'What features are included in the requirements?',
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
  return body;
}

function statusTone(status) {
  if (status === 'ready') return 'ready';
  if (status === 'error') return 'error';
  if (status === 'running') return 'running';
  return 'idle';
}

function App() {
  const [status, setStatus] = useState(null);
  const [question, setQuestion] = useState('');
  const [queryBusy, setQueryBusy] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  async function refreshStatus() {
    try { setStatus(await api('/status')); } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    refreshStatus();
    const timer = window.setInterval(refreshStatus, 2500);
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', onKey); };
  }, []);

  async function ask(nextQuestion = question) {
    if (nextQuestion.trim().length < 3 || queryBusy) return;
    setError(''); setResult(null); setQueryBusy(true); setQuestion(nextQuestion);
    try { setResult(await api('/query', { method: 'POST', body: JSON.stringify({ question: nextQuestion.trim() }) })); }
    catch (err) { setError(err.message); }
    finally { setQueryBusy(false); }
  }

  async function reindex() {
    setError(''); setResult(null); setIngestBusy(true);
    try { await api('/ingest', { method: 'POST', body: '{}' }); await refreshStatus(); }
    catch (err) { setError(err.message); }
    finally { setIngestBusy(false); }
  }

  const indexed = status?.status === 'ready';
  const busy = queryBusy || ingestBusy || status?.status === 'running';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="RAG Studio home">
          <span className="brand-mark"><Network size={19} strokeWidth={2.3} /></span>
          <span className="brand-name">rag<span>studio</span><sup>✳</sup></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-icon"><Layers3 size={15} /></span>
          <span className="workspace-label"><strong>My workspace</strong><small>Personal project</small></span>
          <ChevronDown size={14} className="muted" />
        </div>
        <div className="side-section-label">BUILD</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="side-link active" href="#explorer"><Search size={16} /><span>RAG explorer</span><span className="nav-indicator" /></a>
          <a className="side-link" href="#pipeline"><Activity size={16} /><span>Pipeline</span></a>
          <a className="side-link" href="#document"><BookOpen size={16} /><span>Documents</span></a>
        </nav>
        <div className="side-section-label projects-label">YOUR PROJECT</div>
        <a className="project-link" href="#document"><span className="project-dot" /><span className="project-name">VWO.com PRD</span><span className="project-count">{status?.chunks || '—'}</span></a>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>New to RAG?</strong><p>Explore the pipeline to see how answers come together.</p><a href="#pipeline">Explore flow <ArrowUpRight size={13} /></a></div>
          <div className="profile"><span className="avatar">R</span><span className="profile-copy"><strong>Researcher</strong><small>Local workspace</small></span><span className="profile-more">···</span></div>
        </div>
      </aside>

      <main className="main-panel" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Projects</span><span className="crumb-sep">/</span><strong>VWO.com PRD</strong><span className="crumb-tag">Explorer</span></div>
          <div className="topbar-right">
            <span className="connection"><span className={`status-dot ${statusTone(status?.status)}`} />{status?.status === 'ready' ? 'All systems operational' : status?.status === 'error' ? 'Setup required' : 'Connecting pipeline'}</span>
            <span className="topbar-divider" /><button className="icon-button" title="Refresh status" onClick={refreshStatus}><RefreshCw size={15} /></button>
          </div>
        </header>

        <div className="content" id="explorer">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" />DOCUMENT INTELLIGENCE</div><h1>RAG <span>Explorer</span></h1><p>Ask questions about your document and follow every step from retrieval to answer.</p></div>
            <button className="source-pill" id="document" onClick={() => document.getElementById('document-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><FileText size={15} /><span>VWO.com PRD</span><ArrowUpRight size={13} /></button>
          </div>

          <section className="pipeline-card" id="pipeline" aria-label="RAG pipeline">
            <div className="pipeline-top"><div><span className="section-kicker">THE PIPELINE</span><h2>From document to answer</h2></div><div className="pipeline-run"><span className={`status-dot ${statusTone(status?.status)}`} />{status?.status === 'ready' ? 'Pipeline ready' : status?.stage || 'Connecting…'}</div></div>
            <div className="pipeline-steps">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const complete = indexed && index < 4;
                const active = (status?.status === 'running' && (index === 1 || index === 2 || index === 3)) || (result && index >= 4);
                return <React.Fragment key={step.id}>
                  <div className={`pipeline-step ${complete ? 'complete' : ''} ${active ? 'step-active' : ''}`}>
                    <span className="step-icon"><Icon size={17} strokeWidth={1.8} /></span><span className="step-copy"><strong>{step.title}</strong><small>{step.id === 1 && status?.pages ? `${status.pages} pages · PDF` : step.id === 2 && status?.chunks ? `${status.chunks} chunks` : step.caption}</small></span>
                  </div>
                  {index < steps.length - 1 && <div className={`step-connector ${indexed && index < 3 ? 'connected' : ''}`}><ArrowRight size={13} /></div>}
                </React.Fragment>;
              })}
            </div>
            <div className="pipeline-footer"><span><span className={`status-dot ${statusTone(status?.status)}`} />{indexed ? 'Document indexed and ready for questions' : status?.status === 'running' ? 'Preparing your document for retrieval…' : status?.status === 'error' ? 'Ingestion needs attention' : 'Starting the local ingestion pipeline…'}</span><span className="pipeline-meta">{indexed ? `${status.chunks} vectors stored` : 'Nomic Embed · ChromaDB · Groq'}</span></div>
          </section>

          <div className="workspace-grid">
            <section className="query-card">
              <div className="card-heading"><div><span className="section-kicker">ASK YOUR DOCUMENT</span><h2>What would you like to know?</h2></div><span className="ask-badge"><Sparkles size={13} />AI-powered</span></div>
              <form className="query-form" onSubmit={event => { event.preventDefault(); ask(); }}>
                <label htmlFor="question-input" className="sr-only">Ask a question about the VWO PRD</label>
                <textarea id="question-input" ref={inputRef} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(); } }} placeholder="Ask a question about your document…" disabled={!indexed || busy} rows={3} />
                <div className="input-bottom"><span className="input-hint"><Command size={12} /> K to focus <span className="hint-dot">·</span> Enter to ask</span><button className="ask-button" type="submit" disabled={!indexed || busy || question.trim().length < 3}>{queryBusy ? <><LoaderCircle size={14} className="spin" />Thinking</> : <>Ask question <Send size={14} /></>}</button></div>
              </form>
              {!indexed && <div className="index-hint"><Clock3 size={13} />{status?.status === 'error' ? 'Set up the backend to index the PDF.' : 'Questions will be available when ingestion finishes.'}</div>}
              <div className="suggestions-label">TRY ASKING</div>
              <div className="suggestions">{suggestions.map((suggestion, index) => <button key={suggestion} className="suggestion" onClick={() => { setQuestion(suggestion); if (indexed) ask(suggestion); }} disabled={!indexed || busy}><span>0{index + 1}</span>{suggestion}<ArrowUpRight size={13} /></button>)}</div>
            </section>

            <section className="document-card" id="document-card">
              <div className="card-heading"><div><span className="section-kicker">KNOWLEDGE BASE</span><h2>Source document</h2></div><button className="icon-button small" onClick={reindex} disabled={busy} title="Re-index document"><RefreshCw size={14} className={ingestBusy ? 'spin' : ''} /></button></div>
              <div className="file-preview"><div className="pdf-icon"><FileText size={21} /></div><div className="file-copy"><strong>VWO.com</strong><span>Product requirements · PDF</span></div><span className={`file-state ${statusTone(status?.status)}`}>{indexed ? <><Check size={11} /> Indexed</> : status?.status === 'running' ? <><LoaderCircle size={11} className="spin" /> Processing</> : status?.status === 'error' ? 'Needs setup' : 'Waiting'}</span></div>
              <div className="file-details"><div><span>Pages</span><strong>{status?.pages ?? '—'}</strong></div><div><span>Text chunks</span><strong>{status?.chunks ?? '—'}</strong></div><div><span>File type</span><strong>PDF</strong></div></div>
              <div className="divider" />
              <div className="model-row"><span className="model-icon purple"><Network size={14} /></span><span className="model-copy"><strong>Embedding model</strong><small>{status?.embedding_model || 'Nomic Embed Text v1.5'}</small></span><span className="model-indicator">LOCAL</span></div>
              <div className="model-row"><span className="model-icon green"><Database size={14} /></span><span className="model-copy"><strong>Vector database</strong><small>ChromaDB · local persistent</small></span><span className="model-indicator">LOCAL</span></div>
              <div className="model-row"><span className="model-icon amber"><Zap size={14} /></span><span className="model-copy"><strong>Answer model</strong><small>{status?.llm_model || 'openai/gpt-oss-120b'}</small></span><span className={`model-indicator ${status?.groq_configured ? '' : 'not-set'}`}>{status?.groq_configured ? 'READY' : 'API KEY'}</span></div>
              {status?.status === 'error' && <div className="setup-note"><strong>Backend setup required</strong><span>{status.error}</span></div>}
              <div className="storage-note"><Database size={13} /><span>Vectors are stored on this machine.</span><span className="storage-lock">LOCAL</span></div>
            </section>
          </div>

          {(error || result) && <section className={`result-section ${error ? 'result-error' : ''}`} aria-live="polite">
            <div className="result-heading"><div><span className="section-kicker">{error ? 'REQUEST STATUS' : 'RETRIEVAL & GENERATION'}</span><h2>{error ? 'Something needs attention' : 'Your answer'}</h2></div>{result && <span className="elapsed"><Clock3 size={13} />{result.elapsed_seconds}s</span>}</div>
            {error ? <div className="error-message">{error}</div> : <>
              <div className="answer-card"><div className="answer-mark"><Sparkles size={16} /></div><div className="answer-content"><div className="answer-label">GENERATED RESPONSE <span>·</span> {result.model}</div><p>{result.answer}</p><div className="answer-footnote"><BookOpen size={13} />Grounded in {result.chunks.length} retrieved source chunks</div></div></div>
              <div className="retrieval-heading"><div><span className="section-kicker">SEMANTIC SEARCH</span><h3>Retrieved context <span>({result.chunks.length})</span></h3></div><span className="retrieval-caption">Ranked by cosine similarity <ArrowDown size={13} /></span></div>
              <div className="chunk-grid">{result.chunks.map((chunk, index) => <article className="chunk-card" key={chunk.id}><div className="chunk-top"><span className="chunk-number">0{index + 1}</span><span className="match-score">{Math.round(chunk.similarity * 100)}% match</span></div><p>{chunk.text}</p><div className="chunk-footer"><span><FileText size={12} />{chunk.source}</span><span>Page {chunk.page}</span></div></article>)}</div>
            </>}
          </section>}

          {!error && !result && <div className="empty-state"><span className="empty-icon"><MessageSquareText size={17} /></span><span>Answers and retrieved passages will appear here</span><ArrowRight size={14} /></div>}

          <footer className="page-footer"><span>Built for understanding, one chunk at a time.</span><span><span className={`status-dot ${statusTone(status?.status)}`} />{status?.status === 'ready' ? 'Local pipeline connected' : 'Connecting to local pipeline'} <span className="footer-divider">·</span> RAG Studio</span></footer>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
