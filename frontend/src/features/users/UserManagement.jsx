import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User as UserIcon, X, Loader2, Key, Save, Trash2, UserX, UserCheck } from 'lucide-react';
import { ticketApi } from '../../api';

const UserManagement = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    full_name: '', 
    email: '', 
    role: 'empleado', 
    department: 'All' 
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await ticketApi.getUsers();
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await ticketApi.getDepartments();
      setDepartments(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email) return alert("Email is required");
    setLoading(true);
    try {
      await ticketApi.createUser(newUser);
      setNewUser({ username: '', password: '', full_name: '', email: '', role: 'empleado', department: 'All' });
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setLoading(true);
    try {
      await ticketApi.createDepartment({ name: newDept });
      setNewDept('');
      fetchDepartments();
    } catch (e) {
      alert("Error creating department");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await ticketApi.deleteDepartment(id);
      fetchDepartments();
    } catch (e) { alert("Error deleting area"); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await ticketApi.deleteUser(id);
      fetchUsers();
    } catch (e) { alert(e.response?.data?.detail || "Error deleting user"); }
  };

  const handleToggleActive = async (user) => {
    try {
      await ticketApi.updateUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (e) { alert("Error toggling status"); }
  };

  const handleUpdatePassword = async (userId) => {
    if (!newPassword) return;
    setLoading(true);
    try {
      await ticketApi.updateUser(userId, { password: newPassword });
      setEditingUser(null);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (e) {
      alert("Error updating password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
           <div>
             <h2 className="text-xl font-black text-white">Management Center</h2>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Users & Work Areas</p>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Left/Middle: User Section */}
           <div className="md:col-span-2 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">Register New Account</h3>
                <form onSubmit={handleCreateUser} className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          placeholder="Username"
                          value={newUser.username}
                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                          required
                      />
                      <input 
                          type="password"
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          placeholder="Initial Password"
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          placeholder="Full Name"
                          value={newUser.full_name}
                          onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                          required
                      />
                      <input 
                          type="email"
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          placeholder="Email Address"
                          value={newUser.email}
                          onChange={e => setNewUser({...newUser, email: e.target.value})}
                          required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          value={newUser.role}
                          onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                          <option value="empleado">Empleado</option>
                          <option value="soporte">Soporte</option>
                          <option value="admin">Administrador General</option>
                      </select>
                      <select 
                          className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                          value={newUser.department}
                          onChange={e => setNewUser({...newUser, department: e.target.value})}
                          disabled={newUser.role !== 'soporte'}
                      >
                          <option value="All">All / Default</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                      </select>
                    </div>
                    <button 
                      disabled={loading}
                      className="w-full bg-white text-slate-950 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-sky-500 hover:text-white transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <><UserPlus size={16} /> Create User</>}
                    </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Active Users</h3>
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className={`p-4 rounded-2xl border transition-all ${u.is_active ? 'bg-slate-950/30 border-slate-800/50' : 'bg-rose-500/5 border-rose-500/20 opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-sky-500/10 text-sky-500' : 'bg-slate-800 text-slate-400'}`}>
                              {u.role === 'admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${u.is_active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>{u.full_name}</p>
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                                {u.username} • {u.role} • {u.email || 'No Email'}
                                {!u.is_active && <span className="ml-2 text-rose-500">[DISABLED]</span>}
                              </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleToggleActive(u)}
                            className={`p-2 rounded-xl transition-all ${u.is_active ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-500' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                            title={u.is_active ? "Disable Account" : "Enable Account"}
                          >
                            {u.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                          
                          <button 
                            onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                            className="p-2 text-slate-500 hover:bg-sky-500/10 hover:text-sky-500 rounded-xl transition-all"
                            title="Change Password"
                          >
                            <Key size={18} />
                          </button>

                          {u.username !== 'admin' && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                      {editingUser === u.id && (
                        <div className="mt-4 flex gap-2 animate-fade-in">
                          <input 
                            type="password"
                            className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs outline-none focus:border-sky-500 text-white"
                            placeholder="New password..."
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                          />
                          <button onClick={() => handleUpdatePassword(u.id)} className="bg-sky-500 text-slate-950 p-2 rounded-xl hover:bg-sky-400 transition-colors"><Save size={16} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Right: Areas Management */}
           <div className="space-y-8 border-l border-slate-800 pl-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">Work Areas (DB)</h3>
                <form onSubmit={handleCreateDept} className="flex gap-2">
                   <input 
                      className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs outline-none focus:border-sky-500 text-white"
                      placeholder="New Area..."
                      value={newDept}
                      onChange={e => setNewDept(e.target.value)}
                   />
                   <button className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700">+</button>
                </form>
                <div className="space-y-2">
                  {departments.length === 0 && <p className="text-[10px] text-slate-600 italic">No areas configured.</p>}
                  {departments.map(d => (
                    <div key={d.id} className="flex justify-between items-center p-3 bg-slate-950/20 rounded-xl border border-slate-800/30 group">
                       <span className="text-xs text-slate-300 font-bold">{d.name}</span>
                       <button onClick={() => handleDeleteDept(d.id)} className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserManagement;
