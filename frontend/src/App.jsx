import React, { useState, useEffect } from 'react';
import { ticketApi } from './api';
import { useAuth, AuthProvider } from './context/AuthContext';
import LoginPage from './features/auth/LoginPage';
import TicketCard from './features/tickets/TicketCard';
import CreateTicketModal from './features/tickets/CreateTicketModal';
import TicketDetailModal from './features/tickets/TicketDetailModal';
import UserManagement from './features/users/UserManagement';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard';
import { Plus, LayoutDashboard, Search, AlertCircle, CheckCircle2, Clock, LogOut, Users, Loader2, BarChart3 } from 'lucide-react';

function Dashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'analytics'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const [newTicket, setNewTicket] = useState({ customer_name: '', customer_email: '', subject: '', request_text: '', file: null });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await ticketApi.getAll();
      setTickets(response.data);
    } catch (e) { console.error(e); }
    finally { if (!isSilent) setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      let attachment_url = null;
      if (newTicket.file) {
        const uploadRes = await ticketApi.uploadFile(newTicket.file);
        attachment_url = uploadRes.data.url;
      }
      await ticketApi.create({ ...newTicket, attachment_url });
      setIsModalOpen(false);
      setNewTicket({ customer_name: '', customer_email: '', subject: '', request_text: '', file: null });
      fetchTickets(true);
    } catch (e) { alert("Error creating ticket"); }
  };

  const openDetail = async (ticket) => {
    try {
      const res = await ticketApi.getDetails(ticket.id);
      setSelectedTicket(res.data);
      setIsDetailOpen(true);
    } catch (e) { alert("Error loading details"); }
  };

  const refreshDetail = async () => {
    if (!selectedTicket) return;
    try {
      const res = await ticketApi.getDetails(selectedTicket.id);
      setSelectedTicket(res.data);
      fetchTickets(true);
    } catch (e) { console.error(e); }
  };

  const filteredTickets = tickets.filter(t => {
    const text = (t.subject || t.customer_name || "") + (t.request_text || "");
    const matchesSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const stats = {
    total: tickets.length,
    urgent: tickets.filter(t => t.priority === 'High').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    pending: tickets.filter(t => t.status !== 'Resolved').length
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 min-h-screen">
      <nav className="flex justify-between items-center mb-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-sky-500/40">
            <LayoutDashboard className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">MANTIS <span className="text-sky-500">AI</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Workspace • {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
             <>
               <button 
                 onClick={() => setView(view === 'analytics' ? 'dashboard' : 'analytics')} 
                 className={`p-4 transition-all ${view === 'analytics' ? 'text-sky-500' : 'text-slate-500 hover:text-sky-500'}`} 
                 title={view === 'analytics' ? "Back to Tickets" : "Intelligence Center"}
               >
                  <BarChart3 size={20} />
               </button>
               <button onClick={() => setIsUserMgmtOpen(true)} className="p-4 text-slate-500 hover:text-sky-500 transition-colors" title="User Management">
                  <Users size={20} />
               </button>
             </>
          )}
          <button onClick={logout} className="p-4 text-slate-500 hover:text-rose-500 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm hover:bg-sky-500 hover:text-white transition-all active:scale-95">
            + New Request
          </button>
        </div>
      </nav>

      {view === 'analytics' ? (
        <AnalyticsDashboard isOpen={true} onClose={() => setView('dashboard')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <StatCard icon={<LayoutDashboard size={20}/>} label="Total" value={stats.total} color="sky" />
            <StatCard icon={<AlertCircle size={20}/>} label="Urgent" value={stats.urgent} color="rose" />
            <StatCard icon={<Clock size={20}/>} label="Pending" value={stats.pending} color="amber" />
            <StatCard icon={<CheckCircle2 size={20}/>} label="Resolved" value={stats.resolved} color="emerald" />
          </div>

          <div className="flex flex-col gap-6 mb-12 bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-sm">
            {/* Search and Category Row */}
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 relative">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search ID, subject or customer..." 
                   className="w-full bg-slate-950/80 border border-slate-800/60 pl-14 pr-4 py-4 rounded-2xl outline-none text-sm focus:border-sky-500 transition-all placeholder:text-slate-600" 
                   value={search} 
                   onChange={e => setSearch(e.target.value)} 
                 />
               </div>
               <div className="md:w-64">
                 <FilterSelect 
                   value={filterCategory} 
                   onChange={setFilterCategory} 
                   options={['All', 'Finance', 'Technical Support', 'Sales', 'Operations', 'Legal', 'Procurement']} 
                 />
               </div>
            </div>

            {/* Intuitive Badges Row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 justify-between">
               {/* Priority Badges */}
               <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Priority</span>
                  <div className="flex gap-2">
                     {['All', 'High', 'Medium', 'Low'].map(p => (
                       <button
                         key={p}
                         onClick={() => setFilterPriority(p)}
                         className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all border ${
                           filterPriority === p 
                           ? (p === 'High' ? 'bg-rose-500 border-rose-500 text-white' : p === 'Medium' ? 'bg-amber-500 border-amber-500 text-white' : p === 'Low' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-sky-500 border-sky-500 text-white')
                           : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                         }`}
                       >
                         {p}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Status Badges */}
               <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Lifecycle Status</span>
                  <div className="flex gap-2">
                     {['All', 'Open', 'In Progress', 'Resolved'].map(s => (
                       <button
                         key={s}
                         onClick={() => setFilterStatus(s)}
                         className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all border ${
                           filterStatus === s
                           ? 'bg-white border-white text-slate-950'
                           : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                         }`}
                       >
                         {s}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Sort Toggle */}
               <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Order</span>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:border-sky-500 transition-all text-[11px] font-black uppercase"
                  >
                    <Clock size={14} className={sortOrder === 'desc' ? 'rotate-0' : 'rotate-180 transition-transform'} />
                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </button>
               </div>
            </div>
          </div>

          <main>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48} /></div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-32 opacity-30">No tickets found</div>
            ) : (
              <div className="grid gap-6">
                {filteredTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onClick={openDetail} />)}
              </div>
            )}
          </main>
        </>
      )}

      <CreateTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} data={newTicket} setData={setNewTicket} />
      <TicketDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} ticket={selectedTicket} onUpdate={fetchTickets} onRefreshDetail={refreshDetail} />
      <UserManagement isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={48} /></div>;
  if (!user) return <LoginPage />;
  return <Dashboard />;
}

function StatCard({ icon, label, value, color }) {
  const colors = { sky: "text-sky-400 bg-sky-400/10 border-sky-400/20", rose: "text-rose-400 bg-rose-400/10 border-rose-400/20", amber: "text-amber-400 bg-amber-400/10 border-amber-400/20", emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
  return (
    <div className={`p-6 rounded-3xl border ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-4">{icon}<span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span></div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-sm outline-none text-slate-400" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default App;
