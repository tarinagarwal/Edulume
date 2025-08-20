import React, { useState, useRef, useEffect } from "react";
import { searchUsers } from "../utils/api";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  replyToUsername?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  rows = 4,
  replyToUsername,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyToUsername && !value.includes(`@${replyToUsername}`)) {
      onChange(`@${replyToUsername} `);
    }
  }, [replyToUsername, value, onChange]);

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    onChange(newValue);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionStart(cursorPosition - mentionMatch[0].length);

      if (query.length >= 1) {
        try {
          const users = await searchUsers(query);
          setSuggestions(users);
          setShowSuggestions(users.length > 0);
          setSelectedIndex(0);
        } catch (error) {
          console.error("Failed to search users:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
        case "Escape":
          setShowSuggestions(false);
          break;
      }
    }
  };

  const insertMention = (username: string) => {
    if (mentionStart === -1) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeMention = value.substring(0, mentionStart);
    const textAfterCursor = value.substring(cursorPosition);

    const newValue = `${textBeforeMention}@${username} ${textAfterCursor}`;
    onChange(newValue);

    setShowSuggestions(false);
    setSuggestions([]);

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPosition = mentionStart + username.length + 2;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  const getSuggestionPosition = () => {
    if (!textareaRef.current || mentionStart === -1) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textBeforeMention = value.substring(0, mentionStart);

    // Create a temporary div to measure text dimensions
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.whiteSpace = "pre-wrap";
    tempDiv.style.font = window.getComputedStyle(textarea).font;
    tempDiv.style.width = `${textarea.clientWidth}px`;
    tempDiv.textContent = textBeforeMention;

    document.body.appendChild(tempDiv);
    const rect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    const textareaRect = textarea.getBoundingClientRect();

    return {
      top: rect.height + 25,
      left: rect.width % textarea.clientWidth,
    };
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg max-h-40 overflow-y-auto"
          style={getSuggestionPosition()}
        >
          {suggestions.map((username, index) => (
            <button
              key={username}
              type="button"
              onClick={() => insertMention(username)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors duration-200 ${
                index === selectedIndex
                  ? "bg-alien-green/20 text-alien-green"
                  : "text-gray-300 hover:bg-smoke-light"
              }`}
            >
              @{username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
