


import { useNavigate } from "react-router-dom";
import { CalendarPlus, ListChecks, Bookmark, FileText, Clock, ChevronRight, TrendingUp, Users, Zap, MoreHorizontal, Play, Sparkles, BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Home() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    saved: 0,
    plansGenerated: 0,
    avgDuration: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gsap.fromTo(pageRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.8, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch(`${API}/api/meetings`);
        const meetings = await res.json();
        
        const total = meetings.length;
        const saved = meetings.filter(m => m.summary && m.summary.length > 0).length;
        const plans = meetings.filter(m => m.hasProjectPlan).length;
        const avgDur = total > 0 ? Math.round(meetings.reduce((a, b) => a + (b.durationSeconds || 0), 0) / total) : 0;

        setStats({ totalMeetings: total, saved, plansGenerated: plans, avgDuration: avgDur });
        setRecentMeetings(meetings.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleScheduleMeeting = () => {
    const googleCalendarUrl =
      "https://calendar.google.com/calendar/render?" +
      "action=TEMPLATE&" +
      "text=Meeting&" +
      "details=Meeting scheduled via Fireflies Dashboard&" +
      "location=&" +
      "add=fred@fireflies.ai";
    window.open(googleCalendarUrl, "_blank");
  };

  const handleMeetingClick = async (id) => {
  try {
    const res = await fetch(`${API}/api/meetings/${id}`);
    if (!res.ok) return;
    const meeting = await res.json();

    if (meeting.projectPlan || meeting.hasProjectPlan) {
      navigate(`/project-plan/${meeting.id}`);   // DB ID
    } else if (
      meeting.functionalDoc?.length > 0 ||
      meeting.mockups?.length > 0 ||
      meeting.markdown?.length > 0
    ) {
      navigate(`/generate-files/${meeting.id}`); // DB ID
    } else {
      // use external FirefliesId if present
      if (meeting.firefliesId) {
        navigate(`/meetings/${meeting.firefliesId}`);
      } else {
        console.warn("No FirefliesId found, falling back to DB id");
        navigate(`/meetings/${meeting.id}`);
      }
    }
  } catch (err) {
    console.error("Failed to navigate:", err);
  }
};


  return (
    <div ref={pageRef} className="min-h-screen rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900/80 to-purple-900/90 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 px-4 pt-4 pb-6 flex justify-center ">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800/70 to-purple-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Zap className="text-white" size={28} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                      Fireflies Dashboard
                    </h1>
                    <p className="text-slate-300 mt-1">Track, analyze, and manage your meetings effectively</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-slate-300">System Active</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                icon={<ListChecks size={20} />} 
                label="Total Meetings" 
                value={loading ? "…" : stats.totalMeetings} 
                
                changePositive={true}
                loading={loading}
              />
              <StatCard 
                icon={<Bookmark size={20} />} 
                label="Saved" 
                value={loading ? "…" : stats.saved} 
                
                changePositive={true}
                loading={loading}
              />
              <StatCard 
                icon={<FileText size={20} />} 
                label="Plans Generated" 
                value={loading ? "…" : stats.plansGenerated} 
                
                changePositive={true}
                loading={loading}
              />
              <StatCard 
                icon={<Clock size={20} />} 
                label="Avg. Duration" 
                value={loading ? "…" : `${stats.avgDuration} min`} 
                changePositive={false}
                loading={loading}
              />
            </div>

            

            {/* Recent Meetings Section */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border shadow-lg border-slate-700/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Meetings</h2>
                <button 
                  onClick={() => navigate("/meetings")}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 group"
                >
                  View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {recentMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentMeetings.map((m, i) => (
                    <MeetingCard 
                      key={i} 
                      meeting={m} 
                      onClick={() => handleMeetingClick(m.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                    <Users className="text-slate-400" size={28} />
                  </div>
                  <p className="text-slate-300">No meetings yet</p>
                  <p className="text-slate-400 text-sm mt-1">Fetch meetings to see them here</p>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-5">
            {/* Schedule Meeting Card */}
            <div className="bg-gradient-to-br from-blue-700/80 to-indigo-800/80 backdrop-blur-md rounded-2xl p-5 border border-blue-600/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CalendarPlus size={22} />
                </div>
                <h3 className="text-lg font-semibold">Schedule Meeting</h3>
              </div>
              <p className="text-blue-100 text-sm mb-5">Schedule instantly on Google Calendar with Fred added as a guest.</p>
              <button
                onClick={handleScheduleMeeting}
                className="w-full py-3 rounded-xl bg-white text-blue-700 font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={16} />
                Schedule Now
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-slate-700/30 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <ActionButton
                  icon={<ListChecks size={18} />}
                  label="Fetch Meetings"
                  onClick={() => navigate("/meetings")}
                  color="from-emerald-600 to-teal-700"
                />
                <ActionButton
                  icon={<Bookmark size={18} />}
                  label="View Saved"
                  onClick={() => navigate("/saved")}
                  color="from-violet-600 to-purple-700"
                />
              </div>
            </div>

            

            {/* Tip Card */}
            <div className="bg-gradient-to-br from-amber-700/30 to-orange-700/20 backdrop-blur-md rounded-2xl p-5 border border-amber-600/20 shadow-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="text-amber-300 mt-0.5" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-amber-200 mb-1">Pro Tip</h3>
                  <p className="text-amber-100/80 text-xs">
                    Use the AI summary feature to extract action items 3x faster from your meetings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, changePositive, loading }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-700/50 rounded-xl">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${changePositive ? 'bg-green-900/30 text-green-400' : 'bg-rose-900/30 text-rose-400'}`}>
            <TrendingUp size={12} className={changePositive ? '' : 'rotate-180 mr-1'} />
            <span>{change}</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 bg-slate-700/50 rounded-lg animate-pulse mb-2"></div>
      ) : (
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
      )}
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function MeetingCard({ meeting, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-slate-800/30 backdrop-blur-md p-4 rounded-xl border border-slate-700/30 hover:border-slate-600/50 cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
          {meeting.title || "Untitled Meeting"}
        </h3>
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 rounded transition-all">
          <MoreHorizontal size={16} className="text-slate-400" />
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
          {new Date(meeting.meetingDate).toLocaleDateString()}
        </span>
        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
          {Math.round((meeting.durationSeconds || 0) )} min
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-auto">
        <div className="flex gap-2">
          {meeting.summary && <Tag color="blue" text="Saved" />}
          {meeting.hasProjectPlan && <Tag color="green" text="Plan" />}
        </div>
        <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
}

function Tag({ text, color }) {
  const colorMap = {
    blue: "bg-blue-900/30 text-blue-400 border border-blue-800/30",
    green: "bg-green-900/30 text-green-400 border border-green-800/30",
    gray: "bg-slate-700/50 text-slate-400 border border-slate-600/30",
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[color]}`}>
      {text}
    </span>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${color} text-white font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}
    >
      {icon}
      {label}
    </button>
  );
}