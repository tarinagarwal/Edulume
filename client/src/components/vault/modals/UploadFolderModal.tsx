import React, { useState } from "react";

const UploadFolderModal: React.FC<{ open: boolean; onClose: () => void; onUpload: (files: File[] | FileList | null) => void }> = ({ open, onClose, onUpload }) => {
  const [files, setFiles] = useState<File[] | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className="bg-[#071122] p-6 rounded w-[640px] max-w-[95%]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg text-slate-200">Upload Folder</div>
          <button className="text-slate-400" onClick={onClose}>Close</button>
        </div>

        <div className="border border-dashed border-slate-700 p-8 rounded text-center text-slate-400">
          <p className="mb-3">Select a folder from your computer. Browser support may vary.</p>
          <input
            id="upload-folder-input"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : null)}
          />
          <label htmlFor="upload-folder-input" className="px-3 py-2 bg-slate-800 text-slate-200 rounded cursor-pointer">Choose Folder</label>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button className="px-4 py-2 bg-alien-green text-black rounded" onClick={() => { onUpload(files); }}>Upload Folder</button>
        </div>
      </div>
    </div>
  );
};

export default UploadFolderModal;
