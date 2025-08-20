// File: ProjectPlan.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftFromLine,
  Save,
  Loader2,
  Download,
  Edit3,
  Eye,
  Calendar,
  Clock,
  FileText,
  Check,
  X,
  ListTodo,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function ProjectPlan() {
  const { dbId } = useParams();
  const navigate = useNavigate();

  const [planData, setPlanData] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backlog-related states
  const [generatingBacklog, setGeneratingBacklog] = useState(false);
  const [backlogGenerated, setBacklogGenerated] = useState(false);

  const contentRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (dbId) fetchProjectPlan(dbId);
    else setError("Meeting ID is missing from the URL.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId]);

  useEffect(() => {
    if (toolbarRef.current) {
      toolbarRef.current.classList.remove("translate-y-6", "opacity-0");
      toolbarRef.current.classList.add("translate-y-0", "opacity-100");
    }
    if (contentRef.current) {
      contentRef.current.classList.remove("translate-y-6", "opacity-0");
      contentRef.current.classList.add("translate-y-0", "opacity-100");
    }
  }, [planData]);

  // fetch project plan
  async function fetchProjectPlan(id) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/meetings/${id}/project-plan`);
      if (!res.ok) {
        if (res.status === 404) {
          setPlanData(null);
          setError("No project plan found.");
        } else {
          throw new Error(await res.text());
        }
        return;
      }
      const data = await res.json();
      setPlanData(data);
      setEditedContent(cleanMarkdown(data.projectPlan ?? ""));
      await checkBacklogExists(id);
    } catch (err) {
      setError(err.message || "Failed to load project plan");
    } finally {
      setLoading(false);
    }
  }

  async function checkBacklogExists(id) {
    try {
      const res = await fetch(`${API}/api/meetings/${id}/backlog`);
      setBacklogGenerated(res.ok);
    } catch {
      setBacklogGenerated(false);
    }
  }

  function cleanMarkdown(content) {
    if (!content) return "";
    return content
      .replace(/\*\s*\*/g, "**")
      .replace(/#\s*#/g, "##")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function handleSave() {
    if (!dbId || !editedContent.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API}/api/meetings/${dbId}/project-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPlan: editedContent }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPlanData((p) => ({ ...p, projectPlan: editedContent }));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2600);
    } catch (err) {
      setError(err.message || "Failed to save project plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateBacklog() {
    if (!dbId) return;
    setGeneratingBacklog(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/meetings/${dbId}/generate-backlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(await res.text());

      setBacklogGenerated(true);

      setTimeout(() => {
        navigate(`/meeting/${dbId}/backlog`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to generate product backlog");
    } finally {
      setGeneratingBacklog(false);
    }
  }

  function handleViewBacklog() {
    navigate(`/meeting/${dbId}/backlog`);
  }

  function handleDownload() {
    const content = editedContent || planData?.projectPlan || "";
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (planData?.meetingTitle || "project_plan").replace(/\s+/g, "_");
    a.download = `${name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleBack() {
    navigate(-1);
  }

   // ---------- enhanced heading UI in mdComponents ----------
  const mdComponents = {
    // H1: Large hero-like header with icon and gradient text
    h1: ({ node, children, ...props }) => (
      <div className="flex items-center gap-4 mt-10 mb-6 pb-4 border-b border-gray-100">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-sm">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1
            className="text-3xl md:text-4xl font-extrabold gradient-text leading-tight"
            {...props}
          >
            {children}
          </h1>
          {/* subtitle area — optional, will be empty if no following inline text */}
          <div className="mt-1 text-sm text-gray-500">
            {/* Keep this space light for optional descriptions in your markdown */}
          </div>
        </div>
      </div>
    ),

    // H2: Section header with vertical accent bar and subtle uppercase label
    h2: ({ node, children, ...props }) => (
      <div className="flex items-center gap-3 mt-8 mb-4">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        <h2
          className="text-2xl md:text-3xl font-bold text-gray-800"
          {...props}
        >
          {children}
        </h2>
      </div>
    ),

    // H3: Smaller header with left accent and soft background
    h3: ({ node, children, ...props }) => (
      <h3
        className="text-xl md:text-2xl font-semibold mt-6 mb-3 text-gray-700 pl-4 border-l-4 border-indigo-300 bg-indigo-50/40 py-2 rounded-r-lg"
        {...props}
      >
        {children}
      </h3>
    ),

    // paragraphs, lists, tables, code, blockquote preserved (slightly adjusted look)
    p: ({ node, ...props }) => (
      <p className="leading-relaxed mb-3 text-gray-700 text-base" {...props} />
    ),
    li: ({ node, ordered, ...props }) => (
      <li
        className={`mb-2 ${ordered ? "list-decimal ml-6" : "ml-6 list-disc"}`}
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="border-b-2 border-gray-200 text-left px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 font-semibold"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td className="border-b border-gray-100 px-3 py-2 align-top" {...props} />
    ),
    code: ({ inline, className, children, ...props }) =>
      inline ? (
        <code
          className="bg-indigo-50 px-1 py-0.5 rounded text-sm font-mono text-indigo-700"
          {...props}
        >
          {children}
        </code>
      ) : (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ),
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4 bg-indigo-50/40 py-3 rounded"
        {...props}
      />
    ),
  };
  // loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-6">
        <div className="text-center">
          <Loader2 className="animate-spin w-14 h-14 text-indigo-500 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">
            Loading project plan...
          </div>
        </div>
      </div>
    );
  }

  // no data
  if (!planData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full border">
          <div className="flex items-center gap-4 mb-4">
            <AlertIcon />
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                No project plan found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {error || "There is no project plan stored for this meeting."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <ArrowLeftFromLine size={16} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // main UI
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-3 shadow-lg bg-gradient-to-tr from-indigo-600 to-blue-500 ring-1 ring-indigo-200">
              <FileText className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                Project Plan
              </h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{planData.durationWeeks ?? "—"} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>
                    Generated{" "}
                    {planData.generatedAt
                      ? new Date(planData.generatedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          {/* Toolbar */}
<div
  ref={toolbarRef}
  className="flex items-center gap-3 opacity-100 translate-y-0"
>
  <IconCircle 
  title="Back" 
  onClick={handleBack} 
  accent="from-gray-50 to-white" 
  accentHover="from-gray-100 to-white" 
  animateFloat
  icon={<ArrowLeftFromLine className="w-4 h-4 text-gray-700" />} 
  animateOnClick="animate-bounce-left"
/>

  <IconCircle
    title={isEditing ? "Preview" : "Edit"}
    onClick={() => setIsEditing((s) => !s)}
    accent="from-indigo-50 to-blue-50"
    accentHover="from-indigo-200 to-blue-200"
    animateFloat
    icon={
      isEditing ? (
        <Eye className="w-4 h-4 text-indigo-700" />
      ) : (
        <Edit3 className="w-4 h-4 text-indigo-700" />
      )
    }
  />

  <div className="relative">
    <IconCircle 
  title="Save" 
  onClick={handleSave} 
  disabled={!isEditing || saving} 
  accent="from-emerald-50 to-green-50" 
  accentHover="from-emerald-200 to-green-200" 
  animateFloat
  icon={saving ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <Save className="w-4 h-4 text-green-600" />} 
  animateOnClick="animate-pulse-save"
/>
    {saveSuccess && (
      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg animate-pop">
        <Check className="w-3.5 h-3.5" />
      </span>
    )}
  </div>

  <IconCircle 
  title="Download (.md)" 
  onClick={handleDownload} 
  accent="from-purple-50 to-purple-100" 
  accentHover="from-purple-300 to-purple-400" 
  animateFloat
  icon={<Download className="w-4 h-4 text-purple-700" />} 
  animateOnClick="animate-spin-download"
/>
</div>
        </div>

         {/* Backlog Generation Section */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-2 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                <ListTodo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Product Backlog</h3>
                <p className="text-sm text-gray-600">
                  {backlogGenerated 
                    ? "Sprint-ready backlog generated! View user stories and acceptance criteria."
                    : "Generate a detailed product backlog with user stories, acceptance criteria, and story points."
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {backlogGenerated ? (
                <button
                  onClick={handleViewBacklog}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                >
                  <ListTodo className="w-4 h-4" />
                  View Backlog
                </button>
              ) : (
                <button
                  onClick={handleGenerateBacklog}
                  disabled={generatingBacklog}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {generatingBacklog ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Backlog
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {generatingBacklog && (
            <div className="mt-4 bg-white/60 rounded-lg p-4 border">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Creating your product backlog...</p>
                  <p className="text-xs text-gray-600">This may take 30-60 seconds. Please wait.</p>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* content card */}
        {/* content card */}
<div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
  {/* Card Header */}
  <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 px-6 py-4 border-b">
    <p className="text-sm text-gray-700">
      <strong className="text-gray-900">Meeting:</strong>{" "}
      {planData.meetingTitle ?? planData.FirefliesId ?? "—"}
    </p>
  </div>

  {/* Content Area */}
  <div className="relative h-[72vh] overflow-y-auto" ref={contentRef}>
    {isEditing ? (
      <div className="p-6 relative">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-[66vh] resize-none font-mono text-sm p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-slate-50 shadow-inner"
          placeholder="✍️ Start editing your project plan in Markdown..."
        />
        {/* Sticky Save Reminder */}
        <div className="absolute bottom-4 right-6 text-xs text-gray-500">
          💾 Don’t forget to save your changes
        </div>
      </div>
    ) : (
      <div className="p-8 prose prose-lg max-w-none bg-gradient-to-b from-white via-slate-50 to-white relative">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents}
        >
          {editedContent}
        </ReactMarkdown>

        {/* Background flair */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-purple-100 rounded-full blur-3xl opacity-20 pointer-events-none" />
      </div>
    )}
  </div>
</div>

        {/* error toast */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-3">
              <X className="w-4 h-4" />
              <div className="text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-white/80 hover:text-white"
                aria-label="dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* animations */}
      <style>{`
        @keyframes bounceLeft {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-6px); }
}
@keyframes pulseSave {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}
@keyframes spinDownload {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(360deg) scale(0.9); }
  100% { transform: rotate(720deg) scale(1); }
}

.animate-bounce-left { animation: bounceLeft 0.5s ease; }
.animate-pulse-save { animation: pulseSave 0.6s ease; }
.animate-spin-download { animation: spinDownload 0.6s ease; }
        @keyframes floaty {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-float { animation: floaty 3.6s ease-in-out infinite; }
        .animate-pop { animation: pop 0.45s cubic-bezier(.2,.9,.3,1); }
      `}</style>
    </div>
  );
}

/* ---------- helpers ---------- */

function IconCircle({ 
  children, 
  icon, 
  title, 
  onClick, 
  className = "", 
  disabled = false, 
  accent = "from-white to-white", 
  accentHover = "from-white to-white", 
  animateFloat = false,
  animateOnClick = ""   // <--- NEW
}) {
  const [clicked, setClicked] = useState(false);
  const content = icon || children;

  function handleClick(e) {
    if (disabled) return;
    if (onClick) onClick(e);

    if (animateOnClick) {
      setClicked(true);
      setTimeout(() => setClicked(false), 600); // reset animation
    }
  }

  return (
    <button
      title={title}
      aria-label={title}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative w-11 h-11 rounded-full flex items-center justify-center
        bg-gradient-to-br ${accent}
        shadow-sm transition-all duration-300 ease-out
        active:scale-95
        ${className}
        ${disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:scale-110 hover:rotate-6 hover:shadow-xl hover:from-purple-400 hover:to-indigo-500"
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-200
        ${clicked ? animateOnClick : ""}
      `}
    >
      <span
        className={`
          flex items-center justify-center transform transition-transform duration-300
          ${animateFloat ? "animate-float" : ""}
        `}
      >
        {content}
      </span>
    </button>
  );
}


function AlertIcon() {
  return (
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
      <svg
        className="w-7 h-7 text-rose-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1014.14 0 10 10 0 00-14.14 0z"
        />
      </svg>
    </div>
  );
}
