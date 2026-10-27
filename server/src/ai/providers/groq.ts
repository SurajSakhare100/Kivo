import OpenAI from "openai";
import { AIProvider, AIRequestContext, FilesMap, StreamEvent } from "./base";
import {
  BUILDER_TOOLS,
  ListFilesSchema,
  ReadFileSchema,
  CreateFileSchema,
  UpdateFileSchema,
  DeleteFileSchema,
  GetDiagnosticsSchema,
  SearchSchema,
  AddPackageSchema,
  WebSearchSchema,
  sanitizePath,
} from "../tools";
import { SearchService } from "../../services/search.service";

const SYSTEM_PROMPT = `You are Kivo AI, an expert Next.js and React software engineer and UI/UX designer.
You build, modify, and refine web applications inside an in-browser development environment. The default framework is Next.js (App Router with TypeScript and Tailwind CSS).

RULES:
1. Use list_files to inspect the project structure, then read_file on every file you plan to modify. Never guess file contents.
2. The default entry file is "app/page.tsx" (for Next.js) or "src/App.tsx" (for Vite). Inspect the project files with list_files before modifying.
3. Use search to find symbols and text inside project files. Use web_search or web_search_ddg for current programming documentation, library references, and technical research.
4. Use create_file only for new files, update_file only for existing files, and delete_file only when a file should be removed.
5. Use add_package when new npm dependencies are required, and get_diagnostics when the user asks to fix or inspect preview errors.
6. Make targeted changes, preserve unrelated behavior, and return working code through the file tools. Do not answer with code fences instead of applying file changes.
7. Build functional, accessible components with the project's existing styling and dependencies.
8. Use only relative project paths such as "app/page.tsx", "components/Header.tsx", or "src/App.tsx".
9. Work through the plan in order. Check each tool result before deciding the next step; use multiple independent tools in one turn when that saves time.
10. Read every existing file before editing or deleting it, and read package.json before adding dependencies. Never claim a tool action succeeded unless its result confirms success.`;

export class GroqProvider implements AIProvider {
  name = "AI Engine";
  isMock = false;
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, baseURL = "https://api.groq.com/openai/v1", model = "llama-3.3-70b-versatile") {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = model;
  }

  async *generate(context: AIRequestContext): AsyncGenerator<StreamEvent, void, unknown> {
    const startTime = Date.now();
    let totalTokens = 0;

    yield {
      type: "status",
      status: "planning",
      message: "Analyzing request and planning file modifications...",
    };

    // Construct file tree summary
    const fileList = Object.keys(context.files);
    const filesOverview = fileList.map((f) => `- ${f} (${context.files[f].length} chars)`).join("\n");

    const userPromptWithContext = `USER REQUEST:
${context.prompt}

PROJECT CONTEXT:
Summary: ${context.projectSummary || "Modern React + Vite Application"}
Current Project Files:
${filesOverview}

${
  context.diagnostics && context.diagnostics.length > 0
    ? `PREVIOUS DIAGNOSTICS/ERRORS:\n${context.diagnostics.join("\n")}`
    : ""
}

Please use your tools to inspect necessary files and create or update code to accomplish the user request.`;

    // Plan in a separate model call so the user sees a real plan before any
    // project files are changed. The execution pass still has to inspect and
    // edit files through tools; the plan itself never mutates the project.
    let plan: string;
    try {
      const planningResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n\nFor this planning pass, do not write code or claim that files were changed. Do NOT call any tools. Return a concise numbered plan with the files or project areas to inspect, the implementation steps, and a final validation step.`,
          },
          ...context.history.slice(-4).map((item) => ({
            role: item.role as "user" | "assistant",
            content: item.content,
          })),
          {
            role: "user",
            content: `${userPromptWithContext}\n\nReturn only the ordered plan. Do not call any tools or functions.`,
          },
        ],
        temperature: 0.2,
        max_completion_tokens: 1200,
      });
      totalTokens += planningResponse.usage?.total_tokens || 0;
      plan = planningResponse.choices[0]?.message.content?.trim() ||
        "1. Inspect the relevant project files.\n2. Make the requested changes with the file tools.\n3. Review the tool results and report what changed.";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      yield { type: "error", error: `AI planning failed: ${message}` };
      return;
    }

    yield { type: "plan", plan };
    yield {
      type: "status",
      status: "planning",
      message: "Plan ready. Inspecting project files before making changes...",
    };

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...context.history.slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "assistant", content: `Implementation plan:\n${plan}` },
      { role: "user", content: userPromptWithContext },
    ];

    // Local copy of files for the session
    const currentFiles: FilesMap = { ...context.files };
    const inspectedFiles = new Set<string>();
    const activeTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [...BUILDER_TOOLS];

    const MAX_TOOL_TURNS = 12;
    let turn = 0;
    let changedProjectFiles = false;
    let mustGenerateFiles = false;

    while (turn < MAX_TOOL_TURNS) {
      turn++;

      let response: OpenAI.Chat.Completions.ChatCompletion;
      try {
        response = await this.client.chat.completions.create({
          model: this.model,
          messages,
          tools: activeTools,
          tool_choice: "auto",
          temperature: 0.2,
          max_completion_tokens: 12000,
          parallel_tool_calls: true,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        yield { type: "error", error: `LLM API Error: ${message}` };
        return;
      }

      const choice = response.choices[0];
      const message = choice.message;
      if (response.usage?.total_tokens) {
        totalTokens += response.usage.total_tokens;
      }

      // Check if model called tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== "function") continue;
          const toolName = toolCall.function.name;
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            parsedArgs = {};
          }

          yield {
            type: "tool_call",
            id: toolCall.id,
            tool: toolName,
            args: parsedArgs,
          };

          const operationPath = typeof parsedArgs.path === "string" ? parsedArgs.path : "";
          const operationQuery = typeof parsedArgs.query === "string" ? parsedArgs.query : "";
          const mutationTools = new Set(["create_file", "update_file", "delete_file", "add_package"]);
          const operationMessage = (() => {
            switch (toolName) {
              case "list_files": return "Inspecting the project file list...";
              case "read_file": return `Reading ${operationPath || "project file"}...`;
              case "search":
              case "search_files": return `Searching project files for ${operationQuery || "matching code"}...`;
              case "create_file": return `Creating ${operationPath || "a project file"}...`;
              case "update_file": return `Editing ${operationPath || "a project file"}...`;
              case "delete_file": return `Deleting ${operationPath || "a project file"}...`;
              case "add_package": return `Adding ${String(parsedArgs.packageName || "a dependency")}...`;
              case "get_diagnostics": return "Checking the current preview diagnostics...";
              case "web_search":
              case "web_search_ddg": return `Researching ${operationQuery || "technical documentation"}...`;
              default: return `Running ${toolName}...`;
            }
          })();
          yield {
            type: "status",
            status: mutationTools.has(toolName) ? "editing" : "planning",
            message: operationMessage,
          };

          let toolResult = "";

          if (toolName === "list_files") {
            const parsed = ListFilesSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const prefix = parsed.data.pathPrefix || "";
              const matched = Object.keys(currentFiles).filter((p) => p.startsWith(prefix));
              toolResult = JSON.stringify({ files: matched });
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "read_file") {
            const parsed = ReadFileSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const sanitized = sanitizePath(parsed.data.path);
              if (!sanitized.isValid) {
                toolResult = JSON.stringify({ error: sanitized.error });
              } else if (!(sanitized.path in currentFiles)) {
                toolResult = JSON.stringify({ error: `File not found: ${sanitized.path}` });
              } else {
                inspectedFiles.add(sanitized.path);
                toolResult = currentFiles[sanitized.path];
              }
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult.length > 300 ? toolResult.slice(0, 300) + "… [truncated]" : toolResult,
            };
          } else if (toolName === "search" || toolName === "search_files") {
            const parsed = SearchSchema.safeParse(parsedArgs);
            const queryStr = parsed.success ? parsed.data.query.toLowerCase() : "";
            const terms = queryStr.split(/\s+/).filter(Boolean);
            const matches: Array<{ file: string; line: number; snippet: string }> = [];

            for (const [filePath, content] of Object.entries(currentFiles)) {
              const lines = content.split("\n");
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].toLowerCase();
                if (terms.length > 0 && terms.some((term) => line.includes(term))) {
                  matches.push({
                    file: filePath,
                    line: i + 1,
                    snippet: lines[i].trim().slice(0, 150),
                  });
                  if (matches.length >= 10) break;
                }
              }
              if (matches.length >= 10) break;
            }

            toolResult = JSON.stringify({
              query: queryStr,
              found: matches.length > 0,
              results: matches.length > 0 ? matches : "No direct matches found in project files.",
            });
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "create_file") {
            const parsed = CreateFileSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const sanitized = sanitizePath(parsed.data.path);
              if (!sanitized.isValid) {
                toolResult = JSON.stringify({ error: sanitized.error });
              } else if (sanitized.path in currentFiles) {
                toolResult = JSON.stringify({ error: `File already exists: ${sanitized.path}. Use update_file instead.` });
              } else {
                currentFiles[sanitized.path] = parsed.data.content;
                changedProjectFiles = true;
                toolResult = JSON.stringify({ success: true, path: sanitized.path });
                yield {
                  type: "file_change",
                  action: "create",
                  path: sanitized.path,
                  content: parsed.data.content,
                  explanation: parsed.data.description,
                };
              }
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "update_file") {
            const parsed = UpdateFileSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const sanitized = sanitizePath(parsed.data.path);
              if (!sanitized.isValid) {
                toolResult = JSON.stringify({ error: sanitized.error });
              } else if (!(sanitized.path in currentFiles)) {
                toolResult = JSON.stringify({ error: `File does not exist: ${sanitized.path}. Use create_file instead.` });
              } else if (!inspectedFiles.has(sanitized.path)) {
                toolResult = JSON.stringify({ error: `Read ${sanitized.path} with read_file before editing it.` });
              } else {
                currentFiles[sanitized.path] = parsed.data.content;
                changedProjectFiles = true;
                toolResult = JSON.stringify({ success: true, path: sanitized.path });
                yield {
                  type: "file_change",
                  action: "update",
                  path: sanitized.path,
                  content: parsed.data.content,
                  explanation: parsed.data.explanation,
                };
              }
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "delete_file") {
            const parsed = DeleteFileSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const sanitized = sanitizePath(parsed.data.path);
              if (!sanitized.isValid) {
                toolResult = JSON.stringify({ error: sanitized.error });
              } else if (!(sanitized.path in currentFiles)) {
                toolResult = JSON.stringify({ error: `File not found: ${sanitized.path}` });
              } else if (!inspectedFiles.has(sanitized.path)) {
                toolResult = JSON.stringify({ error: `Read ${sanitized.path} with read_file before deleting it.` });
              } else {
                delete currentFiles[sanitized.path];
                changedProjectFiles = true;
                toolResult = JSON.stringify({ success: true, path: sanitized.path });
                yield {
                  type: "file_change",
                  action: "delete",
                  path: sanitized.path,
                };
              }
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "get_diagnostics") {
            const diagnostics = context.diagnostics || [];
            const parsed = GetDiagnosticsSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
            } else {
              const filteredDiagnostics = parsed.data.filter === "errors_only"
                ? diagnostics.filter((item) => /error|failed|exception/i.test(item))
                : diagnostics;
              toolResult = JSON.stringify({
                diagnostics: filteredDiagnostics,
                status: filteredDiagnostics.length > 0
                  ? `${filteredDiagnostics.length} diagnostic(s) reported`
                  : "Clean — no compiler errors reported",
              });
            }
            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (toolName === "add_package") {
            const parsed = AddPackageSchema.safeParse(parsedArgs);
            if (!parsed.success) {
              toolResult = JSON.stringify({ error: parsed.error.issues });
              yield { type: "tool_result", id: toolCall.id, tool: toolName, result: toolResult };
              messages.push({ role: "tool", tool_call_id: toolCall.id, content: toolResult });
              continue;
            }
            const pkgName = parsed.data.packageName.trim();
            const pkgVer = parsed.data.version || "latest";
            const isDev = Boolean(parsed.data.isDev);

            try {
              if (!inspectedFiles.has("package.json")) {
                throw new Error("Read package.json with read_file before changing dependencies.");
              }
              const pkgJson = JSON.parse(currentFiles["package.json"] || "{}");
              if (isDev) {
                pkgJson.devDependencies = pkgJson.devDependencies || {};
                pkgJson.devDependencies[pkgName] = pkgVer;
              } else {
                pkgJson.dependencies = pkgJson.dependencies || {};
                pkgJson.dependencies[pkgName] = pkgVer;
              }
              const updated = JSON.stringify(pkgJson, null, 2);
              currentFiles["package.json"] = updated;
              changedProjectFiles = true;

              yield {
                type: "file_change",
                action: "update",
                path: "package.json",
                content: updated,
                explanation: `Installed npm dependency ${pkgName}@${pkgVer}`,
              };

              toolResult = JSON.stringify({ success: true, package: pkgName, version: pkgVer });
            } catch (err: any) {
              toolResult = JSON.stringify({ error: `Failed to update package.json: ${err.message}` });
            }

            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else if (
            toolName === "web_search" ||
            toolName === "web_search_ddg" ||
            toolName === "search_web" ||
            toolName === "google_search" ||
            toolName === "duckduckgo_search"
          ) {
            const rawQuery =
              typeof parsedArgs.query === "string" && parsedArgs.query.trim()
                ? parsedArgs.query.trim()
                : typeof parsedArgs.q === "string" && parsedArgs.q.trim()
                ? parsedArgs.q.trim()
                : typeof parsedArgs.search === "string" && parsedArgs.search.trim()
                ? parsedArgs.search.trim()
                : typeof parsedArgs.searchTerm === "string" && parsedArgs.searchTerm.trim()
                ? parsedArgs.searchTerm.trim()
                : "";

            if (!rawQuery) {
              toolResult = JSON.stringify({ error: "Missing required parameter 'query' for web search." });
            } else {
              const searchRes = await SearchService.searchDuckDuckGo(rawQuery);
              toolResult = JSON.stringify(searchRes);
            }

            yield {
              type: "tool_result",
              id: toolCall.id,
              tool: toolName,
              result: toolResult,
            };
          } else {
            toolResult = JSON.stringify({ error: `Tool is not implemented: ${toolName}` });
            yield { type: "tool_result", id: toolCall.id, tool: toolName, result: toolResult };
          }

          // Append tool execution response
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
          });
        }
      } else {
        if (!changedProjectFiles) {
          if (!mustGenerateFiles) {
            mustGenerateFiles = true;
            messages.push({ role: "assistant", content: message.content || "" });
            messages.push({
              role: "user",
              content: "You have not changed any project files yet. Now create or update the relevant source files using the provided file tools. Inspect existing files first if needed, and implement the requested change in code.",
            });
            turn--;
            continue;
          }

          // If the model provided a textual answer (explanation, documentation, research), complete gracefully
          if (message.content && message.content.trim().length > 0) {
            const summary = message.content;
            const durationSec = Math.round((Date.now() - startTime) / 100) / 10;

            yield {
              type: "summary",
              summary,
              tokensUsed: totalTokens,
              generationTime: durationSec,
            };

            yield {
              type: "status",
              status: "completed",
              message: "Response completed.",
            };
            return;
          }

          yield {
            type: "error",
            error: "The AI finished without producing any project file changes. Please retry the request.",
          };
          return;
        }

        // No tool calls, model gave final answer
        const summary = message.content || "Code modifications completed successfully.";
        const durationSec = Math.round((Date.now() - startTime) / 100) / 10;

        yield {
          type: "status",
          status: "building",
          message: "Validating preview and bundling changes...",
        };

        yield {
          type: "summary",
          summary,
          tokensUsed: totalTokens,
          generationTime: durationSec,
        };

        yield {
          type: "status",
          status: "completed",
          message: "Modifications applied successfully.",
        };
        return;
      }
    }

    if (!changedProjectFiles) {
      yield {
        type: "error",
        error: "The AI reached its tool limit before producing project file changes. Please try a smaller request.",
      };
      return;
    }

    // Finished max turns after applying file changes
    const durationSec = Math.round((Date.now() - startTime) / 100) / 10;
    yield {
      type: "summary",
      summary: "Completed all planned file edits and synchronizations.",
      tokensUsed: totalTokens,
      generationTime: durationSec,
    };
    yield {
      type: "status",
      status: "completed",
    };
  }
}
