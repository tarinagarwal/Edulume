import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

import { passwordSchema } from '../../schemas/auth.schema';

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
  const [errors, setErrors] = useState<string[]>([]); // New state for Zod errors


  const calculateVisualStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };


  useEffect(() => {
    // Run the text against the shared schema
    const result = passwordSchema.safeParse(value);

    if (!result.success) {
      // If invalid, extract the specific error messages
      const errorMessages = result.error.issues.map((issue) => issue.message);
      setErrors(errorMessages);
    } else {
      // If valid, clear errors
      setErrors([]);
    }

    // Update the visual strength meter
    setStrength(calculateVisualStrength(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    // Validation is handled by the useEffect above
  };

  const generatePassword = () => {
    // 1. Define sets
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const special = "!@#$%^&*";
    const allChars = lower + upper + nums + special;

    let generated = "";

    // 2. GUARANTEE one of each required type
    generated += lower[Math.floor(Math.random() * lower.length)];
    generated += upper[Math.floor(Math.random() * upper.length)];
    generated += nums[Math.floor(Math.random() * nums.length)];
    generated += special[Math.floor(Math.random() * special.length)];

    // 3. Fill the rest (aiming for length 12-14)
    for (let i = generated.length; i < 14; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 4. Shuffle the result so the pattern isn't predictable
    generated = generated.split('').sort(() => 0.5 - Math.random()).join('');

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
          // Add red border if there are validation errors
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.length > 0 && value.length > 0 ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          } ${className}`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex justify-between items-start mt-2 min-h-[1.5rem]">
        {value ? (
          <div className="flex flex-col gap-1">
             {/* Visual Bar */}
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-16 rounded-full transition-colors duration-300 ${getStrengthColor(strength)}`} />
              <span className={`text-xs font-medium transition-colors duration-300 ${strength < 2 ? 'text-red-500' : strength < 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                {getStrengthLabel(strength)}
              </span>
            </div>
            
            {/* Zod Error Messages Displayed Here */}
            {errors.length > 0 && (
              <ul className="text-red-500 text-[10px] list-disc pl-3 leading-tight">
                {errors.slice(0, 3).map((err, idx) => ( // Limit to showing first 3 errors to save space
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        ) : <div />}

        <button
          type="button"
          onClick={generatePassword}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto whitespace-nowrap"
        >
          <KeyRound size={14} />
          Suggest Strong Password
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;