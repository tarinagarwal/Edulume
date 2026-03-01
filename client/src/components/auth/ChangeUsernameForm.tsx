import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, ArrowLeft } from "lucide-react";
import { changeUsername } from "../../utils/api";
import toast from "react-hot-toast";

export default function ChangeUsernameForm() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await changeUsername(username);
      toast.success("Username changed successfully!");
      setTimeout(() => {
        navigate("/");
        window.location.reload(); // Refresh to update navbar
      }, 1500);
    } catch (err: any) {
      toast.error(err.userMessage || err.response?.data?.error || "Failed to change username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="smoke-card p-8 relative smoke-effect">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-alien-green transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-alien-glow">
              <User className="text-royal-black" size={32} />
            </div>
            <h2 className="text-3xl font-alien font-bold glow-text">
              Change Username
            </h2>
            <p className="text-gray-400 mt-2">
              Choose a new username for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="alien-input w-full pl-10"
                  placeholder="Enter new username"
                  required
                  minLength={3}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                At least 3 characters, letters and numbers only
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing..." : "Change Username"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
