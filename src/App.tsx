import React, { useState, useEffect, useRef } from 'react';
import { Shield, Moon, Sun, Plus, Send, Menu, User, Paperclip, FileText, Activity, X, Eye, Table, Loader, Trash2, MessageSquare, Github, Mail, LogOut, ChevronRight, Network } from 'lucide-react';
import './ui/styles/main.css';
import type { Artifact } from './core/domain/types';

// --- Types ---
type Message = { id: string; role: 'system' | 'user' | 'assistant'; content: string; attachment?: { name: string; type: string; file?: File }; thoughts?: string[]; };
type View = 'chat' | 'threats' | 'logs' | 'audit';
type FileItem = { file: File; id: string };
type UserProfile = { name: string; type: 'guest' | 'user'; };
type ChatSession = { id: string; title: string; messages: Message[]; artifacts: Artifact[]; date: string; };

// --- Translations ---
const I18N = {
  en: {
    welcome: "VestaGuard Core Online. Upload artifacts to initiate secure audit.", newAudit: "New Audit", history: "HISTORY", auditDetails: "Audit Details", threatIntel: "Threat Intel", agents: "AGENTS", guest: "Guest User", login: "Login to VestaGuard", loginDesc: "Authenticate to access corporate audit logs.", analyzing: "Analyzing context...", placeholder: "Ask VestaGuard...", booting: "Initializing Neural Core..."
  },
  es: {
    welcome: "Núcleo VestaGuard en línea. Sube artefactos para iniciar auditoría.", newAudit: "Nueva Auditoría", history: "HISTORIAL", auditDetails: "Detalles Auditoría", threatIntel: "Inteligencia Amenazas", agents: "AGENTES", guest: "Usuario Invitado", login: "Ingresar a VestaGuard", loginDesc: "Autentícate para acceder a los registros corporativos.", analyzing: "Analizando contexto...", placeholder: "Pregunta a VestaGuard...", booting: "Iniciando Núcleo Neural..."
  }
};

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [currentView, setCurrentView] = useState<View>('chat');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>({ name: 'Guest User', type: 'guest' });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'pdf'>('text');

  const streamRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const t = I18N[lang];

  useEffect(() => { const timer = setTimeout(() => setIsBooting(false), 2800); return () => clearTimeout(timer); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  
  useEffect(() => {
    const saved = localStorage.getItem('vestaguard_sessions_v3'); 
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) { setSessions(parsed); setActiveSessionId(parsed[0].id); } else createNewSession();
    } else createNewSession();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      const serializable = sessions.map(s => ({ ...s, messages: s.messages.map(m => ({ ...m, attachment: m.attachment ? { ...m.attachment, file: undefined } : undefined })), artifacts: s.artifacts.map(a => ({ ...a, content: 'File content not persisted' })) }));
      localStorage.setItem('vestaguard_sessions_v3', JSON.stringify(serializable));
    }
  }, [sessions]);

  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; } }, [input]);
  useEffect(() => { streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' }); }, [sessions, activeSessionId, isAgentRunning, agentStep]);

  useEffect(() => {
    if (previewFile && previewFile instanceof File) {
        const type = previewFile.type;
        if (type.startsWith('image/')) {
            setPreviewType('image'); const reader = new FileReader(); reader.onload = (e) => setPreviewContent(e.target?.result as string); reader.readAsDataURL(previewFile);
        } else if (type === 'application/pdf') {
            setPreviewType('pdf'); setPreviewContent(URL.createObjectURL(previewFile));
        } else {
            setPreviewType('text'); const reader = new FileReader(); reader.onload = (e) => setPreviewContent(e.target?.result as string); reader.readAsText(previewFile);
        }
    }
  }, [previewFile]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault(); setIsDragging(false);
      if (e.dataTransfer.files) {
          const newFiles = Array.from(e.dataTransfer.files).map(f => ({ file: f, id: Date.now() + Math.random().toString() }));
          setFileQueue(prev => [...prev, ...newFiles]);
      }
  };

  const getActiveSession = () => sessions.find(s => s.id === activeSessionId);
  const updateActiveSession = (updater: (s: ChatSession) => ChatSession) => setSessions(prev => prev.map(s => s.id === activeSessionId ? updater(s) : s));

  const createNewSession = () => {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: `Audit ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, messages: [{ id: 'init', role: 'assistant', content: t.welcome }], artifacts: [], date: new Date().toISOString() };
      setSessions(prev => [newSession, ...prev]); setActiveSessionId(newId); setCurrentView('chat'); setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); const newSessions = sessions.filter(s => s.id !== id); setSessions(newSessions);
      if (activeSessionId === id) { if (newSessions.length > 0) setActiveSessionId(newSessions[0].id); else createNewSession(); }
  };

  const handleLogin = () => { setUser({ name: 'Security Admin', type: 'user' }); setIsLoginOpen(false); };

  const runAgentExecution = async (userQuery: string, files: FileItem[]) => {
    setIsAgentRunning(true); 
    const msgId = Date.now().toString();
    
    updateActiveSession(s => ({ 
      ...s, 
      messages: [...s.messages, { id: msgId, role: 'assistant', content: '', thoughts: [] }] 
    }));

    const updateMsg = (content: string, thought?: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return { ...s, messages: s.messages.map(m => { 
                    if (m.id === msgId) { 
                        const newThoughts = thought ? [...(m.thoughts || []), thought] : m.thoughts; 
                        return { ...m, content, thoughts: newThoughts }; 
                    } 
                    return m; 
                }) };
            }
            return s;
        }));
    };

    try {
        setAgentStep('Initializing Multi-Agent System...'); 
        await new Promise(r => setTimeout(r, 800));
        
        const analyzer = new (await import('./infrastructure/adapters/HybridAnalyzer')).HybridAnalyzer();
        
        // Handle Text-Only Chat
        if (files.length === 0 && userQuery.trim()) {
             setAgentStep('Agent SecOps: Analyzing query...');
             const response = await analyzer.chat(userQuery);
             updateMsg(response);
             return;
        }

        const results = [];

        for (const f of files) {
            setAgentStep(`Agent SecOps: Scanning ${f.file.name}...`);
            updateMsg('', `Analyzing ${f.file.name} with VirusTotal & CVE engines...`);
            
            const artifact: Artifact = {
                id: f.id, name: f.file.name, type: 'file', content: f.file, size: f.file.size, timestamp: new Date(), status: 'scanning'
            };
            
            const result = await analyzer.analyze(artifact);
            results.push({ name: f.file.name, result });
            
            // Inyectamos el historial de agentes como "pensamientos" visibles
            if (result.agentHistory && result.agentHistory.length > 0) {
                result.agentHistory.forEach(step => {
                    // Ignoramos mensajes vacíos o de sistema puro
                    if (!step.content || step.content.includes("TERMINATE")) return;
                    
                    // Formateamos el pensamiento: "AgentName: Message..."
                    const thoughtText = `[${step.name}] ${step.content.substring(0, 100)}${step.content.length > 100 ? '...' : ''}`;
                    updateMsg('', thoughtText);
                });
            }

            // Add to session artifacts for the table
            updateActiveSession(s => ({ 
                ...s, 
                artifacts: [{ ...artifact, status: 'complete', result }, ...s.artifacts] 
            }));
        }

        setAgentStep('ISO Auditor: Finalizing Report...');
        await new Promise(r => setTimeout(r, 1000));
        
        const summary = results.map(r => 
            `- **${r.name}**: ${r.result.riskLevel} (Score: ${r.result.score}/100). ${r.result.summary.substring(0, 150)}...`
        ).join('\n');

        updateMsg(`Analysis complete for **${files.length}** artifact(s).\n\n${summary}\n\nCheck **Audit Details** for the full ISO 27001 report.`);
    } catch (error) {
        console.error(error);
        updateMsg("Connection to Neural Core failed. Running in Offline Simulation mode.");
    } finally {
        setAgentStep(''); 
        setIsAgentRunning(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() && fileQueue.length === 0) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, attachment: fileQueue.length > 0 ? { name: fileQueue.length === 1 ? fileQueue[0].file.name : `${fileQueue.length} files`, type: 'file', file: fileQueue.length === 1 ? fileQueue[0].file : undefined } : undefined };
    updateActiveSession(s => ({ ...s, messages: [...s.messages, userMsg] }));
    const currentFiles = [...fileQueue]; const currentInput = input; setInput(''); setFileQueue([]);
    runAgentExecution(currentInput, currentFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { const newFiles = Array.from(e.target.files).map(f => ({ file: f, id: Date.now() + Math.random().toString() })); setFileQueue(prev => [...prev, ...newFiles]); }
  };

  const activeSession = getActiveSession();

  // --- Views ---
  const renderAuditView = () => (
      <div className="audit-container">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}><Table /> {t.auditDetails} ({activeSession?.artifacts.length || 0})</h2>
          <div className="card" style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                  <thead><tr><th>Timestamp</th><th>Artifact</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                      {activeSession?.artifacts.map(a => (
                          <tr key={a.id} className="audit-row">
                              <td style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{new Date(a.timestamp).toLocaleTimeString()}</td>
                              <td><div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} /> {a.name}</div></td>
                              <td><span className={`audit-score ${a.result?.riskLevel === 'SAFE' ? 'score-safe' : 'score-critical'}`}>{a.result?.score}/100</span></td>
                              <td>{a.result?.riskLevel}</td>
                              <td><button className="lang-toggle" onClick={() => a.content instanceof File ? setPreviewFile(a.content) : alert("No preview")} style={{display:'flex', alignItems:'center', gap:4}}><Eye size={12}/> View</button></td>
                          </tr>
                      ))}
                      {(!activeSession?.artifacts || activeSession.artifacts.length === 0) && (<tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No artifacts recorded.</td></tr>)}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderThreatIntel = () => (
      <div className="audit-container">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}><Activity /> {t.threatIntel}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>GLOBAL THREAT LEVEL</div><div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#ef4444' }}>CRITICAL</div><div style={{ fontSize: '0.9rem' }}>Sector: FinTech / SaaS</div></div>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>ACTIVE CAMPAIGNS</div><div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#f59e0b' }}>12 Detected</div><div style={{ fontSize: '0.9rem' }}>Top: Ransomware.LockBit</div></div>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>SYSTEM INTEGRITY</div><div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#10b981' }}>99.8%</div><div style={{ fontSize: '0.9rem' }}>3 Agents Online</div></div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Latest CVEs (Live Feed)</h3>
              {[{ id: 'CVE-2026-1045', score: 9.8, desc: 'RCE in OpenSSL v3.4 affecting TLS handshake.' }, { id: 'CVE-2026-0092', score: 7.5, desc: 'Privilege Escalation in Linux Kernel via eBPF.' }, { id: 'CVE-2026-2201', score: 8.2, desc: 'SQL Injection in popular Auth0 generic library.' }].map((cve, i) => (
                  <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}><div style={{ minWidth: 50, height: 50, borderRadius: 8, background: cve.score > 9 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: cve.score > 9 ? '#991b1b' : '#9a3412', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}><span>{cve.score}</span></div><div><div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-accent)' }}>{cve.id}</div><p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cve.desc}</p></div></div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="app" onDragOver={handleDragOver} onDrop={handleDrop} ref={dropZoneRef}>
      {isBooting && <div className="boot-screen"><div className="boot-logo"><Shield size={48} color="var(--brand-accent)" /> VestaGuard</div><div className="boot-loader"></div><div className="boot-status">{t.booting}</div></div>}
      {isLoginOpen && <div className="modal-backdrop" onClick={() => setIsLoginOpen(false)}><div className="modal" onClick={e => e.stopPropagation()}><h2 style={{ marginBottom: '0.5rem' }}>{t.login}</h2><p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t.loginDesc}</p><button className="btn-social primary" onClick={handleLogin}><Github size={18} /> GitHub</button><button className="btn-social" onClick={handleLogin}><Mail size={18} /> Google</button></div></div>}
      {previewFile && <div className="preview-overlay" onClick={() => setPreviewFile(null)}><div className="preview-modal" onClick={e => e.stopPropagation()}><div className="preview-header"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><Eye size={18} /> {previewFile.name}</div><button onClick={() => setPreviewFile(null)}><X size={20} /></button></div><div className="preview-content" style={{ padding: previewType === 'text' ? '2rem' : 0, display: 'flex', justifyContent: 'center', background: '#f0f0f0' }}>{previewType === 'image' && previewContent && <img src={previewContent} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}{previewType === 'pdf' && previewContent && <iframe src={previewContent} width="100%" height="100%" style={{ border: 'none' }} />}{previewType === 'text' && <div style={{ width:'100%', whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#333' }}>{previewContent || "Loading..."}</div>}</div></div></div>}
      {isDragging && <div className="drag-overlay">Drop files to analyze</div>}

      <div className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand"><Shield size={24} color="var(--brand-accent)" /> <span>VestaGuard</span></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="lang-toggle" onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}>{lang.toUpperCase()}</button>
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{ color: 'var(--text-secondary)' }}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button onClick={() => setSidebarOpen(false)} style={{ display: 'none' }} className="mobile-close-btn"><X size={20} /></button>
          </div>
        </div>
        <div className="nav-list">
          <div className="sidebar-action"><button className="btn-new-audit" onClick={createNewSession}><Plus size={18} /> {t.newAudit}</button></div>
          <div style={{ padding: '0 1rem', marginBottom: '1rem' }}><div className="agent-status" style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t.history}</div>{sessions.map(s => (<div key={s.id} className={`nav-item ${activeSessionId === s.id && currentView === 'chat' ? 'active' : ''}`} onClick={() => { setActiveSessionId(s.id); setCurrentView('chat'); setSidebarOpen(false); }}><MessageSquare size={16} /> <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span><Trash2 size={14} onClick={(e) => deleteSession(e, s.id)} style={{ opacity: 0.5 }} /></div>))}</div>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 1rem 1rem 1rem' }}></div>
          <div className={`nav-item ${currentView === 'audit' ? 'active' : ''}`} onClick={() => { setCurrentView('audit'); setSidebarOpen(false); }}><Table size={18} /> <span>{t.auditDetails}</span></div>
          <div className={`nav-item ${currentView === 'threats' ? 'active' : ''}`} onClick={() => { setCurrentView('threats'); setSidebarOpen(false); }}><Activity size={18} /> <span>{t.threatIntel}</span></div>
          
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1rem 1rem 0.5rem 1rem' }}></div>
          <div className="agent-status" style={{ padding: '0 1rem', marginBottom: '0.2rem', marginTop: '0.5rem' }}>ADMIN</div>
          <div className="nav-item" onClick={() => window.open('http://localhost:8081', '_blank')}>
            <Network size={18} color="var(--brand-accent)" /> 
            <span style={{ color: 'var(--brand-accent)', fontWeight: 600 }}>Agent Studio</span>
          </div>
        </div>
        <div className="sidebar-footer" onClick={() => user.type === 'guest' ? setIsLoginOpen(true) : null}><div className="user-avatar" style={{ background: user.type === 'guest' ? 'var(--border-strong)' : 'var(--brand-accent)' }}><User size={16} /></div><div style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>{user.type === 'user' ? <LogOut size={16} onClick={(e) => { e.stopPropagation(); setUser({name:'Guest User', type:'guest'}); }} /> : <ChevronRight size={16} />}</div>
      </aside>

      <main className="main-area">
        <div className="mobile-header"><Menu size={24} onClick={() => setSidebarOpen(true)} /><span style={{ fontWeight: 700 }}>VestaGuard</span><button className="lang-toggle" onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}>{lang.toUpperCase()}</button></div>
        {currentView === 'chat' ? (
          <>
            <div className="chat-container" ref={streamRef}>
              {activeSession?.messages.map(msg => (
                <div key={msg.id} className="message-row">
                  <div className={`role-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>{msg.role === 'user' ? <User size={18} /> : <Shield size={18} />}</div>
                  <div className="message-content">
                    <div className="message-sender">{msg.role === 'user' ? 'You' : 'VestaGuard'}</div>
                    {msg.attachment && (<div className="file-chip" onClick={() => msg.attachment?.file && setPreviewFile(msg.attachment.file)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={14} /> {msg.attachment.name}</div>{msg.attachment.file && (<button onClick={() => msg.attachment?.file && setPreviewFile(msg.attachment.file)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, background: 'var(--brand-accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}><Eye size={12} /> View</button>)}</div>)}
                    {msg.thoughts?.map((t, i) => <div key={i} className="agent-thought"><Activity size={12} /> {t}</div>)}
                    {msg.id === activeSession.messages[activeSession.messages.length-1].id && isAgentRunning && agentStep && <div className="agent-thought processing"><Loader size={12} className="spin" /> {agentStep}</div>}
                    <div className="message-bubble">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="input-area">
              {fileQueue.length > 0 && (<div className="file-queue">{fileQueue.map(f => (<div key={f.id} className="queue-item"><span onClick={() => setPreviewFile(f.file)} style={{ cursor: 'pointer' }}>{f.file.name}</span><X size={12} onClick={() => setFileQueue(prev => prev.filter(p => p.id !== f.id))} /></div>))}</div>)}
              <div className="input-box"><input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} /><button className="btn-upload" onClick={() => fileInputRef.current?.click()}><Plus size={24} /></button><textarea ref={textareaRef} className="text-input" placeholder={t.placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} /><button className="btn-send" onClick={handleSend} disabled={!input.trim() && fileQueue.length === 0}><Send size={16} /></button></div>
            </div>
          </>
        ) : currentView === 'audit' ? renderAuditView() : renderThreatIntel()}
      </main>
    </div>
  );
}

export default App;