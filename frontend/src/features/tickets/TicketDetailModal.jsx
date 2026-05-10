import React, { useState, useEffect } from 'react';
import { X, Send, User, Clock, Tag, Paperclip, AlertTriangle } from 'lucide-react';
import { ticketApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ["Open", "In Progress", "Resolved"];

const TicketDetailModal = ({ isOpen, onClose, ticket, onUpdate, onRefreshDetail }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [agents, setAgents] = useState([]);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'history'

  // Cargar comentarios independientemente del objeto ticket para evitar resets
  useEffect(() => {
    if (isOpen && ticket?.id) {
      ticketApi.getDetails(ticket.id)
        .then(res => setLocalComments(res.data.comments || []))
        .catch(console.error);
    }
    if (!isOpen) {
      setLocalComments([]);
      setComment('');
      setIsEditing(false);
    }
  }, [isOpen, ticket?.id]);

  useEffect(() => {
    if (isOpen && (user?.role === 'admin' || user?.role === 'soporte')) {
      ticketApi.getUsers().then(res => {
        setAgents(res.data.filter(u => u.role === 'soporte').map(u => `${u.full_name} (${u.department})`));
      }).catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen || !ticket) return null;

  const isAdmin = user?.role === 'admin' || user?.role === 'soporte';

  const handleUpdate = async (field, value) => {
    setIsUpdating(true);
    try {
      await ticketApi.update(ticket.id, { [field]: value });
      ticket[field] = value; // Update local state immediately to fix dropdown reset bug
      onUpdate();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || "Error updating ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  const saveEdits = async () => {
    setIsUpdating(true);
    try {
      await ticketApi.update(ticket.id, { request_text: editedText, customer_email: editedEmail });
      setIsEditing(false);
      onUpdate();
      if (onRefreshDetail) onRefreshDetail();
    } catch (e) {
      alert("Error saving edits");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSendingComment(true);
    const commentText = comment;
    try {
      const res = await ticketApi.addComment(ticket.id, { text: commentText, is_internal: isInternal });
      const newComment = res.data;
      
      setLocalComments(prev => [...prev, newComment]);
      setComment("");
      setIsInternal(false);
      
      if (onRefreshDetail) onRefreshDetail();
    } catch (e) {
      console.error('Error adding comment:', e.response?.data || e);
      alert(e.response?.data?.detail || "Error adding comment");
    } finally {
      setIsSendingComment(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await ticketApi.getAuditLog(ticket.id);
      setAuditLogs(res.data);
      setActiveTab('history');
    } catch (e) { alert("Error loading history"); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await ticketApi.deleteComment(ticket.id, commentId);
      setLocalComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error('Error deleting comment:', e.response?.data || e);
      alert(e.response?.data?.detail || "Error deleting comment");
    }
  };

  const priorityColors = {
    High: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Ticket Info */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-slate-800">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${priorityColors[ticket.priority]}`}>
                  {ticket.priority} Priority
                </span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Tag size={14} /> {ticket.category}
                </span>
                {!isEditing && user?.role === 'empleado' && (
                  <button onClick={() => {setEditedText(ticket.request_text); setEditedEmail(ticket.customer_email || ''); setIsEditing(true);}} className="ml-4 text-xs font-bold text-sky-500 hover:text-sky-400">
                    Edit Content
                  </button>
                )}
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">
                {ticket.subject || ticket.customer_name}
              </h1>
              <p className="text-slate-500 mt-2 font-medium flex items-center gap-2 text-sm">
                <User size={16} /> {ticket.customer_name} 
                {isEditing ? (
                  <input className="bg-slate-950 border border-slate-800 p-1 rounded px-2 outline-none focus:border-sky-500 text-white ml-2" value={editedEmail} onChange={e => setEditedEmail(e.target.value)} placeholder="Email" />
                ) : (
                  <span>({ticket.customer_email || 'No email'})</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 block">AI Summary</label>
              <div className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-2xl italic text-sky-100 text-sm leading-relaxed">
                "{ticket.summary}"
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Full Request</label>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-sky-500 transition-all min-h-[150px] text-white"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdits} disabled={isUpdating} className="bg-sky-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs hover:bg-sky-400 transition-colors flex items-center gap-2">
                      {isUpdating ? <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"></span> : 'Save & Reclassify'}
                    </button>
                    <button onClick={() => setIsEditing(false)} disabled={isUpdating} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                  {ticket.request_text}
                </div>
              )}
            </div>

            {ticket.attachment_url && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Attachment</label>
                <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 group relative">
                  <a 
                    href={`${import.meta.env.VITE_API_URL}${ticket.attachment_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block cursor-zoom-in"
                  >
                    <img 
                      src={`${import.meta.env.VITE_API_URL}${ticket.attachment_url}`} 
                      alt="Attachment" 
                      className="w-full h-auto max-h-[300px] object-contain hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white font-bold text-xs bg-slate-900/80 px-4 py-2 rounded-full border border-white/20">Click to expand</span>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Comments */}
        <div className="w-full md:w-80 bg-slate-900/50 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
             <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('feed')}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'feed' ? 'text-sky-500' : 'text-slate-500'}`}
                >Activity</button>
                {isAdmin && (
                  <button 
                    onClick={fetchAuditLogs}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-sky-500' : 'text-slate-500'}`}
                  >History</button>
                )}
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
               <X size={20} />
             </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Ticket Status {!isAdmin && "(Admin only)"}
                </label>
                <select 
                  className={`w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-200 font-bold appearance-none transition-all ${!isAdmin && 'opacity-50 cursor-not-allowed'}`}
                  value={ticket.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  disabled={isUpdating || !isAdmin}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Assigned Owner</label>
                {isAdmin ? (
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-200 font-bold appearance-none transition-all"
                    value={ticket.owner || ""}
                    onChange={(e) => handleUpdate('owner', e.target.value)}
                    disabled={isUpdating}
                  >
                    {!ticket.owner && <option value="">Unassigned</option>}
                    {ticket.owner && !agents.includes(ticket.owner) && (
                      <option value={ticket.owner}>{ticket.owner}</option>
                    )}
                    {agents.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <div className="w-full bg-slate-950/50 border border-slate-800 p-3 rounded-xl text-sm text-slate-400 font-bold flex justify-between items-center">
                    <span>{ticket.owner || "Unassigned"}</span>
                    {ticket.assigned_by_ia && (
                      <span className="text-[9px] bg-sky-500/20 text-sky-400 px-2 py-1 rounded-md border border-sky-500/30 flex items-center gap-1">
                        ✨ IA
                      </span>
                    )}
                  </div>
                )}
                {isAdmin && ticket.assigned_by_ia && (
                  <p className="text-[9px] text-sky-500/60 mt-2 font-bold uppercase tracking-tighter">✨ Auto-assigned by AI Agent</p>
                )}
              </div>
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">
                 {activeTab === 'feed' ? 'Activity Feed' : 'Audit History'}
               </label>
               
               <div className="space-y-4 mb-6">
                 {activeTab === 'feed' ? (
                   <>
                     {localComments.length === 0 && (
                       <p className="text-xs text-slate-600 italic text-center py-2">No hay notas aún.</p>
                     )}
                     {localComments.map((c, i) => (
                       <div key={c.id ?? i} className={`p-4 rounded-2xl border ${c.is_internal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-950/50 border-slate-800/50'}`}>
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-black uppercase ${c.is_internal ? 'text-amber-500' : 'text-sky-500'}`}>{c.author}</span>
                               {c.is_internal && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase">Internal</span>}
                             </div>
                             <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-600">
                                {c.created_at ? new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z').toLocaleString() : ''}
                              </span>
                               {c.author === user?.full_name && (
                                 <button onClick={() => handleDeleteComment(c.id)} className="text-[9px] text-rose-500 hover:text-rose-400 font-bold uppercase transition-colors">✕</button>
                               )}
                             </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
                       </div>
                     ))}
                   </>
                 ) : (
                   <div className="space-y-4">
                     {auditLogs.map((log, i) => (
                       <div key={i} className="border-l-2 border-slate-800 pl-4 py-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-300">{log.username}</span>
                            <span className="text-[8px] text-slate-600 font-mono">{new Date(log.created_at.endsWith('Z') ? log.created_at : log.created_at + 'Z').toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-sky-500 font-bold uppercase tracking-tighter">{log.action}</p>
                          {log.details && <p className="text-[10px] text-slate-500 italic">"{log.details}"</p>}
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {user?.role !== 'empleado' && (
                 <form onSubmit={handleAddComment} className="relative mt-auto space-y-3">
                   <div className="flex items-center gap-2 px-1">
                     <input 
                       type="checkbox" 
                       id="internal" 
                       checked={isInternal} 
                       onChange={e => setIsInternal(e.target.checked)}
                       className="w-3 h-3 accent-sky-500"
                     />
                     <label htmlFor="internal" className="text-[10px] font-bold text-amber-500 uppercase tracking-widest cursor-pointer">Mark as internal note</label>
                   </div>
                   <div className="relative">
                     <textarea 
                       className="w-full bg-slate-950 border border-slate-800 p-4 pr-12 rounded-2xl text-xs outline-none focus:border-sky-500 transition-all min-h-[80px] text-white"
                       placeholder={isInternal ? "Add internal note (private)..." : "Add public comment..."}
                       value={comment}
                       onChange={(e) => setComment(e.target.value)}
                       disabled={isSendingComment}
                     />
                     <button 
                       type="submit"
                       disabled={isSendingComment || !comment.trim()}
                       className={`absolute right-3 bottom-3 p-2 rounded-xl disabled:opacity-50 transition-all ${isInternal ? 'bg-amber-500 text-slate-950' : 'bg-sky-500 text-slate-950'}`}
                     >
                       {isSendingComment 
                         ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                         : <Send size={14} />}
                     </button>
                   </div>
                 </form>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
