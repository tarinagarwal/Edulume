import React, { useCallback, useState } from "react";

const DropZone: React.FC<{ onFiles?: (files: FileList | null) => void; onDropFiles?: (files: FileList | null) => void }> = ({ onFiles, onDropFiles }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const dt = e.dataTransfer;
      // Give parent a chance to show actions instead of auto-uploading
      if (onDropFiles) onDropFiles(dt.files);
      else if (onFiles) onFiles(dt.files);
    },
    [onFiles, onDropFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`w-full p-6 rounded border-2 border-dashed ${isOver ? "border-alien-green bg-[#04202f]" : "border-slate-700 bg-[#071122]"}`}
    >
      <div className="text-slate-300 text-center">
        <div className="text-2xl">Drag & drop files here</div>
        <div className="text-sm text-slate-500">or click Upload to select files</div>
      </div>
    </div>
  );
};

export default DropZone;
