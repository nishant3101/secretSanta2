import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, UserRole } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { Modal } from './components/Modal';
import { Gift, LogOut, Users, UserPlus, Shuffle, Save, CheckCircle, Snowflake, Database, Trash2, ExternalLink, Eye, Copy, Check } from 'lucide-react';

const SESSION_KEY = 'secret_santa_session_user_id';

/**
 * Helper to render text with clickable links
 */
const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  
  // Improved Regex:
  // 1. Matches http/https links
  // 2. Matches www. links
  // 3. Excludes trailing punctuation common at end of sentences (.,!?;)
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
          className="text-blue-600 hover:text-blue-800 underline break-all inline-flex items-center gap-1 group font-medium"
        >
          {part}
          <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
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

  const onConfigComplete = () => {
      setIsDbReady(true);
      db.seedAdminIfNeeded();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Snowflake className="animate-spin text-red-300" size={40} />
      </div>
    );
  }

  if (!isDbReady) {
      return <ConfigPage onConnect={onConfigComplete} />;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-12">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500"></div>
        <div className="absolute -top-10 -right-10 text-red-50 opacity-50 pointer-events-none"><Snowflake size={200} /></div>
        <div className="absolute bottom-10 -left-10 text-green-50 opacity-50 pointer-events-none"><Snowflake size={150} /></div>

      <nav className="relative bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Gift className="text-red-600" />
          <h1 className="text-xl font-bold text-slate-800">Secret Santa</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">
            Hi, <span className="text-slate-900">{currentUser.username}</span>
          </span>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 py-1 px-3 text-sm"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </nav>

      <main className="relative z-10 p-6 max-w-5xl mx-auto">
        {currentUser.role === UserRole.ADMIN ? (
          <AdminDashboard />
        ) : (
          <ParticipantDashboard user={currentUser} />
        )}
      </main>
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
            setError('Connection failed. Please check your URL and Key.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Setup Database</h2>
            </div>
            <form onSubmit={handleConnect} className="space-y-4">
              <Input label="Supabase URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
              <Input label="Supabase Anon Key" type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="eyJh..." />
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={loading}>{loading ? 'Connecting...' : 'Connect to Database'}</Button>
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
        if (user) { onLogin(user); } else { setError('Invalid credentials'); }
    } catch (err) { setError('Login failed. Please try again.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome</h2>
          <p className="text-slate-500">Sign in to Secret Santa</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoFocus />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</Button>
        </form>
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
      setMsg({ type: 'success', text: 'Participant added!' });
      await refreshData();
    } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    openConfirm("Remove Participant", `Delete ${username}?`, async () => {
        setLoading(true);
        try {
            await db.deleteUser(userId);
            setMsg({ type: 'success', text: `Removed ${username}` });
            await refreshData();
        } catch (err: any) { setMsg({ type: 'error', text: "Failed to delete user." }); } finally { setLoading(false); }
    });
  };

  const handleShuffle = () => {
    openConfirm("Shuffle Now?", "This will assign names and cannot be undone.", async () => {
         try {
            await db.performShuffle();
            await refreshData();
            setMsg({ type: 'success', text: 'Shuffle complete!' });
          } catch (err: any) { setMsg({ type: 'error', text: err.message }); }
    });
  };

  const handleReset = () => {
      openConfirm("Reset Game", "This will clear all pairings.", async () => {
          await db.resetGame();
          await refreshData();
          setMsg({ type: 'success', text: 'Assignments reset.' });
      });
  }

  const handleCopyInvite = (u: User) => {
      const url = window.location.origin;
      const text = `Hi ${u.username}! 🎁 You're invited to our Secret Santa.\nLogin: ${url}\nUser: ${u.username}\nPass: ${u.password}`;
      navigator.clipboard.writeText(text);
      setCopiedId(u.id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Modal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={handleModalConfirm} onClose={() => setModalConfig(prev => ({...prev, isOpen: false}))} isLoading={loading && modalConfig.isOpen} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-red-600 to-red-700 text-white border-none">
          <h3 className="text-lg font-semibold opacity-90 mb-1">Participants</h3>
          <div className="text-4xl font-bold mb-4">{users.length}</div>
          <div className="text-sm opacity-80 flex items-center gap-2"><Users size={16} /> Total Registered</div>
        </Card>

        <Card className="md:col-span-2 flex flex-col justify-center gap-4">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Admin Controls</h3>
                <p className="text-slate-500 text-sm">Shuffle pairings once everyone is added</p>
             </div>
             <div className="flex gap-2">
                 {isShuffled && <Button variant="outline" onClick={handleReset} disabled={loading}>Reset</Button>}
                 <Button disabled={isShuffled || users.length < 2 || loading} onClick={handleShuffle} className="flex items-center gap-2">
                    <Shuffle size={18} />
                    {isShuffled ? 'Pairings Locked' : 'Shuffle & Assign'}
                 </Button>
             </div>
          </div>
          {msg && <div className={`p-3 rounded-md text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="text-red-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Add Friend</h3>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3">
              <Input label="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. John" disabled={isShuffled || loading} />
              <Input label="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" disabled={isShuffled || loading} />
              <Button type="submit" variant="secondary" className="w-full" disabled={isShuffled || loading}>Create</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Friend List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Password</th>
                    <th className="px-6 py-3">Wishlist</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No one here yet...</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{u.username}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{u.password}</td>
                        <td className="px-6 py-4">
                           {u.wishlist ? (
                               <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md text-[10px]">READY</span>
                           ) : (
                               <span className="text-slate-300 text-[10px]">EMPTY</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                    variant="outline" 
                                    className="p-1 px-2 text-xs flex items-center gap-1"
                                    onClick={() => handleCopyInvite(u)}
                                >
                                    {copiedId === u.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    {copiedId === u.id ? 'Copied' : 'Invite'}
                                </Button>
                                <button 
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    disabled={isShuffled}
                                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-20"
                                >
                                    <Trash2 size={18} />
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
      setMsg({ type: 'success', text: 'List updated!' });
    } catch (err) { setMsg({ type: 'error', text: 'Save failed.' }); } finally { setIsSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <Card className={`md:col-span-2 ${assignedUser ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-red-100/50' : 'bg-slate-50 border-dashed border-slate-300'}`}>
         {assignedUser ? (
            <div className="text-center py-8">
                <h2 className="text-slate-500 font-medium mb-2 uppercase tracking-widest text-xs">Your Assignment</h2>
                <div className="text-5xl font-bold text-red-600 mb-8">{assignedUser.username}</div>
                <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto shadow-sm border border-red-100 text-left">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gift size={16} className="text-red-400" />
                        Wishlist Items
                    </h3>
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg">
                      {renderTextWithLinks(assignedUser.wishlist) || <span className="text-slate-300 italic">No items listed yet... check back soon!</span>}
                    </div>
                </div>
            </div>
         ) : (
            <div className="text-center py-16">
                <Snowflake size={48} className="text-slate-200 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-400">Waiting for Santa's Shuffle</h2>
                <p className="text-slate-400 mt-2">The organizer will assign names soon!</p>
            </div>
         )}
       </Card>

       <Card className="md:col-span-2">
           <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                   <Gift className="text-red-500" />
                   <h3 className="text-lg font-bold text-slate-800">My Own Wishlist</h3>
               </div>
               <button 
                  onClick={() => setShowPreview(!showPreview)} 
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${showPreview ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                  <Eye size={14} />
                  {showPreview ? 'Editing Mode' : 'Preview Mode'}
               </button>
           </div>
           
           <div className="space-y-4">
               {showPreview ? (
                  <div className="w-full min-h-[160px] p-4 border border-blue-200 rounded-xl bg-blue-50/20 text-slate-700 whitespace-pre-wrap leading-relaxed text-lg animate-in fade-in zoom-in-95 duration-200">
                      {renderTextWithLinks(wishlist) || <span className="text-slate-400 italic">Your list is currently empty...</span>}
                  </div>
               ) : (
                  <textarea
                    className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-y bg-slate-50 text-slate-900 leading-relaxed text-lg"
                    placeholder="Enter items here. URLs like www.google.com will be automatically clickable!"
                    value={wishlist}
                    onChange={e => setWishlist(e.target.value)}
                  />
               )}

               <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                       {msg && <span className={`text-sm font-bold ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>}
                       {!showPreview && <p className="text-[10px] text-slate-400 font-medium">Auto-formats links (http://... or www....)</p>}
                   </div>
                   
                   <Button onClick={handleSaveWishlist} disabled={isSaving} className="flex items-center gap-2 shadow-lg shadow-red-200">
                       <Save size={18} />
                       {isSaving ? 'Updating...' : 'Save My List'}
                   </Button>
               </div>
           </div>
       </Card>
    </div>
  );
};

export default App;