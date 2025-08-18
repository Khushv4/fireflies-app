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

  const contentRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (dbId) fetchProjectPlan(dbId);
    else setError("Meeting ID is missing from the URL.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId]);

  useEffect(() => {
    // entrance animations for toolbar and content (adds small delay)
    if (toolbarRef.current) {
      toolbarRef.current.classList.remove("translate-y-6", "opacity-0");
      toolbarRef.current.classList.add("translate-y-0", "opacity-100");
    }
    if (contentRef.current) {
      contentRef.current.classList.remove("translate-y-6", "opacity-0");
      contentRef.current.classList.add("translate-y-0", "opacity-100");
    }
  }, [planData]);

  // fetch project plan from backend
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
    } catch (err) {
      setError(err.message || "Failed to load project plan");
    } finally {
      setLoading(false);
    }
  }

  // basic cleanup for DB text
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

  // improved markdown renderers
  const mdComponents = {
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl md:text-4xl font-extrabold mt-8 mb-4 pb-3 border-b border-gray-100 text-gray-900" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl md:text-3xl font-bold mt-6 mb-3 text-gray-800" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl md:text-2xl font-semibold mt-5 mb-2 text-gray-700" {...props} />
    ),
    p: ({ node, ...props }) => <p className="leading-relaxed mb-3 text-gray-700" {...props} />,
    li: ({ node, ordered, ...props }) => (
      <li className={`mb-2 ${ordered ? "list-decimal ml-6" : "ml-6 list-disc"}`} {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="border-b-2 border-gray-200 text-left px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 font-semibold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border-b border-gray-100 px-3 py-2 align-top" {...props} />
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return <code className="bg-indigo-50 px-1 py-0.5 rounded text-sm font-mono text-indigo-700" {...props}>{children}</code>;
      }
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
          <code className={className} {...props}>{children}</code>
        </pre>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4" {...props} />
    ),
  };

  // loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-6">
        <div className="text-center">
          <Loader2 className="animate-spin w-14 h-14 text-indigo-500 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">Loading project plan...</div>
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
              <h3 className="text-xl font-bold text-gray-900">No project plan found</h3>
              <p className="text-sm text-gray-600 mt-1">{error || "There is no project plan stored for this meeting."}</p>
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
              <h1 className="text-3xl md:text-4xl font-extrabold">Project Plan</h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{planData.durationWeeks ?? "—"} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>Generated {planData.generatedAt ? new Date(planData.generatedAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* icon toolbar */}
          <div
            ref={toolbarRef}
            className="flex items-center gap-3 translate-y-6 opacity-0 transition-all duration-500"
          >
            <IconCircle
              title="Back"
              onClick={handleBack}
              accent="from-gray-50 to-white"
              accentHover="from-gray-100 to-white"
              icon={<ArrowLeftFromLine className="w-4 h-4 text-gray-700" />}
            />

            <IconCircle
              title={isEditing ? "Preview" : "Edit"}
              onClick={() => setIsEditing((s) => !s)}
              accent="from-indigo-50 to-blue-50"
              accentHover="from-indigo-200 to-blue-200"
              animateFloat
              icon={isEditing ? <Eye className="w-4 h-4 text-indigo-700" /> : <Edit3 className="w-4 h-4 text-indigo-700" />}
            />

            <div className="relative">
              <IconCircle
                title="Save"
                onClick={handleSave}
                disabled={!isEditing || saving}
                accent="from-emerald-50 to-green-50"
                accentHover="from-emerald-200 to-green-200"
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <Save className="w-4 h-4 text-green-600" />}
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
              accent="from-indigo-50 to-indigo-100"
              accentHover="from-indigo-300 to-indigo-400"
              icon={<Download className="w-4 h-4 text-indigo-700" />}
            />
          </div>
        </div>

        {/* content card */}
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="p-6 border-b">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-800">Meeting:</strong> {planData.meetingTitle ?? planData.FirefliesId ?? "—"}
            </p>
          </div>

          <div className="h-[72vh] overflow-y-auto" ref={contentRef}>
            {isEditing ? (
              <div className="p-6">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[66vh] resize-none font-mono text-sm p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  placeholder="Edit your project plan in Markdown..."
                />
              </div>
            ) : (
              <div className="p-6 prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {editedContent}
                </ReactMarkdown>
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

      {/* animations & helpers */}
      <style>{`
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

/* ---------- small presentational helpers ---------- */

// circular icon button used in the toolbar
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
}) {
  // use children for fallback, but prefer icon prop
  const content = icon || children;
  return (
    <button
      title={title}
      aria-label={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        relative w-11 h-11 rounded-full flex items-center justify-center transition transform active:scale-95 shadow-sm
        ${className}
        bg-gradient-to-br ${accent}
        hover:from-indigo-400 hover:to-blue-500
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
      `}
    >
      <span className={`flex items-center justify-center ${animateFloat ? "animate-float" : ""}`}>
        {content}
      </span>
    </button>
  );
}

function AlertIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600">
        <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
      </svg>
    </div>
  );
}
