import { FilesMap } from "@/types/builder";

// Type definition for WebContainer instance
type WebContainerInstance = import("@webcontainer/api").WebContainer;

let webcontainerInstance: WebContainerInstance | null = null;
let devServerProcess: import("@webcontainer/api").WebContainerProcess | null = null;
let isBooting = false;

export function isWebContainerSupported(): boolean {
  if (typeof window === "undefined") return false;
  // WebContainers require Cross-Origin Isolation (SharedArrayBuffer)
  return typeof window.crossOriginIsolated === "boolean" && window.crossOriginIsolated;
}

export async function getWebContainer(): Promise<WebContainerInstance | null> {
  if (typeof window === "undefined") return null;
  if (!isWebContainerSupported()) return null;

  if (webcontainerInstance) return webcontainerInstance;
  if (isBooting) {
    // Wait for in-flight boot
    let retries = 0;
    while (isBooting && retries < 20) {
      await new Promise((r) => setTimeout(r, 250));
      retries++;
    }
    return webcontainerInstance;
  }

  isBooting = true;
  try {
    const { WebContainer } = await import("@webcontainer/api");
    webcontainerInstance = await WebContainer.boot();
    return webcontainerInstance;
  } catch (err) {
    console.warn("WebContainer boot failed or unsupported in this browser environment:", err);
    return null;
  } finally {
    isBooting = false;
  }
}

/**
 * Convert flat FilesMap to WebContainer nested FileSystemTree
 */
export function filesMapToFileSystemTree(files: FilesMap) {
  const tree: Record<string, any> = {};

  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = {
          file: {
            contents: content,
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    }
  }

  return tree;
}

export async function mountProjectFiles(files: FilesMap): Promise<boolean> {
  const container = await getWebContainer();
  if (!container) return false;

  const fileTree = filesMapToFileSystemTree(files);
  await container.mount(fileTree);
  return true;
}

export async function writeWebContainerFile(filePath: string, content: string): Promise<boolean> {
  const container = await getWebContainer();
  if (!container) return false;

  await container.fs.writeFile(filePath, content);
  return true;
}

export async function removeWebContainerFile(filePath: string): Promise<boolean> {
  const container = await getWebContainer();
  if (!container) return false;

  try {
    await container.fs.rm(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function runNpmInstall(onOutput?: (data: string) => void): Promise<number> {
  const container = await getWebContainer();
  if (!container) return -1;

  const installProcess = await container.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput?.(data);
      },
    })
  );

  return installProcess.exit;
}

export async function startViteServer(
  onOutput?: (data: string) => void,
  onServerReady?: (url: string) => void
): Promise<(() => void) | null> {
  const container = await getWebContainer();
  if (!container) return null;

  if (devServerProcess) {
    devServerProcess.kill();
    devServerProcess = null;
  }

  // Listen to server ready event
  container.on("server-ready", (port, url) => {
    onServerReady?.(url);
  });

  devServerProcess = await container.spawn("npm", ["run", "dev"]);
  devServerProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput?.(data);
      },
    })
  );

  return () => {
    devServerProcess?.kill();
    devServerProcess = null;
  };
}
