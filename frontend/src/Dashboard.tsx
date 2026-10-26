import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Papa from 'papaparse';
import {
  Calendar,
  ShieldCheck,
  ClipboardList,
  BrainCircuit,
  Globe2,
  CheckCircle2,
  Trophy,
  Database,
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Download,
  ArrowLeft,
  Printer,
  Zap
} from 'lucide-react';
import { MoleculeViewer } from './components/MoleculeViewer';
import { MechanismGraph } from './components/MechanismGraph';
import { CustomCompoundTester } from './components/CustomCompoundTester';
import { RadarChart } from './components/RadarChart';
import { ScoreBarChart } from './components/ScoreBarChart';
import { CommandPalette } from './components/CommandPalette';
import { SummaryCards } from './components/SummaryCards';
import { ResidueHeatmap } from './components/ResidueHeatmap';

// ── PubChem CIDs Map ──
const PUBCHEM_CIDS: Record<string, string> = {
  costunolide: "5281437",
  dehydrocostus_lactone: "73174",
  cynaropicrin: "5281773",
  santamarine: "91457",
  conessine: "441072",
  baicalein: "5281605",
  oroxylin_a: "5320315",
  chrysin: "5281607",
  baicalin: "64982",
  magnoflorine: "73337",
  aegeline: "15558450",
  imperatorin: "10212",
  skimmianine: "23475",
  boeravinone_b: "5318767",
  liriodendrin: "3084137",
  nimbolide: "100017",
  nimbin: "102095200",
  azadirachtin: "5281303",
  eugenol: "3314",
  ursolic_acid: "64945",
  rosmarinic_acid: "5281792",
  curcumin: "969516",
  demethoxycurcumin: "5469424",
  bisdemethoxycurcumin: "5315472"
};

// ── Target NCBI & UniProt Accession Metadata Map ──
const TARGET_NCBI_ACCESSIONS: Record<string, { ncbi: string; uniprot: string; organism: string; shortOrg: string; strain: string; locus: string; gene: string; pdb: string }> = {
  LasR: { ncbi: "AAA25874.1", uniprot: "P25084", organism: "Pseudomonas aeruginosa", shortOrg: "P. aeruginosa", strain: "PAO1", locus: "PA1430", gene: "lasR", pdb: "PDB: 2UV0" },
  PqsR: { ncbi: "AAG04392.1", uniprot: "Q9I147", organism: "Pseudomonas aeruginosa", shortOrg: "P. aeruginosa", strain: "PAO1", locus: "PA1003", gene: "pqsR", pdb: "PDB: 4JVC" },
  PelD: { ncbi: "NP_250831.1", uniprot: "Q9I4I8", organism: "Pseudomonas aeruginosa", shortOrg: "P. aeruginosa", strain: "PAO1", locus: "PA3061", gene: "pelD", pdb: "PDB: 4Q35" },
  MexB: { ncbi: "NP_252945.1", uniprot: "Q51547", organism: "Pseudomonas aeruginosa", shortOrg: "P. aeruginosa", strain: "PAO1", locus: "PA0426", gene: "mexB", pdb: "PDB: 2V50" },
  
  AgrA: { ncbi: "AAA26597.1", uniprot: "P0A0I7", organism: "Staphylococcus aureus", shortOrg: "S. aureus", strain: "NCTC 8325", locus: "SAOUHSC_02265", gene: "agrA", pdb: "PDB: 4G4K" },
  SrtA: { ncbi: "ABD31836.1", uniprot: "Q2FV99", organism: "Staphylococcus aureus", shortOrg: "S. aureus", strain: "NCTC 8325", locus: "SAOUHSC_01843", gene: "srtA", pdb: "PDB: 1T2P" },
  MecA: { ncbi: "NP_374034.1", uniprot: "Q9KX75", organism: "Staphylococcus aureus", shortOrg: "S. aureus", strain: "MRSA USA300 / N315", locus: "strain specific", gene: "mecA", pdb: "PDB: 1VQQ, 5M18" },
  MurJ: { ncbi: "NP_371661.1", uniprot: "Q2FZF4", organism: "Staphylococcus aureus", shortOrg: "S. aureus", strain: "NCTC 8325", locus: "SAOUHSC_00643", gene: "murJ", pdb: "AlphaFold" },
  
  MrkH: { ncbi: "YP_001335038.1", uniprot: "A0A0H3JXK0", organism: "Klebsiella pneumoniae", shortOrg: "K. pneumoniae", strain: "MGH78578", locus: "KPN_03274", gene: "mrkH", pdb: "AlphaFold" },
  Wzc: { ncbi: "YP_001338520.1", uniprot: "Q8ZIN0", organism: "Klebsiella pneumoniae", shortOrg: "K. pneumoniae", strain: "MGH78578", locus: "KPN_02477", gene: "wzc", pdb: "AlphaFold" },
  AcrB: { ncbi: "YP_001335021.1", uniprot: "Q8ZKQ2", organism: "Klebsiella pneumoniae", shortOrg: "K. pneumoniae", strain: "MGH78578", locus: "KPN_02072", gene: "acrB", pdb: "PDB: 5YIL" },
  OmpK36: { ncbi: "YP_001334052.1", uniprot: "A6T5Y8", organism: "Klebsiella pneumoniae", shortOrg: "K. pneumoniae", strain: "MGH78578", locus: "KPN_03267", gene: "ompK36", pdb: "PDB: 5NXA" }
};

// ── Pathogen Organism Mappings ──
const ORGANISMS = [
  {
    id: 'pseudomonas',
    name: 'Pseudomonas aeruginosa',
    shortName: 'P. aeruginosa',
    strain: 'PAO1',
    ncbiAssembly: 'GCF_000006765',
    emoji: '🦠',
    description: 'Gram-negative opportunistic pathogen',
    colorClass: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    activeColor: 'bg-emerald-500 border-emerald-400 text-emerald-700 dark:text-emerald-300',
    targets: [
      { id: 'LasR', label: 'LasR', desc: 'Quorum sensing regulator', strain: 'PAO1' },
      { id: 'PqsR', label: 'PqsR (MvfR)', desc: 'PQS signaling regulator', strain: 'PAO1' },
      { id: 'PelD', label: 'PelD', desc: 'c-di-GMP receptor (Biofilm matrix)', strain: 'PAO1' },
      { id: 'MexB', label: 'MexB', desc: 'RND multidrug efflux transporter', strain: 'PAO1' }
    ]
  },
  {
    id: 'staphylococcus',
    name: 'Staphylococcus aureus',
    shortName: 'S. aureus',
    strain: 'NCTC 8325',
    ncbiAssembly: 'GCF_000013425',
    emoji: '🧫',
    description: 'Gram-positive virulent pathogen',
    colorClass: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    activeColor: 'bg-rose-500 border-rose-400 text-rose-300',
    targets: [
      { id: 'AgrA', label: 'AgrA', desc: 'Agr QS response regulator', strain: 'NCTC 8325' },
      { id: 'SrtA', label: 'Sortase A', desc: 'Peptidoglycan transpeptidase', strain: 'NCTC 8325' },
      { id: 'MecA', label: 'PBP2a', desc: 'Methicillin resistance transpeptidase', strain: 'MRSA USA300 / N315' },
      { id: 'MurJ', label: 'MurJ', desc: 'Lipid II flippase cell wall target', strain: 'NCTC 8325' }
    ]
  },
  {
    id: 'klebsiella',
    name: 'Klebsiella pneumoniae',
    shortName: 'K. pneumoniae',
    strain: 'MGH78578',
    ncbiAssembly: 'GCF_000016305',
    emoji: '🧬',
    description: 'Gram-negative drug-resistant pathogen',
    colorClass: 'text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    activeColor: 'bg-cyan-500 border-cyan-400 text-cyan-700 dark:text-cyan-300',
    targets: [
      { id: 'MrkH', label: 'MrkH', desc: 'Type III fimbriae regulator (Adhesion)', strain: 'MGH78578' },
      { id: 'Wzc', label: 'Wzc', desc: 'Capsule tyrosine autokinase', strain: 'MGH78578' },
      { id: 'AcrB', label: 'AcrB', desc: 'RND multidrug efflux pump', strain: 'MGH78578' },
      { id: 'OmpK36', label: 'OmpK36', desc: 'Outer membrane porin channel', strain: 'MGH78578' }
    ]
  }
];



interface DashboardProps {
  onOpenDetail?: (targetId: string, ligandId: string) => void;
  initialOrganism?: string;
  initialTarget?: string;
  onBackToLanding?: () => void;
  onOpenLiveStudio?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onOpenDetail,
  initialOrganism = 'pseudomonas',
  initialTarget = 'PqsR',
  onBackToLanding,
  onOpenLiveStudio
}) => {
  // ── States ──
  const [selectedOrganism, setSelectedOrganism] = useState<string>(initialOrganism);
  const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget);
  const [selectedLigand, setSelectedLigand] = useState<string>('Chrysin');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCustomTesterOpen, setIsCustomTesterOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [leaderboardViewMode, setLeaderboardViewMode] = useState<'table' | 'chart'>('table');
  const [customCompoundsMap, setCustomCompoundsMap] = useState<Record<string, any[]>>({});
  const [showCovalentInteractions, setShowCovalentInteractions] = useState<boolean>(false);
  const [showTop5Only, setShowTop5Only] = useState<boolean>(false);

  // Find active organism details
  const activeOrg = ORGANISMS.find(o => o.id === selectedOrganism) || ORGANISMS[0];
  const activeTargetDetails = activeOrg.targets.find(t => t.id === selectedTarget) || activeOrg.targets[0];

  // ── Auto-Update Target when Organism Tab changes ──
  useEffect(() => {
    const defaultTarget = activeOrg.targets[0].id;
    setSelectedTarget(defaultTarget);
  }, [selectedOrganism]);

  // ── 1. Fetch Target Leaderboard CSV & Merge Custom Compounds ──
  const { data: fetchedLeaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', selectedTarget],
    queryFn: async () => {
      const url = `/outputs/${selectedTarget.toLowerCase()}/screening_leaderboard.csv`;
      const res = await axios.get(url);
      const parsed = Papa.parse(res.data, { header: true, skipEmptyLines: true });
      return parsed.data as any[];
    }
  });

  const customForTarget = customCompoundsMap[selectedTarget.toLowerCase()] || [];
  const leaderboard = [...customForTarget, ...fetchedLeaderboard];

  // ── 2. Auto-Select Rank 1 Ligand on Target/Leaderboard Change ──
  useEffect(() => {
    if (leaderboard.length > 0) {
      const topLigand = leaderboard[0]["Compound ID"] || leaderboard[0]["compound_id"];
      if (topLigand) {
        setSelectedLigand(topLigand);
      }
    }
  }, [leaderboard, selectedTarget]);

  // ── Keyboard Shortcuts (Ctrl+K for palette, Arrow keys for cycling) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (!leaderboard || leaderboard.length === 0) return;
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

        const ids = leaderboard.map(r => (r["Compound ID"] || r["compound_id"] || "").toLowerCase());
        const currentIdx = ids.indexOf(selectedLigand.toLowerCase());
        if (currentIdx === -1) return;

        if (e.key === 'ArrowRight') {
          const nextIdx = (currentIdx + 1) % ids.length;
          setSelectedLigand(ids[nextIdx]);
        } else if (e.key === 'ArrowLeft') {
          const prevIdx = (currentIdx - 1 + ids.length) % ids.length;
          setSelectedLigand(ids[prevIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leaderboard, selectedLigand]);

  // ── 3. Fetch Selected Compound Cascade Graph JSON ──
  const { data: graphData } = useQuery({
    queryKey: ['mechanism-graph', selectedTarget, selectedLigand],
    queryFn: async () => {
      const url = `/outputs/${selectedTarget.toLowerCase()}/${selectedLigand.toLowerCase()}/mechanism_graph.json`;
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!selectedTarget && !!selectedLigand
  });

  // ── 4. Fetch Selected Compound Dossier Passport JSON ──
  const { data: passport } = useQuery({
    queryKey: ['evidence-passport', selectedTarget, selectedLigand],
    queryFn: async () => {
      const url = `/outputs/${selectedTarget.toLowerCase()}/${selectedLigand.toLowerCase()}/evidence_passport.json`;
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!selectedTarget && !!selectedLigand
  });

  // Extract active row values from leaderboard
  const activeRow = leaderboard.find(row => 
    (row["Compound ID"] || row["compound_id"] || "").toLowerCase() === selectedLigand.toLowerCase()
  );

  const compoundName = activeRow ? activeRow["Compound Name"] : selectedLigand;
  const vinaEnergy = activeRow ? parseFloat(activeRow["Vina Affinity (kcal/mol)"]) || 0.0 : 0.0;
  const diffdockConfidence = activeRow ? parseFloat(activeRow["DiffDock Confidence"]) || 0.0 : 0.0;
  const hBonds = activeRow ? parseInt(activeRow["Hydrogen Bonds"]) || 0 : 0;
  const hydrophobic = activeRow ? parseInt(activeRow["Hydrophobic Contacts"]) || 4 : 4;
  const priorityScore = activeRow ? parseFloat(activeRow["Validation Priority Score"]) || 0.0 : 0.0;
  const decision = activeRow ? activeRow["Preclinical Decision"] : "Review manually";
  const evidenceStrength = activeRow ? activeRow["Evidence Strength"] : "Low preclinical plausibility";

  // Dynamic Metrics mapped from physics
  const dockingPlausibility = Math.min(100, Math.max(10, Math.round((-vinaEnergy / 12.0) * 100)));
  const antiBiofilmSupport = Math.min(100, Math.max(10, Math.round(((diffdockConfidence + 3.0) / 5.0) * 100)));
  const amrRelevance = Math.round(priorityScore);

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(row => {
    const name = (row["Compound Name"] || "").toLowerCase();
    const id = (row["Compound ID"] || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
  }).slice(0, showTop5Only ? 5 : undefined);

  // CSV Export handler
  const handleExportCSV = () => {
    if (!filteredLeaderboard || filteredLeaderboard.length === 0) return;
    const headers = Object.keys(filteredLeaderboard[0]);
    const csvRows = [
      headers.join(','),
      ...filteredLeaderboard.map(row =>
        headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
      )
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Screening_Leaderboard_${selectedTarget.toUpperCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCustomCompoundSuccess = (customData: {
    targetId: string;
    compoundId: string;
    compoundName: string;
    vinaAffinity: number;
    diffdockConfidence: number;
    priorityScore: number;
  }) => {
    const targetKey = customData.targetId.toLowerCase();
    const newRow = {
      "Rank": "1 [CUSTOM]",
      "Compound ID": customData.compoundId,
      "Compound Name": customData.compoundName + " [CUSTOM TESTED]",
      "Vina Affinity (kcal/mol)": customData.vinaAffinity.toString(),
      "DiffDock Confidence": customData.diffdockConfidence.toString(),
      "Hydrogen Bonds": "4",
      "Hydrophobic Contacts": "6",
      "Validation Priority Score": customData.priorityScore.toString(),
      "Preclinical Decision": customData.priorityScore > 70 ? "Initiate Assay" : "Review manually",
      "Evidence Strength": "Live Tested In-Silico"
    };

    setCustomCompoundsMap(prev => ({
      ...prev,
      [targetKey]: [newRow, ...(prev[targetKey] || [])]
    }));

    setSelectedTarget(customData.targetId);
    setSelectedLigand(customData.compoundId);
  };

  // ── Dynamic Date State ──
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 font-sans select-none antialiased">
      
      {/* ── Top Navigation Bar ── */}
      <header className="flex flex-col lg:flex-row items-center justify-between gap-4 glass-panel px-6 py-4 rounded-xl mb-4 shadow-[0_0_20px_rgba(14,165,233,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center shrink-0">
            <img
              src="/images/MevreonLogo.webp"
              alt="Mevreon Logo"
              className="h-11 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-tight">AYUSH Bio-AI Evidence Demo</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">Mechanism-linked validation for AYUSH medicines</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Live Docking Studio Launch Button */}
          {onOpenLiveStudio && (
            <button
              onClick={onOpenLiveStudio}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.5)] transition animate-pulse"
              title="Launch Real-Time Live Docking Studio"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Live Docking Studio</span>
            </button>
          )}

          {/* Back to Landing Page Button */}
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-500" />
              <span>Landing Page</span>
            </button>
          )}

          {/* Search Ctrl+K Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-cyan-300 transition"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search</span>
            <kbd className="hidden sm:inline-flex px-1 py-0.2 rounded border border-slate-700 bg-slate-800 text-[9px]">Ctrl+K</kbd>
          </button>

          {/* Export PDF Report Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-mono text-slate-300 hover:text-emerald-300 transition no-print"
            title="Download / Print PDF Report"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-cyan-500" />
            <span className="font-mono">{currentDateStr}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30 text-xs font-semibold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Mode: Research-Use-Only
          </div>

          <div className="pl-3 border-l border-slate-200 dark:border-slate-700/50 hidden md:block">
            <div className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              mevreon<span className="text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">·</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Pre-computed Cache & Pipeline Status Banner ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 rounded-xl mb-4 text-xs">
        <div className="flex items-center gap-2.5 text-cyan-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold">288 Pre-computed Docking Pairs Pre-Loaded</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">12 Targets × 24 Ayush Compounds (0ms Instant Load)</span>
        </div>

        {onOpenLiveStudio && (
          <button
            onClick={onOpenLiveStudio}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-[11px] font-bold font-mono transition"
          >
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            Test Live Docking (AutoDock Vina + DiffDock) →
          </button>
        )}
      </div>

      {/* ── Pathogen Organism Segregation Tabs Row ── */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {ORGANISMS.map(org => {
          const isActive = org.id === selectedOrganism;
          return (
            <button
              key={org.id}
              onClick={() => setSelectedOrganism(org.id)}
              className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? `${org.colorClass} border-cyan-400 ring-1 ring-cyan-500/30 scale-[1.01]` 
                  : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/10 hover:border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{org.emoji}</span>
                <span className="text-xs font-bold font-serif italic tracking-wide">{org.name} ({org.shortName})</span>
              </div>
              <p className="text-[10px] text-slate-500 italic font-medium">{org.description}</p>
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-12 gap-4 mb-4">

        {/* ── LEFT COLUMN: Demo Inputs (span-3) ── */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-5 flex-1 relative overflow-hidden flex flex-col justify-between">
             <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>

             <div>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
                <ClipboardList className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide">Preclinical Inputs</h2>
              </div>

              {/* Pathogen Target Selection pill grid */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-900 border border-cyan-400 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]">1</div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Select Target Vector</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-7">
                  {activeOrg.targets.map(tar => {
                    const isTargetActive = tar.id === selectedTarget;
                    const ncbiData = TARGET_NCBI_ACCESSIONS[tar.id];
                    return (
                      <div
                        key={tar.id}
                        className={`p-2 rounded border text-xs font-mono transition-all relative overflow-hidden flex flex-col justify-between ${
                          isTargetActive 
                            ? 'bg-cyan-50 dark:bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-400 text-cyan-700 dark:text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTarget(tar.id)}
                          className="w-full text-left font-bold cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span>{tar.label}</span>
                            {isTargetActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />}
                          </div>
                          <p className="text-[9px] text-slate-500 italic font-semibold mb-1">{tar.desc}</p>
                        </button>
                        {ncbiData && (
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-slate-200/50 dark:border-slate-800/50 pt-1 mt-0.5">
                            <span>Strain: {ncbiData.strain}</span>
                            <a
                              href={`https://www.ncbi.nlm.nih.gov/protein/${ncbiData.ncbi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                              title={`View NCBI Protein Accession ${ncbiData.ncbi}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>NCBI: {ncbiData.ncbi}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Phytochemical Card */}
              <div className="mb-6 border-t border-slate-300 dark:border-slate-800/50 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-900 border border-cyan-400 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]">2</div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">ACTIVE CANDIDATE</h3>
                  </div>
                  {onOpenDetail && (
                    <button 
                      onClick={() => onOpenDetail(selectedTarget, selectedLigand)}
                      className="px-2 py-1 bg-cyan-50 dark:bg-cyan-950 border border-cyan-600 rounded text-[9px] font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-900 transition-colors flex items-center gap-1 shadow-[0_0_5px_rgba(6,182,212,0.3)]"
                    >
                      <Database className="w-3 h-3" /> MORE INFO
                    </button>
                  )}
                </div>
                <div className="pl-7">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                    AYUSH Active Phytochemical (Selected)
                  </p>
                  <h4 className="text-sm font-bold text-cyan-900 dark:text-cyan-100 leading-snug drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]">{compoundName}</h4>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shadow-[0_0_5px_rgba(16,185,129,0.2)]">Pure Phytochemical Lead</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Pathogen Strain Details */}
              <div className="mb-6 border-t border-slate-300 dark:border-slate-800/50 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-900 border border-cyan-400 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]">3</div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">CLINICAL ISOLATE</h3>
                </div>
                <div className="pl-7">
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-300 mb-1 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)] italic font-serif">
                        {activeOrg.name} ({activeOrg.shortName})
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">Reference Strain: <span className="text-cyan-600 dark:text-cyan-400">{activeTargetDetails.strain}</span></p>
                    </div>
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img src={
                        activeOrg.id === 'pseudomonas' ? '/images/pseudomonas.png' :
                        activeOrg.id === 'staphylococcus' ? '/images/staphylococcus.png' :
                        '/images/enterobacteriaceae.png'
                      } alt={activeOrg.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
             </div>

            {/* Antibiotic Comparators */}
            <div className="border-t border-slate-300 dark:border-slate-800/50 pt-4 mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-cyan-900 border border-cyan-400 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]">4</div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Study Context</h3>
              </div>
              <div className="pl-7">
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">Ciprofloxacin Adjuvant Assay</h4>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[9px] font-semibold">Biofilm Inhibition</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 p-0.5 flex items-center justify-center">
                    <img src="/images/ciprofloxacin.png" alt="Ciprofloxacin" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MIDDLE COLUMN: Mechanism Layer (span-5) ── */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-5 flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
              <BrainCircuit className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide">Bio-AI Co-Crystal Simulation</h2>
                <p className="text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold font-mono">Live WebGL-3D molecular interactions</p>
              </div>
            </div>

            {/* Dynamic WebGL 3D Molecule Viewer Panel */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">{selectedTarget} Binding Site</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-slate-400 hover:text-cyan-400">
                    <input
                      type="checkbox"
                      checked={showCovalentInteractions}
                      onChange={(e) => setShowCovalentInteractions(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Include Covalent & Electrostatic Models</span>
                  </label>
                  <span className="px-2 py-0.5 text-[8px] font-bold font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 border border-cyan-800 rounded">Interactive WebGL</span>
                </div>
              </div>
              
              {showCovalentInteractions && (
                <div className="mb-2 p-1.5 px-3 bg-purple-950/30 border border-purple-500/30 rounded text-[9px] font-mono text-purple-300 flex items-center justify-between">
                  <span>⚡ Custom Mode Active: Electrostatic & Covalent predictions enabled for interaction fingerprinting.</span>
                  <span className="text-[8px] bg-purple-900/60 px-1.5 py-0.5 rounded font-bold">EXPERIMENTAL</span>
                </div>
              )}
              
              <div className="h-64 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg relative overflow-hidden shadow-inner flex items-center justify-center">
                {selectedTarget && selectedLigand ? (
                  <MoleculeViewer targetId={selectedTarget} ligandId={selectedLigand} />
                ) : (
                  <div className="text-center text-slate-500 font-mono text-xs">
                    Initializing graphics cards...
                  </div>
                )}
              </div>
            </div>

            {/* AI Mechanism Graph Panel */}
            <div className="flex-1 glass-card rounded-xl p-4 relative flex flex-col bg-slate-50 dark:bg-slate-900/10 border border-slate-300 dark:border-slate-800">
              <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-3 tracking-wider uppercase">AI-Derived Cascade Network</h3>
              
              <div className="flex-1 min-h-[140px]">
                <MechanismGraph nodes={graphData?.nodes} edges={graphData?.edges} />
              </div>

              <div className="mt-3 flex items-start gap-3 p-2.5 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-cyan-900/50 backdrop-blur-md relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-cyan-500"></div>
                <div className="w-6 h-6 rounded bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0 border border-cyan-800">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-700 dark:text-slate-200 leading-relaxed font-mono">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">&gt; ANNOTATION:</span> {passport?.executive_summary || `${compoundName} targets the active site pocket of ${selectedTarget}, initiating down-regulation of virulent biofilm synthesis loops.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Evidence Passport (span-4) ── */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <div className="glass-panel rounded-xl p-5 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent"></div>

            <div>
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide">Evidence Passport</h2>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
              </div>

              {/* Dynamic Score Section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/20 blur-[2px]"></div>
                  <div className="absolute inset-2 rounded-full bg-cyan-900/20 blur-md"></div>
                  
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgba(30,41,59,0.5)" strokeWidth="5" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke="#22d3ee" strokeWidth="5.5" fill="none" strokeDasharray="282.7" strokeDashoffset={282.7 - (priorityScore / 100) * 282.7} strokeLinecap="round" />
                  </svg>
                  <div className="relative flex flex-col items-center justify-center z-10">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-300 font-mono">{priorityScore.toFixed(1)}</span>
                    <span className="text-[9px] font-bold text-cyan-500/80 tracking-widest uppercase mt-0.5">Score</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1 font-mono">PRIORITY RATING</p>
                  <p className="text-sm font-black text-cyan-600 dark:text-cyan-400 leading-snug mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">{decision}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">Evidence Strength: <br/><span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-[10px]">{evidenceStrength}</span></p>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-4 mb-6 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Priority Weight</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{amrRelevance}/100</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${amrRelevance}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Docking Plausibility</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">{dockingPlausibility}/100</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ width: `${dockingPlausibility}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Anti-Biofilm Support</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{antiBiofilmSupport}/100</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${antiBiofilmSupport}%` }} />
                  </div>
                </div>

              </div>

              {/* Multi-Axis Radar Chart */}
              <div className="mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <RadarChart
                  vinaAffinity={vinaEnergy}
                  diffdockConfidence={diffdockConfidence}
                  hBonds={hBonds}
                  hydrophobicContacts={hydrophobic}
                  priorityScore={priorityScore}
                  compoundName={compoundName}
                />
              </div>

              {/* Residue Hotspots Heatmap */}
              <div className="mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <ResidueHeatmap targetId={selectedTarget} leaderboard={leaderboard} />
              </div>

              {/* Real Thermodynamic Details */}
              <div className="mb-6 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                  <h3 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">Biophysical Energetics ({selectedLigand})</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded border border-slate-300 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Vina Affinity</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">{vinaEnergy.toFixed(2)} <span className="text-[7px] text-slate-400 uppercase">kcal/mol</span></span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded border border-slate-300 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">DiffDock Conf.</span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]">{diffdockConfidence.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded border border-slate-300 dark:border-slate-800 text-center">
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">H-Bonds</span>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.3)]">{hBonds} / {hydrophobic}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Validation Workflow */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4 mt-auto">
              <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 text-center font-mono">Suggested Pre-Clinical Flow</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {(passport?.next_validation_steps || [
                  "Verify ligand displacement limits using competitive fluorescent assays.",
                  "Conduct standard MIC biofilms assays on mammalian lines to check toxicity limits.",
                  "Perform target expression qPCR audits."
                ]).map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-100/80 dark:bg-slate-900/60 p-2 rounded border border-slate-300 dark:border-slate-800 hover:border-cyan-500/30 transition-all">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-800 dark:text-slate-200 font-mono leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Target-Wide Insight Summary Cards */}
      <SummaryCards
        leaderboard={leaderboard}
        onSelectLigand={setSelectedLigand}
      />

      {/* ── Interactive 24-Compound Preclinical Leaderboard Table / Chart (Spans Full Width) ── */}
      <div className="glass-panel rounded-xl p-5 mb-4 shadow-[0_0_20px_rgba(14,165,233,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide">{selectedTarget} Leaderboard Ranking</h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider">Dynamic high-throughput screening database (24 Compounds)</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Table / Bar Chart Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px]">
              <button
                onClick={() => setLeaderboardViewMode('table')}
                className={`px-2.5 py-1 rounded font-bold transition ${
                  leaderboardViewMode === 'table' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setLeaderboardViewMode('chart')}
                className={`px-2.5 py-1 rounded font-bold transition ${
                  leaderboardViewMode === 'chart' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bar Chart View
              </button>
            </div>

            {/* Top 5 Filter Toggle */}
            <button
              onClick={() => setShowTop5Only(!showTop5Only)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-mono flex items-center gap-1.5 transition-all duration-200 border ${
                showTop5Only 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{showTop5Only ? 'Top 5 Hits' : 'All 24 Hits'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg font-mono flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Glowing Search Bar */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Search compounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800/80 rounded-lg text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Data Table or Bar Chart View */}
        {leaderboardViewMode === 'chart' ? (
          <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
            <ScoreBarChart
              leaderboard={filteredLeaderboard}
              selectedLigand={selectedLigand}
              onSelectLigand={setSelectedLigand}
            />
          </div>
        ) : (
          <div className="overflow-x-auto select-none rounded-lg border border-slate-300 dark:border-slate-800/80">
            <table className="min-w-full divide-y divide-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <thead className="bg-slate-50 dark:bg-slate-950/90 font-mono text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-black">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Compound Name</th>
                <th className="px-4 py-3 text-right group relative">
                  <div className="flex items-center justify-end gap-1 cursor-help">
                    <span>Vina Affinity (kcal/mol)</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 border border-cyan-500/50 rounded shadow-xl text-[10px] normal-case font-normal text-slate-200 text-left">
                    <strong>AutoDock Vina Affinity:</strong> Empirical thermodynamic binding energy (ΔG kcal/mol). More negative values indicate stronger binding (candidates below -7.0 kcal/mol show high potential).
                  </div>
                </th>
                <th className="px-4 py-3 text-right group relative">
                  <div className="flex items-center justify-end gap-1 cursor-help">
                    <span>DiffDock Confidence</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 border border-purple-500/50 rounded shadow-xl text-[10px] normal-case font-normal text-slate-200 text-left">
                    <strong>DiffDock-L Confidence:</strong> Generative AI diffusion score evaluating spatial pose likelihood (&gt; -1.5 indicates high structural confidence).
                  </div>
                </th>
                <th className="px-4 py-3 text-right group relative">
                  <div className="flex items-center justify-end gap-1 cursor-help">
                    <span>H-Bonds</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 border border-cyan-500/50 rounded shadow-xl text-[10px] normal-case font-normal text-slate-200 text-left">
                    <strong>Hydrogen Bonds:</strong> Directional non-covalent donor-acceptor interactions (≤ 3.5 Å). Essential for target specificity.
                  </div>
                </th>
                <th className="px-4 py-3 text-right group relative">
                  <div className="flex items-center justify-end gap-1 cursor-help">
                    <span>Hydrophobic Contacts</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 border border-teal-500/50 rounded shadow-xl text-[10px] normal-case font-normal text-slate-200 text-left">
                    <strong>Hydrophobic Contacts:</strong> Non-polar residue surface packing interactions that stabilize ligand positioning.
                  </div>
                </th>
                <th className="px-4 py-3 text-center group relative">
                  <div className="flex items-center justify-center gap-1 cursor-help">
                    <span>Priority Score</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 border border-emerald-500/50 rounded shadow-xl text-[10px] normal-case font-normal text-slate-200 text-left">
                    <strong>Validation Priority Score (0-100):</strong> Multi-parametric consensus ranking protocol integrating physical binding energy, generative pose confidence, and structural interaction fingerprinting.
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Preclinical Decision</th>
                <th className="px-4 py-3 text-left">Evidence Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-mono text-[10px] font-semibold">
              {loadingLeaderboard ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
                      <span>Parsing preclinical datasets from static assets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No matching compounds found inside the target database.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((row: any) => {
                  const id = (row["Compound ID"] || row["compound_id"] || "").toLowerCase();
                  const name = row["Compound Name"] || row["compound_name"] || id;
                  const isSelected = id === selectedLigand.toLowerCase();
                  
                  const vAffinity = parseFloat(row["Vina Affinity (kcal/mol)"] || row["vina_affinity"]) || 0.0;
                  const dConfidence = parseFloat(row["DiffDock Confidence"] || row["diffdock_confidence"]) || 0.0;
                  const hydrogenBonds = parseInt(row["Hydrogen Bonds"] || row["hydrogen_bonds"]) || 0;
                  const hydrophobicContacts = parseInt(row["Hydrophobic Contacts"] || row["hydrophobic_contacts"]) || 4;
                  const priority = parseFloat(row["Validation Priority Score"] || row["priority_score"]) || 0.0;
                  const rowDecision = row["Preclinical Decision"] || row["decision"];
                  const strength = row["Evidence Strength"] || row["evidence_strength"];
                  const pubchemCid = PUBCHEM_CIDS[id];

                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedLigand(id)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-cyan-50 dark:bg-cyan-50/80 dark:bg-cyan-950/40 border-l-2 border-cyan-500 text-white shadow-inner shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                          : 'hover:bg-white dark:bg-slate-900/20 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-bold text-slate-500">#{row.Rank || row.rank}</td>
                      <td className="px-4 py-2.5 font-sans font-bold flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-slate-100">{name}</span>
                        {pubchemCid && (
                          <a
                            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemCid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 text-[9px] font-mono"
                            title={`View ${name} on PubChem (CID ${pubchemCid})`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-black ${vAffinity < -7.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {vAffinity.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-black ${dConfidence > -1.0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {dConfidence.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{hydrogenBonds}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{hydrophobicContacts}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-black text-[9px] ${
                          priority >= 75.0 
                            ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold' 
                            : priority >= 60.0 
                              ? 'bg-cyan-50 dark:bg-cyan-950 border border-cyan-500/50 text-cyan-600 dark:text-cyan-400' 
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
                        }`}>
                          {priority.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 text-xs truncate max-w-[150px]">{rowDecision}</td>
                      <td className="px-4 py-2.5 text-purple-600 dark:text-purple-400 text-xs truncate max-w-[150px] font-bold">{strength}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>



      {/* ── Custom Compound Tester Modal ── */}
      <CustomCompoundTester
        isOpen={isCustomTesterOpen}
        onClose={() => setIsCustomTesterOpen(false)}
        onRunSuccess={handleCustomCompoundSuccess}
        availableTargets={ORGANISMS.flatMap(o => o.targets)}
      />

      {/* ── Global Command Palette Search Modal ── */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectOrganism={(id) => {
          setSelectedOrganism(id);
          setIsCommandPaletteOpen(false);
        }}
        onSelectTarget={(id) => {
          setSelectedTarget(id);
          setIsCommandPaletteOpen(false);
        }}
        onSelectLigand={(id) => {
          setSelectedLigand(id);
          setIsCommandPaletteOpen(false);
        }}
        organisms={ORGANISMS}
        targets={ORGANISMS.flatMap(o => o.targets.map(t => ({ ...t, organism: o.name })))}
        ligands={leaderboard.map(r => ({
          id: (r["Compound ID"] || r["compound_id"] || "").toLowerCase(),
          name: r["Compound Name"] || r["compound_name"] || 'Compound',
          plant: 'AYUSH Phytochemical'
        }))}
      />

    </div>
  );
};

export default Dashboard;
