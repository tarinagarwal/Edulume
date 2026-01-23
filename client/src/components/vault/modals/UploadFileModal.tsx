import React, { useState } from "react";
import DropZone from "../DropZone";

const UploadFileModal: React.FC<{ open: boolean; onClose: () => void; onUpload: (files: File[] | FileList | null) => void }> = ({ open, onClose, onUpload }) => {
  const [files, setFiles] = useState<File[] | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className="bg-[#071122] p-6 rounded w-[640px] max-w-[95%]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg text-slate-200">Upload Files</div>
          <button className="text-slate-400" onClick={onClose}>Close</button>
        </div>
        <DropZone onFiles={(fl) => setFiles(fl ? Array.from(fl) : null)} />
        <div className="mt-4 flex items-center justify-center gap-4">
          <input id="upload-files-input" type="file" multiple className="hidden" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : null)} />
          <label htmlFor="upload-files-input" className="px-3 py-2 bg-slate-800 text-slate-200 rounded cursor-pointer">Choose files</label>
          <button className="px-4 py-2 bg-alien-green text-black rounded" onClick={() => { onUpload(files); }}>Upload</button>
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal;
