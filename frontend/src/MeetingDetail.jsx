import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeftFromLine } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || "";

function parseDate(value) {
  if (!value) return null;
  const n = typeof value === "number" ? value : Number(value) || null;
  return n ? new Date(n) : new Date(value);
}

function useAutosizeTextArea(textAreaRef, value) {
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [textAreaRef, value]);
}

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [summary, setSummary] = useState("");
  const [dbId, setDbId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [editingFiles, setEditingFiles] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [updateFilesLoading, setUpdateFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);
  const textAreaRef = useRef(null);

  useAutosizeTextArea(textAreaRef, summary);

  useEffect(() => {
    setLoading(true);

    // Step 1: Fetch meeting detail from Fireflies API
    fetch(`${API}/api/external/meetings/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setMeeting(data);
        setSummary(data.summary?.overview ?? data.summary?.short_summary ?? "");

        // Step 2: Upsert meeting into your DB (save or update)
        upsertMeetingToDb(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load meeting details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function upsertMeetingToDb(data) {
  try {
    const meetingDate = data?.date
      ? (() => {
          const d = typeof data.date === "number"
            ? new Date(Number(data.date))
            : new Date(data.date);
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
        })()
      : null;

    const payload = {
      FirefliesId: String(data?.id ?? ""),
      Title: data?.title ?? "",
      MeetingDate: meetingDate,
      DurationSeconds: Math.round(Number(data?.duration ?? 0)), // int ensure
      TranscriptJson: JSON.stringify(data?.sentences ?? []),
      Summary: data?.summary?.overview ?? data?.summary?.short_summary ?? ""
    };

    console.log("UPSERT -> payload:", payload);

    const res = await fetch(`${API}/api/meetings/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload) 
    });

    const text = await res.text();
    console.log("UPSERT -> status:", res.status, "response:", text);

    if (!res.ok) {
      throw new Error(text || `Status ${res.status}`);
    }

    const saved = text ? JSON.parse(text) : null;
    const newId = saved?.id ?? saved?.Id ?? saved?.ID ?? null;
    if (newId) setDbId(newId);
    else console.warn("Upsert succeeded but id not found in response.", saved);
  } catch (err) {
    console.error("Upsert failed:", err);
    alert("Failed to save meeting to DB. See console/network for details.");
  }
}

  async function downloadSummaryFile() {
  if (!dbId) {
    alert("Meeting not saved in DB yet.");
    return;
  }
  try {
    const res = await fetch(`${API}/api/meetings/${dbId}/download-summary`, {
      method: "GET",
    });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to download summary.");
  }
}

  async function updateSummary() {
    if (!dbId) {
      alert("Wait until meeting is saved to DB first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/meetings/${dbId}/summary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary:summary })
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Summary updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Summary update failed: " + err.message);
    } finally {
      setSaving(false);
    }

  }

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "60px" }}>
        Loading meeting details...
      </div>
    );

  if (!meeting)
    return (
      <div style={{ textAlign: "center", marginTop: "60px" }}>
        Meeting not found.
      </div>
    );

  const d = parseDate(meeting.date);

  return (
    <div style={{ padding: "20px", maxWidth: "960px", margin: "auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          backgroundColor: "var(--card)",
          padding: "14px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 100,
          borderRadius: "10px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
            
        >
          <ArrowLeftFromLine />
        </button>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "1.8rem",
              color: "var(--accent-2)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={meeting.title}
          >
            {meeting.title}
          </h2>
          <div
            style={{
              color: "var(--muted)",
              fontSize: "0.9rem",
              whiteSpace: "nowrap",
              marginTop: "4px",
            }}
          >
            {d ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ""} • Duration: {Math.round(meeting.duration)} Minutes
          </div>
        </div>
      </div>

      {/* Summary */}
      <section
        style={{
          backgroundColor: "var(--card)",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 12px 36px rgba(15,23,42,0.1)",
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginTop: "20px", display: "flex", gap: "16px", justifyContent: "space-between"  }}>
        <label
          htmlFor="summary-textarea"
          style={{ fontWeight: 600, marginBottom: "12px", fontSize: "1.15rem", color: "var(--accent)" }}
        >
          Meeting Summary (editable)
        </label>

        <button onClick={downloadSummaryFile} >
          <Download />
        </button>
          
        </div>
        <textarea
          id="summary-textarea"
          ref={textAreaRef}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={6}
          placeholder="Edit the meeting summary here..."
          aria-label="Edit meeting summary"
          style={{
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: "1rem",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid var(--border-muted)",
            transition: "border-color 0.3s ease",
            minHeight: "140px",
            maxHeight: "250px",
            boxSizing: "border-box",
          }}
        />
        <div style={{ marginTop: "20px", display: "flex", gap: "16px", justifyContent: "space-between"  }}>
          
          <button
            onClick={updateSummary}
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
      {showEditor && (
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
)}

      {/* Transcript toggle */}
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => setTranscriptOpen((open) => !open)}
          aria-expanded={transcriptOpen}
          aria-controls="transcript-section"
          style={{ padding: "10px 20px", borderRadius: "12px" }}
          className="btn btn-ghost"
        >
          {transcriptOpen ? "Hide Transcript ▲" : "Show Transcript ▼"}
        </button>
      </div>

      {/* Transcript Section */}
      <section
        id="transcript-section"
        tabIndex={0}
        aria-label="Meeting transcript"
        style={{
          maxHeight: transcriptOpen ? "350px" : "0",
          overflowY: transcriptOpen ? "auto" : "hidden",
          transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "var(--card)",
          padding: transcriptOpen ? "16px" : "0 16px",
          borderRadius: "14px",
          boxShadow: transcriptOpen ? "0 12px 36px rgba(15,23,42,0.1)" : "none",
          marginBottom: transcriptOpen ? "40px" : "0",
        }}
      >
        {transcriptOpen &&
          (meeting.sentences?.length ? (
            meeting.sentences.map((s) => (
              <p key={s.index} style={{ marginBottom: "12px", wordBreak: "break-word" }}>
                <b style={{ color: "var(--accent-2)", fontStyle: "italic" }}>
                  {s.speaker_name ?? "Speaker"}
                </b>
                : {s.text}
              </p>
            ))
          ) : (
            <div style={{ padding: "24px", textAlign: "center", fontStyle: "italic" }}>
              Transcript not available
            </div>
          ))}
      </section>
    </div>
  );
  
}