import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, UserPlus, LogIn, Mail, Shield } from "lucide-react";
import { login, signup, sendOTP, verifyOTP } from "../../utils/api";

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
