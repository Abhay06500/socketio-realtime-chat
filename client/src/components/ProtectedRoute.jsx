import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protect routes that require user authentication
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show a loading state while checking the user session
  if (loading) {
    return <div className="screen-center">Checking session...</div>;
  }

  // Redirect unauthenticated users to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected content for authenticated users
  return children;
}