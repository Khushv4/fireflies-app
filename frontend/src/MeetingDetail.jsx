// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Download, ArrowLeftFromLine, Save, RefreshCw, Check, Settings2 } from 'lucide-react';
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import FileSelectionModal from './FileSelectionModal'; // Import the new modal

// const API = import.meta.env.VITE_API_BASE_URL || "";

// // ... (keep all your existing helper functions like parseDate, safeJsonParse, useAutosizeTextArea, CustomCheckbox, LoadingSkeleton)
// function parseDate(value) {
//   if (!value) return null;
//   const n = typeof value === "number" ? value : Number(value) || null;
//   return n ? new Date(n) : new Date(value);
// }

// function safeJsonParse(str) {
//   if (typeof str !== 'string') {
//     return str;
//   }
//   try {
//     const trimmed = str.trim();
//     if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
//       return JSON.parse(str);
//     }
//   } catch (e) {
//     console.warn("Failed to parse JSON string, returning as is:", str);
//     return str;
//   }
//   return str;
// }

// function useAutosizeTextArea(textAreaRef, value) {
//   useEffect(() => {
//     if (textAreaRef?.current) {
//       textAreaRef.current.style.height = "auto";
//       textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
//     }
//   }, [textAreaRef, value]);
// }

// const CustomCheckbox = ({ label, checked, onChange }) => (
//     <label onClick={onChange} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: '15px', color: '#334155' }}>
//       <div style={{
//         width: '20px', height: '20px',
//         borderRadius: '6px', border: '2px solid #cbd5e1',
//         backgroundColor: checked ? '#4f46e5' : 'transparent',
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         transition: 'all 0.2s ease-in-out',
//         pointerEvents: 'none'
//       }}>
//         {checked && <Check size={14} color="white" strokeWidth={3} />}
//       </div>
//       {label}
//     </label>
// );

// const LoadingSkeleton = () => (
//   <div style={{ padding: "24px", maxWidth: "1000px", margin: "auto" }}>
//     <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
//     <div style={{ height: '70px', backgroundColor: '#e2e8f0', borderRadius: '14px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
//     <div style={{ height: '220px', backgroundColor: 'white', borderRadius: '16px', marginBottom: '32px', animation: 'pulse 1.5s infinite 0.2s' }}></div>
//     <div style={{ height: '350px', backgroundColor: 'white', borderRadius: '16px', animation: 'pulse 1.5s infinite 0.4s' }}></div>
//   </div>
// );

// // Main Component
// export default function MeetingDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [meeting, setMeeting] = useState(null);
//   const [summary, setSummary] = useState("");
//   const [dbId, setDbId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [transcriptOpen, setTranscriptOpen] = useState(false);
//   const [summaryPreferences, setSummaryPreferences] = useState(null);
//   const [previewMode, setPreviewMode] = useState(true);
  
//   // Add state for file selection modal
//   const [showFileSelectionModal, setShowFileSelectionModal] = useState(false);

//   const textAreaRef = useRef(null);
//   useAutosizeTextArea(textAreaRef, summary);

//   // ... (keep all your existing useEffect for data fetching)
//   useEffect(() => {
//     setLoading(true);
//     fetch(`${API}/api/external/meetings/${id}`)
//     .then(res => {
//         if (!res.ok) {
//             return res.text().then(text => { 
//                 try {
//                     const errorJson = JSON.parse(text);
//                     throw new Error(errorJson.message || 'An unknown error occurred.');
//                 } catch (e) {
//                     throw new Error(text || 'An unknown server error occurred.');
//                 }
//             });
//         }
//         return res.json();
//     })
//     .then(data => {
//       let meetingData = data.transcript ? data.transcript : data;
//       const databaseId = data.dbId ? data.dbId : meetingData.dbId;

//       meetingData.sentences = safeJsonParse(meetingData.sentences);
//       if (meetingData.summary) {
//         meetingData.summary.action_items = safeJsonParse(meetingData.summary.action_items);
//         meetingData.summary.keywords = safeJsonParse(meetingData.summary.keywords);
//         meetingData.summary.extended_sections = safeJsonParse(meetingData.summary.extended_sections);
//       }

//       setMeeting(meetingData);
//       if (databaseId) { setDbId(databaseId); }
//       upsertMeetingToDb(meetingData);

//       if (data.summaryPreferencesJson) {
//         setSummaryPreferences(JSON.parse(data.summaryPreferencesJson));
//       } else {
//         const extendedPrefs = {};
//         if (meetingData.summary?.extended_sections && Array.isArray(meetingData.summary.extended_sections)) {
//           meetingData.summary.extended_sections.forEach(section => {
//             extendedPrefs[section.title] = false;
//           });
//         }
//         setSummaryPreferences({
//           overview: true, action_items: true, keywords: true, bullet_gist: true,
//           extended_sections: extendedPrefs
//         });
//       }
      
//       if (data.userEditedSummary) {
//         setSummary(data.userEditedSummary);
//       } else {
//         let finalSummary = "";
//         const summaryData = meetingData.summary;
//         if (summaryData) {
//             const tempPrefs = data.summaryPreferencesJson ? JSON.parse(data.summaryPreferencesJson) : { overview: true, action_items: true, keywords: true, bullet_gist: true };

//             if (tempPrefs.overview && (summaryData.overview || summaryData.short_summary)) {
//               finalSummary += `## Overview\n${summaryData.overview || summaryData.short_summary}\n\n`;
//             }
//             if (tempPrefs.action_items && summaryData.action_items) {
//               if (Array.isArray(summaryData.action_items) && summaryData.action_items.length > 0) {
//                 finalSummary += `## Action Items\n- ${summaryData.action_items.join('\n- ')}\n\n`;
//               } else if (typeof summaryData.action_items === 'string') {
//                 finalSummary += `## Action Items\n${summaryData.action_items}\n\n`;
//               }
//             }
//             if (tempPrefs.keywords && summaryData.keywords) {
//               if (Array.isArray(summaryData.keywords) && summaryData.keywords.length > 0) {
//                 finalSummary += `## Keywords\n${summaryData.keywords.join(', ')}\n\n`;
//               } else if (typeof summaryData.keywords === 'string') {
//                  finalSummary += `## Keywords\n${summaryData.keywords}\n\n`;
//               }
//             }
//             if (tempPrefs.bullet_gist && summaryData.bullet_gist) {
//               finalSummary += `## Key Points\n${summaryData.bullet_gist}\n\n`;
//             }
//         }
//         setSummary(finalSummary);
//       }
//     })
//     .catch((err) => { 
//         console.error("Caught error:", err); 
//         alert(`Failed to load meeting details: ${err.message}`);
//     })
//     .finally(() => setLoading(false));
//   }, [id]);

//   // ... (keep all your existing handler functions)
//   const handleRegenerateSummary = () => {
//     if (!window.confirm("This will overwrite any manual edits in the text area. Are you sure you want to regenerate the summary?")) {
//       return;
//     }
//     if (!meeting?.summary || !summaryPreferences) return;

//     let finalSummary = "";
//     const summaryData = meeting.summary;

//     if (summaryPreferences.overview && (summaryData.overview || summaryData.short_summary)) {
//       finalSummary += `## Overview\n${summaryData.overview || summaryData.short_summary}\n\n`;
//     }
//     if (summaryPreferences.action_items && Array.isArray(summaryData.action_items) && summaryData.action_items.length > 0) {
//       finalSummary += `## Action Items\n- ${summaryData.action_items.join('\n- ')}\n\n`;
//     }
//     if (summaryPreferences.keywords && Array.isArray(summaryData.keywords) && summaryData.keywords.length > 0) {
//       finalSummary += `## Keywords\n${summaryData.keywords.join(', ')}\n\n`;
//     }
//     if (summaryPreferences.bullet_gist && summaryData.bullet_gist) {
//       finalSummary += `## Key Points\n${summaryData.bullet_gist}\n\n`;
//     }
//     if (meeting.summary.extended_sections && summaryPreferences.extended_sections) {
//         const selectedSections = meeting.summary.extended_sections
//             .filter(section => summaryPreferences.extended_sections[section.title])
//             .map(section => `## ${section.title}\n${section.content}`)
//             .join('\n\n');
//         if (selectedSections) {
//             finalSummary += `${selectedSections}\n\n`;
//         }
//     }
//     setSummary(finalSummary);
//   };

//   const handleSaveAll = async () => {
//     if (!dbId) return alert("Meeting not saved in DB yet.");
//     setSaving(true);
//     try {
//       await Promise.all([
//         fetch(`${API}/api/meetings/${dbId}/summary`, {
//           method: "PUT", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ summary: summary })
//         }),
//         fetch(`${API}/api/meetings/${dbId}/preferences`, {
//           method: "PUT", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ preferences: summaryPreferences })
//         })
//       ]);
//       alert("Summary and preferences saved successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save changes.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   async function upsertMeetingToDb(data) {
//     try {
//       const payload = {
//           FirefliesId: String(data?.id ?? ""), Title: data?.title ?? "",
//           MeetingDate: data?.date ? new Date(data.date).toISOString() : null,
//           DurationSeconds: Math.round(Number(data?.duration ?? 0)),
//           TranscriptJson: JSON.stringify(data?.sentences ?? []),
//           Summary: data?.summary?.overview ?? data?.summary?.short_summary ?? "",
//           BulletGist: data.summary?.bullet_gist ?? null,
//           ActionItems: Array.isArray(data.summary?.action_items) 
//             ? JSON.stringify(data.summary.action_items) 
//             : data.summary?.action_items ?? null,
//           Keywords: Array.isArray(data.summary?.keywords) 
//             ? JSON.stringify(data.summary.keywords) 
//             : data.summary?.keywords ?? null,
//             ExtendedSectionsJson: JSON.stringify(data.summary?.extended_sections ?? null),
//           AudioUrl: data?.audio_url ?? null
//       };
//       const res = await fetch(`${API}/api/meetings/upsert`, {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//       });
//       if (!res.ok) throw new Error(await res.text());
//       const saved = await res.json();
//       if (saved?.id) setDbId(saved.id);
//     } catch (err) { console.error("Upsert failed:", err); }
//   }

//   async function downloadSummaryFile() {
//     if (!dbId) return alert("Meeting not saved yet.");
//     const blob = new Blob([summary], { type: 'text/plain' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${meeting.title}-summary.md`;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     window.URL.revokeObjectURL(url);
//   }

//   // New handler for file selection
//   const handleFileSelectionConfirm = (selectedFileIds) => {
//     setShowFileSelectionModal(false);
//     if (dbId) {
//       // Navigate to the generate files route with selected files in state
//       navigate(`/generate-files/${dbId}`, { 
//         state: { 
//           summary, 
//           meetingId: id,
//           selectedFiles: selectedFileIds
//         } 
//       });
//     } else {
//       alert("Meeting not saved in DB yet. Please wait.");
//     }
//   };
  
//   if (loading || !summaryPreferences) return <LoadingSkeleton />;
//   if (!meeting) return <div style={{ textAlign: "center", marginTop: "60px" }}>Meeting not found.</div>;

//   const d = parseDate(meeting.date);
//   const audioSrc = meeting?.audio_url ? (meeting.audio_url.startsWith('http') ? meeting.audio_url : `${API}${meeting.audio_url}`) : null;

//   return (
//     <div style={{ padding: "24px", maxWidth: "1000px", margin: "auto", fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
//       {/* ... (keep all your existing JSX for header, customize summary section, and summary section) */}
//       <header
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "22px 28px",
//           marginBottom: "36px",
//           borderRadius: "24px",
//           background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
//           boxShadow: "0 12px 40px -8px rgba(22, 34, 51, 0.08)",
//           border: "1px solid rgba(226, 232, 240, 0.6)",
//           backdropFilter: "blur(12px)",
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0 }}>
//           <button
//             onClick={() => navigate(-1)}
//             aria-label="Go back"
//             style={{
//               backgroundColor: "#f8fafc",
//               border: "1px solid #e2e8f0",
//               borderRadius: "16px",
//               width: "50px",
//               height: "50px",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               cursor: "pointer",
//               transition: "all 0.25s ease",
//               color: "#334155",
//               flexShrink: 0,
//               boxShadow: "0 4px 8px rgba(0,0,0,0.04)",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
//               e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
//               e.currentTarget.style.backgroundColor = "#f1f5f9";
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = "translateY(0) scale(1)";
//               e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.04)";
//               e.currentTarget.style.backgroundColor = "#f8fafc";
//             }}
//           >
//             <ArrowLeftFromLine size={22} />
//           </button>

//           <div style={{ minWidth: 0 }}>
//             <h1
//               style={{
//                 margin: 0,
//                 fontWeight: 800,
//                 fontSize: "1.9rem",
//                 letterSpacing: "-0.03em",
//                 color: "#0f172a",
//                 whiteSpace: "nowrap",
//                 overflow: "hidden",
//                 textOverflow: "ellipsis",
//               }}
//               title={meeting.title}
//             >
//               {meeting.title}
//             </h1>
//             <div
//               style={{
//                 marginTop: "10px",
//                 fontSize: "1rem",
//                 fontWeight: 500,
//                 color: "#475569",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "18px",
//               }}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                 <span style={{ fontSize: "1.1rem" }}>📅</span>
//                 <span>{d ? d.toLocaleDateString(undefined, { dateStyle: "long" }) : ""}</span>
//               </div>

//               <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                 <span style={{ fontSize: "1.1rem" }}>⏱️</span>
//                 <span>{Math.round(meeting.duration)} Minutes</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div></div>
//       </header>
      
//       <section className="card">
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
//           <Settings2 size={24} color="#4f46e5" />
//           <h3 style={{ margin: 0, fontWeight: 600, fontSize: "1.25rem" }}>
//             Customize Summary
//           </h3>
//         </div>
//         <div style={{ 
//           display: "grid", 
//           gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
//           gap: "12px", 
//           marginBottom: "20px" 
//         }}>
//           {['overview', 'action_items', 'keywords', 'bullet_gist'].map((key) => (
//             <div 
//               key={key} 
//               style={{
//                 border: '1px solid #e2e8f0',
//                 borderRadius: '10px',
//                 padding: '10px 14px',
//                 background: summaryPreferences[key] ? '#eef2ff' : '#ffffff',
//                 transition: 'all 0.2s ease',
//                 cursor: 'pointer'
//               }}
//               onClick={() => setSummaryPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
//             >
//               <CustomCheckbox
//                 label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//                 checked={!!summaryPreferences[key]}
//                 onChange={() => {}}
//               />
//             </div>
//           ))}
//         </div>

//         {summaryPreferences.extended_sections && Object.keys(summaryPreferences.extended_sections).length > 0 && (
//           <details 
//             style={{ 
//               border: '1px solid #e2e8f0', 
//               borderRadius: '12px', 
//               padding: '16px 18px', 
//               background: '#fafafa'
//             }}
//           >
//             <summary style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
//               Detailed Sections ({Object.keys(summaryPreferences.extended_sections).length})
//             </summary>
//             <div style={{ 
//               display: 'flex', 
//               flexDirection: 'column', 
//               gap: '10px', 
//               marginTop: '14px', 
//               maxHeight: '220px', 
//               overflowY: 'auto'
//             }}>
//               {Object.keys(summaryPreferences.extended_sections).map((title) => (
//                 <div 
//                   key={title}
//                   style={{
//                     border: '1px solid #e2e8f0',
//                     borderRadius: '8px',
//                     padding: '8px 12px',
//                     background: summaryPreferences.extended_sections[title] ? '#f1f5f9' : '#ffffff',
//                     cursor: 'pointer'
//                   }}
//                   onClick={() => {
//                     setSummaryPreferences(prev => ({
//                       ...prev, 
//                       extended_sections: { 
//                         ...prev.extended_sections, 
//                         [title]: !prev.extended_sections[title] 
//                       }
//                     }));
//                   }}
//                 >
//                   <CustomCheckbox
//                     label={title}
//                     checked={summaryPreferences.extended_sections[title]}
//                     onChange={() => {}}
//                   />
//                 </div>
//               ))}
//             </div>
//           </details>
//         )}

//         <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
//           <button onClick={handleRegenerateSummary} className="btn btn-secondary">
//             <RefreshCw size={16} style={{ marginRight: '8px' }} />
//             Regenerate from Selected
//           </button>
//         </div>
//       </section>

//       <section className="card">
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
//           <h3 style={{ fontWeight: 600, fontSize: "1.25rem" }}>Meeting Summary</h3>
//           <div style={{ display: "flex", gap: "12px" }}>
//             <button onClick={downloadSummaryFile} className="icon-btn" title="Download Summary">
//               <Download size={18}/>
//             </button>
//             <button 
//               onClick={() => setPreviewMode(prev => !prev)} 
//               className="icon-btn" 
//               title={previewMode ? "Switch to Edit" : "Switch to Preview"}
//             >
//               {previewMode ? "✏️" : "👁️"}
//             </button>
//           </div>
//         </div>
//         {previewMode ? (
//           <div className="summary-view">
//             <ReactMarkdown
//               remarkPlugins={[remarkGfm]}
//               components={{
//                 h2: ({ node, ...props }) => {
//                   const text = props.children[0];
//                   let bg = "#475569";
//                   if (typeof text === 'string') {
//                       if (text.includes("Overview")) bg = "#2563eb";
//                       else if (text.includes("Action Items")) bg = "#16a34a";
//                       else if (text.includes("Keywords")) bg = "#f59e0b";
//                       else if (text.includes("Key Points")) bg = "#9333ea";
//                   }
//                   return <h2 {...props} style={{ backgroundColor: bg, color: "white", fontSize: "1rem", fontWeight: 600, display: "inline-block", padding: "8px 16px", borderRadius: "8px", margin: "16px 0 12px 0" }} />;
//                 },
//               }}
//             >
//               {summary}
//             </ReactMarkdown>
//           </div>
//         ) : (
//           <textarea
//             ref={textAreaRef}
//             value={summary}
//             onChange={(e) => setSummary(e.target.value)}
//             style={{
//               width: "100%", minHeight: "250px", resize: "none", padding: "16px",
//               border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px",
//               lineHeight: 1.6, fontFamily: "inherit", background: "#f8fafc"
//             }}
//           />
//         )}
//         <div style={{ marginTop: "20px", display: "flex", gap: "16px", justifyContent: "space-between"  }}>
          
//           <button
//             onClick={handleSaveAll}
//             disabled={!dbId || saving}
//             aria-live="polite"
//             className="btn btn-primary"
//           >
//             {saving ? "Updating..." : "Update Summary"}
//           </button>
          
//           {/* Modified Next button to show file selection modal */}
//           <button
//             onClick={() => {
//               if (dbId) {
//                 setShowFileSelectionModal(true);
//               } else {
//                 alert("Meeting not saved in DB yet. Please wait.");
//               }
//             }}
//             disabled={!dbId}
//             className="btn btn-secondary"
//           >
//             Next
//           </button>
//         </div>
//       </section>

//       {/* Transcript section - keep existing code */}
//       <div style={{ marginBottom: "16px" }}>
//         <button onClick={() => setTranscriptOpen((open) => !open)} className="btn btn-ghost">
//           {transcriptOpen ? "Hide Transcript ▲" : "Show Transcript ▼"}
//         </button>
//       </div>
//       <section style={{ maxHeight: transcriptOpen ? "500px" : "0", overflowY: 'auto', transition: "all 0.5s ease-in-out", padding: transcriptOpen ? '24px' : '0 24px' }} className={transcriptOpen ? 'card' : ''}>
//         {audioSrc && (
//           <div style={{ marginBottom: '24px' }}>
//             <h4 style={{marginTop: 0, marginBottom: '12px', fontSize: '1.1rem'}}>Listen to Recording</h4>
//             <audio controls src={audioSrc} style={{ width: '100%' }}>
//               Your browser does not support the audio element.
//             </audio>
//           </div>
//         )}
//         {meeting.sentences?.length ? (
//           meeting.sentences.map((s) => (
//             <p key={s.index} style={{ marginBottom: "16px", lineHeight: 1.7 }}>
//               <b style={{ color: "#4f46e5", display: 'block', marginBottom: '2px' }}>{s.speaker_name ?? "Speaker"}</b> {s.text}
//             </p>
//           ))
//         ) : (
//           <div style={{ padding: "24px", textAlign: "center", fontStyle: "italic", color: '#64748b' }}>
//             Transcript not available
//           </div>
//         )}
//       </section>

//       {/* Add the File Selection Modal */}
//       <FileSelectionModal
//         isOpen={showFileSelectionModal}
//         onClose={() => setShowFileSelectionModal(false)}
//         onConfirm={handleFileSelectionConfirm}
//       />

//       {/* CSS */}
//       <style>{`
//         .card { background-color: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0; margin-bottom: 32px; }
//         .btn { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 12px; padding: 12px 24px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
//         .btn-primary { background-color: #4f46e5; color: white; }
//         .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
//         .btn-secondary { background-color: #eef2ff; color: #4338ca; }
//         .btn-ghost { background-color: transparent; color: #4338ca; font-weight: 600; }
//         .icon-btn { background-color: #f1f5f9; border: 1px solid transparent; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
//         .icon-btn:hover { background-color: #e2e8f0; border-color: #cbd5e1; }
//         .summary-view { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 20px 20px 20px; font-size: 15px; line-height: 1.7; }
//       `}</style>
//     </div>
//   );
// }






import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, Save, RefreshCw, Check, Settings2, FileText, Calendar, Clock, Zap, Play, Headphones, Edit, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FileSelectionModal from './FileSelectionModal';

const API = import.meta.env.VITE_API_BASE_URL || "";

// Helper functions
function parseDate(value) {
  if (!value) return null;
  const n = typeof value === "number" ? value : Number(value) || null;
  return n ? new Date(n) : new Date(value);
}

function safeJsonParse(str) {
  if (typeof str !== 'string') {
    return str;
  }
  try {
    const trimmed = str.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return JSON.parse(str);
    }
  } catch (e) {
    console.warn("Failed to parse JSON string, returning as is:", str);
    return str;
  }
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

const CustomCheckbox = ({ label, checked, onChange, icon }) => (
  <label 
    onClick={onChange} 
    className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-all duration-300 group p-1"
  >
    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
      checked 
        ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400 shadow-lg shadow-blue-500/25' 
        : 'bg-slate-700/50 border-slate-600 group-hover:border-slate-500'
    }`}>
      {checked && (
        <Check size={12} className="text-white animate-in fade-in duration-200" strokeWidth={3} />
      )}
    </div>
    <div className="flex items-center gap-2">
      {icon && <span className="text-sm">{icon}</span>}
      <span className="text-sm font-medium group-hover:translate-x-0.5 transition-transform duration-300">
        {label}
      </span>
    </div>
  </label>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 p-4 md:p-6">
    <div className="container mx-auto max-w-7xl">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-32 bg-slate-800/30 backdrop-blur-md rounded-3xl border border-slate-700/20 animate-pulse" />
        
        {/* Tabs skeleton */}
        <div className="h-16 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/20 animate-pulse" />
        
        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-24 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/20 animate-pulse" />
          <div className="h-96 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/20 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const SectionCard = ({ children, className = "", ...props }) => (
  <div 
    className={`bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const ActionButton = ({ children, variant = "secondary", className = "", ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
    secondary: "bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/40 text-slate-200 hover:text-white",
    ghost: "bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const TabButton = ({ active, onClick, icon, children, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 relative ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
        : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white'
    }`}
  >
    <div className={`p-1 rounded-lg ${active ? 'bg-white/20' : 'bg-slate-600/50'}`}>
      {icon}
    </div>
    <span>{children}</span>
    {count && (
      <span className={`px-2 py-1 text-xs rounded-full ${
        active ? 'bg-white/20 text-white' : 'bg-slate-600/50 text-slate-400'
      }`}>
        {count}
      </span>
    )}
  </button>
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
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryPreferences, setSummaryPreferences] = useState(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [showFileSelectionModal, setShowFileSelectionModal] = useState(false);

  const textAreaRef = useRef(null);
  useAutosizeTextArea(textAreaRef, summary);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/external/meetings/${id}`)
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => { 
                try {
                    const errorJson = JSON.parse(text);
                    throw new Error(errorJson.message || 'An unknown error occurred.');
                } catch (e) {
                    throw new Error(text || 'An unknown server error occurred.');
                }
            });
        }
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
        setSummary(data.userEditedSummary);
      } else {
        let finalSummary = "";
        const summaryData = meetingData.summary;
        if (summaryData) {
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
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title}-summary.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  const handleFileSelectionConfirm = (selectedFileIds) => {
    setShowFileSelectionModal(false);
    if (dbId) {
      navigate(`/generate-files/${dbId}`, { 
        state: { 
          summary, 
          meetingId: id,
          selectedFiles: selectedFileIds
        } 
      });
    } else {
      alert("Meeting not saved in DB yet. Please wait.");
    }
  };
  
  if (loading || !summaryPreferences) return <LoadingSkeleton />;
  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-xl text-slate-300">Meeting not found</div>
        </div>
      </div>
    );
  }

  const d = parseDate(meeting.date);
  const audioSrc = meeting?.audio_url ? (meeting.audio_url.startsWith('http') ? meeting.audio_url : `${API}${meeting.audio_url}`) : null;

  console.log("Rendering MeetingDetail with data:", { audioSrc });
  return (
    <div className="min-h-screen  bg-gradient-to-br from-slate-900 via-blue-900/60 to-purple-900/70 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto relative z-10 max-w-7xl p-3 md:p-6 space-y-5">
        {/* Enhanced Header */}
        <SectionCard className="p-6 md:p-8 ">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <ActionButton
                variant="ghost"
                onClick={() => navigate(-1)}
                className="p-3 shrink-0"
              >
                <ArrowLeft size={20} />
              </ActionButton>
              
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-lg shrink-0 animate-pulse">
                  <FileText size={28} className="text-white" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                    {meeting.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-700/50 backdrop-blur-sm px-4 py-1 rounded-xl border border-slate-600/30 hover:bg-slate-700/70 transition-all duration-300">
                      <Calendar size={16} className="text-blue-400" />
                      <span className="text-slate-400 font-semibold text-sm">
                        {d ? d.toLocaleDateString(undefined, { 
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : "Date unavailable"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-700/50 backdrop-blur-sm px-4 py-1 rounded-xl border border-slate-600/30 hover:bg-slate-700/70 transition-all duration-300">
                      <Clock size={16} className="text-purple-400" />
                      <span className="text-slate-400 font-semibold text-sm">
                        {Math.round(meeting.duration)} min
                      </span>
                    </div>
                    
                    {audioSrc && (
                      <div className="flex items-center gap-2 bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-xl">
                        <Headphones size={16} className="text-green-400" />
                        <span className="text-green-300 font-medium text-sm">Audio Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions were here, now moved to the summary card */}
          </div>
        </SectionCard>

        {/* Tab Navigation */}
        <SectionCard className="p-2">
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'summary'}
              onClick={() => setActiveTab('summary')}
              icon={<FileText size={16} />}
            >
              Meeting Summary
            </TabButton>
            
            <TabButton
              active={activeTab === 'transcript'}
              onClick={() => setActiveTab('transcript')}
              icon={<Headphones size={16} />}
              count={meeting.sentences?.length || 0}
            >
              Transcript
            </TabButton>
          </div>
        </SectionCard>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Summary Settings - Horizontal Layout */}
            <SectionCard className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/30">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Settings2 size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Summary Settings</h3>
              </div>

              {/* Core Sections - Horizontal Grid */}
              <div className="mb-6">
                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  Core Sections
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'overview', label: 'Overview',  },
                    { key: 'action_items', label: 'Action Items',  },
                    { key: 'keywords', label: 'Keywords',  },
                    { key: 'bullet_gist', label: 'Key Points',  }
                  ].map(({ key, label, icon }) => (
                    <div 
                      key={key} 
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer group ${
                        summaryPreferences[key] 
                          ? 'border-blue-500/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 shadow-lg shadow-blue-500/10' 
                          : 'border-slate-700/40 bg-slate-700/20 hover:bg-slate-700/30 hover:border-slate-600/60'
                      }`}
                      onClick={() => setSummaryPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <CustomCheckbox
                        label={label}
                        checked={!!summaryPreferences[key]}
                        onChange={() => {}}
                        icon={icon}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Extended Sections */}
              {summaryPreferences.extended_sections && Object.keys(summaryPreferences.extended_sections).length > 0 && (
                <div className="border border-slate-700/40 rounded-2xl p-5 bg-slate-700/10 mb-6">
                  <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                    Extended Sections
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.keys(summaryPreferences.extended_sections).map((title) => (
                      <div 
                        key={title}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                          summaryPreferences.extended_sections[title]
                            ? 'border-purple-500/50 bg-purple-600/10'
                            : 'border-slate-700/40 bg-slate-700/10 hover:bg-slate-700/20 hover:border-slate-600/60'
                        }`}
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
                </div>
              )}

              <div className="flex gap-4">
                <ActionButton 
                  variant="primary"
                  onClick={handleRegenerateSummary}
                  className="flex-shrink-0"
                >
                  <RefreshCw size={16} />
                  Regenerate Summary
                </ActionButton>
              </div>
            </SectionCard>

            {/* Summary Content */}
            <SectionCard className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <FileText size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Meeting Summary</h3>
                </div>
                
                {/* MOVED BUTTONS START HERE */}
                <div className="flex items-center gap-2">
                  <ActionButton
                    variant="ghost"
                    onClick={downloadSummaryFile}
                    className="p-3"
                    title="Download Summary"
                  >
                    <Download size={18} />
                  </ActionButton>
                  
                  <ActionButton
                    variant="ghost"
                    onClick={() => setPreviewMode(prev => !prev)}
                    className="p-3"
                    title={previewMode ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                  >
                    {previewMode ? <Edit size={18} /> : <Eye size={18} />}
                  </ActionButton>
                </div>
                {/* MOVED BUTTONS END HERE */}

              </div>

              <div className="min-h-[500px]">
                {previewMode ? (
                  <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/40 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ node, ...props }) => {
                          const text = props.children[0];
                          let gradientClass = "from-slate-600 to-slate-700";
                          if (typeof text === 'string') {
                              if (text.includes("Overview")) gradientClass = "from-blue-600 to-blue-700";
                              else if (text.includes("Action Items")) gradientClass = "from-green-600 to-green-700";
                              else if (text.includes("Keywords")) gradientClass = "from-amber-600 to-orange-600";
                              else if (text.includes("Key Points")) gradientClass = "from-purple-600 to-purple-700";
                          }
                          return (
                            <h2 
                              {...props} 
                              className={`inline-block px-6 py-3 rounded-xl text-white text-sm font-bold mb-6 mt-8 first:mt-0 bg-gradient-to-r ${gradientClass} shadow-lg transform hover:scale-105 transition-transform duration-300`}
                            />
                          );
                        },
                        p: ({ node, ...props }) => <p {...props} className="text-slate-300 leading-relaxed mb-5 text-base" />,
                        ul: ({ node, ...props }) => <ul {...props} className="text-slate-300 list-disc list-inside mb-5 space-y-2 pl-2" />,
                        li: ({ node, ...props }) => <li {...props} className="text-slate-300 leading-relaxed" />
                      }}
                    >
                      {summary || "No summary content available. Please generate or edit the summary."}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      ref={textAreaRef}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full min-h-[500px] bg-slate-700/30 border border-slate-600/50 rounded-2xl p-6 text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm leading-relaxed placeholder:text-slate-500 transition-all duration-300"
                      placeholder="Start editing your meeting summary here..."
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg backdrop-blur-sm">
                      {summary.length} characters
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex  m-15 gap-10 mt-8 pt-6 border-t border-slate-700/30">
                <ActionButton
                  variant="primary"
                  onClick={handleSaveAll}
                  disabled={!dbId || saving}
                  className="flex-1"
                >
                  <Save size={18} />
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </ActionButton>
                
                <ActionButton
                  variant="secondary"
                  onClick={() => setShowFileSelectionModal(true)}
                  disabled={!dbId}
                  className="flex-1"
                >
                  <FileText size={18} />
                  Generate Files
                </ActionButton>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Transcript Tab Content */}
        {activeTab === 'transcript' && (
          <SectionCard className="p-6 md:p-8 animate-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
                  <Headphones size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Meeting Transcript</h3>
                {meeting.sentences?.length && (
                  <div className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                    {meeting.sentences.length} segments
                  </div>
                )}
              </div>
              
              {audioSrc && (
                <div className="flex items-center gap-2 bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-xl">
                  <Play size={14} className="text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Audio Ready</span>
                </div>
              )}
            </div>

            {/* Audio Player */}
            {audioSrc && (
              <div className="mb-8 p-6 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl border border-slate-700/40">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Meeting Recording
                </h4>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                  <audio 
                    controls 
                    src={audioSrc} 
                    className="w-full h-12 bg-slate-700 rounded-lg"
                    style={{
                      filter: 'sepia(1) hue-rotate(200deg) saturate(1.5) brightness(1.2)'
                    }}
                  >
                    <div className="text-slate-400 text-center py-4">
                      Your browser does not support the audio element.
                    </div>
                  </audio>
                </div>
              </div>
            )}
            
            {/* Transcript Content */}
            <div className="bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-2xl border border-slate-700/40 overflow-hidden">
              {meeting.sentences?.length ? (
                <div className="max-h-[600px]  overflow-y-auto custom-scrollbar">
                  <div className="p-2 ">
                    {meeting.sentences.map((s, index) => (
                      <div 
                        key={s.index || index} 
                        className="group hover:bg-slate-700/20 rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-slate-600/30"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0 mb-1">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform duration-300"></div>
                            <span className="text-blue-400 font-semibold text-sm bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/30">
                              {s.speaker_name ?? `Speaker ${index + 1}`}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed ml-7 text-base group-hover:text-slate-200 transition-colors duration-300">
                          {s.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 opacity-50">📝</div>
                  <div className="text-xl text-slate-400 mb-2">No Transcript Available</div>
                  <div className="text-sm text-slate-500">
                    The meeting transcript could not be loaded or is not available.
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* File Selection Modal */}
        <FileSelectionModal
          isOpen={showFileSelectionModal}
          onClose={() => setShowFileSelectionModal(false)}
          onConfirm={handleFileSelectionConfirm}
        />
      </div>

      <style>
  {`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(51, 65, 85, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #2563eb, #7c3aed);
    }
  `}
</style>
    </div>
  );
}