// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API = import.meta.env.VITE_API_BASE_URL || "";

// function parseDate(value){
//   if (!value) return null;
//   const n = typeof value === "number" ? value : (Number(value) || null);
//   return n ? new Date(n) : new Date(value);
// }

// function formatDate(d){
//   if(!d) return "";
//   return d.toLocaleDateString('en-US', { 
//     month: 'short', 
//     day: 'numeric', 
//     year: 'numeric' 
//   });
// }

// function formatTime(d){
//   if(!d) return "";
//   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// function formatDuration(seconds){
//   if(seconds == null) return "";
//   const s = Math.round(Number(seconds));
//   if(s < 60) return `${s} min`;
//   const m = Math.floor(s / 60);
//   const rem = s % 60;
//   return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
// }

// export default function MeetingList(){
//   const [meetings, setMeetings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   async function load(){
//     setLoading(true);
//     setError(null);
//     try{
//       const res = await fetch(`${API}/api/external/meetings`);
//       if(!res.ok) throw new Error(await res.text());
//       const data = await res.json();
//       setMeetings(data);
//     }catch(err){
//       console.error(err);
//       setError("Failed to load meetings. Please try again.");
//     }finally{
//       setLoading(false);
//     }
//   }

//   useEffect(()=> { load(); }, []);

//   const LoadingSkeleton = () => (
//     <div style={{ padding: '24px' }}>
//       {[...Array(5)].map((_, i) => (
//         <div key={i} style={{
//           height: '60px',
//           backgroundColor: '#f8fafc',
//           borderRadius: '12px',
//           marginBottom: '12px',
//           animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//           background: 'linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%)',
//           backgroundSize: '200% 100%',
//           animationName: 'shimmer'
//         }} />
//       ))}
//       <style>{`
//         @keyframes shimmer {
//           0% { background-position: 200% 0; }
//           100% { background-position: -200% 0; }
//         }
//       `}</style>
//     </div>
//   );

//   return (
//     <div style={{
//       minHeight: '100vh',
//       backgroundColor: '#f8fafc',
//       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
//     }}>
//       <div style={{
//         maxWidth: '1200px',
//         margin: '0 auto',
//         padding: '32px 24px'
//       }}>
//         {/* Header */}
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '32px',
//           paddingBottom: '24px',
//           borderBottom: '1px solid #e2e8f0'
//         }}>
//           <div>
//             <h1 style={{
//               fontSize: '32px',
//               fontWeight: '700',
//               color: '#1e293b',
//               margin: '0 0 8px 0',
//               letterSpacing: '-0.025em'
//             }}>
//               Meetings
//             </h1>
//             <p style={{
//               color: '#64748b',
//               margin: 0,
//               fontSize: '16px'
//             }}>
//               Manage and view your meeting recordings
//             </p>
//           </div>
//           <button
//             onClick={load}
//             disabled={loading}
//             style={{
//               backgroundColor: loading ? '#e2e8f0' : '#3b82f6',
//               color: loading ? '#94a3b8' : 'white',
//               border: 'none',
//               borderRadius: '12px',
//               padding: '12px 24px',
//               fontSize: '14px',
//               fontWeight: '600',
//               cursor: loading ? 'not-allowed' : 'pointer',
//               transition: 'all 0.2s ease',
//               boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
//               transform: loading ? 'none' : 'translateY(0)',
//             }}
//             onMouseEnter={(e) => {
//               if (!loading) {
//                 e.target.style.backgroundColor = '#2563eb';
//                 e.target.style.transform = 'translateY(-1px)';
//                 e.target.style.boxShadow = '0 8px 25px -8px rgba(59, 130, 246, 0.3)';
//               }
//             }}
//             onMouseLeave={(e) => {
//               if (!loading) {
//                 e.target.style.backgroundColor = '#3b82f6';
//                 e.target.style.transform = 'translateY(0)';
//                 e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.1)';
//               }
//             }}
//           >
//             {loading ? 'Refreshing...' : 'Refresh'}
//           </button>
//         </div>

//         {/* Error State */}
//         {error && (
//           <div style={{
//             backgroundColor: '#fef2f2',
//             border: '1px solid #fecaca',
//             borderRadius: '12px',
//             padding: '16px',
//             marginBottom: '24px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '12px'
//           }}>
//             <div style={{
//               width: '20px',
//               height: '20px',
//               backgroundColor: '#ef4444',
//               borderRadius: '50%',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//               fontSize: '12px',
//               fontWeight: 'bold'
//             }}>!</div>
//             <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
//               {error}
//             </span>
//           </div>
//         )}

//         {/* Loading State */}
//         {loading && <LoadingSkeleton />}

//         {/* Meetings Table */}
//         {!loading && (
//           <div style={{
//             backgroundColor: 'white',
//             borderRadius: '16px',
//             boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
//             overflow: 'hidden'
//           }}>
//             <div style={{ overflowX: 'auto' }}>
//               <table style={{
//                 width: '100%',
//                 borderCollapse: 'collapse'
//               }}>
//                 <thead>
//                   <tr style={{ backgroundColor: '#f8fafc' }}>
//                     <th style={{
//                       padding: '20px 24px',
//                       textAlign: 'left',
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#64748b',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.05em',
//                       width: '50%'
//                     }}>
//                       Meeting Title
//                     </th>
//                     <th style={{
//                       padding: '20px 24px',
//                       textAlign: 'left',
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#64748b',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.05em',
//                       width: '20%'
//                     }}>
//                       Date
//                     </th>
//                     <th style={{
//                       padding: '20px 24px',
//                       textAlign: 'left',
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#64748b',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.05em',
//                       width: '15%'
//                     }}>
//                       Time
//                     </th>
//                     <th style={{
//                       padding: '20px 24px',
//                       textAlign: 'left',
//                       fontSize: '12px',
//                       fontWeight: '600',
//                       color: '#64748b',
//                       textTransform: 'uppercase',
//                       letterSpacing: '0.05em',
//                       width: '15%'
//                     }}>
//                       Duration
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {meetings.map((m, index) => {
//                     const d = parseDate(m.date);
//                     return (
//                       <tr
//                         key={m.id}
//                         onClick={() => navigate(`/meetings/${m.id}`)}
//                         style={{
//                           cursor: 'pointer',
//                           borderTop: index > 0 ? '1px solid #f1f5f9' : 'none',
//                           transition: 'all 0.2s ease'
//                         }}
//                         onMouseEnter={(e) => {
//                           e.currentTarget.style.backgroundColor = '#f8fafc';
//                           e.currentTarget.style.transform = 'translateX(4px)';
//                         }}
//                         onMouseLeave={(e) => {
//                           e.currentTarget.style.backgroundColor = 'transparent';
//                           e.currentTarget.style.transform = 'translateX(0)';
//                         }}
//                       >
//                         <td style={{
//                           padding: '20px 24px',
//                           fontSize: '15px',
//                           fontWeight: '500',
//                           color: '#1e293b'
//                         }}>
//                           {m.title || 'Untitled Meeting'}
//                         </td>
//                         <td style={{
//                           padding: '20px 24px',
//                           fontSize: '14px',
//                           color: '#64748b'
//                         }}>
//                           {formatDate(d)}
//                         </td>
//                         <td style={{
//                           padding: '20px 24px',
//                           fontSize: '14px',
//                           color: '#64748b'
//                         }}>
//                           {formatTime(d)}
//                         </td>
//                         <td style={{
//                           padding: '20px 24px',
//                           fontSize: '14px',
//                           color: '#64748b'
//                         }}>
//                           <span style={{
//                             backgroundColor: '#f1f5f9',
//                             color: '#475569',
//                             padding: '4px 8px',
//                             borderRadius: '6px',
//                             fontSize: '12px',
//                             fontWeight: '500'
//                           }}>
//                             {formatDuration(m.duration)}
//                           </span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Empty State */}
//         {!loading && meetings.length === 0 && (
//           <div style={{
//             textAlign: 'center',
//             padding: '80px 24px',
//             backgroundColor: 'white',
//             borderRadius: '16px',
//             boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
//           }}>
//             <div style={{
//               width: '64px',
//               height: '64px',
//               backgroundColor: '#f1f5f9',
//               borderRadius: '50%',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               margin: '0 auto 24px',
//               fontSize: '24px'
//             }}>
//               📅
//             </div>
//             <h3 style={{
//               fontSize: '20px',
//               fontWeight: '600',
//               color: '#1e293b',
//               margin: '0 0 8px 0'
//             }}>
//               No meetings found
//             </h3>
//             <p style={{
//               color: '#64748b',
//               margin: '0 0 24px 0',
//               fontSize: '16px'
//             }}>
//               Your meetings will appear here once they're available.
//             </p>
//             <button
//               onClick={load}
//               style={{
//                 backgroundColor: '#3b82f6',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 padding: '10px 20px',
//                 fontSize: '14px',
//                 fontWeight: '500',
//                 cursor: 'pointer',
//                 transition: 'background-color 0.2s ease'
//               }}
//               onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
//               onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
//             >
//               Try Again
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }






import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Calendar, Clock, AlertCircle, Folder, Zap, Search, Filter, Download, MoreVertical } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "";

function parseDate(value) {
  if (!value) return null;
  const n = typeof value === "number" ? value : (Number(value) || null);
  return n ? new Date(n) : new Date(value);
}

function formatDate(d) {
  if (!d) return "";
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatTime(d) {
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
  if (seconds == null) return "";
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s} min`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m} min` : `${m}m ${rem}s`;
}

export default function MeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/external/meetings`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load meetings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(parseDate(meeting.date))?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LoadingSkeleton = () => (
    <div className="p-6 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-slate-800/30 backdrop-blur-md rounded-xl border border-slate-700/20 animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 text-white rounded-3xl overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl "></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 ">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 mb-8 mt-5  border border-slate-700/40 shadow-lg">
          {/* Glow accents */}
          <div className="absolute   inset-0 -z-10 ">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full"></div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ">
            {/* Title + Icon */}
            <div className="flex items-center gap-4 ">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-md ">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl pt-3 font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Meeting Library
                </h1>
                
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-64 pl-10 pr-4 py-2.5 bg-slate-700/40 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

             
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-700/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Active System</span>
            </div>
            <div className="text-sm text-slate-400">•</div>
            <div className="text-sm text-slate-300">
              {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} found
            </div>
            <div className="text-sm text-slate-400">•</div>
            <div className="text-sm text-slate-300">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-800/30 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-md">
            <div className="w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle size={14} />
            </div>
            <span className="text-rose-200 text-sm">{error}</span>
            <button
              onClick={load}
              className="ml-auto bg-rose-700/30 hover:bg-rose-700/40 px-3 py-1 rounded-lg text-sm text-rose-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Meetings Table */}
        {!loading && filteredMeetings.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/30 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-700/30">
                    <th className="p-4 pl-6 text-left text-slate-300 font-medium text-sm w-[40%]">
                      Meeting Title
                    </th>
                    <th className="p-4 text-left text-slate-300 font-medium text-sm w-[20%]">
                      Date
                    </th>
                    <th className="p-4 text-left text-slate-300 font-medium text-sm w-[20%]">
                      Time
                    </th>
                    <th className="p-4 text-left text-slate-300 font-medium text-sm w-[15%]">
                      Duration
                    </th>
                    
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((m, index) => {
                    const d = parseDate(m.date);
                    return (
                      <tr
                        key={m.id}
                        className="cursor-pointer transition-all duration-200 border-b border-slate-700/30 last:border-b-0 hover:bg-slate-700/30 group"
                      >
                        <td 
                          className="p-4 pl-6"
                          onClick={() => navigate(`/meetings/${m.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                              <Folder size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                                {m.title || 'Untitled Meeting'}
                              </div>
                              
                            </div>
                          </div>
                        </td>
                        <td 
                          className="p-4"
                          onClick={() => navigate(`/meetings/${m.id}`)}
                        >
                          <div className="flex items-center gap-2 text-slate-300 text-sm">
                            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{formatDate(d)}</span>
                          </div>
                        </td>
                        <td 
                          className="p-4"
                          onClick={() => navigate(`/meetings/${m.id}`)}
                        >
                          <div className="flex items-center gap-2 text-slate-300 text-sm">
                            <Clock size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{formatTime(d)}</span>
                          </div>
                        </td>
                        <td 
                          className="p-4"
                          onClick={() => navigate(`/meetings/${m.id}`)}
                        >
                          <span className="bg-slate-700/40 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600/30 inline-block group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors">
                            {formatDuration(m.duration)}
                          </span>
                        </td>
                       
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-700/50 border-t border-slate-700/30 px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Showing {filteredMeetings.length} of {meetings.length} meetings
                </span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm text-slate-300 hover:text-white transition-colors">
                    Previous
                  </button>
                  <span className="text-sm text-slate-400">•</span>
                  <button className="px-3 py-1 text-sm text-slate-300 hover:text-white transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Empty State */}
        {!loading && filteredMeetings.length === 0 && (
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-12 text-center border border-slate-700/30">
            <div className="w-20 h-20 bg-slate-700/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-600/30">
              <Calendar size={36} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              {searchTerm ? "No meetings found" : "No meetings yet"}
            </h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No meetings match your search for "${searchTerm}". Try different keywords.`
                : "Your meetings will appear here once they're processed and available."
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={load}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 text-white px-6 py-2.5 rounded-xl transition-all duration-300"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}