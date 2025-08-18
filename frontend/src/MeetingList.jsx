import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "";

function parseDate(value){
  if (!value) return null;
  const n = typeof value === "number" ? value : (Number(value) || null);
  return n ? new Date(n) : new Date(value);
}

function formatDate(d){
  if(!d) return "";
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatTime(d){
  if(!d) return "";
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds){
  if(seconds == null) return "";
  const s = Math.round(Number(seconds));
  if(s < 60) return `${s} min`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

export default function MeetingList(){
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function load(){
    setLoading(true);
    setError(null);
    try{
      const res = await fetch(`${API}/api/external/meetings`);
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMeetings(data);
    }catch(err){
      console.error(err);
      setError("Failed to load meetings. Please try again.");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=> { load(); }, []);

  const LoadingSkeleton = () => (
    <div style={{ padding: '24px' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          height: '60px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '12px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          background: 'linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%)',
          backgroundSize: '200% 100%',
          animationName: 'shimmer'
        }} />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0',
              letterSpacing: '-0.025em'
            }}>
              Meetings
            </h1>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '16px'
            }}>
              Manage and view your meeting recordings
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#e2e8f0' : '#3b82f6',
              color: loading ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
              transform: loading ? 'none' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 25px -8px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.1)';
              }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>!</div>
            <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
              {error}
            </span>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Meetings Table */}
        {!loading && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '50%'
                    }}>
                      Meeting Title
                    </th>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '20%'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '15%'
                    }}>
                      Time
                    </th>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '15%'
                    }}>
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m, index) => {
                    const d = parseDate(m.date);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => navigate(`/meetings/${m.id}`)}
                        style={{
                          cursor: 'pointer',
                          borderTop: index > 0 ? '1px solid #f1f5f9' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <td style={{
                          padding: '20px 24px',
                          fontSize: '15px',
                          fontWeight: '500',
                          color: '#1e293b'
                        }}>
                          {m.title || 'Untitled Meeting'}
                        </td>
                        <td style={{
                          padding: '20px 24px',
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          {formatDate(d)}
                        </td>
                        <td style={{
                          padding: '20px 24px',
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          {formatTime(d)}
                        </td>
                        <td style={{
                          padding: '20px 24px',
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {formatDuration(m.duration)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && meetings.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f1f5f9',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '24px'
            }}>
              📅
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              No meetings found
            </h3>
            <p style={{
              color: '#64748b',
              margin: '0 0 24px 0',
              fontSize: '16px'
            }}>
              Your meetings will appear here once they're available.
            </p>
            <button
              onClick={load}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}