import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Mail, MessageSquare } from 'lucide-react';

const faqs = [
  { q: 'What file formats are supported for workload upload?', a: 'CSV and JSON files are supported. CSV must have columns: id, cpu, memory, duration, priority. JSON should be an array of workload objects with the same fields.' },
  { q: 'What is an emergency workload?', a: 'Emergency workloads have the highest scheduling priority. If no server capacity is available, the scheduler will preempt (pause) lower-priority workloads to accommodate emergency tasks.' },
  { q: 'How does the scheduling algorithm work?', a: 'The system uses a multi-dimensional knapsack algorithm. Workloads are sorted by value-to-weight ratio (CPU + memory), then greedily assigned to servers. Emergency workloads are processed first and can preempt others.' },
  { q: 'How is workload pricing calculated?', a: 'Price = Base rate ($0.10) + (CPU × $0.05 + Memory × $0.01) × duration in hours. Emergency and high-priority workloads may have higher effective costs due to preemption overhead.' },
  { q: 'Where are uploaded files stored?', a: 'Files are stored in the cloud storage (mock S3 in development). Each batch gets a unique ID and both input and output files are accessible via download links.' },
  { q: 'Can I change server configuration after uploading workloads?', a: 'Yes. You can update server resources at any time from the Configure Resources page. New scheduling runs will use the latest configuration.' },
  { q: 'What does "Preempted" status mean?', a: 'A preempted workload was initially accepted but was paused to free up resources for a higher-priority (emergency) workload.' },
];

function FAQ({ q, a }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl overflow-hidden border ${theme.divider}`}>
      <button onClick={() => setOpen(v => !v)} className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5`}>
        <span className={`font-medium text-sm ${theme.heading}`}>{q}</span>
        {open ? <ChevronUp size={16} className={theme.subtext} /> : <ChevronDown size={16} className={theme.subtext} />}
      </button>
      {open && (
        <div className={`px-5 pb-4 text-sm leading-relaxed border-t pt-3 ${theme.subtext} ${theme.divider}`}>{a}</div>
      )}
    </div>
  );
}

export default function Help() {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className={`text-2xl font-bold ${theme.heading}`}>Help & Documentation</h1>
        <p className={`text-sm mt-1 ${theme.subtext}`}>Everything you need to use CloudOpt effectively.</p>
      </div>

      {/* Quick start */}
      <div className={`rounded-2xl p-6 border ${theme.card}`}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-cyan-400" />
          <h2 className={`font-semibold ${theme.heading}`}>Quick Start Guide</h2>
        </div>
        <ol className="space-y-3">
          {[
            ['Configure Resources', 'Go to Configure Resources and set the number of servers, CPU cores, and memory per server.'],
            ['Prepare Your Workload File', 'Create a CSV or JSON file with workload definitions. Each workload needs: id, cpu, memory, duration, priority.'],
            ['Upload Workloads', 'Go to Upload Workloads, select your file, optionally mark as emergency, and click Upload.'],
            ['Run the Scheduler', 'After upload, click "Run Scheduler" to process the workloads using the knapsack algorithm.'],
            ['View Results', 'Navigate to Scheduled Workloads to see allocations, pricing, and server assignments.'],
            ['Download Reports', 'From History or Scheduled Workloads, download input/output files for record keeping.'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 bg-cyan-500/15 text-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <span className={`font-medium text-sm ${theme.label}`}>{title}: </span>
                <span className={`text-sm ${theme.subtext}`}>{desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Sample file */}
      <div className={`rounded-2xl p-6 border ${theme.card}`}>
        <h2 className={`font-semibold mb-3 ${theme.heading}`}>Sample Workload Files</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className={`text-xs font-semibold mb-2 ${theme.subtext}`}>workloads.csv</p>
            <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">{`id,cpu,memory,duration,priority
w001,4,8,2,normal
w002,8,16,1,high
w003,2,4,3,normal
w004,16,32,1,emergency`}</pre>
          </div>
          <div>
            <p className={`text-xs font-semibold mb-2 ${theme.subtext}`}>workloads.json</p>
            <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">{`[
  {"id":"w001","cpu":4,
   "memory":8,"duration":2,
   "priority":"normal"},
  {"id":"w002","cpu":8,
   "memory":16,"duration":1,
   "priority":"high"}
]`}</pre>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle size={18} className="text-cyan-400" />
          <h2 className={`font-semibold ${theme.heading}`}>Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => <FAQ key={i} {...faq} />)}
        </div>
      </div>

      {/* Contact */}
      <div className={`rounded-2xl p-6 border ${theme.card}`}>
        <h2 className={`font-semibold mb-4 ${theme.heading}`}>Need More Help?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.03]">
            <Mail size={20} className="text-cyan-400" />
            <div>
              <p className={`font-medium text-sm ${theme.label}`}>Email Support</p>
              <p className={`text-xs ${theme.subtext}`}>support@cloudopt.io</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.03]">
            <MessageSquare size={20} className="text-cyan-400" />
            <div>
              <p className={`font-medium text-sm ${theme.label}`}>Live Chat</p>
              <p className={`text-xs ${theme.subtext}`}>Available Mon–Fri, 9am–6pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

