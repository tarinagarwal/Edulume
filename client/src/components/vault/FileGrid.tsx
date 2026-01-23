import React from "react";
import { FolderItem, FileItem } from "../../services/vaultService";

const ItemCard: React.FC<{
  item: FolderItem | FileItem;
  onOpenFolder: (id: string) => void;
  onRequestDelete: (id: string) => void;
}> = ({ item, onOpenFolder, onRequestDelete }) => {
  const isFolder = item.type === "folder";
  return (
    <div className="w-40 p-3 bg-[#0b1220] rounded flex flex-col gap-2 cursor-pointer hover:shadow-lg" onDoubleClick={() => isFolder && onOpenFolder(item.id)}>
      <div className="h-20 flex items-center justify-center text-3xl">{isFolder ? "📁" : "📄"}</div>
      <div className="text-sm text-slate-200 truncate">{item.name}</div>
      <div className="text-xs text-slate-500 flex justify-between">
        <span>{isFolder ? "Folder" : `${(item as FileItem).size} bytes`}</span>
        <button className="text-red-400" onClick={(e) => { e.stopPropagation(); onRequestDelete(item.id); }}>Delete</button>
      </div>
    </div>
  );
};

const FileGrid: React.FC<{
  folders: FolderItem[];
  files: FileItem[];
  onOpenFolder: (id: string) => void;
  onRequestDelete: (id: string) => void;
}> = ({ folders, files, onOpenFolder, onRequestDelete }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {folders.map((f) => (
        <ItemCard key={f.id} item={f} onOpenFolder={onOpenFolder} onRequestDelete={onRequestDelete} />
      ))}
      {files.map((fi) => (
        <ItemCard key={fi.id} item={fi} onOpenFolder={onOpenFolder} onRequestDelete={onRequestDelete} />
      ))}
    </div>
  );
};

export default FileGrid;
