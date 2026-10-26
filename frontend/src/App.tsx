import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { LandingPage } from './components/LandingPage';
import { LigandDetail } from './components/LigandDetail';
import { CustomCompoundTester } from './components/CustomCompoundTester';
import { CustomComputingWorkspace } from './components/CustomComputingWorkspace';
import { AuthModal } from './components/AuthModal';
import { Moon, Sun, Zap } from 'lucide-react';

import { SwissTargetPredictionPage } from './components/SwissTargetPredictionPage';
import { LiveDockingStudio } from './components/LiveDockingStudio';

export type ThemeMode = 'dark' | 'light' | 'cyber';

const App = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'detail' | 'custom-workspace' | 'swisstarget' | 'live-docking'>('landing');
  const [selectedOrganism, setSelectedOrganism] = useState<string>('pseudomonas');
  const [selectedTarget, setSelectedTarget] = useState<string>('PqsR');
  const [detailTarget, setDetailTarget] = useState('');
  const [detailLigand, setDetailLigand] = useState('');
  const [customRunTarget, setCustomRunTarget] = useState('PqsR');
  const [customRunCompound, setCustomRunCompound] = useState('andrographolide');
  const [customRunName, setCustomRunName] = useState('Andrographolide (Kalmegh Lead)');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isCustomTesterOpen, setIsCustomTesterOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<{ email: string; role: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('mevreon_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleOpenCustomTester = () => {
    if (!authUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsCustomTesterOpen(true);
    }
  };

  // ── Theme Switcher ──
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'cyber');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'cyber') {
      root.classList.add('dark', 'cyber');
    } else {
      root.classList.add('light');
    }
  }, [theme]);

  // ── Shareable Deep Link Parsing (URL Hash) ──
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash) {
        const parts = hash.split('/');
        if (parts[0] && ['pseudomonas', 'staphylococcus', 'klebsiella'].includes(parts[0])) {
          setSelectedOrganism(parts[0]);
          if (parts[1]) setSelectedTarget(parts[1]);
          if (parts[2]) {
            setDetailTarget(parts[1] || 'PqsR');
            setDetailLigand(parts[2]);
            setCurrentView('detail');
            return;
          }
          setCurrentView('dashboard');
        }
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // ── Synchronize URL Hash & Scroll to Top on View Change ──
  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentView === 'landing') {
      window.location.hash = '';
    } else if (currentView === 'dashboard') {
      window.location.hash = `#/${selectedOrganism}/${selectedTarget}`;
    } else if (currentView === 'detail' && detailTarget && detailLigand) {
      window.location.hash = `#/${selectedOrganism}/${detailTarget}/${detailLigand}`;
    }
  }, [currentView, selectedOrganism, selectedTarget, detailTarget, detailLigand]);

  // ── Global Keyboard Shortcuts (Escape key for back navigation) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentView === 'detail') {
          setCurrentView('dashboard');
        } else if (currentView === 'dashboard') {
          setCurrentView('landing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  const handleSelectOrganism = (organismId: string, targetId?: string) => {
    setSelectedOrganism(organismId);
    if (targetId) {
      setSelectedTarget(targetId);
    } else {
      if (organismId === 'pseudomonas') setSelectedTarget('PqsR');
      else if (organismId === 'staphylococcus') setSelectedTarget('AgrA');
      else if (organismId === 'klebsiella') setSelectedTarget('MrkH');
    }
    setCurrentView('dashboard');
  };

  const handleOpenDetail = (targetId: string, ligandId: string) => {
    setDetailTarget(targetId);
    setDetailLigand(ligandId);
    setCurrentView('detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  return (
    <div className="w-full min-h-screen relative transition-colors duration-300">
      <div key={currentView} className="view-transition w-full min-h-screen">
        {currentView === 'landing' ? (
          <LandingPage
            onSelectOrganism={handleSelectOrganism}
            onOpenCustomTester={handleOpenCustomTester}
            onOpenSwissTarget={() => setCurrentView('swisstarget')}
            onOpenLiveStudio={() => setCurrentView('live-docking')}
          />
        ) : currentView === 'dashboard' ? (
          <Dashboard
            initialOrganism={selectedOrganism}
            initialTarget={selectedTarget}
            onOpenDetail={handleOpenDetail}
            onBackToLanding={handleBackToLanding}
            onOpenLiveStudio={() => setCurrentView('live-docking')}
          />
        ) : currentView === 'live-docking' ? (
          <LiveDockingStudio
            onBack={handleBackToDashboard}
            onBackToLanding={handleBackToLanding}
          />
        ) : currentView === 'custom-workspace' ? (
          <CustomComputingWorkspace
            targetId={customRunTarget}
            compoundId={customRunCompound}
            compoundName={customRunName}
            onBack={handleBackToDashboard}
            onViewPassport={handleOpenDetail}
          />
        ) : currentView === 'swisstarget' ? (
          <SwissTargetPredictionPage onBackToLanding={handleBackToLanding} />
        ) : (
          <LigandDetail
            targetId={detailTarget}
            ligandId={detailLigand}
            onBack={handleBackToDashboard}
          />
        )}
      </div>

      {/* Auth Gate Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(user) => {
          setAuthUser(user);
          setIsAuthModalOpen(false);
          setIsCustomTesterOpen(true);
        }}
      />

      {/* Global Custom Compound Tester Modal */}
      <CustomCompoundTester
        isOpen={isCustomTesterOpen}
        onClose={() => setIsCustomTesterOpen(false)}
        onRunSuccess={(customData) => {
          setCustomRunTarget(customData.targetId);
          setCustomRunCompound(customData.compoundId);
          setCustomRunName(customData.compoundName);
          setCurrentView('custom-workspace');
          setIsCustomTesterOpen(false);
        }}
        availableTargets={[
          { id: 'PqsR', label: 'PqsR / MvfR' },
          { id: 'LasR', label: 'LasR' },
          { id: 'PelD', label: 'PelD' },
          { id: 'MexB', label: 'MexB' },
          { id: 'AgrA', label: 'AgrA' },
          { id: 'SrtA', label: 'Sortase A' },
          { id: 'MecA', label: 'PBP2a' },
          { id: 'MurJ', label: 'MurJ' },
          { id: 'MrkH', label: 'MrkH' },
          { id: 'Wzc', label: 'Wzc' },
          { id: 'AcrB', label: 'AcrB' },
          { id: 'OmpK36', label: 'OmpK36' }
        ]}
      />

      {/* Floating 3-Way Theme Switcher */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl bg-slate-900/90 dark:bg-slate-900/90 border border-slate-700 dark:border-cyan-500/50 backdrop-blur-md no-print">
        <button
          onClick={() => setTheme('dark')}
          title="Classic Dark Theme"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            theme === 'dark'
              ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTheme('light')}
          title="Clean Light Theme"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTheme('cyber')}
          title="Cyberpunk Midnight Theme"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            theme === 'cyber'
              ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default App;
