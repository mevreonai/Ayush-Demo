import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Target,
  Cpu,
  FileSearch,
  Layers,
  Beaker,
  Dna,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onSelectOrganism: (organismId: string, targetId?: string) => void;
  onOpenCustomTester?: () => void;
  onOpenSwissTarget?: () => void;
  onOpenLiveStudio?: () => void;
}

/* ── Intersection Observer Hook for Scroll Reveals ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe the parent and all reveal children inside it
    const revealEls = el.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    revealEls.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ── Animated Counter ── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 1800;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.floor(eased * target);
            setCount(start);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Main Landing Page Component ── */
export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectOrganism,
  onOpenSwissTarget,
  onOpenLiveStudio
}) => {
  const scrollContainerRef = useScrollReveal();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollToSection = () => {
    document.getElementById('pathogens')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={scrollContainerRef} className="w-full min-h-screen bg-[#04070d] text-slate-100 font-sans antialiased relative overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 1 — FULL-SCREEN HERO                         */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden grain-overlay">

        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/[0.07] to-transparent animate-float-slow" />
          <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/[0.05] to-transparent animate-float-medium" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-gradient-to-t from-rose-500/[0.04] to-transparent animate-drift" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Top Nav */}
        <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-slate-900/90 border border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.35)] flex items-center justify-center backdrop-blur-md shrink-0">
              <img
                src="/images/MevreonLogo.webp"
                alt="Mevreon Logo"
                className="h-10 sm:h-11 w-auto object-contain transition-transform hover:scale-105"
              />
            </div>
            <span className="text-base font-bold text-slate-200 tracking-wide font-sans">
              AYUSH <span className="text-teal-400">Bio-AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {onOpenLiveStudio && (
              <button
                onClick={onOpenLiveStudio}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-950 to-teal-950 hover:from-cyan-900 hover:to-teal-900 text-cyan-300 border border-cyan-500/60 text-xs font-bold transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                ⚡ Live Docking Studio
              </button>
            )}
            {onOpenSwissTarget && (
              <button
                onClick={onOpenSwissTarget}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold transition-all duration-300"
              >
                <Dna className="w-3.5 h-3.5 text-cyan-400" />
                SwissTarget Predictions
              </button>
            )}
            <button
              onClick={() => onSelectOrganism('pseudomonas')}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500/90 hover:bg-teal-400 text-[#04070d] text-xs font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]"
            >
              Launch Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 sm:px-10 text-center max-w-5xl mx-auto">
          
          {/* Badge */}
          <div className={`transition-all duration-1000 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/40 text-[11px] font-medium text-slate-400 mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Preclinical Evidence Pipeline — 288 Protein Target and Ligands Docking Pairs
            </span>
          </div>

          {/* Title */}
          <h1 className={`transition-all duration-1000 delay-150 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="block text-4xl sm:text-[3.5rem] md:text-[4.2rem] font-bold tracking-tight leading-[1.1] text-slate-100 mb-3">
              Validating Traditional
            </span>
            <span className="block text-4xl sm:text-[3.5rem] md:text-[4.2rem] font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-400 text-shimmer mb-3">
              AYUSH Phytochemicals
            </span>
            <span className="block text-4xl sm:text-[3.5rem] md:text-[4.2rem] font-bold tracking-tight leading-[1.1] text-slate-100">
              Against AMR Pathogens
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`mt-7 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed transition-all duration-1000 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            An integrated computational framework combining <span className="text-slate-200 font-medium">AutoDock&nbsp;Vina</span> physics, <span className="text-slate-200 font-medium">DiffDock‑L</span> generative pose confidence, and <span className="text-slate-200 font-medium">2D/3D interaction fingerprinting</span> to discover novel plant‑derived anti‑infective leads.
          </p>

          {/* Quick Organism Buttons */}
          <div className={`mt-10 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-500 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { id: 'pseudomonas', label: 'P. aeruginosa', color: 'teal' },
              { id: 'staphylococcus', label: 'S. aureus', color: 'rose' },
              { id: 'klebsiella', label: 'K. pneumoniae', color: 'indigo' }
            ].map((org) => (
              <button
                key={org.id}
                onClick={() => onSelectOrganism(org.id)}
                className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${
                  org.color === 'teal' ? 'border-teal-500/30 hover:border-teal-400/60 hover:shadow-[0_8px_30px_rgba(20,184,166,0.15)]' :
                  org.color === 'rose' ? 'border-rose-500/30 hover:border-rose-400/60 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]' :
                  'border-indigo-500/30 hover:border-indigo-400/60 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]'
                } bg-slate-900/30 backdrop-blur-sm`}
              >
                <span className={`text-sm font-semibold italic font-serif ${
                  org.color === 'teal' ? 'text-teal-300' : org.color === 'rose' ? 'text-rose-300' : 'text-indigo-300'
                }`}>
                  {org.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={`relative z-20 flex flex-col items-center pb-10 transition-all duration-1000 delay-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={scrollToSection} className="flex flex-col items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest">Explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SCROLLING METRICS TICKER STRIP                       */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm py-3 overflow-hidden">
        <div className="animate-ticker flex items-center gap-12 whitespace-nowrap text-[11px] font-mono text-slate-500 uppercase tracking-wider px-6"
             style={{ width: 'max-content' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12">
              <span>288 Protein Target & Ligands Docking Pairs</span>
              <span className="text-teal-500">●</span>
              <span>12 Virulence & AMR Targets</span>
              <span className="text-rose-500">●</span>
              <span>24 Pure AYUSH Phytochemicals</span>
              <span className="text-indigo-500">●</span>
              <span>3 WHO Priority Pathogens</span>
              <span className="text-amber-500">●</span>
              <span>AutoDock Vina + DiffDock-L Ensemble</span>
              <span className="text-teal-500">●</span>
              <span>Forensic Passport Verified</span>
              <span className="text-rose-500">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 2 — KEY METRICS (Animated Counters)          */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {[
            { value: 288, label: 'Protein Target and\nLigands Docking Pairs', accent: 'teal' },
            { value: 12, label: 'Validated Protein\nTargets', accent: 'indigo' },
            { value: 24, label: 'Pure AYUSH\nPhytochemicals', accent: 'amber' },
            { value: 3, label: 'WHO Priority\nPathogens', accent: 'rose' }
          ].map((item, idx) => (
            <div key={idx} className={`reveal stagger-${idx + 1} text-center`}>
              <div className={`text-5xl sm:text-6xl font-bold font-mono tracking-tighter mb-2 ${
                item.accent === 'teal' ? 'text-teal-400' :
                item.accent === 'indigo' ? 'text-indigo-400' :
                item.accent === 'amber' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                <AnimatedCounter target={item.value} />
              </div>
              <div className="text-xs text-slate-500 font-medium leading-snug whitespace-pre-line">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 3 — PATHOGEN ORGANISM CARDS                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <section id="pathogens" className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
        {/* Section Header */}
        <div className="reveal mb-14">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-teal-400 mb-3 block">
            Target Pathogen Spectrum
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            Select a pathogen to begin screening
          </h2>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Each organism features 4 curated molecular target vectors — quorum sensing regulators, adhesion factors, efflux pumps, and cell wall biosynthesis enzymes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card — P. aeruginosa */}
          <div
            onClick={() => onSelectOrganism('pseudomonas')}
            className="reveal-scale stagger-1 group relative rounded-2xl border border-slate-800/60 bg-[#060b14] p-6 transition-all duration-500 cursor-pointer hover:border-teal-500/40 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(20,184,166,0.12)]"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center justify-between mb-5">
              <span className="px-2 py-0.5 rounded-md border border-teal-500/20 bg-teal-500/5 text-[9px] font-mono font-semibold text-teal-400 uppercase tracking-wider">
                Gram −ve
              </span>
              <span className="text-[10px] font-mono text-slate-600">PAO1</span>
            </div>

            <h3 className="text-xl font-bold text-slate-100 group-hover:text-teal-300 transition-colors font-serif italic leading-tight mb-1">
              Pseudomonas aeruginosa
            </h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              Critical opportunistic pathogen — burn infections, ventilator‑associated pneumonia, biofilm-protected hospital persistence.
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-6">
              {['LasR', 'PqsR', 'PelD', 'MexB'].map((t) => (
                <div key={t} className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-[10px] font-mono">
                  <span className="text-teal-400 font-bold">{t}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-600 font-mono">4 targets · 96 pairs</span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card — S. aureus */}
          <div
            onClick={() => onSelectOrganism('staphylococcus')}
            className="reveal-scale stagger-2 group relative rounded-2xl border border-slate-800/60 bg-[#060b14] p-6 transition-all duration-500 cursor-pointer hover:border-rose-500/40 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(244,63,94,0.12)]"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center justify-between mb-5">
              <span className="px-2 py-0.5 rounded-md border border-rose-500/20 bg-rose-500/5 text-[9px] font-mono font-semibold text-rose-400 uppercase tracking-wider">
                Gram +ve
              </span>
              <span className="text-[10px] font-mono text-slate-600">NCTC 8325 / MRSA</span>
            </div>

            <h3 className="text-xl font-bold text-slate-100 group-hover:text-rose-300 transition-colors font-serif italic leading-tight mb-1">
              Staphylococcus aureus
            </h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              Virulent pathogen — skin, bloodstream, and device infections. MRSA strains target transpeptidases and quorum sensing.
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-6">
              {['AgrA', 'Sortase A', 'PBP2a', 'MurJ'].map((t) => (
                <div key={t} className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-[10px] font-mono">
                  <span className="text-rose-400 font-bold">{t}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-600 font-mono">4 targets · 96 pairs</span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card — K. pneumoniae */}
          <div
            onClick={() => onSelectOrganism('klebsiella')}
            className="reveal-scale stagger-3 group relative rounded-2xl border border-slate-800/60 bg-[#060b14] p-6 transition-all duration-500 cursor-pointer hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-[0_20px_60px_-10px_rgba(99,102,241,0.12)]"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center justify-between mb-5">
              <span className="px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/5 text-[9px] font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                Gram −ve
              </span>
              <span className="text-[10px] font-mono text-slate-600">MGH78578</span>
            </div>

            <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors font-serif italic leading-tight mb-1">
              Klebsiella pneumoniae
            </h3>
            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              Hypervirulent multi‑drug resistant bacillus — nosocomial pneumonia, urinary infections, heavy polysaccharide capsule.
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-6">
              {['MrkH', 'Wzc', 'AcrB', 'OmpK36'].map((t) => (
                <div key={t} className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-[10px] font-mono">
                  <span className="text-indigo-400 font-bold">{t}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-600 font-mono">4 targets · 96 pairs</span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 4 — PIPELINE METHODOLOGY (Horizontal Steps)  */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t border-slate-800/30">
        <div className="reveal mb-14">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400 mb-3 block">
            Computational Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            5-stage preclinical validation
          </h2>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            From verified 3D protein coordinates to standardized forensic evidence passports — every step is traceable and reproducible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[
            { num: '01', title: 'Target Prep', desc: 'PDB & AlphaFold curation, protonation, grid alignment', icon: Target, color: 'teal' },
            { num: '02', title: 'Ensemble Dock', desc: 'AutoDock Vina ΔG + DiffDock-L generative confidence', icon: Cpu, color: 'cyan' },
            { num: '03', title: 'Fingerprinting', desc: '3.5Å H-bond counts, hydrophobic contacts, residue maps', icon: FileSearch, color: 'indigo' },
            { num: '04', title: 'Priority Score', desc: 'Consensus physics & generative confidence composite scoring', icon: Layers, color: 'amber' },
            { num: '05', title: 'Evidence Passport', desc: 'JSON + MD forensic trace with PubChem & NCBI links', icon: Beaker, color: 'rose' }
          ].map((step, idx) => (
            <div key={idx} className={`reveal stagger-${idx + 1} relative p-5 rounded-xl border border-slate-800/40 bg-[#060b14] group hover:border-${step.color}-500/30 transition-all duration-300`}>
              {/* Connector line */}
              {idx < 4 && (
                <div className="hidden sm:block absolute top-1/2 -right-2.5 w-5 h-px bg-slate-800/60 z-10" />
              )}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-mono font-bold tracking-wider ${
                  step.color === 'teal' ? 'text-teal-500' :
                  step.color === 'cyan' ? 'text-cyan-500' :
                  step.color === 'indigo' ? 'text-indigo-500' :
                  step.color === 'amber' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {step.num}
                </span>
                <step.icon className="w-4 h-4 text-slate-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1.5">{step.title}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 5 — PHYTOCHEMICAL LIBRARY                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t border-slate-800/30">
        <div className="reveal mb-12">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 mb-3 block">
            Curated AYUSH Phytochemical Library
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            24 pure AYUSH phytochemicals
          </h2>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Curated AYUSH phytochemical library with verified PubChem Registry entries — every compound is structurally validated.
          </p>
        </div>

        {/* Compound Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {[
            { name: 'Curcumin', cid: '969516' },
            { name: 'Azadirachtin', cid: '5281303' },
            { name: 'Ursolic Acid', cid: '64945' },
            { name: 'Costunolide', cid: '5281437' },
            { name: 'Boeravinone B', cid: '5318767' },
            { name: 'Aegeline', cid: '15558450' },
            { name: 'Baicalein', cid: '5281605' },
            { name: 'Conessine', cid: '441072' },
            { name: 'Magnoflorine', cid: '73337' },
            { name: 'Eugenol', cid: '3314' },
            { name: 'Nimbolide', cid: '100017' },
            { name: 'Chrysin', cid: '5281607' },
            { name: 'Demethoxycurcumin', cid: '5469424' },
            { name: 'Bisdemethoxycurcumin', cid: '5315472' },
            { name: 'Rosmarinic Acid', cid: '5281792' },
            { name: 'Costus Lactone', cid: '164748' },
            { name: 'Nimbin', cid: '102095200' },
            { name: 'Cynaropicrin', cid: '5281773' },
            { name: 'Marmelosin', cid: '68077' },
            { name: 'Kurchessine', cid: '441073' },
            { name: 'Berberine', cid: '2353' },
            { name: 'Liriodendrin', cid: '5315206' },
            { name: 'Oroxylin A', cid: '5320315' },
            { name: 'Tinosporin', cid: '21637571' }
          ].map((compound, idx) => (
            <a
              key={idx}
              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
              target="_blank"
              rel="noreferrer"
              className={`reveal stagger-${(idx % 6) + 1} group p-2.5 rounded-lg border border-slate-800/40 bg-[#060b14] hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-0.5`}
            >
              <span className="block text-[10px] font-semibold text-slate-300 group-hover:text-teal-300 transition-colors truncate">
                {compound.name}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] font-mono text-slate-600">CID {compound.cid}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-700 group-hover:text-teal-500 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION 6 — CTA BANNER                               */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20 border-t border-slate-800/30">
        <div className="reveal relative rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#060b14] to-[#0a1020] p-10 sm:p-14 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/[0.04] rounded-full filter blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/[0.04] rounded-full filter blur-[60px]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3 tracking-tight">
              Ready to explore docking results?
            </h3>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
              Select a pathogen above or jump straight into the screening workspace to browse pre-computed molecular interaction evidence.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onSelectOrganism('pseudomonas')}
                className="relative flex items-center gap-2 px-7 py-3 rounded-xl bg-teal-500/90 hover:bg-teal-400 text-[#04070d] text-sm font-bold transition-all duration-300 hover:shadow-[0_0_40px_rgba(20,184,166,0.3)]"
              >
                Launch Screening Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                */}
      {/* ══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-slate-800/30 py-6 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] text-slate-600 font-mono">
          <span className="text-slate-400 font-semibold">mevreon Bio-AI</span>
          <a
            href="https://github.com/unrealayush/Ayush-Demo"
            target="_blank"
            rel="noreferrer"
            className="hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            GitHub
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </footer>

    </div>
  );
};
