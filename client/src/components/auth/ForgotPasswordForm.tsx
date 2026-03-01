import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Shield, Lock, ArrowLeft } from "lucide-react";
import { forgotPassword, resetPassword } from "../../utils/api";
import toast from "react-hot-toast";

const ForgotPasswordForm: React.FC = () => {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
      setStep("otp");
    } catch (err: any) {
      toast.error(err.userMessage || err.response?.data?.error || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(email, otp, newPassword);
      toast.success(response.message);
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      toast.error(err.userMessage || err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleSendOTP} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
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
            placeholder="Enter your email address"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>
    </form>
  );

  const renderOTPStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setStep("password");
      }}
      className="space-y-6"
    >
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
        <p className="text-sm text-gray-400 mt-2">
          We sent a verification code to {email}
        </p>
      </div>

      <button
        type="submit"
        disabled={!otp || otp.length !== 6}
        className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Verify Code
      </button>

      <button
        type="button"
        onClick={() =>
          handleSendOTP({ preventDefault: () => { } } as React.FormEvent)
        }
        disabled={loading}
        className="w-full text-sm text-gray-400 hover:text-alien-green transition-colors duration-300"
      >
        Resend Code
      </button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="alien-input w-full pl-10"
            placeholder="Enter new password"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="alien-input w-full pl-10"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Reset Password";
      case "otp":
        return "Verify Code";
      case "password":
        return "New Password";
      default:
        return "Reset Password";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Enter your email to receive a reset code";
      case "otp":
        return "Enter the verification code sent to your email";
      case "password":
        return "Create a new secure password";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="smoke-card p-8 relative smoke-effect">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-alien-glow">
              <Lock className="text-royal-black" size={32} />
            </div>
            <h2 className="text-3xl font-alien font-bold glow-text">
              {getStepTitle()}
            </h2>
            <p className="text-gray-400 mt-2">{getStepDescription()}</p>
          </div>

          {step === "email" && renderEmailStep()}
          {step === "otp" && renderOTPStep()}
          {step === "password" && renderPasswordStep()}

          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="flex items-center justify-center text-alien-green hover:text-alien-green-dark transition-colors duration-300"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
