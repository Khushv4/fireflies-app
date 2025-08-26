

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Download, 
  Edit, 
  Eye, 
  Calendar, 
  Clock, 
  ListTodo, 
  Check, 
  X,
  Table,
  FileText,
  Search,
  Filter,
  Sparkles
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
  const [viewMode, setViewMode] = useState("table");
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
    if (toolbarRef.current) {
      toolbarRef.current.classList.remove("translate-y-6", "opacity-0");
      toolbarRef.current.classList.add("translate-y-0", "opacity-100");
    }
    if (contentRef.current) {
      contentRef.current.classList.remove("translate-y-6", "opacity-0");
      contentRef.current.classList.add("translate-y-0", "opacity-100");
    }
  }, [backlogData]);

  function parseBacklogData(content) {
    if (!content) return [];
    
    const stories = [];
    const lines = content.split('\n');
    let currentStory = {};
    let currentSection = '';
    let collectingCriteria = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#### Epic')) {
        currentSection = line.replace('#### Epic ', '').replace(':', '');
        continue;
      }

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
      else if (line.startsWith('- **Acceptance Criteria**:')) {
        collectingCriteria = true;
        continue;
      } 
      else if (collectingCriteria && line.startsWith('-')) {
        currentStory.acceptanceCriteria.push(line.replace(/^-/, '').trim());
      }
    }

    if (Object.keys(currentStory).length > 0) {
      stories.push(currentStory);
    }

    return stories;
  }

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

  function PriorityBadge({ priority }) {
    const colors = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
      low: "bg-green-500/20 text-green-300 border-green-500/30"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[priority?.toLowerCase()] || colors.medium}`}>
        {priority || 'Medium'}
      </span>
    );
  }

  function StoryPointsBadge({ points }) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30">
        {points || '?'}
      </span>
    );
  }

  const mdComponents = {
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl md:text-4xl font-extrabold mt-8 mb-4 pb-3 border-b border-slate-700 text-white" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl md:text-3xl font-bold mt-6 mb-3 text-slate-200" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl md:text-2xl font-semibold mt-5 mb-2 text-slate-300" {...props} />
    ),
    p: ({ node, ...props }) => <p className="leading-relaxed mb-3 text-slate-300" {...props} />,
    li: ({ node, ordered, ...props }) => (
      <li className={`mb-2 ${ordered ? "list-decimal ml-6" : "ml-6 list-disc"} text-slate-300`} {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="border-b-2 border-slate-700 text-left px-3 py-2 bg-slate-800/50 font-semibold text-slate-300" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border-b border-slate-700/50 px-3 py-2 align-top text-slate-300" {...props} />
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return <code className="bg-slate-700 px-1 py-0.5 rounded text-sm font-mono text-purple-300" {...props}>{children}</code>;
      }
      return (
        <pre className="bg-slate-800 text-slate-200 rounded-lg p-4 overflow-x-auto text-xs border border-slate-700">
          <code className={className} {...props}>{children}</code>
        </pre>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-purple-500/50 pl-4 italic text-slate-400 my-4" {...props} />
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 px-6">
        <div className="text-center">
          <Loader2 className="animate-spin w-14 h-14 text-blue-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-slate-300">Loading product backlog...</div>
        </div>
      </div>
    );
  }

  if (!backlogData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full border border-slate-700/40">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">No product backlog found</h3>
              <p className="text-sm text-slate-400 mt-1">{error || "There is no product backlog stored for this meeting."}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={handleBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/40 text-slate-300 hover:text-white transition">
              <ArrowLeft size={16} />
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
    <div className="min-h-screen  rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 text-white p-4 md:p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Top bar */}
        <div className="flex  md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-3 bg-gradient-to-tr from-blue-600 to-purple-600 border border-blue-500/30">
              <ListTodo className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Project Backlog</h1>
              <div className="mt-2 text-sm text-slate-400 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Agile Development Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>Generated {backlogData.generatedAt ? new Date(backlogData.generatedAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced toolbar */}
          <div ref={toolbarRef} className="flex items-center gap-3 translate-y-6 opacity-0 transition-all duration-500">
            <IconCircle 
              title="Back" 
              onClick={handleBack} 
              accent="from-slate-700 to-slate-800" 
              accentHover="from-slate-600 to-slate-700" 
              animateFloat
              icon={<ArrowLeft className="w-4 h-4 text-slate-300" />} 
            />
            
            <IconCircle 
              title={viewMode === "table" ? "Markdown View" : "Table View"} 
              onClick={() => setViewMode(viewMode === "table" ? "markdown" : "table")} 
              accent="from-blue-700/50 to-cyan-700/50" 
              accentHover="from-blue-600/50 to-cyan-600/50" 
              animateFloat
              icon={viewMode === "table" ? <FileText className="w-4 h-4 text-blue-300" /> : <Table className="w-4 h-4 text-blue-300" />} 
            />

            <IconCircle 
              title={isEditing ? "Preview" : "Edit"} 
              onClick={() => setIsEditing((s) => !s)} 
              accent="from-purple-700/50 to-indigo-700/50" 
              accentHover="from-purple-600/50 to-indigo-600/50" 
              animateFloat 
              icon={isEditing ? <Eye className="w-4 h-4 text-purple-300" /> : <Edit className="w-4 h-4 text-purple-300" />} 
            />
            
            <div className="relative">
              <IconCircle 
                title="Save" 
                onClick={handleSave} 
                disabled={!isEditing || saving} 
                accent="from-green-700/50 to-emerald-700/50" 
                accentHover="from-green-600/50 to-emerald-600/50" 
                animateFloat
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin text-green-300" /> : <Save className="w-4 h-4 text-green-300" />} 
              />
              {saveSuccess && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg animate-pop border border-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            
            <IconCircle 
              title="Download (.md)" 
              onClick={handleDownload} 
              accent="from-purple-700/50 to-purple-600/50" 
              accentHover="from-purple-600/50 to-purple-500/50" 
              animateFloat
              icon={<Download className="w-4 h-4 text-purple-300" />} 
            />
          </div>
        </div>

        {/* Filters */}
        {viewMode === "table" && !isEditing && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/40 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/40 focus-within:ring-2 focus-within:ring-purple-500/30">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm placeholder-slate-500 text-slate-200 flex-1"
                />
              </div>

      {/* Priority Filter */}
<div className="flex items-center gap-2 bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-500/30 hover:border-purple-500/40 transition-all duration-300 shadow-lg">
  <Filter className="w-4 h-4 text-purple-400" />
  <select
    value={filterPriority}
    onChange={(e) => setFilterPriority(e.target.value)}
    className="bg-transparent border-none text-sm outline-none focus:ring-0 cursor-pointer text-slate-200 hover:text-white transition-colors min-w-[120px]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a78bfa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 8px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      paddingRight: '32px',
      appearance: 'none'
    }}
  >
    <option value="all">All Priorities</option>
    {uniquePriorities.map(priority => (
      <option key={priority} value={priority} className="bg-slate-800 text-slate-200 hover:bg-slate-700">
        {priority}
      </option>
    ))}
  </select>
</div>
             {/* Epic Filter */}
<div className="flex items-center gap-2 bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-500/30 hover:border-blue-500/40 transition-all duration-300 shadow-lg">
  <Sparkles className="w-4 h-4 text-blue-400" />
  <select
    value={filterEpic}
    onChange={(e) => setFilterEpic(e.target.value)}
    className="bg-transparent border-none text-sm outline-none focus:ring-0 cursor-pointer text-slate-200 hover:text-white transition-colors min-w-[120px]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2360a5fa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 8px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      paddingRight: '32px',
      appearance: 'none'
    }}
  >
    <option value="all">All Epics</option>
    {uniqueEpics.map(epic => (
      <option key={epic} value={epic} className="bg-slate-800 text-slate-200 hover:bg-slate-700">
        {epic}
      </option>
    ))}
  </select>
</div>

              {/* Story Count */}
              <div className="ml-auto">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {filteredStories.length} / {parseBacklogData(editedContent).length} stories
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content card */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/40 overflow-hidden">
          <div className="p-6 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/70 to-slate-900/70">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-100">Meeting:</strong> {backlogData.meetingTitle ?? backlogData.firefliesId ?? "—"}
            </p>
            <p className="text-xs text-purple-400 mt-1">
              Sprint-ready user stories with acceptance criteria and story points
            </p>
          </div>

          <div className="h-[72vh] overflow-y-auto" ref={contentRef}>
            {isEditing ? (
              <div className="p-6">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[66vh] resize-none font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-slate-900/50 text-slate-200 border border-slate-700/40"
                  placeholder="Edit your product backlog in Markdown..."
                />
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/40 shadow-sm">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-300">Story ID</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Epic</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Title</th>
                      <th className="p-3 text-left font-semibold text-slate-300">User Story</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Acceptance Criteria</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Priority</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Points</th>
                      <th className="p-3 text-left font-semibold text-slate-300">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStories.map((story, index) => (
                      <tr
                        key={story.storyId || index}
                        className="odd:bg-slate-800/30 even:bg-slate-800/10 hover:bg-blue-900/20 transition-colors border-b border-slate-700/30"
                        onClick={() => setSelectedStory(story)}
                      >
                        <td className="p-3 font-mono text-xs text-blue-300 bg-blue-900/20 rounded-l-lg whitespace-nowrap">
                          {story.storyId}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-md text-xs font-medium">
                            {story.epic}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-100 max-w-xs truncate">{story.title}</td>
                        <td className="p-3 text-slate-300 max-w-sm">
                          <div className="line-clamp-2">{story.userStory}</div>
                        </td>
                        <td className="p-3 max-w-md">
                          <ul className="text-xs text-slate-400 space-y-1">
                            {story.acceptanceCriteria.slice(0, 2).map((criteria, i) => (
                              <li
                                key={i}
                                className="bg-purple-900/30 border border-purple-700/30 px-2 py-1 rounded-md line-clamp-2"
                              >
                                {criteria}
                              </li>
                            ))}
                            {story.acceptanceCriteria.length > 2 && (
                              <li className="text-purple-400 font-medium">
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
                        <td className="p-3 text-xs text-slate-400 font-mono rounded-r-lg">
                          {story.dependencies || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredStories.length === 0 && (
                  <div className="p-12 text-center text-slate-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No stories match your current filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {editedContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-600/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 backdrop-blur-sm border border-red-500/30">
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
      `}</style>

      {selectedStory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-slate-700/40">
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-400 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-2 text-white">{selectedStory.title}</h2>
            <p className="mb-4 text-sm text-slate-400">
              <strong>Story ID:</strong> {selectedStory.storyId} | <strong>Epic:</strong> {selectedStory.epic}
            </p>

            <p className="mb-4 text-slate-300"><strong>User Story:</strong> {selectedStory.userStory}</p>

            <div className="mb-4">
              <strong className="text-slate-300">Acceptance Criteria:</strong>
              <ul className="list-disc ml-6 mt-2 text-sm text-slate-400 space-y-1">
                {selectedStory.acceptanceCriteria.map((ac, i) => (
                  <li key={i}>{ac}</li>
                ))}
              </ul>
            </div>

            <p className="mb-2 text-slate-300"><strong>Priority:</strong> {selectedStory.priority}</p>
            <p className="mb-2 text-slate-300"><strong>Story Points:</strong> {selectedStory.storyPoints}</p>
            <p className="text-slate-300"><strong>Dependencies:</strong> {selectedStory.dependencies || "None"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function IconCircle({ 
  children, 
  icon, 
  title, 
  onClick, 
  className = "", 
  disabled = false, 
  accent = "from-slate-700 to-slate-800", 
  accentHover = "from-slate-600 to-slate-700", 
  animateFloat = false
}) {
  const content = icon || children;

  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-11 h-11 rounded-full flex items-center justify-center
        bg-gradient-to-br ${accent}
        border border-slate-600/40 shadow-sm transition-all duration-300 ease-out
        active:scale-95
        ${className}
        ${disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:scale-110 hover:rotate-6 hover:shadow-xl hover:bg-gradient-to-br hover:from-blue-600/50 hover:to-purple-600/50"
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/30
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