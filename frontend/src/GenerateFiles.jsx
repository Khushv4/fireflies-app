import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Thermometer, Save, Loader2, Download, FileText, Eye, X, Pencil } from "lucide-react";
import gsap from "gsap";
import BookLoader from "./BookLoader";

const API = import.meta.env.VITE_API_BASE_URL || "";



// --- CONFIGURATION ---
const FILE_CONFIG = {
  functional: { name: "FunctionalDoc.txt", title: "Functional Document", description: "Detailed functional requirements", icon: FileText },
  mockups: { name: "Mockups.txt", title: "Mockups", description: "UI/UX design specifications", icon: Eye },
  markdown: { name: "Markdown.md", title: "Markdown File", description: "Formatted documentation", icon: Pencil },
};

// Enhanced Loading Animation with BookLoader and Progress Bar
const EngagingLoadingAnimation = ({ progress }) => {
  const progressRef = useRef(null);
  const [currentTip, setCurrentTip] = useState(0);
  
  const loadingTips = [
    "Analyzing meeting content...",
    "Extracting key requirements...",
    "Structuring documentation...",
    "Generating technical specifications...",
    "Almost done! Finalizing documents..."
  ];
  
  useEffect(() => {
    // Progress animation
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: "power2.out"
      });
    }
    
    // Rotate through tips based on progress
    const tipIndex = Math.min(Math.floor(progress / 20), loadingTips.length - 1);
    setCurrentTip(tipIndex);
  }, [progress, loadingTips.length]);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md z-50">
      <div className="text-center max-w-md mx-4">
        {/* BookLoader Component */}
        <div className="mb-8 ml-6">
          <BookLoader text="Crafting Your Documents" />
        </div>
        
        {/* Progress Circle */}
        <div className="relative mb-6 mt-20">
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-6 bg-blue-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
            {Math.round(progress)}%
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-4">Processing Documents</h3>
        
        {/* Dynamic Tips */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 min-h-[60px] flex items-center justify-center">
          <p className="text-blue-300 text-sm animate-pulse transition-all duration-500">
            ✨ {loadingTips[currentTip]}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700/50 rounded-full h-3 mb-2 overflow-hidden">
          <div 
            ref={progressRef}
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: '0%' }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
          </div>
        </div>
        
        <p className="text-slate-400 text-sm">Processing {Math.round(progress)}% complete</p>
        
        {/* Floating dots animation */}
        <div className="flex items-center justify-center space-x-2 mt-4 text-blue-300">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

const FullScreenStatus = ({ loading, error, loadingText = "Generating documents..." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 text-center">
    {loading && (
      <>
        <BookLoader text={loadingText} />
        <div className="mt-8 ml-6">
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </>
    )}
    {error && <p className="text-lg text-red-500">{error}</p>}
  </div>
);

const Notification = ({ message, type, onDismiss }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  const baseClasses = "fixed bottom-5 right-5 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl z-50 transition-all transform animate-fade-in-up";
  const typeClasses = type === 'success' 
      ? "bg-gradient-to-r from-green-500 to-teal-500 text-white" 
      : "bg-gradient-to-r from-red-500 to-orange-500 text-white";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <span>{message}</span>
      <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/20 transition-colors"><X size={16} /></button>
    </div>
  );
};

const ProjectPlanModal = ({ isOpen, onClose, onGenerate }) => {
  const [duration, setDuration] = useState(4);
  const [details, setDetails] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onClose,
    });
  }, [onClose]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate({ duration, details, temperature });
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  const getTempColor = (t) =>
    t <= 0.2
      ? "text-blue-400"
      : t <= 0.5
      ? "text-green-400"
      : t <= 0.8
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            Generate Project Plan
          </h3>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main content */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-80 space-y-6">
            <BookLoader />
            <span className="text-slate-300 text-lg font-medium animate-pulse">
              Generating Project Plan...
            </span>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Project Duration (weeks)
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value) || 1)
                }
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                AI Temperature{" "}
                <span
                  className={`font-bold ${getTempColor(temperature)}`}
                >
                  {temperature.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) =>
                  setTemperature(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Additional Details (optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., specific tech stack, team size..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl resize-none transition"
                disabled={isGenerating}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || duration <= 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:scale-105 transition font-medium"
              >
                Generate
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          background: #fff;
          box-shadow: 0 0 5px #fff, 0 0 10px #fff;
        }
      `}</style>
    </div>
  );
};

const FileEditorCard = React.memo(({ config, content, isEditing, onToggleEdit, onContentChange, onDownload, cardRef }) => {
    return (
        <div ref={cardRef} className="p-6 rounded-2xl bg-slate-800/40 shadow-lg backdrop-blur-md border border-slate-700/50 transition-all duration-300 ease-in-out hover:shadow-blue-500/10 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900/50 rounded-lg text-blue-400"><config.icon size={22} /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                        <p className="text-sm text-slate-400">{config.description}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onToggleEdit} title={isEditing ? "View" : "Edit"} className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"><Pencil size={18} /></button>
                    <button onClick={onDownload} title="Download" className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"><Download size={18} /></button>
                </div>
            </div>
            <div className="relative font-mono text-sm leading-relaxed border border-slate-700 rounded-xl overflow-hidden bg-slate-900/70 min-h-[288px]">
                {isEditing ? (
                    <textarea rows={12} value={content} onChange={onContentChange} className="w-full h-full p-4 bg-transparent text-slate-200 resize-none focus:outline-none" />
                ) : (
                    <div className="p-4 max-h-72 overflow-y-auto whitespace-pre-wrap text-slate-300">{content}</div>
                )}
            </div>
        </div>
    );
});

// --- MAIN PAGE COMPONENT ---
export default function GenerateFiles() {
    const { dbId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedFiles = location.state?.selectedFiles || Object.keys(FILE_CONFIG);

    const [filesContent, setFilesContent] = useState([]);
    const [isEditing, setIsEditing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [projectPlanExists, setProjectPlanExists] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [progress, setProgress] = useState(0);

    const pageRef = useRef(null);
    const cardRefs = useRef([]);

    useEffect(() => {
        const initialize = async () => {
            if (!dbId) return setError("Missing meeting ID.");
            setLoading(true);
            setShowLoadingAnimation(true);
            
            // More realistic progress simulation
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(progressInterval);
                        return 95; // Stop at 95% until API call completes
                    }
                    return prev + Math.random() * 10 + 2; // More consistent progress
                });
            }, 600);
            
            try {
                setIsEditing(new Array(selectedFiles.length).fill(false));
                const filesRes = await fetch(`${API}/api/meetings/${dbId}/generate-files`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedFiles }) });
                if (!filesRes.ok) throw new Error(await filesRes.text());
                const filesData = await filesRes.json();
                
                const filteredContent = selectedFiles.map(id => {
                    const config = FILE_CONFIG[id];
                    const file = filesData.find(f => f.name === config.name);
                    return file ? file.content : `Content for ${config.title} will appear here.`;
                });
                setFilesContent(filteredContent);

                const planRes = await fetch(`${API}/api/meetings/${dbId}/project-plan`);
                setProjectPlanExists(planRes.ok);
                
                // Complete the progress
                setProgress(100);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                setTimeout(() => setShowLoadingAnimation(false), 800);
            }
        };
        initialize();
    }, [dbId, selectedFiles]);
    
    useEffect(() => {
        if (!loading) {
            gsap.fromTo(pageRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
            gsap.fromTo(cardRefs.current.filter(Boolean), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
        }
    }, [loading]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const payload = selectedFiles.map((id, i) => ({ name: FILE_CONFIG[id].name, content: filesContent[i] }));
            const res = await fetch(`${API}/api/meetings/${dbId}/files`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await res.text());
            showNotification("Files saved successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }, [dbId, selectedFiles, filesContent]);

    const handleDownload = useCallback((index) => {
        const config = FILE_CONFIG[selectedFiles[index]];
        const content = filesContent[index];
        const blob = new Blob([content], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = config.name;
        link.click();
        URL.revokeObjectURL(link.href);
    }, [selectedFiles, filesContent]);

    const handleGeneratePlan = useCallback(async (formData) => {
        try {
            const res = await fetch(`${API}/api/meetings/${dbId}/generate-project-plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationWeeks: formData.duration, additionalDetails: formData.details.trim(), temperature: formData.temperature }) });
            if (!res.ok) throw new Error(await res.text());
            setIsModalOpen(false);
            setProjectPlanExists(true);
            showNotification("Project plan generated successfully!");
            navigate(`/project-plan/${dbId}`);
        } catch (err) {
            setError(err.message);
        }
    }, [dbId, navigate]);

    if (loading || error) return <FullScreenStatus loading={loading} error={error} loadingText="Generating initial documents..." />;

    return (
        <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 text-white rounded-3xl">
            {showLoadingAnimation && <EngagingLoadingAnimation progress={Math.min(progress, 100)} />}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1">
                
                <div className="flex items-center ">
                    <div className="flex mr-5">
                        <IconButton 
                            title="Back" 
                            onClick={() => navigate(-1)}
                            icon={<ArrowLeft className="w-4 h-4" />}
                            variant="secondary"
                        />
                    </div>
                    <div className="pt-10">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Generate & Edit Files</h1>
                        <p className="text-slate-400 mt-2">Editing {selectedFiles.length} selected document{selectedFiles.length > 1 && "s"}</p>
                    </div>
                </div>
                <div className="space-y-8">
                    {selectedFiles.map((fileId, idx) => (
                        <FileEditorCard
                            key={fileId}
                            cardRef={el => (cardRefs.current[idx] = el)}
                            config={FILE_CONFIG[fileId]}
                            content={filesContent[idx]}
                            isEditing={isEditing[idx]}
                            onToggleEdit={() => setIsEditing(prev => prev.map((val, i) => i === idx ? !val : val))}
                            onContentChange={e => setFilesContent(prev => prev.map((val, i) => i === idx ? e.target.value : val))}
                            onDownload={() => handleDownload(idx)}
                        />
                    ))}
                </div>
                <div className="mt-8 flex flex-row justify-center items-center gap-4 border-t border-slate-800 pt-8">
                    <button onClick={handleSave} disabled={saving} className="w-60 mb-4 px-6 py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <><Loader2 className="animate-spin" size={20} /> Updating...</> : <><Save size={20} /> Update Documents</>}
                    </button>
                    {projectPlanExists ? (
                        <button onClick={() => navigate(`/project-plan/${dbId}`)} className="w-60 mb-4 px-6 py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out flex items-center justify-center gap-2">
                        <Eye size={20} /> View Project Plan
                        </button>
                    ) : (
                        <button onClick={() => setIsModalOpen(true)} className="w-65 mb-4 px-6 py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out flex items-center justify-center gap-2">
                        <FileText size={20} /> Generate Project Plan
                        </button>
                    )}
                </div>
            </div>
            <ProjectPlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onGenerate={handleGeneratePlan} />
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
        </div>
    );
}

function IconButton({ 
  icon, 
  title, 
  onClick, 
  disabled = false,
  variant = "primary"
}) {
  const variantStyles = {
    primary: "bg-slate-700/50 hover:bg-slate-700/70 text-blue-400 hover:text-blue-300",
    secondary: "bg-slate-700/50 hover:bg-slate-700/70 text-slate-400 hover:text-slate-300",
    success: "bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300",
    accent: "bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300"
  };

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-11 h-11 rounded-xl flex items-center justify-center
        transition-all duration-300 ease-out
        border border-slate-600/40
        hover:scale-110 hover:shadow-lg
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${variantStyles[variant]}
      `}
    >
      {icon}
    </button>
  );
}