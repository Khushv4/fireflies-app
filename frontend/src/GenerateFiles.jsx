import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftFromLine,
  Save,
  Loader2,
  Download,
  Calendar,
  FileText,
  Eye,
  X,
  Pencil,
} from "lucide-react";
import gsap from "gsap";

const API = import.meta.env.VITE_API_BASE_URL || "";

// File configuration mapping
const FILE_CONFIG = {
  functional: {
    name: "FunctionalDoc.txt",
    title: "Functional Document",
    description: "Detailed functional requirements and specifications"
  },
  mockups: {
    name: "Mockups.txt", 
    title: "Mockups",
    description: "UI/UX mockups and design specifications"
  },
  markdown: {
    name: "Markdown.md",
    title: "Markdown File", 
    description: "Formatted markdown documentation"
  }
};

export default function GenerateFiles() {
  const { dbId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get selected files from navigation state
  const selectedFiles = location.state?.selectedFiles || ['functional', 'mockups', 'markdown']; // fallback to all files

  const [files, setFiles] = useState([]);
  const [editingFiles, setEditingFiles] = useState([]);
  const [isEditing, setIsEditing] = useState([]); // dynamic based on selected files
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [projectPlanExists, setProjectPlanExists] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [projectDuration, setProjectDuration] = useState(4);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const pageRef = useRef(null);
  const cardRefs = useRef([]);
  const saveBtnRef = useRef(null);
  const generatePlanBtnRef = useRef(null);
  const viewPlanBtnRef = useRef(null);
  const modalRef = useRef(null);

  // Create filtered file list based on selected files
  const getFilteredFiles = () => {
    return selectedFiles.map(fileId => ({
      id: fileId,
      name: FILE_CONFIG[fileId].name,
      title: FILE_CONFIG[fileId].title,
      description: FILE_CONFIG[fileId].description
    }));
  };

  useEffect(() => {
    async function initializeFilesAndCheckPlan() {
      if (!dbId) {
        setError("Missing meeting DB id.");
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        // Initialize editing state based on selected files
        setIsEditing(new Array(selectedFiles.length).fill(false));

        const filesRes = await fetch(
          `${API}/api/meetings/${dbId}/generate-files`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Pass selected file types to backend
            body: JSON.stringify({ selectedFiles })
          }
        );

        if (!filesRes.ok) {
          throw new Error(`Failed to load files: ${await filesRes.text()}`);
        }
        
        const filesData = await filesRes.json();
        
        // Filter the response to only include selected files
        const filteredFiles = getFilteredFiles().map((config, index) => {
          const matchingFile = filesData.find(f => f.name === config.name);
          return matchingFile || { 
            name: config.name, 
            content: `Generated ${config.title} content will appear here...` 
          };
        });
        
        setFiles(filteredFiles);
        setEditingFiles(filteredFiles.map(f => f.content ?? ""));

        const planRes = await fetch(`${API}/api/meetings/${dbId}/project-plan`);
        if (planRes.ok) {
          setProjectPlanExists(true);
        } else if (planRes.status === 404) {
          setProjectPlanExists(false);
        } else {
          console.error(
            "Error checking project plan status:",
            await planRes.text()
          );
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message || "Failed to initialize data.");
      } finally {
        setLoading(false);
      }
    }
    initializeFilesAndCheckPlan();
  }, [dbId, selectedFiles]);

  async function handleSave() {
    if (!dbId) return;
    setSaving(true);
    setError(null);
    
    try {
      const payload = files.map((f, i) => ({ 
        name: f.name, 
        content: editingFiles[i] 
      }));

      const res = await fetch(`${API}/api/meetings/${dbId}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(await res.text());
      alert("Files saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save files");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openModal() {
    setShowModal(true);
    setTimeout(() => {
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    }, 10);
  }

  function closeModal() {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setShowModal(false),
      });
    }
  }

  async function handleGenerateProjectPlan() {
    if (!dbId || projectDuration <= 0) {
      setError("Invalid project duration.");
      return;
    }

    setGeneratingPlan(true);
    setError(null);

    try {
      const res = await fetch(
        `${API}/api/meetings/${dbId}/generate-project-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            durationWeeks: projectDuration,
            additionalDetails: additionalDetails.trim(),
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      closeModal();
      setProjectPlanExists(true);
      navigate(`/project-plan/${dbId}`);
    } catch (err) {
      console.error("Generate project plan error:", err);
      setError(err.message || "Failed to generate project plan.");
    } finally {
      setGeneratingPlan(false);
    }
  }

  function handleViewProjectPlan() {
    navigate(`/project-plan/${dbId}`);
  }

  // GSAP animations
  useEffect(() => {
    gsap.fromTo(
      pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );

    gsap.fromTo(
      cardRefs.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.15,
      }
    );
  }, [projectPlanExists]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-lg text-gray-600">
        <Loader2 className="animate-spin w-8 h-8 mb-3 text-blue-500" />
        Loading files and checking project plan status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  const filteredFileConfigs = getFilteredFiles();

  return (
    <div ref={pageRef} className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Generate & Edit Meeting Files
          </h2>
          <p className="text-gray-600 mt-2">
            Editing {selectedFiles.length} selected file{selectedFiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition shadow-sm"
        >
          <ArrowLeftFromLine size={18} />
          Back
        </button>
      </div>

      {/* File Editors - Only show selected files */}
      <div className="space-y-8">
        {filteredFileConfigs.map((config, idx) => {
          const fileData = files[idx];
          
          return (
            <div
              key={config.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              className="p-6 rounded-2xl bg-white/80 shadow-lg backdrop-blur-md border border-gray-200 transition hover:shadow-2xl hover:scale-[1.01] duration-300 ease-in-out"
            >
              {/* Title with edit + download */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-lg font-semibold text-gray-800">
                    {config.title}
                  </label>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const arr = [...isEditing];
                      arr[idx] = !arr[idx];
                      setIsEditing(arr);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title={isEditing[idx] ? "Stop Editing" : "Edit File"}
                  >
                    <Pencil
                      size={20}
                      className={isEditing[idx] ? "text-blue-600" : "text-gray-600"}
                    />
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(config.name, editingFiles[idx] ?? "")
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Download File"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* Viewer / Editor */}
              <div className="relative font-mono text-sm leading-relaxed border border-gray-300 rounded-xl overflow-hidden">
                {isEditing[idx] ? (
                  <textarea
                    rows={12}
                    value={editingFiles[idx] ?? ""}
                    onChange={(e) => {
                      const arr = [...editingFiles];
                      arr[idx] = e.target.value;
                      setEditingFiles(arr);
                    }}
                    className="w-full p-4 bg-white text-gray-800 resize-none focus:outline-none"
                  />
                ) : (
                  <div className="p-4 text-gray-800 max-h-72 overflow-y-auto whitespace-pre-wrap space-y-2">
                    {editingFiles[idx]
                      ?.split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line, i) => {
                        // Clean markdown
                        const cleanedLine = line
                          .replace(/^#+\s?/, "") // remove heading markers ##
                          .replace(/[*_]{1,2}/g, ""); // remove **, *, _

                        // Headings
                        if (/^#+\s/.test(line)) {
                          return (
                            <div key={i} className="font-bold text-gray-900">
                              {cleanedLine}
                            </div>
                          );
                        }
                        // Bullet points
                        if (/^[-*]\s/.test(line)) {
                          return (
                            <li key={i} className="ml-5 list-disc">
                              {cleanedLine.replace(/^[-*]\s/, "")}
                            </li>
                          );
                        }
                        // Normal paragraph
                        return <p key={i}>{cleanedLine}</p>;
                      })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="mt-8 flex justify-center items-center gap-4">
        <button
          ref={saveBtnRef}
          onClick={handleSave}
          disabled={saving}
          className="w-48 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition transform flex items-center justify-center gap-3"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Updating...
            </>
          ) : (
            <>
              <Save size={20} />
              Update Files
            </>
          )}
        </button>

        {projectPlanExists ? (
          <button
            ref={viewPlanBtnRef}
            onClick={handleViewProjectPlan}
            className="w-58 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition transform flex items-center justify-center gap-3"
          >
            <Eye size={20} />
            View Project Plan
          </button>
        ) : (
          <button
            ref={generatePlanBtnRef}
            onClick={openModal}
            className="w-48 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition transform flex items-center justify-center gap-3"
          >
            <FileText size={20} />
            Generate Plan
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600 font-medium mt-4 text-center">{error}</div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Generate Project Plan
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={generatingPlan}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Project Duration (weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={projectDuration}
                  onChange={(e) =>
                    setProjectDuration(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={generatingPlan}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Details (optional)
                </label>
                <textarea
                  rows={4}
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Any specific requirements, constraints, or preferences..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  disabled={generatingPlan}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                disabled={generatingPlan}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateProjectPlan}
                disabled={generatingPlan || projectDuration <= 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:scale-[1.02] transition font-medium flex items-center justify-center gap-2"
              >
                {generatingPlan ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}