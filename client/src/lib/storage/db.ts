import { openDB, type IDBPDatabase } from "idb";
import {
  Project,
  ProjectType,
  FilesMap,
  ChatMessage,
  ProjectCheckpoint,
} from "@/types/builder";
import { getInitialFilesForType } from "@/templates";

const DB_NAME = "kivo_local_builder_db";
const DB_VERSION = 1;

interface FileRecord {
  projectId: string;
  path: string;
  content: string;
  updatedAt: string;
}

interface KivoDBSchema {
  projects: {
    key: string;
    value: Project;
  };
  files: {
    key: [string, string];
    value: FileRecord;
    indexes: { "by-project": string };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { "by-project": string };
  };
  checkpoints: {
    key: string;
    value: ProjectCheckpoint;
    indexes: { "by-project": string };
  };
}

let dbPromise: Promise<IDBPDatabase<KivoDBSchema>> | null = null;

export async function getDB(): Promise<IDBPDatabase<KivoDBSchema> | null> {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<KivoDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects Store
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }

        // Files Store: composite key [projectId, path]
        if (!db.objectStoreNames.contains("files")) {
          const fileStore = db.createObjectStore("files", {
            keyPath: ["projectId", "path"],
          });
          fileStore.createIndex("by-project", "projectId");
        }

        // Messages Store
        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messageStore.createIndex("by-project", "projectId");
        }

        // Checkpoints Store
        if (!db.objectStoreNames.contains("checkpoints")) {
          const checkpointStore = db.createObjectStore("checkpoints", {
            keyPath: "id",
          });
          checkpointStore.createIndex("by-project", "projectId");
        }
      },
    });
  }
  return dbPromise;
}

// ─── Project Operations ────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  if (!db) return [];
  const projects = await db.getAll("projects");
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get("projects", id);
}

export async function createProject(
  name: string,
  type: ProjectType = "custom",
  description: string = ""
): Promise<{ project: Project; files: FilesMap }> {
  const db = await getDB();
  const id = "proj_" + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const initialFiles = getInitialFilesForType(type, name.trim() || "Untitled Project");
  const defaultActiveFile = initialFiles["app/page.tsx"] ? "app/page.tsx" : (initialFiles["src/App.tsx"] ? "src/App.tsx" : Object.keys(initialFiles)[0] || "app/page.tsx");

  const project: Project = {
    id,
    name: name.trim() || "Untitled Project",
    type,
    description,
    activeFile: defaultActiveFile,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const tx = db.transaction(["projects", "files"], "readwrite");
    await tx.objectStore("projects").add(project);

    for (const [path, content] of Object.entries(initialFiles)) {
      await tx.objectStore("files").put({
        projectId: id,
        path,
        content,
        updatedAt: now,
      });
    }
    await tx.done;

    // Initial checkpoint
    await createCheckpoint(id, "Initial project template", undefined, initialFiles);
  }

  return { project, files: initialFiles };
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const db = await getDB();
  if (!db) return null;
  const project = await db.get("projects", id);
  if (!project) return null;

  const updated: Project = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put("projects", updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const tx = db.transaction(
    ["projects", "files", "messages", "checkpoints"],
    "readwrite"
  );
  await tx.objectStore("projects").delete(id);

  // Delete all files for project
  const fileKeys = await tx.objectStore("files").index("by-project").getAllKeys(id);
  for (const key of fileKeys) {
    await tx.objectStore("files").delete(key);
  }

  // Delete all messages for project
  const msgKeys = await tx
    .objectStore("messages")
    .index("by-project")
    .getAllKeys(id);
  for (const key of msgKeys) {
    await tx.objectStore("messages").delete(key);
  }

  // Delete all checkpoints for project
  const cpKeys = await tx
    .objectStore("checkpoints")
    .index("by-project")
    .getAllKeys(id);
  for (const key of cpKeys) {
    await tx.objectStore("checkpoints").delete(key);
  }

  await tx.done;
}

// ─── File Operations ──────────────────────────────────────────────────────────

export async function getProjectFiles(projectId: string): Promise<FilesMap> {
  const db = await getDB();
  if (!db) return {};

  const fileRecords = await db
    .getAllFromIndex("files", "by-project", projectId);
  const files: FilesMap = {};
  for (const record of fileRecords) {
    files[record.path] = record.content;
  }
  return files;
}

export async function getFile(
  projectId: string,
  path: string
): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;
  const record = await db.get("files", [projectId, path]);
  return record ? record.content : null;
}

export async function saveFile(
  projectId: string,
  path: string,
  content: string
): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const now = new Date().toISOString();
  await db.put("files", {
    projectId,
    path,
    content,
    updatedAt: now,
  });

  // Touch project updated time
  const project = await db.get("projects", projectId);
  if (project) {
    project.updatedAt = now;
    await db.put("projects", project);
  }
}

export async function saveFiles(
  projectId: string,
  files: FilesMap
): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const now = new Date().toISOString();
  const tx = db.transaction(["files", "projects"], "readwrite");
  const fileStore = tx.objectStore("files");

  for (const [path, content] of Object.entries(files)) {
    await fileStore.put({
      projectId,
      path,
      content,
      updatedAt: now,
    });
  }

  const project = await tx.objectStore("projects").get(projectId);
  if (project) {
    project.updatedAt = now;
    await tx.objectStore("projects").put(project);
  }

  await tx.done;
}

export async function deleteFile(
  projectId: string,
  path: string
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("files", [projectId, path]);
}

// ─── Chat Messages Operations ─────────────────────────────────────────────────

export async function getMessages(projectId: string): Promise<ChatMessage[]> {
  const db = await getDB();
  if (!db) return [];
  const records = await db.getAllFromIndex("messages", "by-project", projectId);
  return records.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("messages", message);
}

export async function clearMessages(projectId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction("messages", "readwrite");
  const keys = await tx.objectStore("messages").index("by-project").getAllKeys(projectId);
  for (const key of keys) {
    await tx.objectStore("messages").delete(key);
  }
  await tx.done;
}

// ─── Checkpoint & Undo / Rollback Operations ──────────────────────────────────

export async function createCheckpoint(
  projectId: string,
  summary: string,
  messageId?: string,
  explicitFiles?: FilesMap
): Promise<ProjectCheckpoint> {
  const db = await getDB();
  const files = explicitFiles || (await getProjectFiles(projectId));
  const checkpoint: ProjectCheckpoint = {
    id: "cp_" + Math.random().toString(36).substring(2, 10),
    projectId,
    messageId,
    summary,
    files: { ...files },
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await db.put("checkpoints", checkpoint);
  }
  return checkpoint;
}

export async function getCheckpoints(
  projectId: string
): Promise<ProjectCheckpoint[]> {
  const db = await getDB();
  if (!db) return [];
  const list = await db.getAllFromIndex("checkpoints", "by-project", projectId);
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function restoreCheckpoint(
  checkpointId: string
): Promise<{ projectId: string; files: FilesMap } | null> {
  const db = await getDB();
  if (!db) return null;
  const checkpoint = await db.get("checkpoints", checkpointId);
  if (!checkpoint) return null;

  // Overwrite project files with checkpoint files
  const tx = db.transaction(["files", "projects"], "readwrite");
  const fileStore = tx.objectStore("files");

  // Remove current project files
  const existingKeys = await fileStore.index("by-project").getAllKeys(checkpoint.projectId);
  for (const key of existingKeys) {
    await fileStore.delete(key);
  }

  // Restore snapshot files
  const now = new Date().toISOString();
  for (const [path, content] of Object.entries(checkpoint.files)) {
    await fileStore.put({
      projectId: checkpoint.projectId,
      path,
      content,
      updatedAt: now,
    });
  }

  const project = await tx.objectStore("projects").get(checkpoint.projectId);
  if (project) {
    project.updatedAt = now;
    await tx.objectStore("projects").put(project);
  }

  await tx.done;
  return { projectId: checkpoint.projectId, files: checkpoint.files };
}

export async function undoLastCheckpoint(
  projectId: string
): Promise<FilesMap | null> {
  const checkpoints = await getCheckpoints(projectId);
  if (checkpoints.length < 2) {
    // Only 1 or 0 checkpoints, cannot undo further
    return null;
  }
  // The second one is the previous state before last modification
  const previousCheckpoint = checkpoints[1];
  const res = await restoreCheckpoint(previousCheckpoint.id);
  return res ? res.files : null;
}
