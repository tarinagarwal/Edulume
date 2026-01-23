import React, { useEffect, useState } from "react";
import vaultService from "../../services/vaultService";

type Node = { id: string; name: string; children?: Node[] };

const TreeNode: React.FC<{ node: Node; onNavigate: (id: string) => void }> = ({ node, onNavigate }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pl-2">
      <div className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-800 rounded" onClick={() => { setOpen(!open); onNavigate(node.id); }}>
        <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center text-xs">F</div>
        <div className="text-sm text-slate-200">{node.name}</div>
      </div>
      {open && node.children && (
        <div className="pl-4">
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

const VaultSidebar: React.FC<{ onNavigate: (id: string) => void }> = ({ onNavigate }) => {
  const [tree, setTree] = useState<Node | null>(null);

  useEffect(() => {
    (async () => {
      const t = await vaultService.getFolderTree();
      setTree(t as Node);
    })();
  }, []);

  return (
    <div className="bg-[#071126] rounded p-3 text-sm">
      <div className="text-slate-300 mb-2 font-semibold">My Vault</div>
      {tree ? <TreeNode node={tree} onNavigate={onNavigate} /> : <div className="text-slate-500">Loading...</div>}
    </div>
  );
};

export default VaultSidebar;
