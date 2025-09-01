import { useState } from 'react'
import './App.css'
import pages from './pages'


import { useEffect } from 'react';

function App() {
  // Use hash for routing
  const [page, setPage] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  // Update hash when page changes
  useEffect(() => {
    if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = page;
    }
  }, [page]);

  // Listen to hash changes (browser navigation)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setPage(hash || 'home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Main page hidden when subpage is open
  const isHome = page === 'home';

  return (
    <>
      {isHome && (
        <>
          <h1 className="text-2xl font-bold mb-4">Visualizer Playground</h1>
          <div className="my-8 flex gap-6">
            {pages.map((p) => (
              <button
                key={p.key}
                className="flex flex-col items-center justify-center w-[100px] h-[100px] rounded-xl border bg-white shadow hover:bg-blue-50 focus:outline-none"
                onClick={() => setPage(p.key)}
              >
                {p.icon}
                <span className="mt-2 text-sm font-medium text-gray-700 text-center">{p.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Page Content */}
      {!isHome && pages.map((p) =>
        page === p.key ? (
          <div className="my-8" key={p.key}>
            {p.render()}
            <button
              className="mt-4 px-3 py-1 rounded border bg-gray-50"
              onClick={() => setPage('home')}
            >Back to Home</button>
          </div>
        ) : null
      )}
    </>
  );
}

export default App
