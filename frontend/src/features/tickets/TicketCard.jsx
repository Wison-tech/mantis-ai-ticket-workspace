import React from 'react';
import { Tag, User, ChevronRight, Paperclip, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const TicketCard = ({ ticket, onClick }) => {
  const priorityColors = {
    High: 'bg-red-500/10 text-red-400 border-red-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };


  return (
    <div 
      onClick={() => onClick(ticket)}
      className="glass-effect p-5 rounded-xl flex items-center justify-between hover:border-sky-500/40 transition-all cursor-pointer group fade-in"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityColors[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <Tag size={12} /> {ticket.category}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-800 ${ticket.status === 'Resolved' ? 'text-emerald-500 bg-emerald-500/5' : 'text-slate-500'}`}>
            {ticket.status}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-400 transition-colors flex items-center gap-2">
          {ticket.subject || ticket.customer_name}
          {ticket.priority === 'High' && <AlertTriangle className="text-rose-500 animate-pulse" size={16} />}
        </h3>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2 italic">
          "{ticket.summary}"
        </p>
        
        {ticket.attachment_url && (
          <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-lg bg-slate-950/50 p-2 border border-slate-800 w-fit">
             <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                <img 
                  src={`${import.meta.env.VITE_API_URL}${ticket.attachment_url}`} 
                  alt="Attachment" 
                  className="w-full h-full object-cover"
                />
             </div>
             <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
               <Paperclip size={10} /> ATTACHMENT_PREVIEW.JPG
             </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <User size={14} /> {ticket.owner || 'Unassigned'}
          </span>
          <span className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">
            Status: {ticket.status}
          </span>
          <span className="text-[9px] text-slate-700 mt-1 font-mono">
            {new Date(ticket.created_at.endsWith('Z') ? ticket.created_at : ticket.created_at + 'Z').toLocaleString()}
          </span>
        </div>
        <ChevronRight className="text-slate-700 group-hover:text-sky-500 transition-colors" size={20} />
      </div>
    </div>
  );
};

export default TicketCard;
