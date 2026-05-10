import React, { useState, useEffect } from 'react';
import { X, BarChart3, PieChart, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Activity, Zap, ShieldCheck, Target, Layers, FileText, Filter, Clock, Award, Star, History, Download, Calendar, Briefcase } from 'lucide-react';
import { ticketApi } from '../../api';

/**
 * Dashboard de Inteligencia Estrategica.
 * Visualiza metricas de rendimiento, distribucion de carga y registros de auditoria forense.
 */
const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [performance, setPerformance] = useState({ support: [], top_users: [], global_avg: 0 });
  const [auditLogs, setAuditLogs] = useState([]); // Historial forense del sistema
  const [loading, setLoading] = useState(true); // Estado de carga global
  const [activeTab, setActiveTab] = useState('overview'); // Pestana activa: 'overview' o 'audit'
  const [auditDays, setAuditDays] = useState(7); // Filtro temporal de auditoria

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
      fetchAuditLogs();
    }
  }, [isOpen, auditDays]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [resSummary, resPerf] = await Promise.all([
        ticketApi.getAnalyticsSummary(),
        ticketApi.getAgentPerformance()
      ]);
      setData(resSummary.data);
      setPerformance(resPerf.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await ticketApi.getGlobalAudit({ days: auditDays });
      setAuditLogs(res.data);
    } catch (e) { console.error(e); }
  };



  if (!isOpen) return null;

  const topAgent = [...performance.support].sort((a, b) => b.resolved - a.resolved)[0];
  const fastestAgent = [...performance.support].filter(a => a.resolved > 0).sort((a, b) => parseFloat(a.avg_time) - parseFloat(b.avg_time))[0];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      
      {/* Power BI Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/40 p-8 rounded-[3rem] border border-slate-800/60 backdrop-blur-md">
         <div className="flex items-center gap-6">
           <div className="p-5 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[2rem] shadow-2xl shadow-sky-500/20 text-white">
              <BarChart3 size={32} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Intelligence <span className="text-sky-500 underline decoration-sky-500/30 underline-offset-8">Center</span></h2>
             <div className="flex items-center gap-4 mt-2">
               <button onClick={() => setActiveTab('overview')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'overview' ? 'text-sky-400' : 'text-slate-500 hover:text-white'}`}>Overview</button>
               <div className="h-3 w-px bg-slate-800"></div>
               <button onClick={() => setActiveTab('audit')} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'audit' ? 'text-sky-400' : 'text-slate-500 hover:text-white'}`}>System Audit</button>
             </div>
           </div>
         </div>

         <div className="flex items-center gap-4">

            <button onClick={onClose} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-500 rounded-2xl transition-all">
              <X size={20} />
            </button>
         </div>
      </div>

      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
           <div className="relative">
              <div className="w-24 h-24 border-[8px] border-slate-900 rounded-full"></div>
              <div className="absolute inset-0 w-24 h-24 border-[8px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <Activity size={32} className="absolute inset-0 m-auto text-sky-500 animate-pulse" />
           </div>
           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.8em]">Synthesizing Intelligence</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          
          {activeTab === 'overview' ? (
            <div className="space-y-10">
               {/* KPI Section */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPIItem label="Volume" value={data?.total} trend="+12.4%" icon={<TrendingUp size={18}/>} color="sky" />
                  <KPIItem label="Open Cases" value={data?.status?.Open || 0} trend="-2.1%" icon={<Activity size={18}/>} color="rose" isGood={false} />
                  <KPIItem label="Avg Time" value={`${performance.global_avg}h`} trend="-14%" icon={<Clock size={18}/>} color="emerald" isGood={true} />
                  <KPIItem label="Efficiency" value="94.2%" trend="+0.5%" icon={<Zap size={18}/>} color="amber" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Performance Matrix */}
                  <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800/60 rounded-[3.5rem] p-10 backdrop-blur-xl">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-10 flex items-center gap-3">
                        <Star size={24} className="text-amber-400" /> Operational Matrix
                     </h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800/50">
                              <th className="pb-6">Resource</th>
                              <th className="pb-6 text-center">Avg Response</th>
                              <th className="pb-6 text-center">Capacity</th>
                              <th className="pb-6 text-right">Yield</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {performance.support.map((agent, i) => (
                              <tr key={i} className="group hover:bg-sky-500/5 transition-all">
                                <td className="py-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:text-sky-500 transition-all">
                                         {agent.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-white">{agent.name}</p>
                                         <p className="text-[9px] font-bold text-slate-600 uppercase">{agent.dept}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-6 text-center text-sm font-black text-sky-400">{agent.avg_time}</td>
                                <td className="py-6 text-center">
                                   <div className="flex flex-col items-center gap-1.5">
                                      <span className="text-[10px] font-black text-white">{agent.resolved} Resolved</span>
                                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                         <div className="h-full bg-sky-500" style={{ width: agent.efficiency }}></div>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-6 text-right font-black text-white text-lg italic">{agent.efficiency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Top Users Bar Chart (Vertical) */}
                  <div className="lg:col-span-4 bg-slate-900/30 border border-slate-800/60 rounded-[3.5rem] p-10">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-10">Active Requestors</h3>
                     <div className="space-y-8">
                        {performance.top_users.map((user, i) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.name}</span>
                                <span className="text-xs font-black text-white">{user.count}</span>
                             </div>
                             <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div className="h-full bg-indigo-500" style={{ width: `${(user.count / (performance.top_users[0]?.count || 1)) * 100}%` }}></div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               {/* Audit Filters */}
               <div className="flex items-center gap-6 bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/40">
                  <div className="flex items-center gap-4">
                     <Calendar size={18} className="text-slate-600" />
                     <div className="flex gap-2">
                        {[7, 15, 30].map(d => (
                          <button 
                            key={d} 
                            onClick={() => setAuditDays(d)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditDays === d ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                          >
                            Last {d} Days
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="h-6 w-px bg-slate-800"></div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                     Showing {auditLogs.length} Events
                  </div>
               </div>

               {/* Large Audit Feed */}
               <div className="bg-slate-900/30 border border-slate-800/60 rounded-[3.5rem] p-10">
                  <div className="space-y-6">
                    {auditLogs.length === 0 ? (
                      <div className="py-20 text-center text-slate-600 italic">No historical events found for this period.</div>
                    ) : auditLogs.map((log, i) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/40 border border-slate-800/30 rounded-[2rem] gap-4 group hover:border-sky-500/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="p-3 bg-slate-900 rounded-2xl text-slate-600 group-hover:text-sky-400 transition-colors">
                              <History size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase tracking-tighter">{log.action}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] font-bold text-sky-500">{log.username}</span>
                                 <span className="text-[10px] text-slate-600 font-bold uppercase">• Ticket #{log.ticket_id}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-xs">{log.details}</p>
                           </div>
                           <div className="text-[9px] font-mono text-slate-700 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                              {new Date(log.created_at).toLocaleString()}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const KPIItem = ({ label, value, trend, isGood = true, icon, color }) => {
  const styles = {
    sky: "bg-sky-500/5 border-sky-500/20 text-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.05)]",
    rose: "bg-rose-500/5 border-rose-500/20 text-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.05)]",
    emerald: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.05)]",
    amber: "bg-amber-500/5 border-amber-500/20 text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.05)]"
  };

  return (
    <div className={`p-8 rounded-[3.5rem] border backdrop-blur-md transition-all hover:-translate-y-2 duration-500 group ${styles[color]}`}>
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 bg-slate-950 rounded-[1.5rem] border border-slate-800 text-slate-600 group-hover:text-white transition-colors">{icon}</div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${isGood ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          {trend}
        </span>
      </div>
      <div className="text-4xl font-black text-white tracking-tighter italic mb-1">{value}</div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</div>
    </div>
  );
};

export default AnalyticsDashboard;
