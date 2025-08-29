import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
  authenticated: boolean | null;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, authenticated }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!authenticated) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch("/api/feedback/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setIsAdmin(response.ok);
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [authenticated]);

  if (loading || authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="smoke-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-alien font-bold mb-4 text-red-400">
            Access Denied
          </h2>
          <p className="text-gray-300 mb-6">
            You don't have permission to access the admin panel. Only authorized
            administrators can view this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="alien-button px-6 py-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
