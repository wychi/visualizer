import React from 'react';

export type PageDef = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  render: () => React.ReactNode;
};

const pages: PageDef[] = [
  {
    key: 'dummy1',
    label: 'Dummy Subpage 1',
    icon: (
      <svg width="100" height="100" viewBox="0 0 40 40" fill="none">
        <rect x="2" y="2" width="36" height="36" rx="8" fill="#f59e42"/>
        <circle cx="20" cy="20" r="10" fill="#fff" stroke="#f59e42" strokeWidth="2"/>
        <text x="20" y="25" textAnchor="middle" fontSize="14" fill="#f59e42" fontFamily="Arial">1</text>
      </svg>
    ),
    render: () => (
      <div className="p-6 rounded-xl bg-gray-100 text-gray-700">
        <h2 className="text-xl font-semibold mb-2">Dummy Subpage 1</h2>
        <p>This is a placeholder for a future tool or visualizer.</p>
      </div>
    ),
  },
  {
    key: 'dummy2',
    label: 'Dummy Subpage 2',
    icon: (
      <svg width="100" height="100" viewBox="0 0 40 40" fill="none">
        <rect x="2" y="2" width="36" height="36" rx="8" fill="#10b981"/>
        <circle cx="20" cy="20" r="10" fill="#fff" stroke="#10b981" strokeWidth="2"/>
        <text x="20" y="25" textAnchor="middle" fontSize="14" fill="#10b981" fontFamily="Arial">2</text>
      </svg>
    ),
    render: () => (
      <div className="p-6 rounded-xl bg-gray-100 text-gray-700">
        <h2 className="text-xl font-semibold mb-2">Dummy Subpage 2</h2>
        <p>This is another placeholder for a future tool or visualizer.</p>
      </div>
    ),
  },
];

export default pages;
