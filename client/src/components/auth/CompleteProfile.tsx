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
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/auth/set-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to set username";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response is not JSON
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store new token
      setAuthToken(data.token);

      // Redirect to home
      navigate("/");
    } catch (err: any) {
      console.error("Set username error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="smoke-card shadow-lg shadow-gray-500 p-8 relative smoke-effect">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-olive-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-olive-forest">
              <User className="text-olive-gold" size={32} />
            </div>
            <h2 className="text-3xl font-bold glow-text mb-2">
              Choose Your Username
            </h2>
            <p className="text-matcha-primary font-semibold">
              Complete your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-moss-accent mb-2">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-moss-accent"
                  size={20}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a unique username"
                  required
                  minLength={3}
                  className="alien-input w-full pl-10 py-1 rounded-lg border border-matcha-primary"
                />
              </div>
              <p className="text-xs text-moss-accent mt-1">
                At least 3 characters, letters and numbers only
              </p>
            </div>

            {error && (
              <div className="bg-red-800 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 3}
              className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
