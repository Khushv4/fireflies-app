
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "";

export default function SavedMeetings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/meetings`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setList(data);
      } catch (err) {
        console.error("Failed loading saved meetings", err);
        setList([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#222",
      }}
    >
      <h2
        style={{
          marginBottom: 24,
          fontSize: "2rem",
          borderBottom: "2px solid #4a90e2",
          paddingBottom: 8,
          fontWeight: "700",
        }}
      >
        Saved Meetings
      </h2>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            fontSize: "1.2rem",
            marginTop: 50,
            color: "#555",
          }}
        >
          Loading...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {list.map((m) => (
            <Link
              to={`/meetings/${m.firefliesId}`}
              key={m.id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "#f5f7fa",
                  boxShadow: "0 4px 10px rgb(0 0 0 / 0.1)",
                  borderRadius: 12,
                  padding: 20,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgb(0 0 0 / 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 10px rgb(0 0 0 / 0.1)";
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    marginBottom: 8,
                    color: "#2c3e50",
                  }}
                >
                  {m.title || "Untitled Meeting"}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                    marginBottom: 12,
                    color: "#7f8c8d",
                  }}
                >
                  {m.meetingDate ? new Date(m.meetingDate).toLocaleString() : "Date not available"}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "#34495e",
                    flexGrow: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {m.summary?.length > 200
                    ? m.summary.substring(0, 200) + "..."
                    : m.summary || "No summary available."}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}