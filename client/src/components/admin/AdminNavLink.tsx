import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";

interface AdminNavLinkProps {
  authenticated: boolean | null;
  onMobileMenuClose?: () => void;
  isMobile?: boolean;
  isDropdown?: boolean;
}

const AdminNavLink: React.FC<AdminNavLinkProps> = ({
  authenticated,
  onMobileMenuClose,
  isMobile = false,
  isDropdown = false,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!authenticated) {
        console.log("🔍 AdminNavLink: Not authenticated");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.log("🔍 AdminNavLink: No token found");
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log("🔍 AdminNavLink: Checking admin access via profile...");
        const apiUrl = import.meta.env.VITE_API_URL || "/api";
        const response = await fetch(`${apiUrl}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("🔍 AdminNavLink: Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 AdminNavLink: Profile data:", {
            email: data.user?.email,
            isAdmin: data.user?.is_admin,
          });
          setIsAdmin(data.user?.is_admin || false);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log("❌ AdminNavLink: Profile fetch failed -", errorData);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("❌ AdminNavLink: Error checking admin access:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [authenticated]);

  if (loading || !isAdmin) {
    return null;
  }

  const isActive = location.pathname === "/admin";

  if (isDropdown) {
    return (
      <Link
        to="/admin"
        onClick={onMobileMenuClose}
        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-smoke-light hover:text-alien-green transition-colors duration-200"
      >
        <Shield size={16} className="mr-3" />
        Admin Panel
      </Link>
    );
  }

  if (isMobile) {
    return (
      <Link
        to="/admin"
        onClick={onMobileMenuClose}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
          isActive
            ? "text-alien-green shadow-alien-glow bg-alien-green/10"
            : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
        }`}
      >
        <Shield size={20} />
        <span>Admin Panel</span>
      </Link>
    );
  }

  return (
    <Link
      to="/admin"
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
        isActive
          ? "text-alien-green shadow-alien-glow"
          : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
      }`}
    >
      <Shield size={16} />
      <span>Admin</span>
    </Link>
  );
};

export default AdminNavLink;
