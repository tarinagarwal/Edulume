import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, ArrowRight } from "lucide-react";
import { setAuthToken } from "../../utils/auth";

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/auth");
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = searchParams.get("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch("/api/auth/set-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set username");
      }

      // Store new token
      setAuthToken(data.token);

      // Redirect to home
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-royal-black">
      <div className="max-w-md w-full">
        <div className="bg-smoke-gray border border-smoke-light rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-royal-black" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Choose Your Username
            </h2>
            <p className="text-gray-400">
              Complete your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
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
                  placeholder="Choose a unique username"
                  required
                  minLength={3}
                  className="w-full pl-10 pr-4 py-3 bg-smoke-light border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green transition-colors"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                At least 3 characters, letters and numbers only
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full bg-alien-green hover:bg-alien-green/80 text-royal-black font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Setting up..."
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
