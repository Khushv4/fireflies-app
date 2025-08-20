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
  ListTodo, 
  Check, 
  X,
  Table,
  FileText,
  Search,
  Filter
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function Backlog() {
  const { dbId } = useParams();
  const navigate = useNavigate();
  const [backlogData, setBacklogData] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "markdown"
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterEpic, setFilterEpic] = useState("all");
  const contentRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (dbId) fetchBacklog(dbId);
    else setError("Meeting ID is missing from the URL.");
  }, [dbId]);

  useEffect(() => {
    // entrance animations for toolbar and content
    if (toolbarRef.current) {
      toolbarRef.current.classList.remove("translate-y-6", "opacity-0");
      toolbarRef.current.classList.add("translate-y-0", "opacity-100");
    }
    if (contentRef.current) {
      contentRef.current.classList.remove("translate-y-6", "opacity-0");
      contentRef.current.classList.add("translate-y-0", "opacity-100");
    }
  }, [backlogData]);

  // Parse markdown content to extract user stories
  function parseBacklogData(content) {
  if (!content) return [];
  
  const stories = [];
  const lines = content.split('\n');
  let currentStory = {};
  let currentSection = '';
  let collectingCriteria = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Epic headers
    if (line.startsWith('#### Epic')) {
      currentSection = line.replace('#### Epic ', '').replace(':', '');
      continue;
    }

    // Story ID = new story
    if (line.startsWith('- **Story ID**:')) {
      if (Object.keys(currentStory).length > 0) {
        stories.push(currentStory);
      }
      currentStory = {
        epic: currentSection,
        storyId: line.replace('- **Story ID**:', '').trim(),
        title: '',
        userStory: '',
        acceptanceCriteria: [],
        storyPoints: '',
        priority: '',
        dependencies: ''
      };
      collectingCriteria = false;
    } 
    
    else if (line.startsWith('- **Title**:')) {
      currentStory.title = line.replace('- **Title**:', '').trim();
      collectingCriteria = false;
    } 
    
    else if (line.startsWith('- **User Story**:')) {
      currentStory.userStory = line.replace('- **User Story**:', '').trim();
      collectingCriteria = false;
    } 
    
    else if (line.startsWith('- **Story Points**:')) {
      currentStory.storyPoints = line.replace('- **Story Points**:', '').trim();
      collectingCriteria = false;
    } 
    
    else if (line.startsWith('- **Priority**:')) {
      currentStory.priority = line.replace('- **Priority**:', '').trim();
      collectingCriteria = false;
    } 
    
    else if (line.startsWith('- **Dependencies**:')) {
      currentStory.dependencies = line.replace('- **Dependencies**:', '').trim();
      collectingCriteria = false;
    } 
    
    // Start acceptance criteria block
    else if (line.startsWith('- **Acceptance Criteria**:')) {
      collectingCriteria = true;
      continue; // skip header line itself
    } 
    
    // Collect criteria lines (bullets starting with "-")
    else if (collectingCriteria && line.startsWith('-')) {
      currentStory.acceptanceCriteria.push(line.replace(/^-/, '').trim());
    }
  }

  // push last story
  if (Object.keys(currentStory).length > 0) {
    stories.push(currentStory);
  }

  return stories;
}


  // Filter stories based on search and filters
  function getFilteredStories() {
    const stories = parseBacklogData(editedContent);
    
    return stories.filter(story => {
      const matchesSearch = searchTerm === '' || 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.userStory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.storyId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filterPriority === 'all' || 
        story.priority.toLowerCase() === filterPriority.toLowerCase();
      
      const matchesEpic = filterEpic === 'all' || 
        story.epic.toLowerCase().includes(filterEpic.toLowerCase());
      
      return matchesSearch && matchesPriority && matchesEpic;
    });
  }

  // Get unique values for filters
  function getUniqueValues(field) {
    const stories = parseBacklogData(editedContent);
    const values = [...new Set(stories.map(story => story[field]).filter(Boolean))];
    return values.sort();
  }

  async function fetchBacklog(id) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/meetings/${id}/backlog`);
      if (!res.ok) {
        if (res.status === 404) {
          setBacklogData(null);
          setError("No product backlog found.");
        } else {
          throw new Error(await res.text());
        }
        return;
      }
      const data = await res.json();
      setBacklogData(data);
      setEditedContent(cleanMarkdown(data.backlog ?? ""));
    } catch (err) {
      setError(err.message || "Failed to load product backlog");
    } finally {
      setLoading(false);
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
      const res = await fetch(`${API}/api/meetings/${dbId}/backlog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backlog: editedContent }),
      });
      if (!res.ok) throw new Error(await res.text());
      setBacklogData((p) => ({ ...p, backlog: editedContent }));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2600);
    } catch (err) {
      setError(err.message || "Failed to save product backlog");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const content = editedContent || backlogData?.backlog || "";
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (backlogData?.meetingTitle || "product_backlog").replace(/\s+/g, "_");
    a.download = `${name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleBack() {
    navigate(-1);
  }

  // Priority badge component
  function PriorityBadge({ priority }) {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      low: "bg-green-100 text-green-800 border-green-200"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[priority?.toLowerCase()] || colors.medium}`}>
        {priority || 'Medium'}
      </span>
    );
  }

  // Story points badge
  function StoryPointsBadge({ points }) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
        {points || '?'}
      </span>
    );
  }

  // Improved markdown renderers (same as before)
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
      <th className="border-b-2 border-gray-200 text-left px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 font-semibold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border-b border-gray-100 px-3 py-2 align-top" {...props} />
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return <code className="bg-purple-50 px-1 py-0.5 rounded text-sm font-mono text-purple-700" {...props}>{children}</code>;
      }
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
          <code className={className} {...props}>{children}</code>
        </pre>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-purple-200 pl-4 italic text-gray-600 my-4" {...props} />
    ),
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 px-6">
        <div className="text-center">
          <Loader2 className="animate-spin w-14 h-14 text-purple-500 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">Loading product backlog...</div>
        </div>
      </div>
    );
  }

  // No data state
  if (!backlogData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full border">
          <div className="flex items-center gap-4 mb-4">
            <AlertIcon />
            <div>
              <h3 className="text-xl font-bold text-gray-900">No product backlog found</h3>
              <p className="text-sm text-gray-600 mt-1">{error || "There is no product backlog stored for this meeting."}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
              <ArrowLeftFromLine size={16} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredStories = getFilteredStories();
  const uniquePriorities = getUniqueValues('priority');
  const uniqueEpics = getUniqueValues('epic');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-3 shadow-lg bg-gradient-to-tr from-purple-600 to-indigo-500 ring-1 ring-purple-200">
              <ListTodo className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">Product Backlog</h1>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Agile Development Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>Generated {backlogData.generatedAt ? new Date(backlogData.generatedAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced toolbar */}
          <div ref={toolbarRef} className="flex items-center gap-3 translate-y-6 opacity-0 transition-all duration-500">
            <IconCircle title="Back" onClick={handleBack} accent="from-gray-50 to-white" accentHover="from-gray-100 to-white" icon={<ArrowLeftFromLine className="w-4 h-4 text-gray-700" />} />
            
            <IconCircle 
              title={viewMode === "table" ? "Markdown View" : "Table View"} 
              onClick={() => setViewMode(viewMode === "table" ? "markdown" : "table")} 
              accent="from-blue-50 to-cyan-50" 
              accentHover="from-blue-200 to-cyan-200" 
              animateFloat
              icon={viewMode === "table" ? <FileText className="w-4 h-4 text-blue-700" /> : <Table className="w-4 h-4 text-blue-700" />} 
            />

            <IconCircle 
              title={isEditing ? "Preview" : "Edit"} 
              onClick={() => setIsEditing((s) => !s)} 
              accent="from-purple-50 to-indigo-50" 
              accentHover="from-purple-200 to-indigo-200" 
              animateFloat 
              icon={isEditing ? <Eye className="w-4 h-4 text-purple-700" /> : <Edit3 className="w-4 h-4 text-purple-700" />} 
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
              accent="from-purple-50 to-purple-100" 
              accentHover="from-purple-300 to-purple-400" 
              icon={<Download className="w-4 h-4 text-purple-700" />} 
            />
          </div>
        </div>

        {/* Filters (only show in table view and not editing) */}
        {viewMode === "table" && !isEditing && (
  <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-gray-200 p-4 mb-6">
    <div className="flex flex-wrap gap-4 items-center">
      
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-sm placeholder-gray-400 flex-1"
        />
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-transparent border-none text-sm outline-none focus:ring-0 cursor-pointer"
        >
          <option value="all">All Priorities</option>
          {uniquePriorities.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {/* Epic Filter */}
      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
        <select
          value={filterEpic}
          onChange={(e) => setFilterEpic(e.target.value)}
          className="bg-transparent border-none text-sm outline-none focus:ring-0 cursor-pointer"
        >
          <option value="all">All Epics</option>
          {uniqueEpics.map(epic => (
            <option key={epic} value={epic}>{epic}</option>
          ))}
        </select>
      </div>

      {/* Story Count */}
      <div className="ml-auto">
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 shadow-sm">
          {filteredStories.length} / {parseBacklogData(editedContent).length} stories
        </span>
      </div>
    </div>
  </div>
)}

        {/* Content card */}
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-800">Meeting:</strong> {backlogData.meetingTitle ?? backlogData.firefliesId ?? "—"}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Sprint-ready user stories with acceptance criteria and story points
            </p>
          </div>

          <div className="h-[72vh] overflow-y-auto" ref={contentRef}>
            {isEditing ? (
              <div className="p-6">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[66vh] resize-none font-mono text-sm p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  placeholder="Edit your product backlog in Markdown..."
                />
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
  <table className="w-full text-sm border-collapse">
    <thead className="sticky top-0 z-10 bg-gradient-to-r from-purple-100 to-indigo-100 border-b shadow-sm">
      <tr>
        <th className="p-3 text-left font-semibold text-gray-800">Story ID</th>
        <th className="p-3 text-left font-semibold text-gray-800">Epic</th>
        <th className="p-3 text-left font-semibold text-gray-800">Title</th>
        <th className="p-3 text-left font-semibold text-gray-800">User Story</th>
        <th className="p-3 text-left font-semibold text-gray-800">Acceptance Criteria</th>
        <th className="p-3 text-left font-semibold text-gray-800">Priority</th>
        <th className="p-3 text-left font-semibold text-gray-800">Points</th>
        <th className="p-3 text-left font-semibold text-gray-800">Dependencies</th>
      </tr>
    </thead>
    <tbody>
      {filteredStories.map((story, index) => (
        <tr
          key={story.storyId || index}
          className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50/70 transition-colors border-b"
          onClick={() => setSelectedStory(story)}
        >
          <td className="p-3 font-mono text-xs text-blue-800 bg-blue-50 rounded-l-lg whitespace-nowrap">
            {story.storyId}
          </td>
          <td className="p-3">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
              {story.epic}
            </span>
          </td>
          <td className="p-3 font-medium text-gray-900 max-w-xs truncate">{story.title}</td>
          <td className="p-3 text-gray-700 max-w-sm">
            <div className="line-clamp-2">{story.userStory}</div>
          </td>
          <td className="p-3 max-w-md">
            <ul className="text-xs text-gray-700 space-y-1">
              {story.acceptanceCriteria.slice(0, 2).map((criteria, i) => (
                <li
                  key={i}
                  className="bg-purple-50 border border-purple-100 px-2 py-1 rounded-md line-clamp-2"
                >
                  {criteria}
                </li>
              ))}
              {story.acceptanceCriteria.length > 2 && (
                <li className="text-purple-600 font-medium">
                  +{story.acceptanceCriteria.length - 2} more
                </li>
              )}
            </ul>
          </td>
          <td className="p-3">
            <PriorityBadge priority={story.priority} />
          </td>
          <td className="p-3">
            <StoryPointsBadge points={story.storyPoints} />
          </td>
          <td className="p-3 text-xs text-gray-600 font-mono rounded-r-lg">
            {story.dependencies || "—"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {filteredStories.length === 0 && (
    <div className="p-12 text-center text-gray-500">
      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>No stories match your current filters.</p>
    </div>
  )}
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

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-3">
              <X className="w-4 h-4" />
              <div className="text-sm">{error}</div>
              <button onClick={() => setError(null)} className="ml-2 text-white/80 hover:text-white" aria-label="dismiss">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animations & helpers */}
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
        .animate-float {
          animation: floaty 3.6s ease-in-out infinite;
        }
        .animate-pop {
          animation: pop 0.45s cubic-bezier(.2,.9,.3,1);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {selectedStory && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
      <button
        onClick={() => setSelectedStory(null)}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-bold mb-2">{selectedStory.title}</h2>
      <p className="mb-4 text-sm text-gray-500">
        <strong>Story ID:</strong> {selectedStory.storyId} | <strong>Epic:</strong> {selectedStory.epic}
      </p>

      <p className="mb-4"><strong>User Story:</strong> {selectedStory.userStory}</p>

      <div className="mb-4">
        <strong>Acceptance Criteria:</strong>
        <ul className="list-disc ml-6 mt-2 text-sm text-gray-700 space-y-1">
          {selectedStory.acceptanceCriteria.map((ac, i) => (
            <li key={i}>{ac}</li>
          ))}
        </ul>
      </div>

      <p className="mb-2"><strong>Priority:</strong> {selectedStory.priority}</p>
      <p className="mb-2"><strong>Story Points:</strong> {selectedStory.storyPoints}</p>
      <p><strong>Dependencies:</strong> {selectedStory.dependencies || "None"}</p>
    </div>
  </div>
)}

      
    </div>
    
  );
}

/* ---------- Helper Components ---------- */

function IconCircle({ 
  children, 
  icon, 
  title, 
  onClick, 
  className = "", 
  disabled = false, 
  accent = "from-white to-white", 
  accentHover = "from-white to-white", 
  animateFloat = false 
}) {
  const content = icon || children;
  return (
    <button
      title={title}
      aria-label={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition transform active:scale-95 shadow-sm ${className} bg-gradient-to-br ${accent} hover:from-purple-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
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