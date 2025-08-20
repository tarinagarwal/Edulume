import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthForm from "./components/AuthForm";
import PDFsPage from "./components/PDFsPage";
import EbooksPage from "./components/EbooksPage";
import UploadForm from "./components/UploadForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import NotFoundPage from "./components/NotFoundPage";
import DiscussionsPage from "./components/DiscussionsPage";
import CreateDiscussionPage from "./components/CreateDiscussionPage";
import DiscussionDetailPage from "./components/DiscussionDetailPage";
import { isAuthenticated } from "./utils/auth";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/auth" />;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return !isAuthenticated() ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-royal-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <AuthRoute>
                <AuthForm />
              </AuthRoute>
            }
          />
          <Route path="/pdfs" element={<PDFsPage />} />
          <Route path="/ebooks" element={<EbooksPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
          <Route
            path="/discussions/new"
            element={
              <ProtectedRoute>
                <CreateDiscussionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
