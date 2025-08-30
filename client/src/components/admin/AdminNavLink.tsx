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
