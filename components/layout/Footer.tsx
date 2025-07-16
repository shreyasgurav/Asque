export default function Footer() {
  return (
    <footer className="w-full py-6 flex flex-col items-center justify-center bg-slate-900/90 border-t border-slate-800/50">
      <div className="flex items-center gap-2">
        <img src="/AsQue Logo NoBG.png" alt="AsQue Logo" className="w-8 h-8 rounded-xl" />
        <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">AsQue</span>
              </div>
      <div className="mt-2 text-xs text-slate-400 flex flex-col items-center">
        <span className="mt-1">
          Build By{' '}
          <a
            href="https://www.linkedin.com/in/shreyasdgurav/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline hover:text-blue-300 font-semibold"
          >
            Shreyas Gurav
          </a>
                </span>
      </div>
    </footer>
  );
} 