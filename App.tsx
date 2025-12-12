import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, UserRole, ADMIN_CREDENTIALS } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { Modal } from './components/Modal';
import { Gift, LogOut, Users, UserPlus, Shuffle, Save, CheckCircle, Snowflake, Database, Settings, Trash2 } from 'lucide-react';

const SESSION_KEY = 'secret_santa_session_user_id';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize and Restore session
  useEffect(() => {
    const initApp = async () => {
      if (db.isReady()) {
        setIsDbReady(true);
        // Try to seed admin if connection works
        try { await db.seedAdminIfNeeded(); } catch (e) { console.error("Seed failed", e); }

        // Restore session
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

  // 1. If DB not configured, show config screen
  if (!isDbReady) {
      return <ConfigPage onConnect={onConfigComplete} />;
  }

  // 2. If not logged in, show login
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 3. Main App
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Festive background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500"></div>
        <div className="absolute -top-10 -right-10 text-red-50 opacity-50"><Snowflake size={200} /></div>
        <div className="absolute bottom-10 -left-10 text-green-50 opacity-50"><Snowflake size={150} /></div>

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

// --- Sub-components (Views) ---

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
            // Test connection
            await db.getUsers();
            onConnect();
        } catch (err: any) {
            setError('Connection failed. Please check your URL and Key.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-lg border-2 border-slate-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Setup Database</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 text-left">
                  <p className="text-sm text-amber-800 font-medium mb-1">Is this your hosted site?</p>
                  <p className="text-xs text-amber-700">
                    If you are hosting this for friends, you should hardcode your Supabase URL and Key in 
                    <code className="bg-amber-100 px-1 rounded mx-1">services/db.ts</code> 
                    before deploying. Otherwise, every guest will see this screen!
                  </p>
              </div>
            </div>
    
            <form onSubmit={handleConnect} className="space-y-4">
              <Input 
                label="Supabase URL" 
                value={url} 
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
              />
              <Input 
                label="Supabase Anon Key" 
                type="password"
                value={key} 
                onChange={e => setKey(e.target.value)}
                placeholder="eyJh..."
              />
              
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
    
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect to Database'}
              </Button>
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
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid credentials');
        }
    } catch (err) {
        setError('Login failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome to Secret Santa</h2>
          <p className="text-slate-500">Please sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            autoFocus
          />
          <Input 
            label="Password" 
            type="password"
            value={password} 
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
            <p>Admin Login: {ADMIN_CREDENTIALS.username} / {ADMIN_CREDENTIALS.password}</p>
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

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const refreshData = async () => {
    setLoading(true);
    try {
        const allUsers = await db.getUsers();
        setUsers(allUsers.filter(u => u.role === UserRole.PARTICIPANT));
        setIsShuffled(await db.isShuffled());
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm: action
    });
  };

  const handleModalConfirm = async () => {
      try {
          await modalConfig.onConfirm();
      } finally {
          setModalConfig(prev => ({...prev, isOpen: false}));
      }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setMsg(null);
    try {
      await db.addUser(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      setMsg({ type: 'success', text: 'Participant added successfully' });
      await refreshData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    openConfirm(
        "Remove Participant", 
        `Are you sure you want to remove ${username}? This cannot be undone.`,
        async () => {
            setLoading(true);
            try {
                // Optimistic update
                setUsers(prev => prev.filter(u => u.id !== userId));

                await db.deleteUser(userId);
                setMsg({ type: 'success', text: `Removed ${username}` });
                
                // Background refresh to ensure sync
                const allUsers = await db.getUsers();
                setUsers(allUsers.filter(u => u.role === UserRole.PARTICIPANT));
            } catch (err: any) {
                console.error("Delete failed:", err);
                setMsg({ type: 'error', text: "Failed to delete user." });
                // Revert on error
                refreshData();
            } finally {
                setLoading(false);
            }
        }
    );
  };

  const handleShuffle = () => {
    openConfirm(
        "Shuffle Participants",
        "Are you sure? This will assign Secret Santas and cannot be easily undone without a reset.",
        async () => {
             try {
                await db.performShuffle();
                await refreshData();
                setMsg({ type: 'success', text: 'Shuffle complete! Participants can now see their assignments.' });
              } catch (err: any) {
                setMsg({ type: 'error', text: err.message });
              }
        }
    );
  };

  const handleReset = () => {
      openConfirm(
          "Reset Game",
          "This will clear all assignments. Are you sure you want to restart?",
          async () => {
              await db.resetGame();
              await refreshData();
              setMsg({ type: 'success', text: 'Assignments reset.' });
          }
      );
  }

  return (
    <div className="space-y-6">
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={handleModalConfirm}
        onClose={() => setModalConfig(prev => ({...prev, isOpen: false}))}
        isLoading={loading && modalConfig.isOpen}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-red-600 to-red-700 text-white border-none">
          <h3 className="text-lg font-semibold opacity-90 mb-1">Participants</h3>
          <div className="text-4xl font-bold mb-4">{users.length}</div>
          <div className="text-sm opacity-80 flex items-center gap-2">
            <Users size={16} />
            Registered Users
          </div>
        </Card>

        {/* Actions Card */}
        <Card className="md:col-span-2 flex flex-col justify-center items-start gap-4">
          <div className="flex justify-between w-full items-center">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Game Control</h3>
                <p className="text-slate-500 text-sm">Manage the Secret Santa event state</p>
             </div>
             <div className="flex gap-2">
                 {isShuffled && (
                     <Button variant="outline" onClick={handleReset} disabled={loading}>Reset</Button>
                 )}
                 <Button 
                    disabled={isShuffled || users.length < 2 || loading} 
                    onClick={handleShuffle}
                    className="flex items-center gap-2"
                 >
                    <Shuffle size={18} />
                    {loading ? 'Processing...' : (isShuffled ? 'Already Shuffled' : 'Shuffle & Assign')}
                 </Button>
             </div>
          </div>
          
          {msg && (
            <div className={`w-full p-3 rounded-md text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add User Form */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="text-red-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Add Participant</h3>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3">
              <Input 
                label="Username" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. John"
                disabled={isShuffled || loading}
              />
              <Input 
                label="Password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Set a password"
                disabled={isShuffled || loading}
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={isShuffled || loading}>
                Create User
              </Button>
              {isShuffled && <p className="text-xs text-slate-400 text-center">Cannot add users after shuffle.</p>}
            </form>
          </Card>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <Card>
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="text-slate-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Participant List</h3>
                </div>
                {loading && <Snowflake className="animate-spin text-red-300" size={16} />}
             </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3">Wishlist Status</th>
                    <th className="px-4 py-3">Assignment</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {loading ? 'Loading...' : 'No participants yet.'}
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{u.password}</td>
                        <td className="px-4 py-3">
                           {u.wishlist ? (
                               <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded-full">
                                   <CheckCircle size={12} /> Filled
                               </span>
                           ) : (
                               <span className="text-slate-400 text-xs">Pending</span>
                           )}
                        </td>
                        <td className="px-4 py-3">
                            {isShuffled && u.assignedToId ? (
                                <span className="text-slate-600">Assigned</span>
                            ) : (
                                <span className="text-slate-400">-</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteUser(u.id, u.username);
                                }}
                                disabled={isShuffled}
                                className="relative z-10 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                                title={isShuffled ? "Cannot remove after shuffle" : "Remove participant"}
                            >
                                <Trash2 size={18} className="pointer-events-none" />
                            </button>
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
      setMsg({ type: 'success', text: 'Wishlist updated!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to save wishlist.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {/* Assignment Card */}
       <Card className={`md:col-span-2 ${assignedUser ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' : 'bg-slate-50'}`}>
         {assignedUser ? (
            <div className="text-center py-6">
                <h2 className="text-slate-500 font-medium mb-2">You are the Secret Santa for</h2>
                <div className="text-4xl font-bold text-red-600 mb-6">{assignedUser.username}</div>
                
                <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-sm border border-red-100 text-left">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Gift size={16} />
                        Their Wishlist
                    </h3>
                    {assignedUser.wishlist ? (
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{assignedUser.wishlist}</p>
                    ) : (
                        <p className="text-slate-400 italic">They haven't added a wishlist yet.</p>
                    )}
                </div>
            </div>
         ) : (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Snowflake size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-700">Waiting for Shuffle</h2>
                <p className="text-slate-500 mt-2">The admin hasn't shuffled the names yet. Check back later!</p>
            </div>
         )}
       </Card>

       {/* My Wishlist */}
       <Card className="md:col-span-2">
           <div className="flex items-center gap-2 mb-4">
               <Gift className="text-red-500" />
               <h3 className="text-lg font-bold text-slate-800">Your Wishlist</h3>
           </div>
           <p className="text-sm text-slate-500 mb-4">Help your Secret Santa by adding some gift ideas here!</p>
           
           <textarea
             className="w-full h-32 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-y bg-white text-slate-900"
             placeholder="Dear Santa, I would like..."
             value={wishlist}
             onChange={e => setWishlist(e.target.value)}
           />
           
           <div className="flex items-center justify-between mt-4">
               {msg ? (
                   <span className={`text-sm ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                       {msg.text}
                   </span>
               ) : <span></span>}
               
               <Button onClick={handleSaveWishlist} disabled={isSaving} className="flex items-center gap-2">
                   <Save size={18} />
                   {isSaving ? 'Saving...' : 'Save Wishlist'}
               </Button>
           </div>
       </Card>
    </div>
  );
};

export default App;