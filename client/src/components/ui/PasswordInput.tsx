import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter password",
  name,
  id,
  className = ""
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setStrength(calculateStrength(e.target.value));
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const event = {
      target: { name, value: generated }
    } as React.ChangeEvent<HTMLInputElement>;

    handleInputChange(event);
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 h-6">
        {value ? (
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${getStrengthColor(strength)}`} />
            <span className={`text-xs font-medium transition-colors duration-300 ${strength < 2 ? 'text-red-500' : strength < 3 ? 'text-yellow-500' : 'text-green-500'}`}>
              {getStrengthLabel(strength)}
            </span>
          </div>
        ) : <div />}

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