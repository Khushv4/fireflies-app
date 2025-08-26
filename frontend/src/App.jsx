
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import MeetingList from "./MeetingList";
import MeetingDetail from "./MeetingDetail";
import SavedMeetings from "./SavedMeetings";
import GenerateFiles from "./GenerateFiles";
import ProjectPlan from "./ProjectPlan";
import Backlog from "./Backlog";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import LoaderTest from "./LoaderTest";
import NotFound404 from "./NotFound404";

// Enhanced Logo Component
const EnhancedLogo = () => {
  const [displayText, setDisplayText] = useState("");
  const [showTagline, setShowTagline] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const intervalRef = useRef(null);

  const fullText = "Projectra";
  const tagline = "Turning Discussions into Actionable Plans";
  
  // Generate particles data
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 5 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: Math.random() * 2 + 2,
    color: `hsl(${Math.random() * 60 + 200}, 70%, 65%)`,
  }));

  useEffect(() => {
    let currentIndex = 0;
    intervalRef.current = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalRef.current);
        setTimeout(() => {
          setShowTagline(true);
          setAnimationComplete(true);
        }, 300);
      }
    }, 120);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="brand h-13" tabIndex={-1}>
      <div className="logo-container">
        <div className="logo-icon">
          <svg 
            viewBox="0 0 100 100" 
            className={`logo-svg ${animationComplete ? 'pulse' : ''}`}
          >
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#3f51b5" 
              strokeWidth="3"
              className="logo-circle"
            />
            <path 
              d="M30,40 L70,40 L70,60 L30,60 Z M40,30 L40,70 M60,30 L60,70" 
              stroke="#2196f3" 
              strokeWidth="3" 
              fill="none"
              className="logo-inner"
            />
          </svg>
        </div>
        
        <div className="text-container">
          <h1 className="enhanced-logo">
            {displayText}
            <span className="cursor">|</span>
            {particles.map(particle => (
              <span 
                key={particle.id}
                className="logo-particle"
                style={{
                  top: `${particle.y}%`,
                  left: `${particle.x}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </h1>
          
          {showTagline && (
            <div className="tagline-container">
              <small className="enhanced-tagline">{tagline}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <header className="app-header" role="banner">
          <EnhancedLogo />
          
          <nav className="nav" role="navigation" aria-label="Primary navigation">
            <NavLink 
              to="/" 
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} 
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/meetings" 
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Meetings
            </NavLink>
            <NavLink 
              to="/saved" 
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Saved
            </NavLink>
          </nav>
        </header>

        <main className="app-main" role="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meetings" element={<MeetingList />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
            <Route path="/saved" element={<SavedMeetings />} />
            <Route path="/generate-files/:dbId" element={<GenerateFiles />} />
            <Route path="/project-plan/:dbId" element={<ProjectPlan />} />
            <Route path="/meeting/:dbId/backlog" element={<Backlog />} />
            <Route path="/loading-test" element={<LoaderTest />} />
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}