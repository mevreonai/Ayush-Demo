import os
import sys
import subprocess
from pathlib import Path
from PIL import Image

def main():
    base_dir = Path(__file__).resolve().parent.parent
    brain_dir = Path(r"C:\Users\ayu23\.gemini\antigravity-ide\brain\b157adbd-df8e-4f85-822b-d2037a57cef7")
    webp_path = brain_dir / "platform_walkthrough_1792702871362.webp"
    clips_dir = base_dir / "outputs" / "walkthrough_clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    print("Extracting keyframes from WebP animation...")
    im = Image.open(webp_path)
    total_frames = getattr(im, "n_frames", 1)
    print(f"Total animation frames available: {total_frames}")

    # Key moments across the 1711 frames
    keyframe_map = [
        {"id": "clip_01", "frame": 15, "title": "Platform Hero & Executive Summary", "category": "Overview"},
        {"id": "clip_02", "frame": 90, "title": "WHO Priority Pathogens (Pseudomonas, Staph, Klebsiella)", "category": "Target Scope"},
        {"id": "clip_03", "frame": 180, "title": "5-Stage Preclinical Evaluation Framework", "category": "Pipeline"},
        {"id": "clip_04", "frame": 270, "title": "24 Curated AYUSH Phytochemical Leads Library", "category": "Chemistry"},
        {"id": "clip_05", "frame": 460, "title": "Screening Workspace & PqsR Leaderboard", "category": "High-Throughput Screen"},
        {"id": "clip_06", "frame": 680, "title": "3D WebGL Molecular Complex (Protein Ribbon & Pose)", "category": "Structural Biology"},
        {"id": "clip_07", "frame": 880, "title": "Mechanism of Action Cascade Network Graph", "category": "Pathways"},
        {"id": "clip_08", "frame": 1050, "title": "Evidence Passport & Priority Score Breakdown", "category": "Validation"},
        {"id": "clip_09", "frame": 1280, "title": "Multi-Target Navigation (LasR, AgrA, AcrB)", "category": "Cross-Organism"},
        {"id": "clip_10", "frame": 1580, "title": "SwissTargetPrediction Human Selectivity & Pie Chart", "category": "Safety & Polypharmacology"},
    ]

    for item in keyframe_map:
        f_idx = min(item["frame"], total_frames - 1)
        im.seek(f_idx)
        out_file = clips_dir / f"{item['id']}.png"
        im.save(out_file)
        item["path"] = out_file
        print(f"  -> Extracted frame {f_idx} to {out_file.name}")

    # Build High-Fidelity Printable HTML Dossier
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mevreon Bio-AI Platform — Technical Walkthrough Dossier</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    
    @page {{
        size: A4 portrait;
        margin: 14mm 12mm 14mm 12mm;
    }}
    
    * {{
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }}
    
    body {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #0b0f19;
        color: #e2e8f0;
        line-height: 1.5;
        font-size: 11pt;
    }}
    
    .page {{
        page-break-after: always;
        position: relative;
        padding-bottom: 20px;
    }}
    
    .page:last-child {{
        page-break-after: avoid;
    }}
    
    .header-bar {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 8px;
        margin-bottom: 16px;
        font-size: 8.5pt;
        color: #94a3b8;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }}
    
    .header-tag {{
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
    }}
    
    /* Cover Page */
    .cover-container {{
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 90vh;
        padding: 40px 20px;
    }}
    
    .cover-badge {{
        display: inline-block;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2));
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 10pt;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 20px;
        align-self: flex-start;
    }}
    
    h1.cover-title {{
        font-size: 28pt;
        font-weight: 800;
        color: #ffffff;
        line-height: 1.15;
        margin-bottom: 14px;
        background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }}
    
    p.cover-sub {{
        font-size: 13pt;
        color: #94a3b8;
        max-width: 90%;
        margin-bottom: 30px;
        line-height: 1.6;
    }}
    
    .meta-grid {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
        margin-top: 25px;
        padding: 20px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
    }}
    
    .meta-item {{
        display: flex;
        flex-direction: column;
    }}
    
    .meta-label {{
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #64748b;
        margin-bottom: 4px;
    }}
    
    .meta-val {{
        font-size: 11pt;
        font-weight: 600;
        color: #f1f5f9;
        font-family: 'JetBrains Mono', monospace;
    }}
    
    /* Section & Cards */
    .section-title {{
        font-size: 16pt;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 10px;
    }}
    
    .section-badge {{
        font-size: 8pt;
        background: #1e293b;
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
        padding: 3px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        font-weight: 600;
    }}
    
    .section-desc {{
        font-size: 9.5pt;
        color: #94a3b8;
        margin-bottom: 12px;
        line-height: 1.45;
    }}
    
    .clip-card {{
        background: #111827;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 16px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    }}
    
    .clip-img-wrap {{
        width: 100%;
        max-height: 270px;
        overflow: hidden;
        background: #030712;
        border-bottom: 1px solid rgba(255,255,255,0.06);
    }}
    
    .clip-img-wrap img {{
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
    }}
    
    .clip-body {{
        padding: 12px 16px;
    }}
    
    .clip-meta {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }}
    
    .clip-title {{
        font-size: 11.5pt;
        font-weight: 700;
        color: #38bdf8;
    }}
    
    .clip-pill {{
        font-size: 7.5pt;
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
    }}
    
    .clip-text {{
        font-size: 9pt;
        color: #cbd5e1;
        line-height: 1.45;
    }}
    
    .highlight-list {{
        margin-top: 6px;
        padding-left: 16px;
        font-size: 8.5pt;
        color: #94a3b8;
    }}
    
    .highlight-list li {{
        margin-bottom: 2px;
    }}
    
    .two-col {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="page cover-container">
    <div class="cover-badge">Official Technical Dossier & Walkthrough Clips</div>
    <h1 class="cover-title">MEVREON BIO-AI PLATFORM</h1>
    <p class="cover-sub">
        High-Throughput In-Silico Screening of 24 Curated AYUSH Phytochemicals Against Multi-Drug Resistant Bacterial Pathogens Using Physics-Based AutoDock Vina & Generative Diffusion Deep Learning (DiffDock-L).
    </p>
    
    <div class="clip-card" style="margin-bottom: 25px;">
        <div class="clip-img-wrap" style="max-height: 320px;">
            <img src="{clips_dir.as_uri()}/clip_01.png" alt="Platform Overview">
        </div>
    </div>
    
    <div class="meta-grid">
        <div class="meta-item">
            <span class="meta-label">Live Production Link</span>
            <span class="meta-val" style="color: #38bdf8;">https://mevreondocking.vercel.app/</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">GCP Cloud Run Service</span>
            <span class="meta-val">ayush-bioai-demo (asia-south1)</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Accompanying Walkthrough MP4</span>
            <span class="meta-val" style="color: #34d399;">mevreon_platform_walkthrough.mp4 (4m 45s)</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Target Organisms / Library</span>
            <span class="meta-val">12 Targets (3 WHO Priority) / 24 Compounds</span>
        </div>
    </div>
</div>

<!-- PAGE 2: LANDING & TARGET SCOPE -->
<div class="page">
    <div class="header-bar">
        <span>Mevreon Bio-AI Platform — Technical Walkthrough Dossier</span>
        <span class="header-tag">Section 1: Architecture & Scope</span>
    </div>
    
    <div class="section-title">
        <span>01. Campaign Architecture & Pathogen Target Coverage</span>
        <span class="section-badge">Platform Scope</span>
    </div>
    <div class="section-desc">
        Screening campaign designed to overcome antimicrobial resistance (AMR) by identifying non-traditional virulence and efflux targets in priority gram-negative and gram-positive pathogens.
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_02.png" alt="WHO Pathogens">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">WHO Critical Priority Bacterial Pathogens</span>
                <span class="clip-pill">Target Discovery</span>
            </div>
            <div class="clip-text">
                The platform integrates 12 validated target proteins across three clinically dangerous AMR pathogens:
            </div>
            <ul class="highlight-list">
                <li><strong>Pseudomonas aeruginosa</strong>: Quorum sensing master regulators (PqsR/MvfR, LasR), biofilm polysaccharide biosynthesis (PelD), and RND efflux (MexB).</li>
                <li><strong>Staphylococcus aureus</strong>: Virulence response regulator (AgrA), cell wall anchoring transpeptidase (Sortase A / SrtA), and methicillin-resistance PBP2a (MecA).</li>
                <li><strong>Enterobacteriaceae (K. pneumoniae)</strong>: AcrB multidrug efflux pump, MurA peptidoglycan biosynthesis, and porin OmpK36.</li>
            </ul>
        </div>
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_03.png" alt="5-Stage Pipeline">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">5-Stage Preclinical Evaluation Framework</span>
                <span class="clip-pill">Methodology</span>
            </div>
            <div class="clip-text">
                Every phytochemical undergoes a rigorous five-step biophysical and computational audit:
                (1) <em>AutoDock Vina Thermodynamic &Delta;G Grid Docking</em> &bull; 
                (2) <em>DiffDock-L Equivariant Diffusion Spatial Pose Prediction</em> &bull; 
                (3) <em>Atomic Contact & Non-Covalent Interaction Parsing</em> &bull; 
                (4) <em>Mechanism of Action Downstream Phenotypic Cascade Routing</em> &bull; 
                (5) <em>Multi-Parametric Validation Priority Score Generation (0-100)</em>.
            </div>
        </div>
    </div>
</div>

<!-- PAGE 3: PHYTOCHEMICAL LIBRARY & SCREENING WORKSPACE -->
<div class="page">
    <div class="header-bar">
        <span>Mevreon Bio-AI Platform — Technical Walkthrough Dossier</span>
        <span class="header-tag">Section 2: High-Throughput Screening</span>
    </div>
    
    <div class="section-title">
        <span>02. Phytochemical Library & High-Throughput Screening Workspace</span>
        <span class="section-badge">Screening Engine</span>
    </div>
    <div class="section-desc">
        Evaluation of the 24 curated traditional botanical compounds and real-time leaderboard exploration.
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_04.png" alt="24 Phytochemical Library">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">24 Curated AYUSH Phytochemical Lead Compounds</span>
                <span class="clip-pill">Phytochemistry</span>
            </div>
            <div class="clip-text">
                Standardized chemical registry mapping active constituents (Costunolide, Dehydrocostus lactone, Curcumin, Baicalein, Nimbolide, Cynaropicrin, Chrysin, Eugenol, etc.) with validated PubChem CIDs, Canonical SMILES, and traditional plant source origins.
            </div>
        </div>
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_05.png" alt="PqsR Leaderboard">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">High-Throughput Leaderboard Workspace (PqsR Target)</span>
                <span class="clip-pill">Leaderboard Engine</span>
            </div>
            <div class="clip-text">
                Multi-metric sorting grid presenting AutoDock Vina affinities, DiffDock-L generative model confidence scores, detected hydrogen bonds, and final composite priority scores across all screened compounds.
            </div>
        </div>
    </div>
</div>

<!-- PAGE 4: 3D MOLECULAR VISUALIZATION & MECHANISM GRAPH -->
<div class="page">
    <div class="header-bar">
        <span>Mevreon Bio-AI Platform — Technical Walkthrough Dossier</span>
        <span class="header-tag">Section 3: Structural Biology & Pathways</span>
    </div>
    
    <div class="section-title">
        <span>03. 3D Molecular Complex Viewer & Mechanism Cascade</span>
        <span class="section-badge">Biophysics & Graph</span>
    </div>
    <div class="section-desc">
        Co-localized WebGL rendering of docked poses and pathway disruption network analysis.
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_06.png" alt="3D WebGL Viewer">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">Co-Localized 3D WebGL Molecular Viewer (3Dmol.js)</span>
                <span class="clip-pill">3D Structural Biology</span>
            </div>
            <div class="clip-text">
                Interactive real-time 3D canvas rendering clean receptor crystallographic geometries (.pdb) co-localized with AutoDock Vina (.pdbqt) and DiffDock-L (.sdf) conformers. Features dynamic rotation, zoom, pocket centering, and surface style toggles.
            </div>
        </div>
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_07.png" alt="Mechanism Graph">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">Mechanism of Action (MoA) Cascade Network Graph</span>
                <span class="clip-pill">Systems Biology</span>
            </div>
            <div class="clip-text">
                Mathematical SVG node-edge network mapping compound binding events through upstream receptor inhibition to downstream biological outcomes: downregulation of virulence genes, suppression of pyocyanin/elastase production, and biofilm matrix destabilization.
            </div>
        </div>
    </div>
</div>

<!-- PAGE 5: EVIDENCE PASSPORT & SWISSTARGET PREDICTION -->
<div class="page">
    <div class="header-bar">
        <span>Mevreon Bio-AI Platform — Technical Walkthrough Dossier</span>
        <span class="header-tag">Section 4: Evidence & Safety</span>
    </div>
    
    <div class="section-title">
        <span>04. Evidence Passport & SwissTarget Human Selectivity</span>
        <span class="section-badge">Validation & Polypharmacology</span>
    </div>
    <div class="section-desc">
        Preclinical verification matrices and human host target profiling.
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_08.png" alt="Evidence Passport">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">Preclinical Evidence Passport & Validation Priority Score</span>
                <span class="clip-pill">Validation Passport</span>
            </div>
            <div class="clip-text">
                Comprehensive audit card featuring the biophysical Validation Priority Score gauge (0–100), multi-axial radar profiles (affinity, selectivity, druggability, stability), active-site contact hotspot residue tables, and transparent literature traceability citations.
            </div>
        </div>
    </div>
    
    <div class="clip-card">
        <div class="clip-img-wrap">
            <img src="{clips_dir.as_uri()}/clip_10.png" alt="SwissTargetPrediction">
        </div>
        <div class="clip-body">
            <div class="clip-meta">
                <span class="clip-title">SwissTargetPrediction Human Selectivity Explorer</span>
                <span class="clip-pill">Off-Target Safety</span>
            </div>
            <div class="clip-text">
                Direct integration of SwissTargetPrediction 30 CSV datasets. Features real trigonometric SVG Donut/Pie charts categorizing predicted human host protein classes (Kinases, Proteases, Nuclear Receptors, GPCRs, Enzymes) and deep tabular data with UniProt IDs and calibrated probabilities.
            </div>
        </div>
    </div>
</div>

</body>
</html>
"""

    html_path = base_dir / "outputs" / "mevreon_platform_walkthrough_dossier.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated HTML report at: {html_path}")

    # Generate PDF with Headless Chrome
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    pdf_out = base_dir / "mevreon_platform_walkthrough_dossier.pdf"
    brain_pdf = brain_dir / "mevreon_platform_walkthrough_dossier.pdf"

    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_out}",
        str(html_path)
    ]

    print("Compiling PDF using Chrome headless engine...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and pdf_out.exists():
        print(f"[SUCCESS] Generated PDF at: {pdf_out} ({pdf_out.stat().st_size} bytes)")
        import shutil
        shutil.copy2(pdf_out, brain_pdf)
        print(f"[SUCCESS] Copied PDF to brain artifacts: {brain_pdf}")
    else:
        print(f"[ERROR] PDF generation failed: {res.stderr}")

if __name__ == "__main__":
    main()
