import React, { useState } from "react";

const CreateFolderModal: React.FC<{ open: boolean; onClose: () => void; onCreate: (name: string) => void }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-[#071122] p-6 rounded w-96">
        <div className="text-lg text-slate-200 mb-3">Create Folder</div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-[#0b1220] border border-slate-700 text-slate-200" placeholder="Folder name" />
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 bg-alien-green text-black rounded" onClick={() => { onCreate(name); setName(""); }}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
