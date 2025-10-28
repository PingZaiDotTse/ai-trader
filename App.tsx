import React from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <main>
        <Dashboard />
      </main>
    </div>
  );
};

export default App;