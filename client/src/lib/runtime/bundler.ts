import { FilesMap } from "@/types/builder";

/**
 * Builds a self-contained, robust sandboxed HTML document from the virtual FilesMap
 * that transpiles and executes multi-file React + TypeScript code directly in the browser,
 * with dynamic package loading via esm.sh CDN and virtual in-memory module resolution.
 */
export function generatePreviewHtml(files: FilesMap): string {
  const indexHtml =
    files["index.html"] ||
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; }
    </style>
  </head>
  <body class="bg-neutral-950 text-neutral-100 min-h-screen">
    <div id="root"></div>
  </body>
</html>`;

  // Filter virtual JS/TS/TSX/CSS files
  const virtualFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (
      path.endsWith(".tsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".jsx") ||
      path.endsWith(".js") ||
      path.endsWith(".css") ||
      path.endsWith(".json")
    ) {
      virtualFiles[path] = content;
    }
  }

  // Detect imported packages across all files
  const detectedPackages = new Set<string>([
    "react",
    "react-dom",
    "react-dom/client",
    "react/jsx-runtime",
    "lucide-react",
  ]);

  if (files["package.json"]) {
    try {
      const parsed = JSON.parse(files["package.json"]);
      if (parsed.dependencies && typeof parsed.dependencies === "object") {
        Object.keys(parsed.dependencies).forEach((pkg) => detectedPackages.add(pkg));
      }
    } catch {
      // ignore json parse errors
    }
  }

  // Regex to extract import/from and require("pkg")
  const importRegex =
    /(?:import\s+(?:[\w*\s{},]*)\s+from\s*|require\s*\(\s*)['"]([^'"./\\][^'"]*)['"]/g;

  for (const code of Object.values(virtualFiles)) {
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(code)) !== null) {
      const pkgName = match[1]?.trim();
      if (pkgName && !pkgName.startsWith(".") && !pkgName.startsWith("/")) {
        detectedPackages.add(pkgName);
      }
    }
  }

  const serializedFiles = JSON.stringify(virtualFiles);
  const serializedPackages = JSON.stringify(Array.from(detectedPackages));

  // Sandboxed runtime script
  const runtimeScript = `
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.2/babel.min.js"></script>
<script>
  (function() {
    function notifyParent(data) {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(data, '*');
        }
      } catch (e) {}
    }

    // Capture unhandled runtime errors
    window.addEventListener('error', function(event) {
      notifyParent({
        type: 'KIVO_DIAGNOSTIC',
        diagnostic: {
          id: 'err_' + Date.now(),
          type: 'error',
          message: event.message || 'Script execution error',
          file: event.filename || 'unknown',
          line: event.lineno,
          column: event.colno,
          source: 'runtime',
          timestamp: new Date().toISOString()
        }
      });
    });

    window.addEventListener('unhandledrejection', function(event) {
      notifyParent({
        type: 'KIVO_DIAGNOSTIC',
        diagnostic: {
          id: 'rej_' + Date.now(),
          type: 'error',
          message: 'Unhandled Promise: ' + (event.reason ? (event.reason.message || String(event.reason)) : 'Unknown'),
          source: 'runtime',
          timestamp: new Date().toISOString()
        }
      });
    });
  })();
</script>
<script type="text/javascript">
(async function() {
  const files = ${serializedFiles};
  const targetPackages = ${serializedPackages};

  const rootEl = document.getElementById('root');

  function renderStatusOverlay(message, isError = false) {
    if (!rootEl) return;
    if (isError) {
      rootEl.innerHTML = \`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #f87171; background: #121216; border: 1px solid #27272a; border-radius: 12px; margin: 24px; max-width: 720px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom: 12px;">
            <div style="width:10px; height:10px; border-radius:50%; background:#ef4444;"></div>
            <h3 style="margin:0; color:#ef4444; font-size: 15px; font-weight:600;">Preview Execution Error</h3>
          </div>
          <pre style="background: #09090b; padding: 14px; border-radius: 8px; font-size: 12px; overflow-x: auto; color: #fca5a5; border: 1px solid #27272a; white-space: pre-wrap; font-family: monospace;">\${message}</pre>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 12px; margin-bottom: 0;">Our AI builder detects this error and will self-correct on the next iteration.</p>
        </div>
      \`;
    }
  }

  function getCdnUrl(name) {
    // Use one canonical React URL across the renderer and every dependency.
    // esm.sh's dev variant creates a separate module URL from dependencies
    // requested with deps=react@18.3.1, which can cause invalid hook calls.
    if (name === "react") return "https://esm.sh/react@18.3.1";
    if (name === "react-dom") return "https://esm.sh/react-dom@18.3.1";
    if (name === "react-dom/client") return "https://esm.sh/react-dom@18.3.1/client";
    if (name === "react/jsx-runtime") return "https://esm.sh/react@18.3.1/jsx-runtime";
    if (name === "react/jsx-dev-runtime") return "https://esm.sh/react@18.3.1/jsx-dev-runtime";

    if (name.startsWith("@")) {
      const parts = name.split("/");
      const scopeAndName = parts.slice(0, 2).join("/");
      const sub = parts.slice(2).join("/");
      return "https://esm.sh/" + scopeAndName + (sub ? "/" + sub : "") + "?deps=react@18.3.1,react-dom@18.3.1";
    }

    const parts = name.split("/");
    const base = parts[0];
    const sub = parts.slice(1).join("/");
    return "https://esm.sh/" + base + (sub ? "/" + sub : "") + "?deps=react@18.3.1,react-dom@18.3.1";
  }

  // Preload external NPM packages from esm.sh
  const loadedPackages = {};

  try {
    await Promise.all(targetPackages.map(async (name) => {
      try {
        const cdnUrl = getCdnUrl(name);
        const mod = await import(cdnUrl);
        loadedPackages[name] = mod;
      } catch (err) {
        console.warn("Could not preload NPM package '" + name + "':", err);
      }
    }));
  } catch (err) {
    console.warn("Package preloading error:", err);
  }

  // Ensure core React & ReactDOM exist
  let ReactMod = loadedPackages['react'];
  if (!ReactMod) {
    ReactMod = await import('https://esm.sh/react@18.3.1');
    loadedPackages['react'] = ReactMod;
  }
  const ReactInstance = ReactMod.default || ReactMod;
  window.React = ReactInstance;

  let ReactDOMMod = loadedPackages['react-dom/client'] || loadedPackages['react-dom'];
  if (!ReactDOMMod) {
    ReactDOMMod = await import('https://esm.sh/react-dom@18.3.1/client');
    loadedPackages['react-dom/client'] = ReactDOMMod;
  }
  const ReactDOMInstance = ReactDOMMod.default || ReactDOMMod;
  window.ReactDOM = ReactDOMInstance;

  // Bulletproof synthetic JSX runtime
  const syntheticJsxRuntime = {
    jsx: function(type, props, key) {
      const p = props ? { ...props } : {};
      const { children, ...rest } = p;
      if (key !== undefined) rest.key = key;
      if (children === undefined) return ReactInstance.createElement(type, rest);
      if (Array.isArray(children)) return ReactInstance.createElement(type, rest, ...children);
      return ReactInstance.createElement(type, rest, children);
    },
    jsxs: function(type, props, key) {
      const p = props ? { ...props } : {};
      const { children, ...rest } = p;
      if (key !== undefined) rest.key = key;
      if (children === undefined) return ReactInstance.createElement(type, rest);
      if (Array.isArray(children)) return ReactInstance.createElement(type, rest, ...children);
      return ReactInstance.createElement(type, rest, children);
    },
    Fragment: ReactInstance.Fragment,
  };

  // Virtual path resolution
  function resolvePath(currentFile, importPath) {
    if (importPath.startsWith('@/')) {
      const stripped = importPath.slice(2);
      const tryBases = [stripped, 'app/' + stripped, 'src/' + stripped];
      const tryExtensions = ['', '.tsx', '.ts', '.jsx', '.js', '.json', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      for (const base of tryBases) {
        for (const ext of tryExtensions) {
          if (files[base + ext] !== undefined) return base + ext;
        }
      }
      return stripped;
    }

    if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('/')) {
      const parts = currentFile.split('/');
      parts.pop(); // remove filename
      const targetParts = importPath.split('/');
      for (const seg of targetParts) {
        if (seg === '.' || seg === '') continue;
        if (seg === '..') parts.pop();
        else parts.push(seg);
      }
      const basePath = parts.join('/');
      const tryExtensions = ['', '.tsx', '.ts', '.jsx', '.js', '.json', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      for (const ext of tryExtensions) {
        if (files[basePath + ext] !== undefined) return basePath + ext;
      }
      return basePath;
    }
    return importPath;
  }

  function injectCss(code) {
    const style = document.createElement('style');
    style.textContent = code;
    document.head.appendChild(style);
  }

  // Inject any standalone CSS files (e.g. src/index.css, src/App.css)
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.endsWith('.css')) {
      injectCss(content);
    }
  }

  // Module Cache & In-Memory Execution
  const moduleCache = {};

  function executeModule(filePath) {
    if (moduleCache[filePath]) {
      return moduleCache[filePath].exports;
    }

    const rawCode = files[filePath];
    if (rawCode === undefined) {
      throw new Error("Cannot find module: '" + filePath + "'");
    }

    if (filePath.endsWith('.json')) {
      try {
        const parsedJson = JSON.parse(rawCode);
        moduleCache[filePath] = { exports: parsedJson };
        return parsedJson;
      } catch (e) {
        throw new Error("Failed to parse JSON file: " + filePath);
      }
    }

    if (filePath.endsWith('.css')) {
      injectCss(rawCode);
      moduleCache[filePath] = { exports: {} };
      return {};
    }

    // Transpile using Babel with classic React runtime (so React.createElement is used)
    let transformedCode = "";
    try {
      transformedCode = Babel.transform(rawCode, {
        presets: [
          ['react', { runtime: 'classic' }],
          ['typescript', { isTSX: true, allExtensions: true }]
        ],
        plugins: ['transform-modules-commonjs'],
        filename: filePath
      }).code;
    } catch (err) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'KIVO_DIAGNOSTIC',
          diagnostic: {
            id: 'babel_' + Date.now(),
            type: 'error',
            file: filePath,
            message: err.message,
            source: 'bundler',
            timestamp: new Date().toISOString()
          }
        }, '*');
      }
      throw err;
    }

    const moduleObj = { exports: {} };
    moduleCache[filePath] = moduleObj;

    const moduleRequire = function(specifier) {
      // Relative or alias import
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('@/')) {
        const resolved = resolvePath(filePath, specifier);
        return executeModule(resolved);
      }
      if (specifier.endsWith('.css')) {
        if (files[specifier]) injectCss(files[specifier]);
        return {};
      }

      // Next.js Package Shims
      if (specifier === 'next/link') {
        const NextLink = function({ href, children, className, ...props }) {
          return ReactInstance.createElement('a', { href: href || '#', className, ...props }, children);
        };
        return { default: NextLink, __esModule: true };
      }

      if (specifier === 'next/image') {
        const NextImage = function({ src, alt, width, height, className, priority, ...props }) {
          const imgSrc = typeof src === 'object' && src !== null ? src.src : src;
          return ReactInstance.createElement('img', {
            src: imgSrc,
            alt: alt || '',
            width,
            height,
            className,
            loading: priority ? 'eager' : 'lazy',
            ...props
          });
        };
        return { default: NextImage, __esModule: true };
      }

      if (specifier === 'next/navigation') {
        const mockRouter = {
          push: function(url) { window.location.hash = url; },
          replace: function(url) { window.location.hash = url; },
          back: function() { window.history.back(); },
          forward: function() { window.history.forward(); },
          refresh: function() {},
          prefetch: function() {},
        };
        return {
          useRouter: function() { return mockRouter; },
          usePathname: function() { return window.location.pathname || '/'; },
          useSearchParams: function() { return new URLSearchParams(window.location.search); },
          useParams: function() { return {}; },
          redirect: function(url) { window.location.href = url; },
          notFound: function() {},
          __esModule: true
        };
      }

      if (specifier.startsWith('next/font')) {
        const fontMock = function() {
          return {
            className: 'font-sans',
            variable: '--font-sans',
            style: { fontFamily: 'Inter, system-ui, sans-serif' }
          };
        };
        return new Proxy({}, {
          get: function() { return fontMock; }
        });
      }

      if (specifier === 'next/head') {
        const NextHead = function() { return null; };
        return { default: NextHead, __esModule: true };
      }

      // JSX Runtime support
      if (specifier === 'react/jsx-runtime' || specifier === 'react/jsx-dev-runtime') {
        const preloaded = loadedPackages[specifier];
        return {
          ...syntheticJsxRuntime,
          ...(preloaded || {}),
          ...(preloaded?.default || {}),
          jsx: preloaded?.jsx || preloaded?.default?.jsx || syntheticJsxRuntime.jsx,
          jsxs: preloaded?.jsxs || preloaded?.default?.jsxs || syntheticJsxRuntime.jsxs,
          Fragment: preloaded?.Fragment || preloaded?.default?.Fragment || syntheticJsxRuntime.Fragment,
        };
      }

      // React & ReactDOM
      if (specifier === 'react') return ReactInstance;
      if (specifier === 'react-dom') return ReactDOMInstance;
      if (specifier === 'react-dom/client') return ReactDOMInstance;

      // Preloaded NPM package
      if (loadedPackages[specifier]) {
        return loadedPackages[specifier];
      }

      // Check subpath packages e.g. "lucide-react/icons"
      const rootPkg = specifier.split('/')[0];
      if (loadedPackages[rootPkg]) {
        return loadedPackages[rootPkg];
      }

      // Fallback globals
      if (specifier === 'lucide-react') return loadedPackages['lucide-react'] || window.LucideReact;

      console.warn("Unresolved package: " + specifier);
      return {};
    };

    const dirName = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
    // Pass React explicitly into function scope so React.createElement is always defined
    const fn = new Function('React', 'exports', 'require', 'module', '__filename', '__dirname', transformedCode);
    fn(ReactInstance, moduleObj.exports, moduleRequire, moduleObj, filePath, dirName);

    return moduleObj.exports;
  }

  try {
    let mounted = false;

    // 1. Next.js App Router entry point: app/page.tsx or src/app/page.tsx
    const nextAppPage = files['app/page.tsx']
      ? 'app/page.tsx'
      : (files['app/page.jsx']
        ? 'app/page.jsx'
        : (files['src/app/page.tsx'] ? 'src/app/page.tsx' : null));

    if (nextAppPage) {
      try {
        const pageModule = executeModule(nextAppPage);
        const PageComponent = pageModule.default || pageModule.Home || pageModule.App;
        if (!PageComponent) {
          throw new Error(nextAppPage + " does not export a default React component.");
        }

        let elementToMount = ReactInstance.createElement(PageComponent);

        // Check for RootLayout (app/layout.tsx or src/app/layout.tsx)
        const nextLayoutPath = files['app/layout.tsx']
          ? 'app/layout.tsx'
          : (files['app/layout.jsx']
            ? 'app/layout.jsx'
            : (files['src/app/layout.tsx'] ? 'src/app/layout.tsx' : null));

        if (nextLayoutPath) {
          try {
            const layoutModule = executeModule(nextLayoutPath);
            const LayoutComponent = layoutModule.default || layoutModule.RootLayout;
            if (LayoutComponent) {
              elementToMount = ReactInstance.createElement(LayoutComponent, null, elementToMount);
            }
          } catch (layoutErr) {
            console.warn("Layout execution failed, mounting page directly:", layoutErr);
          }
        }

        if (rootEl) {
          const root = ReactDOMInstance.createRoot ? ReactDOMInstance.createRoot(rootEl) : ReactDOMInstance.render(elementToMount, rootEl);
          if (ReactDOMInstance.createRoot) {
            root.render(elementToMount);
          }
          mounted = true;
        }
      } catch (pageErr) {
        console.warn("Next.js App Router mount failed, checking Vite entry points:", pageErr);
      }
    }

    // 2. Vite / SPA entry points: src/main.tsx or src/App.tsx
    if (!mounted && (files['src/main.tsx'] || files['src/main.jsx'])) {
      const mainPath = files['src/main.tsx'] ? 'src/main.tsx' : 'src/main.jsx';
      try {
        executeModule(mainPath);
        mounted = true;
      } catch (mainErr) {
        console.warn("Error running " + mainPath + ", falling back to mounting src/App.tsx directly:", mainErr);
      }
    }

    if (!mounted) {
      const appPath = files['src/App.tsx'] ? 'src/App.tsx' : (files['src/App.jsx'] ? 'src/App.jsx' : null);
      if (!appPath) {
        throw new Error("No entry point found. Expected 'app/page.tsx', 'src/App.tsx', or 'src/main.tsx'.");
      }

      const appModule = executeModule(appPath);
      const AppComponent = appModule.default || appModule.App;

      if (!AppComponent) {
        throw new Error(appPath + " does not export a default React component.");
      }

      if (rootEl) {
        const root = ReactDOMInstance.createRoot ? ReactDOMInstance.createRoot(rootEl) : ReactDOMInstance.render(ReactInstance.createElement(AppComponent), rootEl);
        if (ReactDOMInstance.createRoot) {
          root.render(ReactInstance.createElement(AppComponent));
        }
      }
    }

    // Report clean build to parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'KIVO_DIAGNOSTIC_CLEAN',
        timestamp: new Date().toISOString()
      }, '*');
    }
  } catch (err) {
    console.error("Preview render failed:", err);
    renderStatusOverlay(err.message || String(err), true);
  }
})();
</script>
`;

  // Insert before </body> or append
  if (indexHtml.includes("</body>")) {
    return indexHtml.replace("</body>", `${runtimeScript}</body>`);
  }
  return indexHtml + runtimeScript;
}
