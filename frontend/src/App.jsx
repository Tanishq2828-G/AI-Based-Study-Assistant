import { useEffect, useRef, useState } from 'react';
import {
  BookOpen, Brain, Check, ChevronDown, ChevronRight, Clock3, FileText,
  GraduationCap, Layers3, LibraryBig, LoaderCircle, Menu, MessageCircle,
  Plus, RefreshCw, Search, Send, Sparkles, Trash2, Upload, Wifi, WifiOff, X, User, ShieldCheck
} from 'lucide-react';

export default function App() {
  // Config & API
  const defaultApi = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('studywise_api_url') || defaultApi);
  const [connStatus, setConnStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [connModalOpen, setConnModalOpen] = useState(false);
  const [tempApiInput, setTempApiInput] = useState('');
  const [testingConn, setTestingConn] = useState(false);

  const API = apiUrl ? `${apiUrl}/api` : '/api';
  const size = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

  // Accounts & Workspaces
  const [accounts, setAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studywise_accounts')) || [
        { id: 1, name: 'Student', email: 'student@studywise.app', role: 'Personal Account', avatar: 'S' }
      ];
    } catch {
      return [{ id: 1, name: 'Student', email: 'student@studywise.app', role: 'Personal Account', avatar: 'S' }];
    }
  });
  const [currentAccount, setCurrentAccount] = useState(() => accounts[0]);
  const [workspaces, setWorkspaces] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studywise_workspaces')) || ['My Workspace', 'Exam Revision'];
    } catch {
      return ['My Workspace', 'Exam Revision'];
    }
  });
  const [currentWorkspace, setCurrentWorkspace] = useState(() => workspaces[0]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newWsName, setNewWsName] = useState('');

  // Study Session Timer
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(25 * 60);

  // App Core State
  const [items, setItems] = useState([]);
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState('');
  const [topics, setTopics] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [toast, setToast] = useState('');
  const [menu, setMenu] = useState(false);

  const input = useRef(null);
  const end = useRef(null);
  const searchInput = useRef(null);
  const workbenchRef = useRef(null);

  // Check Backend Connection
  const checkHealth = async (targetBase) => {
    const base = targetBase !== undefined ? targetBase : apiUrl;
    const testEndpoint = base ? `${base}/api/health` : '/api/health';
    try {
      setConnStatus('checking');
      const res = await fetch(testEndpoint, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        setConnStatus('online');
        return true;
      }
      setConnStatus('offline');
      return false;
    } catch {
      // Also try fetching materials as fallback ping
      try {
        const matRes = await fetch(base ? `${base}/api/materials` : '/api/materials', { signal: AbortSignal.timeout(6000) });
        if (matRes.ok) {
          setConnStatus('online');
          return true;
        }
      } catch {}
      setConnStatus('offline');
      return false;
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => checkHealth(), 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Session timer ticker
  useEffect(() => {
    let t;
    if (sessionActive && sessionSeconds > 0) {
      t = setInterval(() => setSessionSeconds(s => s - 1), 1000);
    } else if (sessionSeconds === 0 && sessionActive) {
      setSessionActive(false);
      setToast('Study session completed! Great focus!');
    }
    return () => clearInterval(t);
  }, [sessionActive, sessionSeconds]);

  // Save accounts to storage
  useEffect(() => {
    localStorage.setItem('studywise_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('studywise_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  const refresh = async () => {
    try {
      let r = await fetch(`${API}/materials?search=${encodeURIComponent(search)}`);
      if (!r.ok) throw Error('Could not load materials. Check backend connection.');
      let d = await r.json();
      setItems(d);
      setDoc(old => d.find(x => x.id === old?.id) || d[0] || null);
      setConnStatus('online');
    } catch (e) {
      setError(e.message);
      setConnStatus('offline');
    }
  };

  useEffect(() => { refresh(); }, [search, apiUrl]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (toast) {
      let t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const resetDoc = d => {
    setDoc(d);
    setTab('Overview');
    setSummary('');
    setTopics([]);
    setQuiz([]);
    setAnswers({});
    setMessages([]);
    setError('');
    setMenu(false);
  };

  const call = async (action, body) => {
    if (!doc) return null;
    setBusy(true);
    setError('');
    try {
      let r = await fetch(`${API}/study/${doc.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      let d = await r.json();
      if (!r.ok) throw Error(d.message || 'The request failed.');
      return d;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const upload = async e => {
    let f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError('');
    let form = new FormData();
    form.append('file', f);
    try {
      let r = await fetch(`${API}/materials`, { method: 'POST', body: form });
      let d = await r.json();
      if (!r.ok) throw Error(d.message || 'Upload failed.');
      await refresh();
      resetDoc(d);
      setToast('Notes added to your study space');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete “${name}”?`)) return;
    try {
      let r = await fetch(`${API}/materials/${id}`, { method: 'DELETE' });
      if (!r.ok) throw Error('Could not delete this material.');
      if (doc?.id === id) resetDoc(null);
      await refresh();
      setToast('Material deleted');
    } catch (e) {
      setError(e.message);
    }
  };

  const ask = async e => {
    e.preventDefault();
    let q = question.trim();
    if (!q || busy) return;
    setMessages(m => [...m, { role: 'user', text: q }]);
    setQuestion('');
    let d = await call('ask', { question: q });
    if (d) setMessages(m => [...m, { role: 'assistant', text: d.answer }]);
  };

  const startSummary = async () => {
    let d = await call('summary');
    if (d) setSummary(d.summary);
  };

  const startTopics = async () => {
    let d = await call('topics');
    if (d) setTopics(d.topics);
  };

  const startQuiz = async () => {
    let d = await call('quiz', { count: 5 });
    if (d) {
      setQuiz(d.questions);
      setAnswers({});
    }
  };

  // Immediate Action Launchers for Study Desk
  const launchSummary = () => {
    setTab('Summary');
    if (!summary) startSummary();
    workbenchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchAsk = () => {
    setTab('Ask AI');
    workbenchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchQuiz = () => {
    setTab('Quiz');
    if (!quiz.length) startQuiz();
    workbenchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick Account Creator
  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const newAcc = {
      id: Date.now(),
      name: newAccName.trim(),
      email: newAccEmail.trim() || `${newAccName.toLowerCase().replace(/\s+/g, '')}@studywise.app`,
      role: 'Student Account',
      avatar: newAccName.trim().charAt(0).toUpperCase()
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    setCurrentAccount(newAcc);
    setNewAccName('');
    setNewAccEmail('');
    setToast(`Account created: ${newAcc.name}`);
  };

  // Quick Workspace Creator
  const handleAddWorkspace = (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const updated = [...workspaces, newWsName.trim()];
    setWorkspaces(updated);
    setCurrentWorkspace(newWsName.trim());
    setNewWsName('');
    setToast(`Switched to workspace: ${newWsName.trim()}`);
  };

  // Save manual backend URL
  const handleSaveApiUrl = async () => {
    setTestingConn(true);
    const cleaned = tempApiInput.trim().replace(/\/+$/, '');
    const isOk = await checkHealth(cleaned);
    setTestingConn(false);
    if (isOk) {
      setApiUrl(cleaned);
      localStorage.setItem('studywise_api_url', cleaned);
      setToast('Connected to Backend!');
      setConnModalOpen(false);
      refresh();
    } else {
      setError('Could not connect to that backend URL. Make sure it is live on Render.');
    }
  };

  // Create sample document
  const loadSample = async () => {
    setBusy(true);
    const sampleText = `Convolutional Neural Networks (CNN) Overview:
CNNs are a class of deep learning architectures specifically designed for computer vision tasks such as image recognition and video analysis.
Key Features:
1. Local Receptive Fields: Neurons process local input patches rather than entire images at once.
2. Shared Weights & Biases: Reduces parameters drastically compared to traditional dense feed-forward neural networks.
3. Pooling Layers: Max pooling and average pooling reduce spatial dimensions, providing translation invariance.
Famous Architectures:
- LeNet-5: Pioneer CNN architecture by Yann LeCun for handwritten digit classification.
- AlexNet: 2012 ImageNet breakthrough that kicked off modern deep learning with ReLU and Dropout.
- ResNet: Introduced residual skip connections to successfully train ultra-deep networks over 100 layers.`;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const file = new File([blob], 'CNN_Deep_Learning_Notes.txt', { type: 'text/plain' });
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await fetch(`${API}/materials`, { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) throw Error(d.message || 'Failed to create sample note.');
      await refresh();
      resetDoc(d);
      setToast('Sample AI study notes loaded!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    ['Overview', Layers3],
    ['Summary', FileText],
    ['Topics', Sparkles],
    ['Ask AI', MessageCircle],
    ['Quiz', Brain],
    ['Library', LibraryBig]
  ];

  const formatTimer = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand">
          <div className="brandicon"><Sparkles size={17} /></div>
          studywise
          <button className="mobile-close" onClick={() => setMenu(false)}><X size={16} /></button>
        </div>

        {/* Workspace Switcher */}
        <button className="workspace" onClick={() => setAccountModalOpen(true)} title="Switch or create workspace">
          <span className="workspace-avatar">{currentAccount.avatar}</span>
          <span>
            <b>{currentWorkspace}</b>
            <small>{currentAccount.name} · Click to switch</small>
          </span>
          <ChevronDown size={14} />
        </button>

        <div className="label">WORKSPACE</div>
        <nav>
          <button className={`nav ${tab === 'Overview' ? 'selected' : ''}`} onClick={() => setTab('Overview')}>
            <Layers3 size={16} />Overview
          </button>
          <button className={`nav ${tab === 'Library' ? 'selected' : ''}`} onClick={() => setTab('Library')}>
            <LibraryBig size={16} />My library<span className="count">{items.length}</span>
          </button>
          <button className={`nav ${tab === 'Quiz' ? 'selected' : ''}`} onClick={launchQuiz}>
            <Brain size={16} />Practice quizzes
          </button>
        </nav>

        <div className="library-label">
          <span className="label">YOUR MATERIALS</span>
          <button onClick={() => input.current?.click()} title="Upload new notes"><Plus size={16} /></button>
        </div>

        <div className="side-files">
          {items.slice(0, 8).map((m, i) => (
            <button
              className={`side-file ${doc?.id === m.id ? 'chosen' : ''}`}
              onClick={() => resetDoc(m)}
              key={m.id}
            >
              <span className={`mini-file tint${i % 4}`}><FileText size={14} /></span>
              <span>{m.name}</span>
            </button>
          ))}
          {!items.length && <small className="muted-note">Your notes will be listed here.</small>}
        </div>

        {/* Study Streak & Focus Session Timer */}
        <div className="side-bottom">
          <div className="streak-card">
            <div className="streak-icon">✦</div>
            <b>Focus Study Session</b>
            <p>{sessionActive ? `Time remaining: ${formatTimer(sessionSeconds)}` : 'Boost memory with timed focus sprints.'}</p>
            <span
              onClick={() => {
                if (sessionActive) {
                  setSessionActive(false);
                  setSessionSeconds(25 * 60);
                  setToast('Study session paused.');
                } else {
                  setSessionActive(true);
                  setToast('25-minute study session started!');
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {sessionActive ? 'End Session ✕' : <>Start 25m sprint <ChevronRight size={14} /></>}
            </span>
          </div>

          {/* Account Profile Pill */}
          <div className="student" onClick={() => setAccountModalOpen(true)} style={{ cursor: 'pointer' }} title="Manage accounts & profile">
            <span className="student-avatar">{currentAccount.avatar}</span>
            <span>
              <b>{currentAccount.name}</b>
              <small>{currentAccount.role}</small>
            </span>
            <ChevronDown size={14} />
          </div>
        </div>
      </aside>

      {menu && <button className="scrim" onClick={() => setMenu(false)} />}

      {/* Main View */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="crumb">
            <button className="hamb" onClick={() => setMenu(true)}><Menu size={18} /></button>
            <span>{currentWorkspace}</span>
            <ChevronRight size={13} />
            <b>{doc?.name || 'Overview'}</b>
          </div>

          <div className="top-right">
            {/* Live Backend Connection Indicator */}
            <button
              className={`conn-pill ${connStatus}`}
              onClick={() => { setTempApiInput(apiUrl); setConnModalOpen(true); }}
              title="Click to check or change backend connection URL"
            >
              <span className="conn-dot" />
              {connStatus === 'online' ? 'Backend Connected' : connStatus === 'checking' ? 'Connecting…' : 'Backend Offline'}
            </button>

            {/* Search */}
            <label className="search">
              <Search size={15} />
              <input
                ref={searchInput}
                placeholder="Search materials"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <kbd onClick={() => searchInput.current?.focus()}>⌘ K</kbd>
            </label>

            {/* Profile Avatar Button */}
            <span
              className="top-avatar"
              onClick={() => setAccountModalOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Manage profile"
            >
              {currentAccount.avatar}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="content">
          {/* Active Focus Session Banner */}
          {sessionActive && (
            <div className="session-timer">
              <div>
                <b>Focus Sprint in Progress: {formatTimer(sessionSeconds)}</b>
                <div style={{ fontSize: '10px', color: '#6857bd' }}>Studying {doc?.name ? `“${doc.name}”` : 'notes'}</div>
              </div>
              <button className="outline" onClick={() => setSessionActive(false)}>Pause Session</button>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="welcome">
            <div>
              <div className="eyebrow"><i /> YOUR PERSONAL STUDY SPACE</div>
              <h1>{doc ? `Good to see you, ${currentAccount.name}.` : 'Make room for a little more clarity.'}</h1>
              <p>{doc ? `Pick up where you left off with “${doc.name}”.` : 'Upload your notes or try sample material to turn notes into focused practice.'}</p>
            </div>
            <div className="orb"><div /><Sparkles size={19} /></div>
          </div>

          {error && (
            <div className="error">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={15} /></button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="stats">
            <div className="stat" onClick={() => setTab('Library')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon purple"><LibraryBig size={17} /></span>
              <div>
                <small>STUDY MATERIALS</small>
                <b>{String(items.length).padStart(2, '0')}</b>
                <span>Ready in your library</span>
              </div>
              <i>↗</i>
            </div>
            <div className="stat" onClick={() => setAccountModalOpen(true)} style={{ cursor: 'pointer' }}>
              <span className="stat-icon peach"><Clock3 size={17} /></span>
              <div>
                <small>ACTIVE ACCOUNT</small>
                <b>{currentAccount.name}</b>
                <span>{currentWorkspace}</span>
              </div>
              <i>✦</i>
            </div>
            <div className="stat" onClick={() => { if (doc) { setTab('Topics'); if (!topics.length) startTopics(); } }} style={{ cursor: 'pointer' }}>
              <span className="stat-icon mint"><GraduationCap size={18} /></span>
              <div>
                <small>TOPICS EXPLORED</small>
                <b>{String(topics.length).padStart(2, '0')}</b>
                <span>From your current notes</span>
              </div>
              <i>✳</i>
            </div>
          </div>

          {/* Empty Workspace or Study Desk */}
          {!doc ? (
            <section className="empty">
              <div className="illustration">
                <div className="paper back" />
                <div className="paper front"><i /><i /><i /></div>
                <span className="float spark"><Sparkles size={18} /></span>
                <span className="float up"><Upload size={17} /></span>
              </div>
              <h2>Your next aha moment starts here.</h2>
              <p>Add your class notes, reading, or revision material. We’ll help you make sense of it, one idea at a time.</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="primary" onClick={() => input.current?.click()} disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />} Add your notes
                </button>
                <button className="outline" onClick={loadSample} disabled={busy}>
                  <Sparkles size={14} /> Try Sample Material
                </button>
              </div>
              <small>PDF, DOCX or TXT · up to 20 MB</small>
              <div className="promises">
                <span><Sparkles size={13} /> Clear summaries</span><i />
                <span><MessageCircle size={13} /> Notes-aware answers</span><i />
                <span><Brain size={13} /> Quick practice</span>
              </div>
            </section>
          ) : (
            <>
              {/* Study Desk */}
              <section className="desk">
                <div className="desk-head">
                  <div>
                    <div className="section-label"><i /> YOUR STUDY DESK</div>
                    <h2>What would you like to work on?</h2>
                    <p>Choose an action to launch it immediately with <b>{doc.name}</b>.</p>
                  </div>
                  <button className="link" onClick={() => setTab('Library')}>Browse library <ChevronRight size={14} /></button>
                </div>
                <div className="actions">
                  <button className="action" onClick={launchSummary}>
                    <span className="action-icon purple"><FileText size={18} /></span>
                    <small>START HERE</small>
                    <b>Quick summary</b>
                    <span>Get the main ideas, distilled without noise.</span>
                    <ChevronRight className="action-arrow" size={15} />
                  </button>

                  <button className="action" onClick={launchAsk}>
                    <span className="action-icon blue"><MessageCircle size={18} /></span>
                    <b>Ask a question</b>
                    <span>Talk through concepts grounded in your notes.</span>
                    <ChevronRight className="action-arrow" size={15} />
                  </button>

                  <button className="action" onClick={launchQuiz}>
                    <span className="action-icon peach"><Brain size={18} /></span>
                    <b>Make a quiz</b>
                    <span>Practice multiple-choice questions with instant feedback.</span>
                    <ChevronRight className="action-arrow" size={15} />
                  </button>
                </div>
              </section>

              {/* In-Focus Material Selector */}
              <section className="materials">
                <div className="materials-head">
                  <div>
                    <div className="section-label"><i /> IN FOCUS</div>
                    <h2>Your materials</h2>
                  </div>
                  <div className="material-tools">
                    <span>{items.length} materials</span>
                    <button className="outline" onClick={() => input.current?.click()}><Plus size={14} /> Add new</button>
                  </div>
                </div>
                <div>
                  {items.slice(0, 4).map((m, i) => (
                    <div
                      className={`material-row ${doc?.id === m.id ? 'active-row' : ''}`}
                      key={m.id}
                      onClick={() => resetDoc(m)}
                    >
                      <span className={`doc-icon tint${i % 4}`}><FileText size={18} /></span>
                      <span className="doc-info">
                        <b>{m.name}</b>
                        <small>
                          {m.fileType} <i /> {size(m.sizeBytes)} <i />
                          Added {new Date(m.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </small>
                      </span>
                      <span className="ready"><i /> {doc?.id === m.id ? 'Active' : 'Ready'}</span>
                      <button className="row-arrow" title="Open material"><ChevronRight size={17} /></button>
                      <button className="trash" title="Delete material" onClick={e => { e.stopPropagation(); remove(m.id, m.name); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {items.length > 4 && (
                  <button className="all-link" onClick={() => setTab('Library')}>
                    View all {items.length} materials <ChevronRight size={14} />
                  </button>
                )}
              </section>

              {/* Workbench */}
              <section className="workbench" ref={workbenchRef}>
                <div className="tabs">
                  {tabs.map(([n, I]) => (
                    <button key={n} onClick={() => {
                      setTab(n);
                      if (n === 'Topics' && !topics.length) startTopics();
                    }} className={tab === n ? 'active' : ''}>
                      <I size={14} />{n}
                    </button>
                  ))}
                  <span className="context"><i /> Working with <b>{doc.name}</b></span>
                </div>

                <div className="work-area">
                  {/* Overview Tab */}
                  {tab === 'Overview' && (
                    <div className="overview-hint">
                      <span className="hint-icon"><BookOpen size={18} /></span>
                      <div>
                        <b>A good place to start</b>
                        <p>Get the big picture with a summary, or jump into practice questions.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="outline" onClick={launchSummary}>Make a summary <ChevronRight size={14} /></button>
                        <button className="outline" onClick={launchQuiz}>Try a quiz <ChevronRight size={14} /></button>
                      </div>
                    </div>
                  )}

                  {/* Library Tab */}
                  {tab === 'Library' && (
                    <div className="library-view">
                      <h3>All your study materials ({items.length})</h3>
                      {items.map((m, i) => (
                        <div className="material-row" key={m.id} onClick={() => resetDoc(m)}>
                          <span className={`doc-icon tint${i % 4}`}><FileText size={18} /></span>
                          <span className="doc-info">
                            <b>{m.name}</b>
                            <small>{m.fileType} <i /> {size(m.sizeBytes)}</small>
                          </span>
                          <button className="outline" onClick={e => { e.stopPropagation(); resetDoc(m); }}>
                            Study this <ChevronRight size={13} />
                          </button>
                          <button className="trash" onClick={e => { e.stopPropagation(); remove(m.id, m.name); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button className="outline" onClick={() => input.current?.click()}><Plus size={14} /> Add new file</button>
                        <button className="outline" onClick={loadSample}><Sparkles size={14} /> Add sample notes</button>
                      </div>
                    </div>
                  )}

                  {/* Summary Tab */}
                  {tab === 'Summary' && (
                    <div className="feature">
                      <div className="feature-head">
                        <span className="action-icon purple"><FileText size={18} /></span>
                        <div>
                          <h3>A clearer picture</h3>
                          <p>Distilled core ideas from <b>{doc.name}</b>.</p>
                        </div>
                        <button className="primary small" disabled={busy} onClick={startSummary}>
                          {busy ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />}
                          {summary ? 'Refresh summary' : 'Create summary'}
                        </button>
                      </div>
                      {summary ? (
                        <div className="result">
                          <div className="result-label"><Sparkles size={13} /> THE BIG IDEAS</div>
                          {summary.split(/\n+/).map((s, i) => s.trim() && (
                            <div className="summary-line" key={i}>
                              <span>{String(i + 1).padStart(2, '0')}</span>
                              <p>{s.replace(/^[-•*]\s*/, '')}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="placeholder">
                          <span className="placeholder-icon"><Sparkles size={19} /></span>
                          <b>Ready to summarize</b>
                          <p>Distill your material into high-yield bullet points.</p>
                          <button className="link" onClick={startSummary}>Generate summary now <ChevronRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Topics Tab */}
                  {tab === 'Topics' && (
                    <div className="feature">
                      <div className="feature-head">
                        <span className="action-icon blue"><Sparkles size={18} /></span>
                        <div>
                          <h3>Ideas worth holding onto</h3>
                          <p>Key concepts extracted from <b>{doc.name}</b>.</p>
                        </div>
                        <button className="primary small" disabled={busy} onClick={startTopics}>
                          {busy ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />} Find key topics
                        </button>
                      </div>
                      {topics.length ? (
                        <div className="topic-grid">
                          {topics.map((t, i) => (
                            <div className="topic" key={t}>
                              <span>{String(i + 1).padStart(2, '0')}</span>
                              <b>{t}</b>
                              <Sparkles size={14} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="placeholder">
                          <span className="placeholder-icon"><Sparkles size={19} /></span>
                          <b>Discover the core topics</b>
                          <p>We’ll pull out the central themes to map out what’s here.</p>
                          <button className="link" onClick={startTopics}>Explore key topics <ChevronRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ask AI Tab */}
                  {tab === 'Ask AI' && (
                    <div className="chat">
                      <div className="feature-head">
                        <span className="action-icon blue"><MessageCircle size={18} /></span>
                        <div>
                          <h3>Think it through together</h3>
                          <p>Answers grounded directly in <b>{doc.name}</b>.</p>
                        </div>
                        <span className="connected"><i /> NOTES CONNECTED</span>
                      </div>
                      <div className="messages">
                        {!messages.length && (
                          <div className="chat-welcome">
                            <span className="bot"><Sparkles size={17} /></span>
                            <div>
                              <b>Hi, I’m your study tutor.</b>
                              <p>Ask anything about your notes, and I’ll explain it simply.</p>
                              <div className="suggestions">
                                {['What are the main ideas?', 'Explain a tricky concept', 'Give me an example'].map(q => (
                                  <button key={q} onClick={() => setQuestion(q)}>{q} <ChevronRight size={12} /></button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {messages.map((m, i) => (
                          <div className={`message ${m.role}`} key={i}>
                            {m.role === 'assistant' && <span className="mini-bot"><Sparkles size={12} /></span>}
                            <div>{m.text}</div>
                          </div>
                        ))}
                        {busy && (
                          <div className="message assistant">
                            <span className="mini-bot"><Sparkles size={12} /></span>
                            <div className="typing">•••</div>
                          </div>
                        )}
                        <div ref={end} />
                      </div>
                      <form className="chat-input" onSubmit={ask}>
                        <input
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          placeholder="Ask a question about your material…"
                        />
                        <button disabled={!question.trim() || busy}><Send size={15} /></button>
                      </form>
                      <small className="chat-note"><Sparkles size={11} /> Answers are synthesized from your notes.</small>
                    </div>
                  )}

                  {/* Quiz Tab */}
                  {tab === 'Quiz' && (
                    <div className="feature">
                      <div className="feature-head">
                        <span className="action-icon peach"><Brain size={18} /></span>
                        <div>
                          <h3>Practice knowledge check</h3>
                          <p>Interactive questions with instant answers and explanations.</p>
                        </div>
                        <button className="primary small" disabled={busy} onClick={startQuiz}>
                          {busy ? <LoaderCircle className="spin" size={14} /> : <Brain size={14} />}
                          {quiz.length ? 'Generate new set' : 'Make a quiz'}
                        </button>
                      </div>
                      {quiz.length ? (
                        <div className="quiz-list">
                          {quiz.map((q, i) => (
                            <article className="quiz-q" key={i}>
                              <small>QUESTION {String(i + 1).padStart(2, '0')}</small>
                              <h4>{q.question}</h4>
                              <div className="options">
                                {q.options.map((o, j) => (
                                  <button
                                    key={j}
                                    className={`option ${answers[i] === j ? (j === q.answerIndex ? 'correct' : 'wrong') : answers[i] !== undefined && j === q.answerIndex ? 'correct' : ''}`}
                                    onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                                  >
                                    <span>{String.fromCharCode(65 + j)}</span>
                                    {o}
                                    {answers[i] === j && <Check size={14} />}
                                  </button>
                                ))}
                              </div>
                              {answers[i] !== undefined && (
                                <p className="explanation"><Sparkles size={13} />{q.explanation}</p>
                              )}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="placeholder">
                          <span className="placeholder-icon peach"><Brain size={19} /></span>
                          <b>Practice makes concepts stick</b>
                          <p>Generate practice questions based on your material.</p>
                          <button className="link" onClick={startQuiz}>Make practice quiz <ChevronRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          <footer>
            <span>StudyWise Assistant <b>✳</b></span>
            <span><i /> Your notes stay in your private workspace</span>
          </footer>
        </div>
      </main>

      <input ref={input} type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" hidden onChange={upload} />
      {toast && <div className="toast"><Check size={15} />{toast}</div>}

      {/* Account & Workspace Switcher Modal */}
      {accountModalOpen && (
        <div className="modal-overlay" onClick={() => setAccountModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><User size={18} /> Accounts & Workspaces</h3>
              <button className="modal-close" onClick={() => setAccountModalOpen(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label>Active Account</label>
                <div className="account-list">
                  {accounts.map(acc => (
                    <div
                      key={acc.id}
                      className={`account-item ${currentAccount.id === acc.id ? 'active' : ''}`}
                      onClick={() => { setCurrentAccount(acc); setToast(`Switched to ${acc.name}`); }}
                    >
                      <div className="account-avatar">{acc.avatar}</div>
                      <div className="account-info">
                        <b>{acc.name}</b>
                        <small>{acc.email}</small>
                      </div>
                      {currentAccount.id === acc.id && <Check size={14} color="#7161db" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Account Form */}
              <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderTop: '1px solid #f0f0f5' }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: '#777' }}>+ ADD NEW ACCOUNT / PROFILE</label>
                <input
                  className="modal-input"
                  placeholder="Your Name (e.g. Tanishq)"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                />
                <input
                  className="modal-input"
                  placeholder="Email (e.g. tanishq@example.com)"
                  value={newAccEmail}
                  onChange={e => setNewAccEmail(e.target.value)}
                />
                <button className="primary small" type="submit" disabled={!newAccName.trim()}>
                  <Plus size={14} /> Create Account
                </button>
              </form>

              {/* Workspaces Section */}
              <div className="modal-field" style={{ borderTop: '1px solid #f0f0f5', paddingTop: '10px' }}>
                <label>Workspaces</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {workspaces.map(ws => (
                    <button
                      key={ws}
                      className={`outline ${currentWorkspace === ws ? 'primary' : ''}`}
                      onClick={() => { setCurrentWorkspace(ws); setToast(`Workspace: ${ws}`); }}
                      style={{ height: '28px', fontSize: '10px' }}
                    >
                      {ws} {currentWorkspace === ws && '✓'}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAddWorkspace} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input
                    className="modal-input"
                    placeholder="New Workspace Name"
                    value={newWsName}
                    onChange={e => setNewWsName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="outline" type="submit" disabled={!newWsName.trim()}>+ Add</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backend Connection Modal */}
      {connModalOpen && (
        <div className="modal-overlay" onClick={() => setConnModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {connStatus === 'online' ? <Wifi size={18} color="#2e7d32" /> : <WifiOff size={18} color="#c62828" />}
                Backend Connection Settings
              </h3>
              <button className="modal-close" onClick={() => setConnModalOpen(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div style={{ padding: '10px', background: connStatus === 'online' ? '#edf7ee' : '#fdf2f2', borderRadius: '8px' }}>
                <b>Status: {connStatus === 'online' ? '🟢 Connected' : '🔴 Disconnected'}</b>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#666' }}>
                  {connStatus === 'online'
                    ? 'Your frontend is communicating with your backend API without errors.'
                    : 'The frontend could not reach the backend API. If you are on Render free tier, the server may take 30–50s to wake up on first launch.'}
                </p>
              </div>

              <div className="modal-field">
                <label>Backend API Base URL</label>
                <input
                  className="modal-input"
                  placeholder="https://your-backend-name.onrender.com"
                  value={tempApiInput}
                  onChange={e => setTempApiInput(e.target.value)}
                />
                <small style={{ color: '#888', fontSize: '9px' }}>
                  Paste your live Render backend URL here. It will be saved directly in your browser.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  className="outline"
                  onClick={() => checkHealth()}
                  disabled={testingConn}
                >
                  <RefreshCw size={12} className={testingConn ? 'spin' : ''} /> Ping Backend
                </button>
                <button
                  className="primary small"
                  onClick={handleSaveApiUrl}
                  disabled={testingConn}
                >
                  {testingConn ? <LoaderCircle className="spin" size={14} /> : <ShieldCheck size={14} />}
                  Test & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
