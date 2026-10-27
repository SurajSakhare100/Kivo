import { z } from "zod";

// Permitted file extensions in generated projects
export const ALLOWED_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
  ".html",
  ".md",
  ".svg",
];

export const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB

// Helper to normalize and validate relative file paths
export function sanitizePath(inputPath: string): { isValid: boolean; path: string; error?: string } {
  if (!inputPath || typeof inputPath !== "string") {
    return { isValid: false, path: "", error: "Path must be a non-empty string" };
  }

  // Trim whitespace and remove leading slashes
  let clean = inputPath.trim().replace(/^[\/\\]+/, "");

  // Prevent directory traversal attacks
  if (clean.includes("..") || clean.includes(":\\") || clean.startsWith("/")) {
    return { isValid: false, path: "", error: "Path traversal or absolute paths are not permitted" };
  }

  // Check file extension
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => clean.toLowerCase().endsWith(ext));
  if (!hasValidExt) {
    return {
      isValid: false,
      path: "",
      error: `File extension not permitted. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { isValid: true, path: clean };
}

// ─── Zod Schemas for Tool Arguments ──────────────────────────────────────────

export const ListFilesSchema = z.object({
  pathPrefix: z
    .string()
    .optional()
    .describe("Optional directory prefix to filter files, e.g. 'src/' or 'src/components/'"),
});

export const ReadFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe("Relative path of the file to inspect before editing, e.g. 'src/App.tsx'"),
});

export const CreateFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe("Relative path for the new file, e.g. 'src/components/Header.tsx'"),
  content: z
    .string()
    .max(MAX_FILE_SIZE_BYTES, "File content exceeds 512KB limit")
    .describe("Complete source code for the new file"),
  description: z
    .string()
    .optional()
    .describe("Short summary of what this component or file does"),
});

export const UpdateFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe("Relative path of the existing file to update, e.g. 'src/App.tsx'"),
  content: z
    .string()
    .max(MAX_FILE_SIZE_BYTES, "File content exceeds 512KB limit")
    .describe("Complete updated content of the file. Preserve existing unrelated functionality"),
  explanation: z
    .string()
    .optional()
    .describe("Clear, concise summary of the changes made"),
});

export const DeleteFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe("Relative path of the file to delete"),
});

export const GetDiagnosticsSchema = z.object({
  filter: z
    .enum(["all", "errors_only"])
    .optional()
    .default("all")
    .describe("Filter diagnostics by severity"),
});

export const SearchSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe("Keyword, symbol, or text to search across project files"),
});

export const AddPackageSchema = z.object({
  packageName: z
    .string()
    .min(1)
    .describe("NPM package name to install, e.g. 'canvas-confetti', 'recharts', 'date-fns'"),
  version: z
    .string()
    .optional()
    .default("latest")
    .describe("Optional semver or tag, defaults to 'latest'"),
  isDev: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to install as a devDependency"),
});

export const WebSearchSchema = z
  .object({
    query: z.string().optional(),
    q: z.string().optional(),
    search: z.string().optional(),
    searchTerm: z.string().optional(),
  })
  .passthrough();

export type ListFilesArgs = z.infer<typeof ListFilesSchema>;
export type ReadFileArgs = z.infer<typeof ReadFileSchema>;
export type CreateFileArgs = z.infer<typeof CreateFileSchema>;
export type UpdateFileArgs = z.infer<typeof UpdateFileSchema>;
export type DeleteFileArgs = z.infer<typeof DeleteFileSchema>;
export type GetDiagnosticsArgs = z.infer<typeof GetDiagnosticsSchema>;
export type SearchArgs = z.infer<typeof SearchSchema>;
export type AddPackageArgs = z.infer<typeof AddPackageSchema>;
export type WebSearchArgs = z.infer<typeof WebSearchSchema>;

// ─── OpenAI Tool Definitions ──────────────────────────────────────────────────

export const BUILDER_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "list_files",
      description: "List all files in the project. Always call this first if unsure about project structure.",
      parameters: {
        type: "object",
        properties: {
          pathPrefix: {
            type: "string",
            description: "Optional prefix to filter files, e.g. 'src/'",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the full contents of an existing file. Inspect existing files before editing them.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path of file to read (e.g. 'src/App.tsx')",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search",
      description: "Search for keywords, components, styles, or symbols across existing project files.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term or keyword to find",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for current programming documentation, API references, and technical implementation guidance.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_file",
      description: "Create a new file in the project with complete code.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path (e.g. 'src/components/Card.tsx')",
          },
          content: {
            type: "string",
            description: "Full content of the file",
          },
          description: {
            type: "string",
            description: "Brief note explaining what this file provides",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_file",
      description: "Update an existing file with modified content. Preserve all unrelated code and logic.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path of the existing file (e.g. 'src/App.tsx')",
          },
          content: {
            type: "string",
            description: "Complete updated code for the file",
          },
          explanation: {
            type: "string",
            description: "Concise summary of modifications",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_file",
      description: "Delete an unwanted or deprecated file from the project.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path of the file to delete",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_diagnostics",
      description: "Retrieve any bundler, runtime, or syntax diagnostics from the live preview.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            enum: ["all", "errors_only"],
            description: "Filter level",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_package",
      description: "Install a new NPM package dependency into the project's package.json so it can be imported in components.",
      parameters: {
        type: "object",
        properties: {
          packageName: {
            type: "string",
            description: "NPM package name to add (e.g. 'canvas-confetti', 'recharts', 'date-fns')",
          },
          version: {
            type: "string",
            description: "Version string or 'latest'",
          },
          isDev: {
            type: "boolean",
            description: "Whether to install as devDependency",
          },
        },
        required: ["packageName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search_ddg",
      description: "Search DuckDuckGo STRICTLY for coding research: library documentation, syntax, API examples, and technical troubleshooting. Non-coding queries are forbidden.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Technical or coding research query (e.g. 'framer-motion AnimatePresence docs', 'lucide-react icons list')",
          },
        },
        required: ["query"],
      },
    },
  },
];
