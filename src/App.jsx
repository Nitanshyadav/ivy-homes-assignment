import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "./api";
import Listings from "./Listings";
import Projects from "./Projects";

function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);
      setLoggedIn(true);
      navigate("/");
    } else {
      setError("Login failed. Check credentials.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login to Ivy Homes</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          type="submit"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!sessionStorage.getItem("access_token"),
  );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="font-bold text-xl text-blue-600">Ivy Homes</div>
          <div className="space-x-4">
            {loggedIn ? (
              <>
                <Link to="/" className="text-gray-600 hover:text-blue-600">
                  Listings
                </Link>
                <Link
                  to="/projects"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Projects
                </Link>
                <button
                  onClick={() => {
                    sessionStorage.clear();
                    setLoggedIn(false);
                  }}
                  className="text-red-600 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-blue-600 font-medium">
                Login
              </Link>
            )}
          </div>
        </nav>

        <main className="flex-grow p-6">
          <Routes>
            <Route
              path="/login"
              element={
                !loggedIn ? (
                  <Login setLoggedIn={setLoggedIn} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/"
              element={loggedIn ? <Listings /> : <Navigate to="/login" />}
            />
            <Route
              path="/projects"
              element={loggedIn ? <Projects /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>

        <footer className="p-4 text-center text-sm text-gray-500 bg-white border-t">
          Data certified by 100acres · 100A-498FC3
        </footer>
      </div>
    </Router>
  );
}
