import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import CalendarView from "./components/CalendarView";
import TodoList from "./components/TodoList";
import Footer from './components/Footer';
import "./styles/index.css";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load user preferences from localStorage on initial load
  useEffect(() => {
    const savedLargeText = localStorage.getItem("largeText") === "true";
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    
    setLargeText(savedLargeText);
    setDarkMode(savedDarkMode);
    
    // Apply saved preferences
    if (savedLargeText) {
      document.body.classList.add("large-text");
    }
    
    if (savedDarkMode) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  // Handle large text toggle
  const toggleLargeText = () => {
    const newValue = !largeText;
    setLargeText(newValue);
    
    if (newValue) {
      document.body.classList.add("large-text");
    } else {
      document.body.classList.remove("large-text");
    }
    
    localStorage.setItem("largeText", newValue);
  };

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    
    if (newValue) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    
    localStorage.setItem("darkMode", newValue);
  };

  // Handle print calendar
  const printCalendar = () => {
    window.print();
  };

  // Handle login
  const login = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Failed to login. Please check your email and password.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`app ${darkMode ? 'dark-mode' : ''} ${largeText ? 'large-text' : ''}`}>
        <div className="login-container">
          <h2>Welcome Back</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={login}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                id="password"
                placeholder="Enter your password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
          
          <div className="accessibility-controls">
            <button 
              onClick={toggleLargeText} 
              className={`accessibility-btn ${largeText ? 'active' : ''}`}
              aria-pressed={largeText}
            >
              {largeText ? "Normal Text" : "Large Text"}
            </button>
            <button 
              onClick={toggleDarkMode} 
              className={`accessibility-btn ${darkMode ? 'active' : ''}`}
              aria-pressed={darkMode}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''} ${largeText ? 'large-text' : ''}`}>
      <Router>
        <nav>
          <div className="nav-links">
            <NavLink to="/" end>Calendar</NavLink>
            <NavLink to="/todos">Task Manager</NavLink>
          </div>
          
          <div className="nav-controls">
            <div className="accessibility-controls">
              <button 
                onClick={toggleLargeText} 
                className={`accessibility-btn ${largeText ? 'active' : ''}`}
                aria-label={largeText ? "Switch to normal text size" : "Switch to large text size"}
                title={largeText ? "Normal Text" : "Large Text"}
              >
                <span className="accessibility-icon">Aa</span>
              </button>
              
              <button 
                onClick={toggleDarkMode} 
                className={`accessibility-btn ${darkMode ? 'active' : ''}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                <span className="accessibility-icon">
                  {darkMode ? "☀️" : "🌙"}
                </span>
              </button>
              
              <button 
                onClick={printCalendar} 
                className="accessibility-btn"
                aria-label="Print current view"
                title="Print"
              >
                <span className="accessibility-icon">🖨️</span>
              </button>
            </div>
            
            <button 
              onClick={() => signOut(auth)} 
              className="logout-btn"
            >
              Log Out
            </button>
          </div>
        </nav>
        
        <main>
          <Routes>
            <Route path="/" element={<CalendarView user={user} />} />
            <Route path="/todos" element={<TodoList user={user} />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;