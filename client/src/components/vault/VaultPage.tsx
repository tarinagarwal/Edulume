import React, { useEffect, useState, useRef } from "react";
import VaultSidebar from "./VaultSidebar";
import VaultBreadcrumb from "./VaultBreadcrumb";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import CreateFolderModal from "./modals/CreateFolderModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import UploadFileModal from "./modals/UploadFileModal";
import UploadFolderModal from "./modals/UploadFolderModal";
import vaultService, { FolderItem, FileItem } from "../../services/vaultService";

const VaultPage: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [showUploadFolderModal, setShowUploadFolderModal] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const root = await vaultService.getRootId();
      setCurrentFolderId((id) => id ?? root);
    })();
  }, []);

  useEffect(() => {
    if (!currentFolderId) return;
    (async () => {
      const { folders: f, files: fi } = await vaultService.getChildren(currentFolderId);
      setFolders(f);
      setFiles(fi);
    })();
  }, [currentFolderId]);

  async function handleCreate(name: string) {
    if (!currentFolderId) return;
    await vaultService.createFolder(currentFolderId, name);
    const { folders: f } = await vaultService.getChildren(currentFolderId);
    setFolders(f);
    setShowCreate(false);
  }

  async function handleFiles(files: File[] | FileList | null) {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0) || !currentFolderId) return;
    const list: File[] = Array.isArray(files) ? files : Array.from(files);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      await vaultService.uploadFile(currentFolderId, f.name, f.size, f.type || "application/octet-stream");
    }
    const { folders: fldr, files: fi } = await vaultService.getChildren(currentFolderId);
    setFolders(fldr);
    setFiles(fi);
    setShowUploadFileModal(false);
    setShowUploadFolderModal(false);
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleDelete(id: string) {
    await vaultService.deleteItem(id);
    const { folders: f, files: fi } = await vaultService.getChildren(currentFolderId);
    setFolders(f);
    setFiles(fi);
    setShowDelete(false);
    setToDeleteId(null);
  }

  return (
    <div className="min-h-[70vh] p-6">
      <div className="flex gap-6">
        <div className="w-72">
          <VaultSidebar onNavigate={(id) => setCurrentFolderId(id)} />
        </div>
        <div className="flex-1 bg-[#0f1724] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <VaultBreadcrumb currentFolderId={currentFolderId} onNavigate={setCurrentFolderId} />
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-300">Storage: 120MB / 2GB</div>
              <div className="relative" ref={newMenuRef}>
                <button onClick={() => setShowNewMenu((s) => !s)} className="px-3 py-1 bg-alien-green text-black rounded">New ▾</button>
                {showNewMenu && (
                  <div className="absolute right-0 mt-2 bg-[#071122] border border-slate-700 rounded shadow-lg w-48 z-30">
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-800" onClick={() => { setShowCreate(true); setShowNewMenu(false); }}>New Folder</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-800" onClick={() => { setShowUploadFileModal(true); setShowNewMenu(false); }}>Upload File</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-800" onClick={() => { setShowUploadFolderModal(true); setShowNewMenu(false); }}>Upload Folder</button>
                  </div>
                )}
              </div>
              <button
                className="px-3 py-1 border border-slate-600 text-slate-200 rounded"
                onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
              >
                {view === "grid" ? "List" : "Grid"}
              </button>
            </div>
          </div>

          <div>
            {view === "grid" ? (
              <FileGrid
                folders={folders}
                files={files}
                onOpenFolder={(id) => setCurrentFolderId(id)}
                onRequestDelete={(id) => {
                  setToDeleteId(id);
                  setShowDelete(true);
                }}
              />
            ) : (
              <FileList
                folders={folders}
                files={files}
                onOpenFolder={(id) => setCurrentFolderId(id)}
                onRequestDelete={(id) => {
                  setToDeleteId(id);
                  setShowDelete(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <CreateFolderModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      <UploadFileModal open={showUploadFileModal} onClose={() => setShowUploadFileModal(false)} onUpload={handleFiles} />
      <UploadFolderModal open={showUploadFolderModal} onClose={() => setShowUploadFolderModal(false)} onUpload={handleFiles} />
      <ConfirmDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => toDeleteId && handleDelete(toDeleteId)}
      />
    </div>
  );
};

export default VaultPage;
