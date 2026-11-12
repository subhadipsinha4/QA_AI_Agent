import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, FileCheck2, FileText, FlaskConical, Github, LayoutDashboard, Link2, LoaderCircle, Moon, Plus, Search, Settings2, ShieldCheck, Sparkles, Sun, X } from 'lucide-react';
import './style.css';

const API = '/api';
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
const initials = (text = '') => text.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
function App() {
  const [page, setPage] = useState('dashboard');
  const [dark, setDark] = useState(localStorage.getItem('tps-theme') === 'dark');
  const [status, setStatus] = useState({ llm: {}, jira: {} });
  const [config, setConfig] = useState({ provider: 'Groq', model: 'openai/gpt-oss-20b', baseUrl: '', apiKey: '', jiraUrl: '', email: '', apiToken: '' });
  const [jiraKey, setJiraKey] = useState('');
  const [issue, setIssue] = useState(null);
  const [additional, setAdditional] = useState('');
  const [plan, setPlan] = useState(null);
  const [cases, setCases] = useState([]);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);
  const [planApproved, setPlanApproved] = useState(false);

  const refreshStatus = async () => { try { const data = await request('/settings/status'); setStatus(data); setConfig((old) => ({ ...old, provider: data.llm.provider || old.provider, model: data.llm.model || old.model, baseUrl: data.llm.baseUrl || old.baseUrl, jiraUrl: data.jira.baseUrl || old.jiraUrl, email: data.jira.email || old.email })); } catch {} };
  useEffect(() => { refreshStatus(); }, []);
  useEffect(() => { localStorage.setItem('tps-theme', dark ? 'dark' : 'light'); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  const toast = (kind, message) => { setNotice({ kind, message }); window.setTimeout(() => setNotice(null), 4500); };
  const navigate = (next) => { setPage(next); setNotice(null); };
  useEffect(() => { window.__navigate = navigate; }, []);
  async function testLlm() { setBusy('llm-test'); try { const r = await request('/settings/test-llm', { method: 'POST', body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, model: config.model, baseUrl: config.baseUrl }) }); toast('success', r.message); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function saveLlm() { setBusy('llm-save'); try { await request('/settings', { method: 'POST', body: JSON.stringify({ llm: { provider: config.provider, apiKey: config.apiKey, model: config.model, baseUrl: config.baseUrl } }) }); await refreshStatus(); toast('success', 'LLM settings saved on this device.'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function testJira() { setBusy('jira-test'); try { const r = await request('/settings/test-jira', { method: 'POST', body: JSON.stringify({ baseUrl: config.jiraUrl, email: config.email, apiToken: config.apiToken }) }); toast('success', r.message); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function saveJira() { setBusy('jira-save'); try { await request('/settings', { method: 'POST', body: JSON.stringify({ jira: { baseUrl: config.jiraUrl, email: config.email, apiToken: config.apiToken } }) }); await refreshStatus(); toast('success', 'Jira settings saved on this device.'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function fetchIssue(event) { event?.preventDefault(); setBusy('issue'); try { const data = await request(`/jira/${encodeURIComponent(jiraKey.trim())}`); setIssue(data); setPlan(null); setCases([]); setPlanApproved(false); setPage('issue'); toast('success', `${data.key} loaded`); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function generatePlan() { setBusy('plan'); try { const data = await request('/plans/generate', { method: 'POST', body: JSON.stringify({ jiraIssue: issue, additionalContext: additional }) }); setPlan(data); setPlanApproved(false); setCases([]); setPage('plan'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function savePlanEdit() { setBusy('plan-save'); try { await request(`/plans/${plan.planId}`, { method: 'PUT', body: JSON.stringify({ plan }) }); setPlanApproved(false); toast('success', 'Plan changes saved. Review and approve again to continue.'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function approvePlan() { setBusy('approve'); try { await request(`/plans/${plan.planId}`, { method: 'PUT', body: JSON.stringify({ plan }) }); await request(`/plans/${plan.planId}/approve`, { method: 'POST', body: '{}' }); setPlanApproved(true); toast('success', 'Plan approved. Test cases are ready to generate.'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  async function generateCases() { setBusy('cases'); try { const data = await request(`/plans/${plan.planId}/test-cases`, { method: 'POST', body: JSON.stringify({ jiraIssue: issue, additionalContext: additional }) }); setCases(data.testCases); setPage('results'); } catch (e) { toast('error', e.message); } finally { setBusy(''); } }
  function updatePlan(path, value) { setPlan((old) => { const next = structuredClone(old); let cursor = next; for (const key of path.slice(0, -1)) cursor = cursor[key]; cursor[path.at(-1)] = value; return { ...next, approval: 'pending' }; }); setPlanApproved(false); }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'llm', label: 'LLM connection', icon: Sparkles, done: status.llm?.configured },
    { id: 'jira-settings', label: 'Jira connection', icon: Link2, done: status.jira?.configured },
    { id: 'issue', label: 'Jira issue', icon: Search },
    { id: 'plan', label: 'Plan review', icon: FileCheck2 },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><FlaskConical size={19} /></div><div><strong>TestPlan</strong><span>STUDIO</span></div><button className="icon-btn collapse-btn" aria-label="Collapse sidebar"><ChevronLeft size={16} /></button></div>
      <div className="workspace-switch"><div className="workspace-logo">T</div><div className="workspace-meta"><strong>Test Workspace</strong><small>Personal workspace</small></div><ChevronDown size={15} /></div>
      <div className="side-label">WORKSPACE</div>
      <nav className="navigation">{navItems.map(({ id, label, icon: Icon, done }) => <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={17} /><span>{label}</span>{done && <span className="nav-check"><Check size={12} /></span>}</button>)}</nav>
      <div className="side-label secondary-label">YOUR WORK</div>
      <button className={`nav-link ${page === 'results' ? 'active' : ''}`} onClick={() => navigate('results')}><FileText size={17} /><span>Generated cases</span></button>
      <div className="sidebar-spacer" />
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={16} /></div><div><strong>Need a hand?</strong><small>Visit the help center</small></div><ChevronRight size={15} /></div><button className="profile"><div className="avatar">SS</div><div><strong>Subhadip Sinha</strong><small>Personal plan</small></div><ChevronDown size={15} /></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle(page)}</strong></div><div className="top-actions"><button className="icon-btn theme-btn" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="help-top"><CircleHelp size={16} /> <span>Help & feedback</span></button><div className="avatar top-avatar">SS</div></div></header>
      <div className="content-wrap">
        {page === 'dashboard' && <Dashboard status={status} issue={issue} onNavigate={navigate} />}
        {page === 'llm' && <SettingsPage type="llm" config={config} setConfig={setConfig} busy={busy} onTest={testLlm} onSave={saveLlm} connected={status.llm?.configured} />}
        {page === 'jira-settings' && <SettingsPage type="jira" config={config} setConfig={setConfig} busy={busy} onTest={testJira} onSave={saveJira} connected={status.jira?.configured} />}
        {page === 'issue' && <IssuePage issue={issue} jiraKey={jiraKey} setJiraKey={setJiraKey} additional={additional} setAdditional={setAdditional} busy={busy} onFetch={fetchIssue} onPlan={generatePlan} />}
        {page === 'plan' && <PlanPage plan={plan} updatePlan={updatePlan} busy={busy} approved={planApproved} onBack={() => navigate('issue')} onSave={savePlanEdit} onApprove={approvePlan} onGenerate={generateCases} />}
        {page === 'results' && <ResultsPage cases={cases} issue={issue} plan={plan} busy={busy} onGenerate={generateCases} />}
      </div>
    </main>
    {notice && <div className={`toast ${notice.kind}`}><span className="toast-dot" />{notice.message}<button className="toast-close" onClick={() => setNotice(null)}><X size={14} /></button></div>}
  </div>;
}

function pageTitle(page) { return ({ dashboard: 'Dashboard', llm: 'LLM connection', 'jira-settings': 'Jira connection', issue: 'Jira issue', plan: 'Test plan review', results: 'Generated cases' })[page] || 'Dashboard'; }
function PageHeader({ eyebrow = 'OVERVIEW', title, subtitle, right }) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{right}</div>; }
function Dashboard({ status, issue, onNavigate }) {
  const tasks = [
    { number: '01', title: 'Connect your LLM', description: 'Add an API key and choose the model that will draft your test plans.', target: 'llm', done: status.llm?.configured, icon: Sparkles, tag: 'AI PROVIDER' },
    { number: '02', title: 'Connect Jira', description: 'Link your Jira workspace to securely fetch issue requirements.', target: 'jira-settings', done: status.jira?.configured, icon: Link2, tag: 'INTEGRATION' },
    { number: '03', title: 'Fetch a Jira issue', description: 'Load a ticket and review its requirements before planning.', target: 'issue', done: Boolean(issue), icon: Search, tag: 'START HERE' },
    { number: '04', title: 'Review your test plan', description: 'Approve the plan before generating executable test cases.', target: 'plan', done: false, icon: FileCheck2, tag: 'HUMAN REVIEW' },
  ];
  const completed = tasks.filter((t) => t.done).length;
  return <><PageHeader eyebrow="WORKSPACE OVERVIEW" title="Good morning, Subhadip" subtitle="Your test planning workspace is ready when you are." right={<button className="button button-primary" onClick={() => onNavigate('issue')}><Plus size={16} /> New test plan</button>} />
    <div className="welcome-banner"><div className="welcome-copy"><div className="welcome-kicker"><span className="live-dot" /> YOUR WORKFLOW</div><h2>From Jira ticket to<br /><em>test-ready confidence.</em></h2><p>Connect your tools, review the plan, and generate cases with a human approval step built in.</p><button className="button button-white" onClick={() => onNavigate(!status.llm?.configured ? 'llm' : !status.jira?.configured ? 'jira-settings' : 'issue')}>Continue setup <ChevronRight size={16} /></button></div><div className="welcome-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-card back-card"><FileText size={18} /><span>Requirements</span><i>3</i></div><div className="art-card middle-card"><Sparkles size={16} /><span>Plan drafted</span><Check size={15} /></div><div className="art-card front-card"><div className="art-check"><Check size={17} /></div><div><strong>Ready for review</strong><small>Human approval required</small></div></div><div className="art-spark s1">✳</div><div className="art-spark s2">✦</div></div><div className="banner-count"><strong>{String(completed).padStart(2, '0')}</strong><span>of 4 steps complete</span></div></div>
    <div className="section-heading"><div><h2>Get started</h2><p>A few quick steps to set up your workspace.</p></div><button className="text-button" onClick={() => onNavigate('issue')}>View workflow <ChevronRight size={15} /></button></div>
    <div className="setup-list">{tasks.map((task) => { const Icon = task.icon; return <button className={`setup-row ${task.done ? 'complete' : ''}`} key={task.number} onClick={() => onNavigate(task.target)}><div className="setup-icon"><Icon size={18} /></div><div className="setup-copy"><div><strong>{task.title}</strong>{task.done && <span className="complete-label"><Check size={11} /> Connected</span>}</div><p>{task.description}</p></div><span className="setup-tag">{task.tag}</span><div className="step-number">{task.done ? <Check size={15} /> : task.number}</div><ChevronRight className="setup-arrow" size={16} /></button>; })}</div>
    <div className="dashboard-footnote"><ShieldCheck size={16} /><span>Credentials stay on this device's local server and are never sent back to the browser.</span><button onClick={() => onNavigate('llm')}>Security details</button></div>
  </>;
}

function SettingsPage({ type, config, setConfig, busy, onTest, onSave, connected }) {
  const llm = type === 'llm';
  const val = (key) => config[key] || '';
  const set = (key) => (e) => setConfig((old) => ({ ...old, [key]: e.target.value }));
  return <><PageHeader eyebrow="SETTINGS / CONNECTIONS" title={llm ? 'LLM connection' : 'Jira connection'} subtitle={llm ? 'Connect a model provider to draft test plans and test cases.' : 'Connect your Jira workspace to fetch issue requirements securely.'} right={connected && <span className="connected-pill"><span /> Connected</span>} />
    <div className="settings-layout"><div className="settings-card"><div className="card-heading"><div className={`provider-icon ${llm ? 'llm-icon' : 'jira-icon'}`}>{llm ? <Sparkles size={19} /> : <Link2 size={19} />}</div><div><h2>{llm ? 'Provider credentials' : 'Jira credentials'}</h2><p>{llm ? 'Credentials are stored in a local, ignored settings file.' : 'Use an Atlassian API token for your Jira account.'}</p></div></div>
      {llm ? <><label className="field-label">Groq API key</label><input className="input" type="password" autoComplete="new-password" placeholder="Enter your Groq API key" value={val('apiKey')} onChange={set('apiKey')} /><label className="field-label">Model name</label><input className="input" placeholder="e.g. openai/gpt-oss-20b" value={val('model')} onChange={set('model')} /><p className="field-hint">Uses Groq automatically. Enter your Groq API key and a model ID from your Groq account.</p></> : <><label className="field-label">Jira base URL</label><input className="input" placeholder="https://your-company.atlassian.net" value={val('jiraUrl')} onChange={set('jiraUrl')} /><div className="field-row"><div className="field-col"><label className="field-label">Account email</label><input className="input" type="email" placeholder="name@company.com" value={val('email')} onChange={set('email')} /></div><div className="field-col"><label className="field-label">API token</label><input className="input" type="password" autoComplete="new-password" placeholder="Paste your Jira API token" value={val('apiToken')} onChange={set('apiToken')} /></div></div><p className="field-hint">Create or manage tokens in your Atlassian account security settings.</p></>}
      <div className="settings-divider" /><div className="button-row"><button className="button button-secondary" disabled={Boolean(busy)} onClick={onTest}>{busy.endsWith('-test') ? <LoaderCircle className="spin" size={15} /> : <Link2 size={15} />} Test connection</button><button className="button button-primary" disabled={Boolean(busy)} onClick={onSave}>{busy.endsWith('-save') ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Save settings</button></div>
    </div><aside className="security-note"><div className="security-icon"><ShieldCheck size={17} /></div><h3>Stored locally</h3><p>Your credentials are saved by the local Node service in a file excluded from Git. They are never returned to this page or written to browser storage.</p><div className="note-rule" /><span className="note-caption">LOCAL DEVELOPMENT MODE</span></aside></div>
  </>;
}

function IssuePage({ issue, jiraKey, setJiraKey, additional, setAdditional, busy, onFetch, onPlan }) {
  return <><PageHeader eyebrow="NEW TEST PLAN / 01" title="Start with a Jira issue" subtitle="Fetch a ticket to ground your test plan in real requirements." right={<span className="step-indicator"><span className="step-active">1</span><i /><span>2</span><i /><span>3</span></span>} />
    <div className="workflow-card"><div className="workflow-card-top"><div className="step-icon-large"><Search size={20} /></div><div><h2>Fetch your Jira ticket</h2><p>Enter an issue key from your connected Jira workspace.</p></div><span className="step-badge">STEP 01</span></div><form className="fetch-form" onSubmit={onFetch}><div className="input-with-prefix"><span className="jira-prefix">JIRA</span><input aria-label="Jira issue key" placeholder="e.g. PROJ-123" value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} /></div><button className="button button-primary" disabled={busy === 'issue' || !jiraKey.trim()}>{busy === 'issue' ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />} Fetch issue</button></form></div>
    {issue && <><div className="issue-preview"><div className="preview-head"><div><span className="eyebrow">ISSUE PREVIEW</span><h2>{issue.key} <span>·</span> {issue.summary}</h2></div><span className="status-chip">{issue.status || 'Status unavailable'}</span></div><div className="issue-meta"><span><i className="meta-dot" />{issue.issueType || 'Issue'}</span><span>Key <b>{issue.key}</b></span>{issue.labels?.map((tag) => <span className="label-chip" key={tag}>{tag}</span>)}</div><div className="preview-body"><h3>Description</h3><p>{issue.description || <em>Not specified in this Jira issue.</em>}</p>{issue.acceptanceCriteria && <><h3>Acceptance criteria</h3><p>{issue.acceptanceCriteria}</p></>}</div></div><div className="context-card"><div className="context-label"><div><h3>Additional context <span>OPTIONAL</span></h3><p>Add constraints or details that aren't captured in Jira.</p></div><div className="context-count">{additional.length} / 2,000</div></div><textarea maxLength={2000} value={additional} onChange={(e) => setAdditional(e.target.value)} placeholder="For example: Focus on accessibility and keyboard navigation. Include regression coverage for the existing sign-in flow…" /></div><div className="workflow-footer"><div className="footer-assurance"><ShieldCheck size={16} /><span>Plan will be generated for your review before cases.</span></div><button className="button button-primary" onClick={onPlan} disabled={busy === 'plan'}>{busy === 'plan' ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />} Draft test plan <ChevronRight size={15} /></button></div></>}
  </>;
}

function PlanPage({ plan, updatePlan, busy, approved, onBack, onSave, onApprove, onGenerate }) {
  if (!plan) return <><PageHeader eyebrow="NEW TEST PLAN / 02" title="Review the plan" subtitle="Fetch a Jira issue first to create a grounded test plan." /><div className="empty-state"><FileCheck2 size={26} /><h3>No plan to review yet</h3><button className="button button-primary" onClick={onBack}>Go to Jira issue</button></div></>;
  const textArea = (label, path, value, hint) => <label className="plan-field"><span>{label}</span>{hint && <small>{hint}</small>}<textarea value={Array.isArray(value) ? value.join('\n') : value || ''} onChange={(e) => updatePlan(path, path.length === 1 && ['testStrategy', 'testEnvironments', 'entryCriteria', 'exitCriteria', 'assumptionsAndOpenQuestions', 'sourceReferences'].includes(path[0]) ? e.target.value.split('\n') : e.target.value)} /></label>;
  return <><PageHeader eyebrow={`NEW TEST PLAN / 02 · ${plan.issueKey}`} title="Review your test plan" subtitle="Edit any section, then approve the plan to unlock test case generation." right={<span className="step-indicator"><span className="step-done"><Check size={13} /></span><i className="line-active" /><span className="step-active">2</span><i /><span>3</span></span>} />
    <div className="approval-callout"><div className="approval-callout-icon"><ShieldCheck size={18} /></div><div><strong>{approved ? 'Plan approved' : 'Your approval is required'}</strong><p>{approved ? 'This plan is approved. You can now generate test cases.' : 'Test cases stay locked until you review and approve this plan.'}</p></div><span className={`approval-state ${approved ? 'is-approved' : ''}`}>{approved ? 'APPROVED' : 'PENDING REVIEW'}</span></div>
    <div className="plan-sheet"><div className="plan-sheet-heading"><div><div className="eyebrow">DRAFT TEST PLAN · {plan.issueKey}</div><input className="plan-title-input" value={plan.title || ''} onChange={(e) => updatePlan(['title'], e.target.value)} /><p>AI-generated draft · Review and edit before approval</p></div><span className="draft-chip"><span /> DRAFT</span></div><div className="plan-grid">{textArea('OBJECTIVE', ['objective'], plan.objective)}{textArea('INCLUSIONS', ['scope', 'inclusions'], plan.scope?.inclusions)}{textArea('EXCLUSIONS', ['scope', 'exclusions'], plan.scope?.exclusions)}{textArea('TEST STRATEGY', ['testStrategy'], plan.testStrategy)}{textArea('TEST ENVIRONMENTS', ['testEnvironments'], plan.testEnvironments)}{textArea('ENTRY CRITERIA', ['entryCriteria'], plan.entryCriteria)}{textArea('EXIT CRITERIA', ['exitCriteria'], plan.exitCriteria)}<label className="plan-field"><span>RISKS & MITIGATIONS</span><textarea value={(plan.risksAndMitigations || []).map((x) => `${x.risk} — ${x.mitigation}`).join('\n')} onChange={(e) => updatePlan(['risksAndMitigations'], e.target.value.split('\n').filter(Boolean).map((line) => { const [risk, mitigation] = line.split('—'); return { risk: risk?.trim() || line.trim(), mitigation: mitigation?.trim() || 'Not specified' }; }))} /></label>{textArea('ASSUMPTIONS & OPEN QUESTIONS', ['assumptionsAndOpenQuestions'], plan.assumptionsAndOpenQuestions)}{textArea('SOURCE REFERENCES', ['sourceReferences'], plan.sourceReferences)}</div></div>
    <div className="workflow-footer plan-footer"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={15} /> Back to issue</button><div className="footer-right"><button className="button button-secondary" disabled={Boolean(busy)} onClick={onSave}>{busy === 'plan-save' ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Save edits</button>{!approved ? <button className="button button-primary" disabled={Boolean(busy)} onClick={onApprove}>{busy === 'approve' ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={16} />} Approve plan</button> : <button className="button button-primary" disabled={Boolean(busy)} onClick={onGenerate}>{busy === 'cases' ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={16} />} Generate test cases <ChevronRight size={15} /></button>}</div></div>
  </>;
}

function ResultsPage({ cases, issue, plan, busy, onGenerate }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All cases');
  const filtered = useMemo(() => cases.filter((test) => (filter === 'All cases' || test.scenarioType === filter.toLowerCase()) && `${test.title} ${test.testId} ${test.expectedResult}`.toLowerCase().includes(query.toLowerCase())), [cases, filter, query]);
  const exportCsv = () => {
    const headers = ['Test ID', 'Title', 'Scenario Type', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Source References'];
    const quote = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const rows = cases.map((test) => [test.testId, test.title, test.scenarioType, test.priority, (test.preconditions || []).join('\n'), (test.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n'), test.expectedResult, (test.sourceReferences || []).join('\n')]);
    downloadBlob(new Blob([[headers, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${issue?.key || 'test-cases'}.csv`);
  };
  async function exportPdf() {
    const response = await fetch(`${API}/export/pdf`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ issueKey: issue?.key, title: plan?.title, testCases: cases }) });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'PDF export failed.'); }
    downloadBlob(await response.blob(), `${issue?.key || 'test-cases'}.pdf`);
  }
  return <><PageHeader eyebrow="TEST PLAN / 03" title="Your test cases" subtitle={`${cases.length} test cases generated from ${issue?.key || 'your Jira issue'}.`} right={cases.length > 0 && <div className="export-actions"><button className="button button-secondary" onClick={exportCsv}><Download size={15} /> CSV</button><button className="button button-primary" onClick={() => exportPdf().catch((error) => window.alert(error.message))}><Download size={15} /> PDF</button></div>} />
    {cases.length === 0 ? <div className="empty-state"><FileText size={26} /><h3>No test cases yet</h3><p>Approve a test plan before generating test cases.</p><button className="button button-primary" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'plan' }))} disabled={busy === 'cases'}>Review test plan</button></div> : <><div className="results-summary"><div className="summary-num">{cases.length}</div><div><strong>Test cases ready for review</strong><p>From {issue?.key}: {issue?.summary}</p></div><span className="approved-small"><Check size={13} /> PLAN APPROVED</span></div><div className="table-tools"><div className="table-search"><Search size={15} /><input placeholder="Search test cases…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All cases</option><option>positive</option><option>negative</option><option>boundary</option><option>integration</option><option>other</option></select><span className="table-count">Showing {filtered.length} of {cases.length}</span></div><div className="results-table-wrap"><table className="results-table"><thead><tr><th>TEST CASE</th><th>TYPE</th><th>PRIORITY</th><th>STEPS</th><th>EXPECTED RESULT</th></tr></thead><tbody>{filtered.map((test) => <tr key={test.testId}><td><div className="case-id">{test.testId}</div><strong className="case-title">{test.title}</strong>{test.preconditions?.length > 0 && <small className="case-pre">Preconditions: {test.preconditions.join('; ')}</small>}</td><td><span className="type-pill">{test.scenarioType}</span></td><td><Priority value={test.priority} /></td><td><ol className="step-list">{test.steps?.map((step, i) => <li key={i}>{step}</li>)}</ol></td><td className="expected-cell">{test.expectedResult}</td></tr>)}</tbody></table></div></>}
  </>;
}
function Priority({ value }) { return <span className={`priority-pill ${(value || 'p2').toLowerCase()}`}>{value || 'P2'}</span>; }
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }

const root = createRoot(document.getElementById('root'));
root.render(<App />);
