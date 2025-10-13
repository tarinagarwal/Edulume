import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, UserPlus, LogIn, Mail, Shield } from "lucide-react";
import { login, signup, sendOTP } from "../../utils/api";

interface AuthFormProps {
  onAuthChange: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTPField, setShowOTPField] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setOtpLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await sendOTP(email, "signup");
      setSuccess(response.message);
      setOtpSent(true);
      setShowOTPField(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const authResponse = isLogin
        ? await login(usernameOrEmail, password)
        : await signup(username, email, password, otp);

      console.log("✅ Authentication successful:", authResponse.user?.username);

      // Set success message for signup
      if (!isLogin) {
        setSuccess("Account created successfully! Welcome to Edulume!");
      }

      // Notify parent component to re-check auth status
      onAuthChange();

      // Redirect after successful authentication
      setTimeout(
        () => {
          navigate("/");
        },
        isLogin ? 100 : 1000
      ); // Shorter delay for signup
    } catch (err: any) {
      console.error("❌ Authentication failed:", err);
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="smoke-card p-8 relative smoke-effect">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-alien-glow">
              {isLogin ? (
                <LogIn className="text-royal-black" size={32} />
              ) : (
                <UserPlus className="text-royal-black" size={32} />
              )}
            </div>
            <h2 className="text-3xl font-alien font-bold glow-text">
              {isLogin ? "Access Vault" : "Join Vault"}
            </h2>
            <p className="text-gray-400 mt-2">
              {isLogin ? "Enter your credentials" : "Create your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isLogin ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="alien-input w-full pl-10"
                    placeholder="Enter username or email"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
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
                      className="alien-input w-full pl-10"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="alien-input w-full pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {!isLogin && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading || !email}
                      className="mt-2 text-sm text-alien-green hover:text-alien-green-dark transition-colors duration-300 disabled:opacity-50"
                    >
                      {otpLoading ? "Sending..." : "Send Verification Code"}
                    </button>
                  )}
                </div>

                {showOTPField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <Shield
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="alien-input w-full pl-10"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                      className="mt-2 text-sm text-gray-400 hover:text-alien-green transition-colors duration-300"
                    >
                      Resend Code
                    </button>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="alien-input w-full pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-smoke-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-smoke-gray text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={`${import.meta.env.VITE_API_URL || "/api"}/auth/google`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-smoke-light rounded-lg text-white hover:bg-smoke-light transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign {isLogin ? "in" : "up"} with Google
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-alien-green hover:text-alien-green-dark transition-colors duration-300"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-gray-400 hover:text-alien-green transition-colors duration-300"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
