import React, { useEffect } from 'react';
import { X, Loader2, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreateTicketModal = ({ isOpen, onClose, onSubmit, loading, data, setData }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      setData(prev => ({ 
        ...prev, 
        customer_name: user.full_name, 
        customer_email: user.email || user.username // Usar email si existe, sino username
      }));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden fade-in">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-sky-400" size={20} /> New Request
            </h2>
            <p className="text-xs text-slate-500 mt-1">Submit your request to the AI workspace.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Campos de cliente ocultos y auto-rellenados para todos los roles internos */}

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Subject / Issue Title</label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-sky-500 outline-none transition-all text-sm"
              placeholder="e.g. Server is down"
              value={data.subject || ''}
              onChange={e => setData({...data, subject: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Detailed Request</label>
            <textarea 
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-sky-500 outline-none transition-all text-sm min-h-[120px]"
              placeholder="Explain the issue..."
              value={data.request_text}
              onChange={e => setData({...data, request_text: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Attachment (Screenshot)</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-slate-950 border border-slate-800 p-3 rounded-lg hover:border-sky-500 transition-all flex items-center gap-2 text-sm text-slate-400">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={e => setData({...data, file: e.target.files[0]})} 
                  accept="image/*"
                />
                <Plus size={16} /> {data.file ? 'Change File' : 'Choose File'}
              </label>
              {data.file && (
                <span className="text-xs text-sky-400 font-medium truncate max-w-[200px]">
                  {data.file.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              disabled={loading}
              className="flex-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Process with AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
