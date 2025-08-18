import { useNavigate } from "react-router-dom";
import { CalendarPlus, ListChecks, Bookmark, FileText, Clock } from "lucide-react";
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
    gsap.fromTo(pageRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" });
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch(`${API}/api/meetings`);
        const meetings = await res.json();

        const total = meetings.length;
        const saved = meetings.filter(m => m.summary && m.summary.length > 0).length;
        const plans = meetings.filter(m => m.hasProjectPlan).length;
        const avgDur = total > 0 ? Math.round(meetings.reduce((a, b) => a + (b.durationSeconds || 0), 0) / total / 60) : 0;

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

  // ✅ Navigation logic when user clicks a meeting
  const handleMeetingClick = async (id) => {
    try {
      const res = await fetch(`${API}/api/meetings/${id}`);
      if (!res.ok) return;
      const meeting = await res.json();

      if (meeting.projectPlan || meeting.hasProjectPlan) {
        navigate(`/project-plan/${id}`);
      } else if (
        meeting.functionalDoc?.length > 0 ||
        meeting.mockups?.length > 0 ||
        meeting.markdown?.length > 0
      ) {
        navigate(`/generate-files/${id}`);
      } else {
        navigate(`/meetings/${id}`);
      }
    } catch (err) {
      console.error("Failed to navigate:", err);
    }
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-6 py-10 flex justify-center"
    >
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE - Dashboard Info */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Header */}
          <div className="bg-white shadow-sm rounded-3xl p-8 border border-gray-100">
            <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fireflies Dashboard
            </h2>
            <p className="text-gray-600">Track, analyze, and manage your meetings effectively.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <StatCard icon={<ListChecks />} label="Total Meetings" value={loading ? "…" : stats.totalMeetings} />
            <StatCard icon={<Bookmark />} label="Saved" value={loading ? "…" : stats.saved} />
            <StatCard icon={<FileText />} label="Plans Generated" value={loading ? "…" : stats.plansGenerated} />
            <StatCard icon={<Clock />} label="Avg. Duration" value={loading ? "…" : `${stats.avgDuration} min`} />
          </div>

          {/* Recent Meetings */}
          <div className="bg-white shadow-sm rounded-3xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Meetings</h3>
            <ul className="space-y-4">
              {recentMeetings.map((m, i) => (
                <li
                  key={i}
                  onClick={() => handleMeetingClick(m.id)}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md hover:scale-[1.01] cursor-pointer transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{m.title || "Untitled"}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(m.meetingDate).toLocaleDateString()} • {Math.round((m.durationSeconds || 0) / 60)} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {m.summary ? <Tag color="blue" text="Saved" /> : null}
                    {m.hasProjectPlan ? <Tag color="green" text="Plan" /> : null}
                  </div>
                </li>
              ))}
              {recentMeetings.length === 0 && !loading && (
                <p className="text-gray-500 italic">No meetings yet. Fetch meetings to see them here.</p>
              )}
            </ul>
          </div>
        </div>

        {/* RIGHT SIDE - Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl shadow-lg p-6 flex flex-col items-center gap-4">
            <CalendarPlus size={40} className="mb-2" />
            <h3 className="text-xl font-bold">Schedule Meeting</h3>
            <p className="text-sm text-center text-blue-100">Schedule instantly on Google Calendar with Fred added as a guest.</p>
            <button
              onClick={handleScheduleMeeting}
              className="mt-3 w-full py-2 rounded-xl bg-white text-blue-600 font-semibold hover:bg-gray-100 transition"
            >
              Schedule Now
            </button>
          </div>

          <button
            onClick={() => navigate("/meetings")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition"
          >
            <ListChecks size={20} />
            Fetch Meetings
          </button>

          <a
            href="/saved"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition"
          >
            <Bookmark size={20} />
            View Saved
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-5 rounded-2xl shadow-sm bg-white border border-gray-100 hover:shadow-md hover:scale-[1.02] transition flex flex-col items-center">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function Tag({ text, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorMap[color]}`}>{text}</span>;
}
