"use client"

import type React from "react";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { TestData } from "../courses/TestPageStandalone";

const TestTimeRemaining : React.FC<{
  answeredQuestions: number;
  testData: TestData;
  handleSubmitTest: (isSubmitted: boolean) => void;
}> = ({ answeredQuestions, testData, handleSubmitTest }) => {
  const [timeRemaining, settimeRemaining] = useState(() => testData.timeLimit * 60);
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const TestCountdown = setInterval(() => {
      settimeRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(TestCountdown);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmitTest(true);
    }
  }, [timeRemaining, handleSubmitTest]);
  return (
    <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
      <div
        className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${timeRemaining < 600
          ? "bg-red-600/20 text-red-400"
          : "bg-alien-green/20 text-alien-green"
          }`}
      >
        <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="font-mono font-semibold text-xs sm:text-sm">
          {formatTime(timeRemaining)}
        </span>
      </div>

      <div className="hidden xs:flex items-center space-x-2">
        <span className="text-xs sm:text-sm text-gray-400">
          Progress:
        </span>
        <span className="text-xs sm:text-sm font-semibold">
          {answeredQuestions}/{testData.questions.length}
        </span>
      </div>
    </div>
  );
};

export default TestTimeRemaining ;