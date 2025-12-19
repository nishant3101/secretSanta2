import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, UserRole } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { Modal } from './components/Modal';
import { 
  Gift, 
  LogOut, 
  Users, 
  UserPlus, 
  Shuffle, 
  Save, 
  CheckCircle, 
  Database, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Copy, 
  Check,
  Building2,
  MapPin,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

const SESSION_KEY = 'lodha_santa_session_id';

/**
 * Helper to render text with clickable links
 */
const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+(?![.,!?;](?:\s|$)))/gi;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.toLowerCase().startsWith('http') ? part : `https://${part}`;
      return (
        <a 
          key={i} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lodha-gold hover:underline break-all inline-flex items-center gap-1 group font-medium"
        >
          {part}
          <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
        </a>
      );
    }
    return part;
  });
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      if (db.isReady()) {
        setIsDbReady(true);
        try { await db.seedAdminIfNeeded(); } catch (e) { console.error("Seed failed", e); }
        const storedUserId = localStorage.getItem(SESSION_KEY);
        if (storedUserId) {
          const user = await db.getUserById(storedUserId);
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem(SESSION_KEY, user.id);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-lodha-cream">
        <div className="w-16 h-16 border-4 border-lodha-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lodha-gold font-serif text-lg tracking-widest uppercase">Lodha | Mumbai</p>
      </div>
    );
  }

  if (!isDbReady) {
      return <ConfigPage onConnect={() => { setIsDbReady(true); db.seedAdminIfNeeded(); }} />;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-lodha-cream relative overflow-hidden pb-12">
      {/* Structural Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-lodha-gold"></div>
      <div className="absolute top-0 right-0 w-1/3 h-screen opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 L20 0 L40 100 L60 0 L80 100 L100 0" stroke="currentColor" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <nav className="relative bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-lodha-slate p-2 rounded-sm text-lodha-gold">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-lodha-slate leading-none">LODHA</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-lodha-gold mt-1 font-medium">Mumbai • Secret Santa</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Logged in as</p>
            <p className="text-sm font-semibold text-lodha-slate">{currentUser.username}</p>
          </div>
          <button 
            className="text-lodha-slate hover:text-lodha-gold transition-colors p-2"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="relative z-10 p-6 max-w-6xl mx-auto mt-4">
        {currentUser.role === UserRole.ADMIN ? (
          <AdminDashboard />
        ) : (
          <ParticipantDashboard user={currentUser} />
        )}
      </main>
      
      <footer className="relative z-10 text-center mt-8 pb-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium">Building a Better Life</p>
      </footer>
    </div>
  );
};

const ConfigPage: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            db.initClient(url, key);
            await db.getUsers();
            onConnect();
        } catch (err: any) {
            setError('System authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-lodha-cream p-4">
          <Card className="w-full max-w-lg">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-lodha-slate text-lodha-gold rounded-sm flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Database size={36} />
              </div>
              <h2 className="text-3xl font-serif font-bold text-lodha-slate">System Initialisation</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">Lodha Internal Network</p>
            </div>
            <form onSubmit={handleConnect} className="space-y-6">
              <Input label="Environment URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
              <Input label="Access Key" type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="••••••••" />
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              <Button type="submit" className="w-full py-4 text-sm" disabled={loading}>Establish Connection</Button>
            </form>
          </Card>
        </div>
      );
}

const LoginPage: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        const user = await db.authenticate(username, password);
        if (user) { onLogin(user); } else { setError('Unauthorised access attempt.'); }
    } catch (err) { setError('Network connectivity issue.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lodha-cream p-4">
      <Card className="w-full max-w-md border-t-4 border-lodha-gold">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif font-bold text-lodha-slate mb-2 tracking-tight">Lodha</h1>
          <div className="h-px w-12 bg-lodha-gold mx-auto mb-4 opacity-50"></div>
          <h2 className="text-sm uppercase tracking-[0.3em] text-lodha-gold font-black mb-1">Secret Santa Hub</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Official Employee Portal • Mumbai</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <Input label="Staff Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. aditya.k" autoFocus />
          <Input label="Access Token" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your secret password" />
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <Button type="submit" className="w-full py-4 shadow-lg" disabled={loading}>Sign In to Portal</Button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">
            This system is for the exclusive use of <br/> 
            <span className="text-lodha-gold font-bold">Lodha Group - CRM IT team</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isShuffled, setIsShuffled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => Promise<void>;}>({
    isOpen: false, title: '', message: '', onConfirm: async () => {},
  });

  const refreshData = async () => {
    setLoading(true);
    try {
        const allUsers = await db.getUsers();
        setUsers(allUsers.filter(u => u.role === UserRole.PARTICIPANT));
        setIsShuffled(await db.isShuffled());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { refreshData(); }, []);

  const openConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: action });
  };

  const handleModalConfirm = async () => {
      try { await modalConfig.onConfirm(); } finally { setModalConfig(prev => ({...prev, isOpen: false})); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setMsg(null);
    try {
      await db.addUser(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      setMsg({ type: 'success', text: 'Team member added successfully.' });
      await refreshData();
    } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    openConfirm("Remove Associate", `Deactivate account for ${username}?`, async () => {
        setLoading(true);
        try {
            await db.deleteUser(userId);
            setMsg({ type: 'success', text: `Removed ${username}` });
            await refreshData();
        } catch (err: any) { setMsg({ type: 'error', text: "Operation failed." }); } finally { setLoading(false); }
    });
  };

  const handleShuffle = () => {
    openConfirm("Secret Santa Shuffle", "Assign gift partners for the CRM IT team? The roster will be locked once matches are made.", async () => {
         try {
            await db.performShuffle();
            await refreshData();
            setMsg({ type: 'success', text: 'Assignments generated successfully.' });
          } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
    });
  };

  const handleReset = () => {
      openConfirm("Reset Shuffle", "This will wipe current pairings. Are you sure?", async () => {
          await db.resetGame();
          await refreshData();
          setMsg({ type: 'success', text: 'Session reset.' });
      });
  }

  const handleCopyInvite = (u: User) => {
      const url = window.location.origin;
      const text = `Hi ${u.username}! 🏢 Lodha Group - CRM IT Team Holiday Exchange.\nAccess Portal: ${url}\nUser: ${u.username}\nPass: ${u.password}`;
      navigator.clipboard.writeText(text);
      setCopiedId(u.id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={handleModalConfirm} onClose={() => setModalConfig(prev => ({...prev, isOpen: false}))} isLoading={loading && modalConfig.isOpen} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 bg-lodha-slate text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={80} />
          </div>
          <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-lodha-gold mb-6">Total Roster</h3>
          <div className="text-6xl font-serif font-bold mb-4">{users.length}</div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
            <MapPin size={12} className="text-lodha-gold" /> Lodha Mumbai HQ
          </p>
        </Card>

        <Card className="md:col-span-2 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
             <div>
                <h3 className="text-xl font-serif font-bold text-lodha-slate">Secret Santa Shuffle</h3>
                <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Manage pairings for the CRM IT team</p>
             </div>
             <div className="flex gap-3">
                 {isShuffled && <Button variant="outline" onClick={handleReset} disabled={loading}>Reset Shuffle</Button>}
                 <Button disabled={isShuffled || users.length < 2 || loading} onClick={handleShuffle} className="flex items-center gap-2">
                    <Shuffle size={14} />
                    {isShuffled ? 'Pairings Finalised' : 'Shuffle Now'}
                 </Button>
             </div>
          </div>
          {msg && <div className={`mt-6 p-4 border-l-2 text-xs font-bold uppercase tracking-widest ${msg.type === 'error' ? 'border-red-500 text-red-600 bg-red-50' : 'border-lodha-gold text-lodha-gold bg-lodha-cream'}`}>{msg.text}</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <div className="text-lodha-gold"><UserPlus size={20} /></div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-lodha-slate">Register Associate</h3>
            </div>
            <form onSubmit={handleAddUser} className="space-y-5">
              <Input label="Full Name / ID" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. Ramesh S." disabled={isShuffled || loading} />
              <Input label="Default Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" disabled={isShuffled || loading} />
              <Button type="submit" variant="secondary" className="w-full" disabled={isShuffled || loading}>Update Roster</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-lodha-slate">Active Participants</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                <ShieldCheck size={12} className="text-lodha-gold" /> Protected System
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-4">Name</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr><td colSpan={3} className="px-8 py-16 text-center text-slate-300 italic tracking-widest">Database is currently empty.</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-lodha-cream/30 transition-colors group">
                        <td className="px-8 py-5">
                            <p className="font-bold text-lodha-slate">{u.username}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{u.password}</p>
                        </td>
                        <td className="px-8 py-5">
                           {u.wishlist ? (
                               <span className="text-lodha-gold font-black tracking-widest text-[9px] border border-lodha-gold px-2 py-0.5 rounded-sm bg-lodha-gold/5">LISTED</span>
                           ) : (
                               <span className="text-slate-300 font-black tracking-widest text-[9px]">PENDING</span>
                           )}
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-3">
                                <Button 
                                    variant="outline" 
                                    className="px-3 py-1.5 text-[10px] flex items-center gap-2"
                                    onClick={() => handleCopyInvite(u)}
                                >
                                    {copiedId === u.id ? <Check size={12} className="text-lodha-gold" /> : <Copy size={12} />}
                                    Invite
                                </Button>
                                <button 
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    disabled={isShuffled}
                                    className="p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ParticipantDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [wishlist, setWishlist] = useState(user.wishlist || '');
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      const assignment = await db.getAssignmentFor(user.id);
      setAssignedUser(assignment);
    };
    fetchAssignment();
  }, [user.id]);

  const handleSaveWishlist = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      await db.updateUserWishlist(user.id, wishlist);
      setMsg({ type: 'success', text: 'Update successful.' });
    } catch (err) { setMsg({ type: 'error', text: 'System error.' }); } finally { setIsSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       <Card className={`md:col-span-2 relative overflow-hidden ${assignedUser ? 'bg-white border-lodha-gold/20 border-2' : 'bg-slate-50 border-dashed border-slate-300 opacity-60'}`}>
         {assignedUser && (
           <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
             <TrendingUp size={120} />
           </div>
         )}
         {assignedUser ? (
            <div className="text-center py-10 relative z-10">
                <h2 className="text-slate-400 font-bold mb-4 uppercase tracking-[0.4em] text-[10px]">Your Allocated Recipient</h2>
                <div className="text-6xl font-serif font-bold text-lodha-slate mb-10 tracking-tight">{assignedUser.username}</div>
                <div className="bg-lodha-cream/40 rounded-sm p-8 max-w-3xl mx-auto border border-lodha-gold/10 text-left">
                    <h3 className="text-[10px] font-bold text-lodha-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Gift size={14} />
                        Associate Wishlist
                    </h3>
                    <div className="text-lodha-slate/80 whitespace-pre-wrap leading-relaxed text-xl font-serif italic">
                      {renderTextWithLinks(assignedUser.wishlist) || <span className="text-slate-300">No data available for this recipient.</span>}
                    </div>
                </div>
            </div>
         ) : (
            <div className="text-center py-20">
                <Building2 size={48} className="text-slate-200 mx-auto mb-6" />
                <h2 className="text-2xl font-serif font-bold text-slate-300 italic tracking-widest">Awaiting Management Assignment...</h2>
                <p className="text-slate-300 mt-4 text-xs uppercase tracking-[0.3em] font-bold">Matches will be broadcasted shortly.</p>
            </div>
         )}
       </Card>

       <Card className="md:col-span-2">
           <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
               <div className="flex items-center gap-3">
                   <div className="text-lodha-gold"><Gift size={20} /></div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-lodha-slate">My Executive Wishlist</h3>
               </div>
               <button 
                  onClick={() => setShowPreview(!showPreview)} 
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm transition-all ${showPreview ? 'bg-lodha-slate text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
               >
                  <Eye size={14} />
                  {showPreview ? 'Compose Mode' : 'Preview Format'}
               </button>
           </div>
           
           <div className="space-y-6">
               {showPreview ? (
                  <div className="w-full min-h-[160px] p-6 border border-lodha-gold/20 rounded-sm bg-lodha-cream/20 text-lodha-slate italic font-serif text-xl leading-relaxed animate-in fade-in duration-300">
                      {renderTextWithLinks(wishlist) || <span className="text-slate-300 font-sans text-sm tracking-widest uppercase">List is currently unpopulated.</span>}
                  </div>
               ) : (
                  <textarea
                    className="w-full h-48 p-6 border border-slate-100 rounded-sm focus:ring-1 focus:ring-lodha-gold outline-none transition-all resize-y bg-slate-50/50 text-lodha-slate leading-relaxed text-lg"
                    placeholder="Provide specific details or links. Our system will format URLs automatically."
                    value={wishlist}
                    onChange={e => setWishlist(e.target.value)}
                  />
               )}

               <div className="flex items-center justify-between pt-4">
                   <div className="flex flex-col">
                       {msg && <span className={`text-[10px] font-black uppercase tracking-widest ${msg.type === 'success' ? 'text-lodha-gold' : 'text-red-500'}`}>{msg.text}</span>}
                       {!showPreview && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Building a Better Life • Lodha Mumbai</p>}
                   </div>
                   
                   <Button onClick={handleSaveWishlist} disabled={isSaving} className="flex items-center gap-3 px-8">
                       <Save size={14} />
                       {isSaving ? 'Syncing...' : 'Update Records'}
                   </Button>
               </div>
           </div>
       </Card>
    </div>
  );
};

export default App;