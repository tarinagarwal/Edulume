import React from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: "green" | "blue" | "yellow" | "red";
}

export function ProgressBar({
  progress,
  className = "",
  showPercentage = true,
  color = "green",
}: ProgressBarProps) {
  const colorClasses = {
    green: "bg-alien-green",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300">Processing...</span>
        {showPercentage && (
          <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-smoke-light rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
