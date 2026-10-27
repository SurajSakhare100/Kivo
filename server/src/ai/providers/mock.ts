import { AIProvider, AIRequestContext, StreamEvent } from "./base";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockProvider implements AIProvider {
  name = "Mock AI Provider (Offline / Zero Cost)";
  isMock = true;

  async *generate(context: AIRequestContext): AsyncGenerator<StreamEvent, void, unknown> {
    const startTime = Date.now();
    const prompt = context.prompt.toLowerCase();

    // 1. Planning phase
    yield {
      type: "status",
      status: "planning",
      message: "Analyzing your request and planning component architecture...",
    };
    await delay(350);

    const plan = `Plan for: "${context.prompt}"
1. Inspect project directory and read current src/App.tsx.
2. Develop tailored UI components with Tailwind CSS and Lucide icons.
3. Add interactive local state (filters, counters, forms, toggles).
4. Run preview validation and diagnostics.`;

    yield {
      type: "plan",
      plan,
    };
    await delay(350);

    // 2. Tool call: list_files
    const listId = "mock_call_" + Math.random().toString(36).substring(2, 8);
    yield {
      type: "tool_call",
      id: listId,
      tool: "list_files",
      args: { pathPrefix: "src/" },
    };
    await delay(250);

    const existingFiles = Object.keys(context.files);
    yield {
      type: "tool_result",
      id: listId,
      tool: "list_files",
      result: { files: existingFiles },
    };
    await delay(250);

    // 3. Tool call: read_file (inspect existing code)
    const targetPath = context.files["app/page.tsx"] !== undefined ? "app/page.tsx" : "src/App.tsx";
    const readId = "mock_call_" + Math.random().toString(36).substring(2, 8);
    yield {
      type: "tool_call",
      id: readId,
      tool: "read_file",
      args: { path: targetPath },
    };
    await delay(250);

    yield {
      type: "tool_result",
      id: readId,
      tool: "read_file",
      result: (context.files[targetPath] || "").slice(0, 200) + "… [inspected]",
    };
    await delay(250);

    // 4. Generate customized code based on prompt keywords
    yield {
      type: "status",
      status: "editing",
      message: "Writing custom React components and updating styles...",
    };

    let generatedAppCode = "";
    let summaryText = "";

    if (prompt.includes("dashboard") || prompt.includes("analytics")) {
      generatedAppCode = `import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Bell, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function App() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [filterQuery, setFilterQuery] = useState('');

  const metrics = [
    { title: 'Total Revenue', value: '$48,290', change: '+14.2%', isPositive: true, icon: DollarSign },
    { title: 'Active Users', value: '2,845', change: '+28.4%', isPositive: true, icon: Users },
    { title: 'Conversion Rate', value: '3.64%', change: '-0.8%', isPositive: false, icon: TrendingUp },
    { title: 'Avg. Order Value', value: '$134.50', change: '+5.1%', isPositive: true, icon: BarChart3 },
  ];

  const recentTransactions = [
    { id: 'TX-901', customer: 'Acme Corp', product: 'Enterprise Tier', amount: '$2,400', status: 'Completed', date: 'Just now' },
    { id: 'TX-902', customer: 'Sarah Jenkins', product: 'Pro Subscription', amount: '$49', status: 'Completed', date: '12m ago' },
    { id: 'TX-903', customer: 'Pulse Labs', product: 'API Usage Pack', amount: '$380', status: 'Processing', date: '1h ago' },
    { id: 'TX-904', customer: 'Nova Studio', product: 'Annual License', amount: '$990', status: 'Completed', date: '3h ago' },
  ];

  const filtered = recentTransactions.filter(t => 
    t.customer.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.product.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <header className="h-16 border-b border-neutral-800 bg-[#0d0d12]/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
            K
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">MetricsOS</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
            Live v2.4
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search metrics..." 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 w-48 sm:w-64"
            />
          </div>
          <button className="w-8 h-8 rounded-lg border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Executive Overview</h1>
            <p className="text-xs text-neutral-400 mt-1">Real-time performance and financial KPIs.</p>
          </div>
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={\`px-3 py-1 rounded text-xs font-medium transition \${
                  timeRange === r ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }\`}
              >
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last quarter'}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="p-5 rounded-xl border border-neutral-800/80 bg-[#111116] hover:border-neutral-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400">{m.title}</span>
                  <div className="w-7 h-7 rounded-lg bg-neutral-800/60 flex items-center justify-center text-neutral-300">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white tracking-tight">{m.value}</span>
                  <span className={\`inline-flex items-center gap-0.5 text-xs font-medium \${
                    m.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }\`}>
                    {m.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {m.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Data Table */}
        <div className="rounded-xl border border-neutral-800 bg-[#111116] overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
            </div>
            <span className="text-xs text-neutral-500">{filtered.length} records found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/60 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/30 transition">
                    <td className="py-3 px-4 font-mono text-neutral-400">{item.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{item.customer}</td>
                    <td className="py-3 px-4 text-neutral-300">{item.product}</td>
                    <td className="py-3 px-4 font-semibold text-white">{item.amount}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-500">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}`;
      summaryText = "Created a full dark analytics dashboard with KPI cards, live time filter, searchable transaction log, and Lucide icons.";
    } else if (prompt.includes("portfolio") || prompt.includes("developer")) {
      generatedAppCode = `import React, { useState } from 'react';
import { 
  Code2, 
  ExternalLink, 
  Github, 
  Mail, 
  Sparkles, 
  Terminal, 
  FolderGit2, 
  Check, 
  ArrowUpRight 
} from 'lucide-react';

export default function App() {
  const [filter, setFilter] = useState<'all' | 'frontend' | 'ai'>('all');
  const [copied, setCopied] = useState(false);

  const projects = [
    {
      title: 'NeuralCanvas',
      description: 'Generative UI engine creating components in real-time with WebAssembly.',
      tags: ['TypeScript', 'WebGL', 'AI'],
      category: 'ai',
      stars: 482,
    },
    {
      title: 'Kivo Studio',
      description: 'Local-first browser IDE running React sandboxes with instant HMR.',
      tags: ['React 19', 'IndexedDB', 'Tailwind'],
      category: 'frontend',
      stars: 1250,
    },
    {
      title: 'VectorFlow',
      description: 'High-throughput embeddings search engine for serverless workers.',
      tags: ['Rust', 'Python', 'Wasm'],
      category: 'ai',
      stars: 890,
    },
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('alex@engineer.dev');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-[#050507] text-neutral-200 antialiased selection:bg-emerald-500 selection:text-black">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Header / Intro */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Available for select projects
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
            Alex Rivera <span className="text-neutral-500">— Full-stack developer & UI designer.</span>
          </h1>

          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Building high-performance web applications, local-first architectures, and intuitive developer tools.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button 
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              {copied ? 'Copied alex@engineer.dev' : 'alex@engineer.dev'}
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </header>

        {/* Featured Projects */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-neutral-400 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              Featured Projects
            </h2>
            <div className="flex gap-1.5">
              {(['all', 'frontend', 'ai'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={\`text-xs px-2.5 py-1 rounded capitalize transition \${
                    filter === tab ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }\`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map(project => (
              <div 
                key={project.title}
                className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/30 hover:border-neutral-700 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="font-mono text-emerald-400">★ {project.stars}</span>
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="font-medium text-white text-base mb-1.5">{project.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">{project.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800/60">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack Pills */}
        <section className="p-6 rounded-2xl border border-neutral-800 bg-[#0d0d12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Core Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vite', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'].map(tech => (
              <span key={tech} className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}`;
      summaryText = "Designed a sleek developer portfolio with project category filters, interactive email clipboard button, and technical badge showcase.";
    } else {
      // General responsive landing page / web app
      generatedAppCode = `import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Star,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Zap,
      title: 'Instant Execution',
      desc: 'Build, compile, and run client code directly in the sandbox with zero lag.'
    },
    {
      icon: ShieldCheck,
      title: 'Isolated & Secure',
      desc: 'Local-first architecture ensures your code and data stay private in your browser.'
    },
    {
      icon: Layers,
      title: 'Component Library',
      desc: 'Pre-styled components powered by Tailwind CSS and modern React hooks.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
      {/* Navigation */}
      <nav className="h-16 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/20">
              K
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Nova App</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a href="#features" className="text-neutral-400 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-neutral-400 hover:text-white transition">Pricing</a>
            <button className="bg-white text-black font-semibold px-3.5 py-1.5 rounded-lg hover:bg-neutral-200 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Crafted for rapid product validation
        </div>

        <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">
          The modern platform for building ideas into reality.
        </h1>

        <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Create, iterate, and preview responsive React applications directly in your browser with automated hot reload.
        </p>

        {/* Call to action form */}
        <div className="pt-4 max-w-md mx-auto">
          {subscribed ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Thank you! Your spot is confirmed.
            </div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
              className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5"
            >
              <input 
                type="email" 
                placeholder="Enter your email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none flex-1"
              />
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5"
              >
                Start Free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Feature Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="p-6 rounded-2xl border border-neutral-800/80 bg-[#0d0d12] hover:border-neutral-700 transition space-y-3"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-800/80 text-emerald-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-medium text-white">{feat.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Toggle */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8 w-full">
        <div>
          <h2 className="text-2xl sm:text-3xl font-medium text-white">Simple, transparent plans</h2>
          <p className="text-xs text-neutral-400 mt-2">Zero hidden fees. Cancel anytime.</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={\`px-3 py-1 text-xs rounded transition \${
              billingCycle === 'monthly' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }\`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={\`px-3 py-1 text-xs rounded transition \${
              billingCycle === 'yearly' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }\`}
          >
            Yearly (Save 20%)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-[#0d0d12] space-y-4">
            <h4 className="text-sm font-medium text-neutral-300">Starter</h4>
            <div className="text-3xl font-bold text-white">
              {billingCycle === 'yearly' ? '$12' : '$15'}
              <span className="text-xs font-normal text-neutral-500">/mo</span>
            </div>
            <ul className="text-xs text-neutral-400 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 5 Active Projects</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Previews</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Local Undo History</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-emerald-500/40 bg-[#0d0d12] space-y-4 relative">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </div>
            <h4 className="text-sm font-medium text-white">Pro Creator</h4>
            <div className="text-3xl font-bold text-white">
              {billingCycle === 'yearly' ? '$29' : '$36'}
              <span className="text-xs font-normal text-neutral-500">/mo</span>
            </div>
            <ul className="text-xs text-neutral-300 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Projects</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full Code Export</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom Domain Support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 text-center text-xs text-neutral-600 mt-auto">
        Built with Kivo Local-first AI App Builder
      </footer>
    </div>
  );
}`;
      summaryText = `Applied custom modifications tailored to "${context.prompt}". Updated ${targetPath} with responsive sections, active state handlers, and Tailwind CSS.`;
    }

    // Yield file change event
    yield {
      type: "file_change",
      action: "update",
      path: targetPath,
      content: generatedAppCode,
      explanation: summaryText,
    };
    await delay(300);

    // Diagnostics tool call
    const diagId = "mock_call_" + Math.random().toString(36).substring(2, 8);
    yield {
      type: "tool_call",
      id: diagId,
      tool: "get_diagnostics",
      args: { filter: "errors_only" },
    };
    await delay(200);

    yield {
      type: "tool_result",
      id: diagId,
      tool: "get_diagnostics",
      result: { diagnostics: [], status: "Zero syntax or bundler errors." },
    };
    await delay(200);

    // Build status
    yield {
      type: "status",
      status: "building",
      message: "Bundling code and updating live preview...",
    };
    await delay(300);

    const durationSec = Math.round((Date.now() - startTime) / 100) / 10;
    const finalSummary = `${summaryText}

> **Note**: Running in **Mock Mode** (zero cost). To enable real AI generation powered by Groq, add \`GROQ_API_KEY\` to your \`.env\` file.`;

    yield {
      type: "summary",
      summary: finalSummary,
      tokensUsed: 620,
      generationTime: durationSec,
    };

    yield {
      type: "status",
      status: "completed",
      message: "Ready! Live preview updated.",
    };
  }
}
