export type VaultItemBase = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FolderItem = VaultItemBase & {
  type: "folder";
  parentId: string | null;
  children: string[];
};

export type FileItem = VaultItemBase & {
  type: "file";
  parentId: string | null;
  size: number;
  mime: string;
};

type Item = FolderItem | FileItem;

const makeId = () => Math.random().toString(36).slice(2, 9);

// Simple in-memory mock store
const store: { items: Record<string, Item>; rootId: string } = { items: {}, rootId: "" };

function nowISO() {
  return new Date().toISOString();
}

function init() {
  if (store.rootId) return;
  const rootId = makeId();
  store.rootId = rootId;
  store.items[rootId] = {
    id: rootId,
    name: "My Drive",
    type: "folder",
    parentId: null,
    children: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  // sample folders/files
  const f1 = makeId();
  const f2 = makeId();
  store.items[f1] = {
    id: f1,
    name: "Personal",
    type: "folder",
    parentId: rootId,
    children: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  } as FolderItem;
  store.items[f2] = {
    id: f2,
    name: "CourseNotes.pdf",
    type: "file",
    parentId: rootId,
    size: 234567,
    mime: "application/pdf",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  } as FileItem;
  (store.items[rootId] as FolderItem).children.push(f1, f2);
}

init();

export async function getRootId(): Promise<string> {
  return store.rootId;
}

export async function getChildren(parentId: string | null) {
  const pid = parentId ?? store.rootId;
  const parent = store.items[pid] as FolderItem;
  if (!parent || parent.type !== "folder") return { folders: [], files: [] };
  const folders: FolderItem[] = [];
  const files: FileItem[] = [];
  for (const cid of parent.children) {
    const it = store.items[cid];
    if (!it) continue;
    if (it.type === "folder") folders.push(it as FolderItem);
    else files.push(it as FileItem);
  }
  return { folders, files };
}

export async function getPath(folderId: string) {
  const path: FolderItem[] = [];
  let cur: any = store.items[folderId];
  while (cur) {
    if (cur.type === "folder") path.unshift(cur as FolderItem);
    cur = cur.parentId ? store.items[cur.parentId] : null;
  }
  return path;
}

export async function createFolder(parentId: string | null, name: string) {
  const pid = parentId ?? store.rootId;
  const id = makeId();
  const folder: FolderItem = {
    id,
    name,
    type: "folder",
    parentId: pid,
    children: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.items[id] = folder;
  (store.items[pid] as FolderItem).children.push(id);
  return folder;
}

export async function uploadFile(parentId: string | null, name: string, size: number, mime: string) {
  const pid = parentId ?? store.rootId;
  const id = makeId();
  const file: FileItem = {
    id,
    name,
    type: "file",
    parentId: pid,
    size,
    mime,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  store.items[id] = file;
  (store.items[pid] as FolderItem).children.push(id);
  return file;
}

export async function renameItem(id: string, name: string) {
  const it = store.items[id];
  if (!it) throw new Error("Not found");
  it.name = name;
  it.updatedAt = nowISO();
  return it;
}

export async function deleteItem(id: string) {
  const it = store.items[id];
  if (!it) throw new Error("Not found");
  // remove from parent's children
  if (it.parentId) {
    const parent = store.items[it.parentId] as FolderItem;
    parent.children = parent.children.filter((c) => c !== id);
  }
  // recursively delete if folder
  if (it.type === "folder") {
    for (const child of (it as FolderItem).children.slice()) {
      await deleteItem(child);
    }
  }
  delete store.items[id];
  return true;
}

export async function getFolderTree() {
  // return a shallow tree from root for sidebar
  const root = store.items[store.rootId] as FolderItem;
  function make(node: FolderItem) {
    return {
      id: node.id,
      name: node.name,
      children: node.children
        .map((c) => store.items[c])
        .filter(Boolean)
        .filter((i) => i.type === "folder")
        .map((i: any) => make(i as FolderItem)),
    };
  }
  return make(root);
}

export default {
  getRootId,
  getChildren,
  getPath,
  createFolder,
  renameItem,
  deleteItem,
  getFolderTree,
};
