import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-slate-900 border-t border-slate-800 text-center text-slate-400 text-sm mt-8">
      <span>© {new Date().getFullYear()} AsQue. All rights reserved.</span>
    </footer>
  );
} 