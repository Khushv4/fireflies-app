
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeftFromLine, Save, RefreshCw, Check, Settings2 } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = import.meta.env.VITE_API_BASE_URL || "";

// Helper functions (no changes)
function parseDate(value) {
  if (!value) return null;
  const n = typeof value === "number" ? value : Number(value) || null;
  return n ? new Date(n) : new Date(value);
}

// Add this helper function at the top of MeetingDetail.jsx

function safeJsonParse(str) {
  if (typeof str !== 'string') {
    return str; // Return as is if it's not a string
  }
  try {
    const trimmed = str.trim();
    // Only parse if it looks like a JSON object or array
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return JSON.parse(str);
    }
  } catch (e) {
    console.warn("Failed to parse JSON string, returning as is:", str);
    return str; // If parsing fails, return the original string
  }
  // If it's not a JSON-like string, return it as is
  return str;
}


function useAutosizeTextArea(textAreaRef, value) {
  useEffect(() => {
    if (textAreaRef?.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [textAreaRef, value]);
}

const CustomCheckbox = ({ label, checked, onChange }) => (
    <label onClick={onChange} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: '15px', color: '#334155' }}>
      <div style={{
        width: '20px', height: '20px',
        borderRadius: '6px', border: '2px solid #cbd5e1',
        backgroundColor: checked ? '#4f46e5' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        pointerEvents: 'none'
      }}>
        {checked && <Check size={14} color="white" strokeWidth={3} />}
      </div>
      {label}
    </label>
);

const LoadingSkeleton = () => (
  <div style={{ padding: "24px", maxWidth: "1000px", margin: "auto" }}>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    <div style={{ height: '70px', backgroundColor: '#e2e8f0', borderRadius: '14px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ height: '220px', backgroundColor: 'white', borderRadius: '16px', marginBottom: '32px', animation: 'pulse 1.5s infinite 0.2s' }}></div>
    <div style={{ height: '350px', backgroundColor: 'white', borderRadius: '16px', animation: 'pulse 1.5s infinite 0.4s' }}></div>
  </div>
);

// Main Component
export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [summary, setSummary] = useState("");
  const [dbId, setDbId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [summaryPreferences, setSummaryPreferences] = useState(null);
  const [previewMode, setPreviewMode] = useState(true);

  const textAreaRef = useRef(null);
  useAutosizeTextArea(textAreaRef, summary);

  // ✅ **UPDATED DATA FETCHING useEffect**
  // In MeetingDetail.jsx

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/external/meetings/${id}`)
    .then(res => {
        // First, check if the response was successful (status 200-299)
        if (!res.ok) {
            // If not, read the response body as text and throw an error.
            // This will be caught by the .catch() block.
            return res.text().then(text => { 
                try {
                    // Try to parse it as JSON (for our custom backend errors)
                    const errorJson = JSON.parse(text);
                    throw new Error(errorJson.message || 'An unknown error occurred.');
                } catch (e) {
                    // If it's not JSON, just throw the raw text
                    throw new Error(text || 'An unknown server error occurred.');
                }
            });
        }
        // If successful, parse the JSON body and continue
        return res.json();
    })
    .then(data => {
      let meetingData = data.transcript ? data.transcript : data;
      const databaseId = data.dbId ? data.dbId : meetingData.dbId;

      meetingData.sentences = safeJsonParse(meetingData.sentences);
      if (meetingData.summary) {
        meetingData.summary.action_items = safeJsonParse(meetingData.summary.action_items);
        meetingData.summary.keywords = safeJsonParse(meetingData.summary.keywords);
        meetingData.summary.extended_sections = safeJsonParse(meetingData.summary.extended_sections);
      }

      setMeeting(meetingData);
      if (databaseId) { setDbId(databaseId); }
      upsertMeetingToDb(meetingData);

      if (data.summaryPreferencesJson) {
        setSummaryPreferences(JSON.parse(data.summaryPreferencesJson));
      } else {
        const extendedPrefs = {};
        if (meetingData.summary?.extended_sections && Array.isArray(meetingData.summary.extended_sections)) {
          meetingData.summary.extended_sections.forEach(section => {
            extendedPrefs[section.title] = false;
          });
        }
        setSummaryPreferences({
          overview: true, action_items: true, keywords: true, bullet_gist: true,
          extended_sections: extendedPrefs
        });
      }
      
      if (data.userEditedSummary) {
        setSummaryText(data.userEditedSummary);
      } else {
        let finalSummary = "";
        const summaryData = meetingData.summary;
        if (summaryData) { // Check if summaryData exists
            const tempPrefs = data.summaryPreferencesJson ? JSON.parse(data.summaryPreferencesJson) : { overview: true, action_items: true, keywords: true, bullet_gist: true };

            if (tempPrefs.overview && (summaryData.overview || summaryData.short_summary)) {
              finalSummary += `## Overview\n${summaryData.overview || summaryData.short_summary}\n\n`;
            }
            if (tempPrefs.action_items && summaryData.action_items) {
              if (Array.isArray(summaryData.action_items) && summaryData.action_items.length > 0) {
                finalSummary += `## Action Items\n- ${summaryData.action_items.join('\n- ')}\n\n`;
              } else if (typeof summaryData.action_items === 'string') {
                finalSummary += `## Action Items\n${summaryData.action_items}\n\n`;
              }
            }
            if (tempPrefs.keywords && summaryData.keywords) {
              if (Array.isArray(summaryData.keywords) && summaryData.keywords.length > 0) {
                finalSummary += `## Keywords\n${summaryData.keywords.join(', ')}\n\n`;
              } else if (typeof summaryData.keywords === 'string') {
                 finalSummary += `## Keywords\n${summaryData.keywords}\n\n`;
              }
            }
            if (tempPrefs.bullet_gist && summaryData.bullet_gist) {
              finalSummary += `## Key Points\n${summaryData.bullet_gist}\n\n`;
            }
        }
        setSummary(finalSummary);
      }
    })
    .catch((err) => { 
        console.error("Caught error:", err); 
        alert(`Failed to load meeting details: ${err.message}`);
    })
    .finally(() => setLoading(false));
  }, [id]);


  const handleRegenerateSummary = () => {
    if (!window.confirm("This will overwrite any manual edits in the text area. Are you sure you want to regenerate the summary?")) {
      return;
    }
    if (!meeting?.summary || !summaryPreferences) return;

    let finalSummary = "";
    const summaryData = meeting.summary;

    if (summaryPreferences.overview && (summaryData.overview || summaryData.short_summary)) {
      finalSummary += `## Overview\n${summaryData.overview || summaryData.short_summary}\n\n`;
    }
    if (summaryPreferences.action_items && Array.isArray(summaryData.action_items) && summaryData.action_items.length > 0) {
      finalSummary += `## Action Items\n- ${summaryData.action_items.join('\n- ')}\n\n`;
    }
    if (summaryPreferences.keywords && Array.isArray(summaryData.keywords) && summaryData.keywords.length > 0) {
      finalSummary += `## Keywords\n${summaryData.keywords.join(', ')}\n\n`;
    }
    if (summaryPreferences.bullet_gist && summaryData.bullet_gist) {
      finalSummary += `## Key Points\n${summaryData.bullet_gist}\n\n`;
    }
    if (meeting.summary.extended_sections && summaryPreferences.extended_sections) {
        const selectedSections = meeting.summary.extended_sections
            .filter(section => summaryPreferences.extended_sections[section.title])
            .map(section => `## ${section.title}\n${section.content}`)
            .join('\n\n');
        if (selectedSections) {
            finalSummary += `${selectedSections}\n\n`;
        }
    }
    setSummary(finalSummary);
  };

  const handleSaveAll = async () => {
    if (!dbId) return alert("Meeting not saved in DB yet.");
    setSaving(true);
    try {
      await Promise.all([
        fetch(`${API}/api/meetings/${dbId}/summary`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: summary })
        }),
        fetch(`${API}/api/meetings/${dbId}/preferences`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: summaryPreferences })
        })
      ]);
      alert("Summary and preferences saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  async function upsertMeetingToDb(data) {
    try {
      const payload = {
          FirefliesId: String(data?.id ?? ""), Title: data?.title ?? "",
          MeetingDate: data?.date ? new Date(data.date).toISOString() : null,
          DurationSeconds: Math.round(Number(data?.duration ?? 0)),


          TranscriptJson: JSON.stringify(data?.sentences ?? []),
          Summary: data?.summary?.overview ?? data?.summary?.short_summary ?? "",
          BulletGist: data.summary?.bullet_gist ?? null,

          ActionItems: Array.isArray(data.summary?.action_items) 
            ? JSON.stringify(data.summary.action_items) 
            : data.summary?.action_items ?? null,
          Keywords: Array.isArray(data.summary?.keywords) 
            ? JSON.stringify(data.summary.keywords) 
            : data.summary?.keywords ?? null,

            ExtendedSectionsJson: JSON.stringify(data.summary?.extended_sections ?? null),
          AudioUrl: data?.audio_url ?? null
      };
      const res = await fetch(`${API}/api/meetings/upsert`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      if (saved?.id) setDbId(saved.id);
    } catch (err) { console.error("Upsert failed:", err); }
  }

  async function downloadSummaryFile() {
    if (!dbId) return alert("Meeting not saved yet.");
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title}-summary.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
  
  if (loading || !summaryPreferences) return <LoadingSkeleton />;
  if (!meeting) return <div style={{ textAlign: "center", marginTop: "60px" }}>Meeting not found.</div>;

  const d = parseDate(meeting.date);
  const audioSrc = meeting?.audio_url ? (meeting.audio_url.startsWith('http') ? meeting.audio_url : `${API}${meeting.audio_url}`) : null;


  console.log("Meeting Data:", meeting);

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "auto", fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
      
      <header
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "22px 28px",
    marginBottom: "36px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
    boxShadow: "0 12px 40px -8px rgba(22, 34, 51, 0.08)",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    backdropFilter: "blur(12px)",
  }}
>
  {/* Left Section: Back Button + Title */}
  <div style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0 }}>
    {/* Back Button */}
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.25s ease",
        color: "#334155",
        flexShrink: 0,
        boxShadow: "0 4px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.backgroundColor = "#f1f5f9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.04)";
        e.currentTarget.style.backgroundColor = "#f8fafc";
      }}
    >
      <ArrowLeftFromLine size={22} />
    </button>

    {/* Meeting Title + Metadata */}
    <div style={{ minWidth: 0 }}>
      <h1
        style={{
          margin: 0,
          fontWeight: 800,
          fontSize: "1.9rem",
          letterSpacing: "-0.03em",
          color: "#0f172a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={meeting.title}
      >
        {meeting.title}
      </h1>
      <div
        style={{
          marginTop: "10px",
          fontSize: "1rem",
          fontWeight: 500,
          color: "#475569",
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        {/* Date with Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "1.1rem" }}>📅</span>
          <span>{d ? d.toLocaleDateString(undefined, { dateStyle: "long" }) : ""}</span>
        </div>

        {/* Duration with Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "1.1rem" }}>⏱️</span>
          <span>{Math.round(meeting.duration)} Minutes</span>
        </div>
      </div>
    </div>
  </div>

  {/* Right Section (Future buttons if needed) */}
  <div></div>
</header>


      
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Settings2 size={24} color="#4f46e5" />
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: "1.25rem" }}>
            Customize Summary
          </h3>
        </div>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: "12px", 
          marginBottom: "20px" 
        }}>
          {['overview', 'action_items', 'keywords', 'bullet_gist'].map((key) => (
            <div 
              key={key} 
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 14px',
                background: summaryPreferences[key] ? '#eef2ff' : '#ffffff',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSummaryPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              <CustomCheckbox
                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                checked={!!summaryPreferences[key]}
                onChange={() => {}}
              />
            </div>
          ))}
        </div>

        {summaryPreferences.extended_sections && Object.keys(summaryPreferences.extended_sections).length > 0 && (
          <details 
            style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '16px 18px', 
              background: '#fafafa'
            }}
          >
            <summary style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Detailed Sections ({Object.keys(summaryPreferences.extended_sections).length})
            </summary>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              marginTop: '14px', 
              maxHeight: '220px', 
              overflowY: 'auto'
            }}>
              {Object.keys(summaryPreferences.extended_sections).map((title) => (
                <div 
                  key={title}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: summaryPreferences.extended_sections[title] ? '#f1f5f9' : '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSummaryPreferences(prev => ({
                      ...prev, 
                      extended_sections: { 
                        ...prev.extended_sections, 
                        [title]: !prev.extended_sections[title] 
                      }
                    }));
                  }}
                >
                  <CustomCheckbox
                    label={title}
                    checked={summaryPreferences.extended_sections[title]}
                    onChange={() => {}}
                  />
                </div>
              ))}
            </div>
          </details>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={handleRegenerateSummary} className="btn btn-secondary">
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Regenerate from Selected
          </button>
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontWeight: 600, fontSize: "1.25rem" }}>Meeting Summary</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={downloadSummaryFile} className="icon-btn" title="Download Summary">
              <Download size={18}/>
            </button>
            <button 
              onClick={() => setPreviewMode(prev => !prev)} 
              className="icon-btn" 
              title={previewMode ? "Switch to Edit" : "Switch to Preview"}
            >
              {previewMode ? "✏️" : "👁️"}
            </button>
          </div>
        </div>
        {previewMode ? (
          <div className="summary-view">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ node, ...props }) => {
                  const text = props.children[0];
                  let bg = "#475569";
                  if (typeof text === 'string') {
                      if (text.includes("Overview")) bg = "#2563eb";
                      else if (text.includes("Action Items")) bg = "#16a34a";
                      else if (text.includes("Keywords")) bg = "#f59e0b";
                      else if (text.includes("Key Points")) bg = "#9333ea";
                  }
                  return <h2 {...props} style={{ backgroundColor: bg, color: "white", fontSize: "1rem", fontWeight: 600, display: "inline-block", padding: "8px 16px", borderRadius: "8px", margin: "16px 0 12px 0" }} />;
                },
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textAreaRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{
              width: "100%", minHeight: "250px", resize: "none", padding: "16px",
              border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px",
              lineHeight: 1.6, fontFamily: "inherit", background: "#f8fafc"
            }}
          />
        )}
        <div style={{ marginTop: "20px", display: "flex", gap: "16px", justifyContent: "space-between"  }}>
          
          <button
            onClick={handleSaveAll}
            disabled={!dbId || saving}
            aria-live="polite"
            className="btn btn-primary"
          >
            {saving ? "Updating..." : "Update Summary"}
          </button>
          <button
                onClick={() => {
                    if (dbId) {
                        // Navigate to the new route, passing dbId and summary as state
                        navigate(`/generate-files/${dbId}`, { state: { summary, meetingId: id } });
                    } else {
                        alert("Meeting not saved in DB yet. Please wait.");
                    }
                }}
                disabled={!dbId} // Disable if dbId is not available
                className="btn btn-secondary"
            >
                Next
            </button>
        </div>
      </section>

      {/* Generated Files Editor (Removed from here, will be in the new route) */}
{/*       {showEditor && (
  <section style={{ background: "#f9f9f9", padding: "24px", borderRadius: "14px", marginBottom: "32px" }}>
    <h3 style={{ marginBottom: "18px" }}>Generated Files</h3>
    {generatedFiles.map((file, idx) => (
      <div key={file.name} style={{ marginBottom: "24px" }}>
        <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>{file.name}</label>
        <textarea
          value={editingFiles[idx]}
          onChange={e => {
            const newFiles = [...editingFiles];
            newFiles[idx] = e.target.value;
            setEditingFiles(newFiles);
          }}
          rows={10}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "1rem", borderRadius: "8px", padding: "10px" }}
        />
      </div>
    ))}
    <button
      onClick={async () => {
        setUpdateFilesLoading(true);
        setFilesError(null);
        try {
          const res = await fetch(`${API}/api/external/save-files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meetingId: dbId,
              files: generatedFiles.map((f, i) => ({ name: f.name, content: editingFiles[i] }))
            })
          });
          if (!res.ok) throw new Error(await res.text());
          alert("Files updated!");
          setShowEditor(false);
        } catch (err) {
          setFilesError(err.message || "Failed to save files.");
        } finally {
          setUpdateFilesLoading(false);
        }
      }}
      disabled={updateFilesLoading}
      className="btn btn-success"
      style={{ marginTop: "12px" }}
    >
      {updateFilesLoading ? "Saving..." : "Update Files"}
    </button>
    {filesError && <div style={{ color: "red", marginTop: "12px" }}>{filesError}</div>}
  </section>
)} */}

   

      <div style={{ marginBottom: "16px" }}>
        <button onClick={() => setTranscriptOpen((open) => !open)} className="btn btn-ghost">
          {transcriptOpen ? "Hide Transcript ▲" : "Show Transcript ▼"}
        </button>
      </div>
      <section style={{ maxHeight: transcriptOpen ? "500px" : "0", overflowY: 'auto', transition: "all 0.5s ease-in-out", padding: transcriptOpen ? '24px' : '0 24px' }} className={transcriptOpen ? 'card' : ''}>
        {audioSrc && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{marginTop: 0, marginBottom: '12px', fontSize: '1.1rem'}}>Listen to Recording</h4>
            <audio controls src={audioSrc} style={{ width: '100%' }}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {meeting.sentences?.length ? (
          meeting.sentences.map((s) => (
            <p key={s.index} style={{ marginBottom: "16px", lineHeight: 1.7 }}>
              <b style={{ color: "#4f46e5", display: 'block', marginBottom: '2px' }}>{s.speaker_name ?? "Speaker"}</b> {s.text}
            </p>
          ))
        ) : (
          <div style={{ padding: "24px", textAlign: "center", fontStyle: "italic", color: '#64748b' }}>
            Transcript not available
          </div>
        )}
      </section>

      {/* CSS */}
      <style>{`
        .card { background-color: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0; margin-bottom: 32px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 12px; padding: 12px 24px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-primary { background-color: #4f46e5; color: white; }
        .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        .btn-secondary { background-color: #eef2ff; color: #4338ca; }
        .btn-ghost { background-color: transparent; color: #4338ca; font-weight: 600; }
        .icon-btn { background-color: #f1f5f9; border: 1px solid transparent; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .icon-btn:hover { background-color: #e2e8f0; border-color: #cbd5e1; }
        .summary-view { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 20px 20px 20px; font-size: 15px; line-height: 1.7; }
      `}</style>
    </div>
  );
}