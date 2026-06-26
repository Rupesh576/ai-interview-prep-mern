import { Brain, CheckCircle2, PlayCircle } from 'lucide-react';

const features = [
  'Create role-based mock interviews',
  'Practice one question at a time',
  'Review AI feedback and scores'
];

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <Brain size={18} />
            AI Interview Preparation
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            Practice interviews with focused questions and actionable feedback.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This MERN app will help users create mock interview sessions, answer AI-generated questions, and track progress over time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
              <PlayCircle size={20} />
              Start Building
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <CheckCircle2 className="mb-4 text-cyan-300" size={24} />
              <p className="text-sm font-medium text-slate-100">{feature}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;

