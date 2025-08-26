
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";

// const API = import.meta.env.VITE_API_BASE_URL || "";

// export default function SavedMeetings() {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       try {
//         const res = await fetch(`${API}/api/meetings`);
//         if (!res.ok) throw new Error(await res.text());
//         const data = await res.json();
//         setList(data);
//       } catch (err) {
//         console.error("Failed loading saved meetings", err);
//         setList([]);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "40px auto",
//         padding: "0 20px",
//         fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//         color: "#222",
//       }}
//     >
//       <h2
//         style={{
//           marginBottom: 24,
//           fontSize: "2rem",
//           borderBottom: "2px solid #4a90e2",
//           paddingBottom: 8,
//           fontWeight: "700",
//         }}
//       >
//         Saved Meetings
//       </h2>

//       {loading ? (
//         <div
//           style={{
//             textAlign: "center",
//             fontSize: "1.2rem",
//             marginTop: 50,
//             color: "#555",
//           }}
//         >
//           Loading...
//         </div>
//       ) : (
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
//             gap: 20,
//           }}
//         >
//           {list.map((m) => (
//             <Link
//               to={`/meetings/${m.firefliesId}`}
//               key={m.id}
//               style={{ textDecoration: "none", color: "inherit" }}
//             >
//               <div
//                 style={{
//                   background: "#f5f7fa",
//                   boxShadow: "0 4px 10px rgb(0 0 0 / 0.1)",
//                   borderRadius: 12,
//                   padding: 20,
//                   height: "100%",
//                   display: "flex",
//                   flexDirection: "column",
//                   justifyContent: "space-between",
//                   transition: "transform 0.3s ease, box-shadow 0.3s ease",
//                   cursor: "pointer",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.transform = "translateY(-5px)";
//                   e.currentTarget.style.boxShadow = "0 10px 20px rgb(0 0 0 / 0.15)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.transform = "translateY(0)";
//                   e.currentTarget.style.boxShadow = "0 4px 10px rgb(0 0 0 / 0.1)";
//                 }}
//               >
//                 <div
//                   style={{
//                     fontWeight: "700",
//                     fontSize: "1.1rem",
//                     marginBottom: 8,
//                     color: "#2c3e50",
//                   }}
//                 >
//                   {m.title || "Untitled Meeting"}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: "0.85rem",
//                     fontStyle: "italic",
//                     marginBottom: 12,
//                     color: "#7f8c8d",
//                   }}
//                 >
//                   {m.meetingDate ? new Date(m.meetingDate).toLocaleString() : "Date not available"}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: "0.95rem",
//                     color: "#34495e",
//                     flexGrow: 1,
//                     lineHeight: 1.4,
//                   }}
//                 >
//                   {m.summary?.length > 200
//                     ? m.summary.substring(0, 200) + "..."
//                     : m.summary || "No summary available."}
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, ArrowRight, Loader2, ArrowLeft, Star, Users, Hash } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function SavedMeetings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/meetings`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setList(data);
      } catch (err) {
        console.error("Failed loading saved meetings", err);
        setList([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getCardGradient = (title) => {
    const gradients = [
      "from-blue-600/20 to-cyan-600/20",
      "from-purple-600/20 to-pink-600/20",
      "from-green-600/20 to-emerald-600/20",
      "from-orange-600/20 to-red-600/20",
      "from-indigo-600/20 to-blue-600/20",
      "from-teal-600/20 to-cyan-600/20"
    ];
    const index = title ? title.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6 rounded-3xl">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-5">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/40 rounded-xl transition-all duration-300 hover:-translate-x-1 group"
            >
              <ArrowLeft size={24} className="text-slate-300 group-hover:text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h2 className=" pt-7 text-3xl font-bold text-white">Saved Meetings</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Access and review your previously saved meeting summaries
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <Loader2 className="animate-spin w-16 h-16 text-blue-400 mb-4" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
            </div>
            <p className="text-slate-300 text-lg mt-4">Loading your meetings...</p>
            <p className="text-slate-500 text-sm mt-2">This may take a moment</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/40 max-w-2xl mx-auto">
            <div className="relative inline-block mb-6">
              <FileText className="w-20 h-20 text-slate-500 mx-auto" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Star size={12} className="text-white" fill="currentColor" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">No meetings saved yet</h3>
            <p className="text-slate-400 mb-6">Your saved meetings will appear here once you start creating them</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {list.map((m) => (
              <Link
                to={`/meetings/${m.firefliesId}`}
                key={m.id}
                className="block group transform transition-all duration-500 hover:scale-[1.02]"
              >
                <div className={`bg-gradient-to-br ${getCardGradient(m.title)} rounded-2xl p-1 h-full backdrop-blur-sm`}>
                  <div className="bg-slate-900/80 rounded-2xl p-6 h-full border border-slate-700/30 transition-all duration-300 group-hover:border-slate-500/50">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-slate-700/50 rounded-lg mt-1">
                        <FileText size={16} className="text-blue-400" />
                      </div>
                      <h3 className="font-semibold  text-lg text-white line-clamp-2 group-hover:text-blue-300 transition-colors flex-1">
                        {m.title || "Untitled Meeting"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg">
                        <Calendar size={14} />
                        <span>
                          {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString() : "No date"}
                        </span>
                      </div>
                      {m.durationSeconds && (
                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg">
                          <Clock size={14} />
                          <span>{Math.round(m.durationSeconds )} min</span>
                        </div>
                      )}
                    </div>
                    <div className="text-slate-300 text-sm mb-4 line-clamp-3 bg-slate-800/30 p-3 rounded-lg border border-slate-700/20">
                      {m.summary?.length > 120
                        ? m.summary.substring(0, 120) + "..."
                        : m.summary || "No summary available."}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/40">
                      <span className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors font-medium">
                        View Details
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Explore</span>
                        <ArrowRight size={16} className="text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Users size={16} />
              <span className="text-sm">{list.length} reetings</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}