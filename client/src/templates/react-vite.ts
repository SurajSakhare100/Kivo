import { FilesMap, ProjectType } from "@/types/builder";

export const BASE_REACT_VITE_TEMPLATE: FilesMap = {
  "package.json": JSON.stringify(
    {
      name: "kivo-generated-app",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        "react": "18.3.1",
        "react-dom": "18.3.1",
        "lucide-react": "0.460.0",
      },
      devDependencies: {
        "@types/react": "18.3.5",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        typescript: "^5.5.3",
        vite: "^5.4.2",
      },
    },
    null,
    2
  ),

  "vite.config.ts": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
`,

  "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kivo Generated App</title>
    <!-- Tailwind CSS CDN for instant live styling in preview -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              brand: {
                50: '#f0fdf4',
                500: '#22c55e',
                600: '#16a34a',
                900: '#14532d',
              }
            }
          }
        }
      }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
    </style>
  </head>
  <body class="bg-neutral-950 text-neutral-100 min-h-screen selection:bg-emerald-500 selection:text-black">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

  "src/main.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0a0a0a;
}
::-webkit-scrollbar-thumb {
  background: #262626;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #404040;
}
`,

  "src/App.tsx": `import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans flex flex-col justify-between p-6 sm:p-16 selection:bg-white selection:text-black">
      {/* Top Banner */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs sm:text-sm font-mono">
        <p className="flex items-center gap-2 text-neutral-400 bg-neutral-900/90 border border-neutral-800/90 px-4 py-2 rounded-xl backdrop-blur-md">
          Get started by editing&nbsp;
          <code className="font-semibold text-white bg-neutral-800 px-2 py-0.5 rounded-md text-xs">
            src/App.tsx
          </code>
        </p>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-neutral-400 font-sans font-medium">Ready</span>
        </div>
      </div>

      {/* Hero / Next.js Iconic Centerpiece */}
      <div className="relative flex flex-col items-center justify-center my-16 text-center">
        {/* Glow behind logo */}
        <div className="absolute -z-10 h-72 w-72 rounded-full bg-gradient-to-tr from-white/10 to-neutral-500/5 blur-3xl opacity-50" />
        
        <div className="flex items-center gap-3.5 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-2xl shadow-white/20">
            N
          </div>
          <span className="text-4xl sm:text-6xl font-black tracking-tighter text-white">
            Next<span className="text-neutral-500">.js</span>
          </span>
        </div>

        <p className="text-neutral-400 text-sm sm:text-base max-w-md leading-relaxed">
          Describe any changes or additions in the chat on the left to start building your application.
        </p>
      </div>

      {/* Grid of 4 Next.js style feature cards */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
        <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 transition-all hover:border-neutral-700 hover:bg-neutral-900/70 cursor-pointer">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
            Docs
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Find in-depth information about Next.js features and API.
          </p>
        </div>

        <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 transition-all hover:border-neutral-700 hover:bg-neutral-900/70 cursor-pointer">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
            Learn
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Learn about Next.js in an interactive course with quizzes!
          </p>
        </div>

        <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 transition-all hover:border-neutral-700 hover:bg-neutral-900/70 cursor-pointer">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
            Templates
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Explore starter templates and modern responsive layouts.
          </p>
        </div>

        <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 transition-all hover:border-neutral-700 hover:bg-neutral-900/70 cursor-pointer">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
            Deploy
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Instantly deploy your site to a shareable live preview URL.
          </p>
        </div>
      </div>
    </div>
  );
}
`,

  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
      },
      include: ["src"],
    },
    null,
    2
  ),
};

export function getInitialFilesForType(type: ProjectType, name: string): FilesMap {
  const files = { ...BASE_REACT_VITE_TEMPLATE };
  // Customize project name in package.json
  try {
    const pkg = JSON.parse(files["package.json"]);
    pkg.name = name.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "kivo-app";
    files["package.json"] = JSON.stringify(pkg, null, 2);
  } catch {
    // preserve default
  }
  return files;
}
