import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  height?: string;
  className?: string;
  readOnly?: boolean;
  onLanguageChange?: (language: string) => void;
  showLanguageSelector?: boolean;
}

// Available programming languages
const AVAILABLE_LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" },
  { id: "csharp", name: "C#" },
  { id: "sql", name: "SQL" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "go", name: "Go" },
  { id: "rust", name: "Rust" },
  { id: "php", name: "PHP" },
  { id: "ruby", name: "Ruby" },
  { id: "swift", name: "Swift" },
  { id: "kotlin", name: "Kotlin" },
];

const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  onChange,
  language = "javascript",
  placeholder = "Write your code here...",
  height = "300px",
  className = "",
  readOnly = false,
  onLanguageChange,
  showLanguageSelector = false,
}) => {
  const editorRef = useRef<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Use built-in dark theme
    monaco.editor.setTheme("vs-dark");

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
      },
      wordWrap: "on",
      folding: true,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: "full",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Update current language when prop changes
  React.useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  return (
    <div className={`monaco-editor-container ${className}`}>
      {showLanguageSelector && (
        <div className="flex items-center justify-between mb-2 p-2 bg-gray-800 rounded-t-lg border border-smoke-light border-b-0">
          <span className="text-sm text-gray-300">Programming Language:</span>
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600 focus:border-alien-green focus:outline-none"
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="border border-smoke-light rounded-lg overflow-hidden">
        <Editor
          height={height}
          language={currentLanguage}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-gray-400">Loading editor...</div>
            </div>
          }
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            mouseWheelZoom: true,
            contextmenu: true,
            copyWithSyntaxHighlighting: true,
            emptySelectionClipboard: false,
            links: false,
            multiCursorModifier: "ctrlCmd",
            renderControlCharacters: false,
            renderValidationDecorations: "on",
            renderWhitespace: "selection",
            rulers: [],
            showFoldingControls: "always",
            smoothScrolling: true,
            suggestOnTriggerCharacters: true,
            tabCompletion: "on",
            unusualLineTerminators: "prompt",
            wordBasedSuggestions: "allDocuments",
            wordSeparators: "`~!@#$%^&*()-=+[{]}\\|;:'\",./<>?",
            wordWrapBreakAfterCharacters: "\t})]?|/&.,;¿!¡¿@¡。。",
            wordWrapBreakBeforeCharacters: "[({¿¡。",
            wrappingIndent: "indent",
            placeholder: placeholder,
          }}
        />
      </div>
    </div>
  );
};

export default MonacoCodeEditor;
