import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

// Define the shape of props this component expects.
// This ensures TypeScript warns us if we forget to pass required data.
interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
}

/**
 * Reusable Password Input Component
 *
 */
const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter password",
  name,
  id,
  className = ""
}) => {
  // State to toggle between "text" (visible) and "password" (masked) types
  const [showPassword, setShowPassword] = useState(false);
  // State to track password strength score (0 to 4)
  const [strength, setStrength] = useState(0);

 
  const calculateStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;

    // Criteria 1: Length check (longer than 8 chars)
    if (password.length > 8) score++;
    // Criteria 2: Contains at least one uppercase letter
    if (/[A-Z]/.test(password)) score++;
    // Criteria 3: Contains at least one number
    if (/[0-9]/.test(password)) score++;
    // Criteria 4: Contains special characters (symbols)
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

 
  // We need this to update the local strength meter alongside the parent's state.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e); 
    setStrength(calculateStrength(e.target.value)); 
  };

  /**
   * Generates a secure random 12-character password.
   * 
   */
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

  
    // This allows us to reuse the existing `handleInputChange` function.
    const event = {
      target: { name, value: generated }
    } as React.ChangeEvent<HTMLInputElement>;

    handleInputChange(event);
  };

  // Helper to determine the color of the strength bar based on score
  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';    // Weak
    if (score < 3) return 'bg-yellow-500'; // Fair/Good
    return 'bg-green-500';                 // Strong
  };

  // Helper to get the text label for the strength score
  const getStrengthLabel = (score: number) => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    return labels[score] || 'Weak';
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          id={id}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          // Combine base styles with any custom className passed via props
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        
        {/* Visibility Toggle Button (Eye Icon) */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Strength Meter & Generator Actions */}
      <div className="flex justify-between items-center mt-2 h-6">
        {/* Only show strength meter if the user has typed something */}
        {value ? (
          <div className="flex items-center gap-2">
            {/* Visual Progress Bar */}
            <div className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${getStrengthColor(strength)}`} />
            <span className={`text-xs font-medium transition-colors duration-300 ${strength < 2 ? 'text-red-500' : strength < 3 ? 'text-yellow-500' : 'text-green-500'}`}>
              {getStrengthLabel(strength)}
            </span>
          </div>
        ) : <div />} {/* Empty div to maintain spacing when hidden */}

        {/* Suggest Password Button */}
        <button
          type="button"
          onClick={generatePassword}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
        >
          <KeyRound size={14} />
          Suggest Strong Password
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;