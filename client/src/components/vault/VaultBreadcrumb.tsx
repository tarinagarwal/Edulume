import React, { useEffect, useState } from "react";
import vaultService, { FolderItem } from "../../services/vaultService";

const VaultBreadcrumb: React.FC<{ currentFolderId: string | null; onNavigate: (id: string) => void }> = ({ currentFolderId, onNavigate }) => {
  const [path, setPath] = useState<FolderItem[]>([]);

  useEffect(() => {
    if (!currentFolderId) return;
    (async () => {
      const p = await vaultService.getPath(currentFolderId);
      setPath(p);
    })();
  }, [currentFolderId]);

  return (
    <div className="text-sm text-slate-300">
      {path.map((p, i) => (
        <span key={p.id} className="cursor-pointer hover:underline" onClick={() => onNavigate(p.id)}>
          {i > 0 && <span className="mx-2 text-slate-500">/</span>}
          {p.name}
        </span>
      ))}
    </div>
  );
};

export default VaultBreadcrumb;
