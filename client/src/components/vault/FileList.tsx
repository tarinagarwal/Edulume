import React from "react";
import { FolderItem, FileItem } from "../../services/vaultService";

const FileRow: React.FC<{ item: FolderItem | FileItem; onOpenFolder: (id: string) => void; onRequestDelete: (id: string) => void }> = ({ item, onOpenFolder, onRequestDelete }) => {
  const isFolder = item.type === "folder";
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-800 rounded">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{isFolder ? "📁" : "📄"}</div>
        <div className="text-sm text-slate-200 cursor-pointer" onDoubleClick={() => isFolder && onOpenFolder(item.id)}>{item.name}</div>
      </div>
      <div className="text-xs text-slate-400 flex gap-4 items-center">
        <div>{isFolder ? "Folder" : `${(item as FileItem).size} bytes`}</div>
        <button className="text-red-400" onClick={() => onRequestDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
};

const FileList: React.FC<{ folders: FolderItem[]; files: FileItem[]; onOpenFolder: (id: string) => void; onRequestDelete: (id: string) => void }> = ({ folders, files, onOpenFolder, onRequestDelete }) => {
  return (
    <div className="flex flex-col">
      {folders.map((f) => (
        <FileRow key={f.id} item={f} onOpenFolder={onOpenFolder} onRequestDelete={onRequestDelete} />
      ))}
      {files.map((fi) => (
        <FileRow key={fi.id} item={fi} onOpenFolder={onOpenFolder} onRequestDelete={onRequestDelete} />
      ))}
    </div>
  );
};

export default FileList;
