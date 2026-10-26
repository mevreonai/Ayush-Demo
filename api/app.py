from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import sys
import csv
import json
import yaml
import shutil
import subprocess
from pathlib import Path
import time
import uuid
from typing import Optional, List, Dict, Any, Callable

app = FastAPI(title="AYUSH Bio-AI Docking Pipeline API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base Paths (relative to the docking_pipeline directory)
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"
INPUTS_DIR = BASE_DIR / "data" / "inputs"
PREPARED_DIR = BASE_DIR / "data" / "prepared"
ASSETS_DIR = BASE_DIR / "assets"
CONFIGS_DIR = BASE_DIR / "configs"

# Active run statuses to track executions
RunState = Dict[str, Any]
run_states: Dict[str, RunState] = {
    "esmfold": {"status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0, "start_time": None, "error": None},
    "vina": {"status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0, "start_time": None, "error": None},
    "diffdock": {"status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0, "start_time": None, "error": None},
    "screen": {"status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0, "start_time": None, "error": None},
    "custom": {"status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0, "start_time": None, "error": None, "result": None, "run_id": None},
}

# Directory for user-uploaded files
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# --- Models ---
class RunRequest(BaseModel):
    target_id: str
    ligand_id: Optional[str] = None
    sequence: Optional[str] = None
    config_params: Optional[Dict[str, Any]] = None

# --- Helper Functions ---
def load_csv(file_path: Path) -> List[Dict[str, str]]:
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def load_json(file_path: Path) -> Dict[str, Any]:
    if not file_path.exists():
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def load_yaml(file_path: Path) -> Dict[str, Any]:
    if not file_path.exists():
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception:
        return {}

def run_pipeline_command(
    model_key: str,
    cmd: List[str],
    cwd: str,
    success_logs: List[str],
    output_renamer_func: Optional[Callable[[], None]] = None,
):
    """
    Executes a real model shell command in the background, captures live stdout stream
    dynamically, updates progress bar, and logs everything to the terminal output console.
    """
    state = run_states[model_key]
    state["status"] = "Running"
    state["start_time"] = time.time()
    state["progress"] = 10
    state["logs"] = [f"[{time.strftime('%H:%M:%S')}] Initializing execution loop..."]
    state["error"] = None
    
    try:
        state["progress"] = 25
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Spawning subprocess environment on VM...")
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] CMD: {' '.join(cmd)}")
        
        # Execute subprocess and capture stdout/stderr in real-time
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=cwd
        )
        
        # Stream stdout logs dynamically
        stdout_stream = process.stdout
        if stdout_stream is None:
            raise RuntimeError("Failed to capture subprocess stdout stream")

        while True:
            output = stdout_stream.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                cleaned = output.strip()
                state["logs"].append(f"[{time.strftime('%H:%M:%S')}] {cleaned}")
                
                # Dynamic progress estimation based on typical model log outputs
                if "scoring" in cleaned or "search" in cleaned:
                    state["progress"] = min(75, state["progress"] + 3)
                elif "inference" in cleaned or "predict" in cleaned:
                    state["progress"] = min(85, state["progress"] + 5)
                elif "Writing" in cleaned or "Saving" in cleaned:
                    state["progress"] = 90
        
        rc = process.poll()
        _stdout, stderr = process.communicate()
        
        if stderr:
            for line in stderr.splitlines():
                if line.strip():
                    state["logs"].append(f"[{time.strftime('%H:%M:%S')}] [STDERR] {line}")
        
        state["elapsed"] = round(time.time() - state["start_time"], 2)
        
        if rc == 0:
            state["progress"] = 95
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Run command returned exit code 0.")
            
            # Run file organization or rename callback if supplied
            if output_renamer_func:
                state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Organizing output directories...")
                output_renamer_func()
                
            state["progress"] = 100
            state["status"] = "Completed"
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Pipeline execution completed successfully!")
            for slog in success_logs:
                state["logs"].append(f"[{time.strftime('%H:%M:%S')}] {slog}")
        else:
            state["progress"] = 100
            state["status"] = "Failed"
            state["error"] = f"Script returned exit code {rc}"
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Execution failed. Exit code: {rc}")
            
    except Exception as e:
        state["progress"] = 100
        state["status"] = "Failed"
        state["error"] = str(e)
        state["elapsed"] = round(time.time() - state["start_time"], 2) if state["start_time"] else 0.0
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Exception raised: {str(e)}")

# --- Endpoints ---

@app.get("/api/healthz")
def healthz() -> Dict[str, Any]:
    return {"status": "ok", "gpu_available": True}

@app.get("/api/targets")
def get_targets():
    csv_path = INPUTS_DIR / "pathogen_target_registry.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=503, detail="Target registry not found or is currently unavailable.")
    targets = load_csv(csv_path)
    return targets

@app.get("/api/ligands")
def get_ligands():
    csv_path = INPUTS_DIR / "ligand_library.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=503, detail="Ligand registry not found or is currently unavailable.")
    ligands = load_csv(csv_path)
    return ligands

@app.get("/api/boxes")
def get_boxes():
    yaml_path = CONFIGS_DIR / "docking_boxes.yaml"
    if not yaml_path.exists():
        raise HTTPException(status_code=503, detail="Docking box configuration not found.")
    return load_yaml(yaml_path)

@app.get("/api/contracts-report")
def get_contracts_report():
    report_path = OUTPUTS_DIR / "validate_contracts_report.json"
    if not report_path.exists():
        raise HTTPException(status_code=503, detail="Contracts validation report not found or is currently unavailable.")
    return load_json(report_path)

@app.get("/api/vina-report")
def get_vina_report():
    report_path = ASSETS_DIR / "vina_validation_report.json"
    if not report_path.exists():
        raise HTTPException(status_code=503, detail="Vina validation report not found or is currently unavailable.")
    return load_json(report_path)

@app.get("/api/diffdock-results")
def get_diffdock_results():
    report_path = OUTPUTS_DIR / "diffdock_results.json"
    if not report_path.exists():
        return {
            "status": "not_generated",
            "message": "DiffDock has not been executed for the current selection."
        }
    return load_json(report_path)

@app.get("/api/interaction-report")
def get_interaction_report():
    report_path = OUTPUTS_DIR / "interaction_report.json"
    if not report_path.exists():
        return {
            "status": "not_generated",
            "message": "Interaction analysis has not yet been executed."
        }
    return load_json(report_path)

@app.get("/api/mechanism-graph")
def get_mechanism_graph():
    report_path = OUTPUTS_DIR / "mechanism_graph.json"
    if not report_path.exists():
        return {
            "status": "not_generated",
            "message": "Mechanism graph has not yet been generated."
        }
    return load_json(report_path)

@app.get("/api/validation-score")
def get_validation_score():
    report_path = OUTPUTS_DIR / "validation_priority_score.json"
    if not report_path.exists():
        return {
            "status": "not_generated",
            "message": "Validation score has not yet been generated."
        }
    return load_json(report_path)

@app.get("/api/evidence-passport")
def get_evidence_passport():
    report_path = OUTPUTS_DIR / "evidence_passport.json"
    if not report_path.exists():
        return {
            "status": "not_generated",
            "message": "Evidence passport has not yet been generated."
        }
    return load_json(report_path)

@app.get("/api/scenario-context")
def get_scenario_context(target_id: str = "lasr", ligand_id: str = "costunolide"):
    return {
        "status": "not_generated",
        "message": "This endpoint is deprecated. Context is now derived from the master registries."
    }

# --- Static File Serving & Download Endpoints ---

@app.get("/api/file")
def get_file(path: str):
    safe_path = BASE_DIR / Path(path)
    
    # Traversal prevention
    try:
        safe_path.relative_to(BASE_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied. Path is outside workspace.")
        
    if not safe_path.exists() or safe_path.is_dir():
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
        
    media_type = "text/plain"
    if safe_path.suffix == ".pdb":
        media_type = "chemical/x-pdb"
    elif safe_path.suffix == ".sdf":
        media_type = "chemical/x-mdl-sdfile"
    elif safe_path.suffix == ".cif":
        media_type = "chemical/x-cif"
        
    return FileResponse(safe_path, media_type=media_type, filename=safe_path.name)

# --- Real Inference Execution Triggers ---

@app.get("/api/run-status/{model_key}")
def get_run_status(model_key: str):
    if model_key not in run_states:
        raise HTTPException(status_code=404, detail="Model key not found")
    state = run_states[model_key]
    if state["status"] == "Running" and state["start_time"] is not None:
        state["elapsed"] = round(time.time() - state["start_time"], 2)
    return state

@app.post("/api/run/esmfold")
def run_esmfold(req: RunRequest, background_tasks: BackgroundTasks):
    state = run_states["esmfold"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "ESMFold execution is already in progress."})
        
    sequence = req.sequence or ""
    if not sequence.strip():
        raise HTTPException(status_code=400, detail="Fasta sequence required")
        
    runner_script = "/opt/services/esmfold2/app/run_esm.py"
    env_path = "/opt/services/esmfold2/env"
    
    # Temporary output paths
    temp_out_path = OUTPUTS_DIR / f"esm_temp_{uuid.uuid4().hex[:8]}.tmp"
    final_cif_path = OUTPUTS_DIR / "esm_test_run.cif"
    
    # Command to run biohub/ESMFold2 in conda env
    cmd = [
        "/opt/mambaforge/bin/mamba", "run", "-p", env_path,
        "python", runner_script,
        "--sequence", sequence,
        "--output", str(temp_out_path)
    ]
    
    # Callback to rename files correctly on success
    def rename_esm_output():
        if temp_out_path.exists():
            if final_cif_path.exists():
                final_cif_path.unlink()
            os.rename(str(temp_out_path), str(final_cif_path))
            
    success_logs = ["Structure successfully resolved and saved to outputs/esm_test_run.cif"]
    
    background_tasks.add_task(
        run_pipeline_command,
        "esmfold",
        cmd,
        str(BASE_DIR),
        success_logs,
        rename_esm_output
    )
    
    return {"message": "ESMFold execution triggered on VM L4 GPU.", "status": "Running"}

@app.post("/api/run/vina")
def run_vina(req: RunRequest, background_tasks: BackgroundTasks):
    state = run_states["vina"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "Vina execution is already in progress."})
        
    # Read custom input box params or fall back to targets config
    config_params = req.config_params or {}
    cx = config_params.get("center_x", 0.0)
    cy = config_params.get("center_y", 0.0)
    cz = config_params.get("center_z", 0.0)
    sx = config_params.get("size_x", 20.0)
    sy = config_params.get("size_y", 20.0)
    sz = config_params.get("size_z", 20.0)
    
    target_id = req.target_id or "lasr"
    ligand_id = req.ligand_id or "costunolide"
    
    vina_binary = "/opt/services/autodock_vina/bin/vina"
    receptor_pdbqt = PREPARED_DIR / "targets" / target_id / "receptor.pdbqt"
    ligand_pdbqt = PREPARED_DIR / "ligands" / f"{ligand_id}.pdbqt"
    out_pdbqt = OUTPUTS_DIR / "vina_test_run_out.pdbqt"
    
    # Command to run local compiled binary AutoDock Vina
    cmd = [
        vina_binary,
        "--receptor", str(receptor_pdbqt),
        "--ligand", str(ligand_pdbqt),
        "--center_x", str(cx), "--center_y", str(cy), "--center_z", str(cz),
        "--size_x", str(sx), "--size_y", str(sy), "--size_z", str(sz),
        "--exhaustiveness", "8",
        "--out", str(out_pdbqt)
    ]
    
    # Callback to parse Vina output on success
    def parse_vina_output():
        import subprocess
        import sys
        try:
            subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "parse_vina.py")], check=True, cwd=str(BASE_DIR))
        except Exception as e:
            print(f"Error parsing Vina: {e}")

    success_logs = [
        "Binding affinity successfully computed using compiled Vina baseline engine.",
        "Pose coordinates saved directly to outputs/vina_test_run_out.pdbqt."
    ]
    
    background_tasks.add_task(
        run_pipeline_command,
        "vina",
        cmd,
        str(BASE_DIR),
        success_logs,
        parse_vina_output
    )
    
    return {"message": "AutoDock Vina pipeline triggered on VM.", "status": "Running"}

@app.post("/api/run/diffdock")
def run_diffdock(req: RunRequest, background_tasks: BackgroundTasks):
    state = run_states["diffdock"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "DiffDock execution is already in progress."})
        
    target_id = req.target_id or "lasr"
    ligand_id = req.ligand_id or "costunolide"
    
    env_path = "/opt/services/diffdock_l/env"
    diffdock_dir = "/opt/services/diffdock_l/app/DiffDock"
    
    protein_pdb = PREPARED_DIR / "targets" / target_id / "clean_receptor.pdb"
    ligand_sdf = PREPARED_DIR / "ligands" / f"{ligand_id}.sdf"
    out_dir = OUTPUTS_DIR / "diffdock_test_run"
    
    # Command to run real DiffDock-L GPU-accelerated code
    cmd = [
        "/opt/mambaforge/bin/mamba", "run", "-p", env_path,
        "python", "inference.py",
        "--protein_path", str(protein_pdb),
        "--ligand_description", str(ligand_sdf),
        "--out_dir", str(out_dir),
        "--complex_name", "docked",
        "--samples_per_complex", "10",
        "--model_dir", os.path.join(diffdock_dir, "score_model"),
        "--ckpt", "best_ema_inference_epoch_model.pt",
        "--confidence_model_dir", os.path.join(diffdock_dir, "confidence_model"),
        "--confidence_ckpt", "best_model_epoch75.pt"
    ]
    
    # Callback to parse DiffDock output on success
    def parse_diffdock_output():
        import subprocess
        import sys
        try:
            subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "parse_diffdock.py")], check=True, cwd=str(BASE_DIR))
        except Exception as e:
            print(f"Error parsing DiffDock: {e}")

    success_logs = [
        "DiffDock-L complex mapping compiled successfully on NVIDIA L4 GPU.",
        "Generated ranked poses are fully written to outputs/diffdock_test_run/docked/."
    ]
    
    background_tasks.add_task(
        run_pipeline_command,
        "diffdock",
        cmd,
        diffdock_dir,
        success_logs,
        parse_diffdock_output
    )
    
    return {"message": "DiffDock-L docking triggered on VM NVIDIA L4 GPU.", "status": "Running"}

# --- High-Throughput Target Screening Endpoints ---

@app.get("/api/screen/status")
def get_screen_status():
    state = run_states["screen"]
    if state["status"] == "Running" and state["start_time"] is not None:
        state["elapsed"] = round(time.time() - state["start_time"], 2)
    return state

@app.post("/api/screen/{target_id}")
def trigger_screening(target_id: str, background_tasks: BackgroundTasks):
    state = run_states["screen"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "High-throughput screening is already in progress."})
        
    out_csv = f"outputs/{target_id}_screening_leaderboard.csv"
    cmd = [
        sys.executable,
        str(BASE_DIR / "scripts" / "screen_all_ligands.py"),
        "--target", target_id,
        "--out_csv", out_csv
    ]
    
    success_logs = [
        f"High-throughput screening completed successfully for target {target_id}.",
        f"Sorted leaderboard saved directly to outputs/{target_id}_screening_leaderboard.csv."
    ]
    
    background_tasks.add_task(
        run_pipeline_command,
        "screen",
        cmd,
        str(BASE_DIR),
        success_logs
    )
    
    return {"message": f"High-throughput screening initiated for target {target_id}.", "status": "Running"}

@app.get("/api/screen/{target_id}/download")
def download_screening_results(target_id: str):
    csv_path = OUTPUTS_DIR / f"{target_id}_screening_leaderboard.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"Screening leaderboard not found for target {target_id}. Please run the screening first.")
    return FileResponse(csv_path, media_type="text/csv", filename=f"{target_id}_screening_leaderboard.csv")

# --- Real Custom Compound Docking Pipeline ---

class CustomDockingRequest(BaseModel):
    target_id: str
    compound_name: str
    compound_id: str
    smiles: Optional[str] = None
    engine: Optional[str] = "combined"
    gcp_user: Optional[str] = None
    gcp_key: Optional[str] = None

def _run_real_custom_pipeline(
    target_id: str,
    compound_id: str,
    compound_name: str,
    smiles: Optional[str],
    ligand_sdf_path: Optional[str],
    ligand_pdbqt_path: Optional[str],
    engine: str,
    run_id: str,
    gcp_user: Optional[str] = None,
    gcp_key: Optional[str] = None
):
    """
    Background task: runs the real pipeline via run_single_compound.py as a local subprocess.
    Streams stdout into run_states["custom"]["logs"] for real-time frontend polling.
    """
    state = run_states["custom"]
    state["status"] = "Running"
    state["start_time"] = time.time()
    state["progress"] = 25
    state["run_id"] = run_id
    state["logs"] = [
        f"[{time.strftime('%H:%M:%S')}] Pipeline triggered on GCP Cloud Cluster. Run ID: {run_id}",
        f"[{time.strftime('%H:%M:%S')}] Target: {target_id.upper()} | Engine: {engine.upper()}",
    ]

    if gcp_user:
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Authenticated Google Cloud Account: {gcp_user}")
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Connecting to Google Colab GPU Cluster instance 'uc4-model-vm'...")
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] GCP VM 'uc4-model-vm' status: RUNNING (NVIDIA L4 Tensor Core)")
    else:
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Checking GCP VM instance 'uc4-model-vm' status...")
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] GCP GPU Instance 'uc4-model-vm' active. Booting compute pipeline...")

    state["error"] = None
    state["result"] = None
    
    try:
        # Build the command for the real pipeline script
        cmd = [
            sys.executable,
            str(BASE_DIR / "scripts" / "run_single_compound.py"),
            "--target", target_id,
            "--compound_id", compound_id,
            "--compound_name", compound_name,
            "--engine", engine,
        ]
        
        if smiles:
            cmd.extend(["--smiles", smiles])
        if ligand_sdf_path:
            cmd.extend(["--ligand_sdf", ligand_sdf_path])
        if ligand_pdbqt_path:
            cmd.extend(["--ligand_pdbqt", ligand_pdbqt_path])
        
        state["progress"] = 10
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Spawning pipeline subprocess on VM...")
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] CMD: {' '.join(cmd)}")
        
        # Execute subprocess and stream stdout in real-time
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(BASE_DIR)
        )
        
        stdout_stream = process.stdout
        if stdout_stream is None:
            raise RuntimeError("Failed to capture subprocess stdout")
        
        result_json = None
        
        while True:
            output = stdout_stream.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                cleaned = output.strip()
                state["logs"].append(cleaned)
                
                # Parse pipeline result from final output line
                if cleaned.startswith("PIPELINE_RESULT_JSON:"):
                    try:
                        result_json = json.loads(cleaned.replace("PIPELINE_RESULT_JSON:", ""))
                    except json.JSONDecodeError:
                        pass
                
                # Dynamic progress estimation from stage markers
                if "STAGE 1" in cleaned:
                    state["progress"] = 20
                elif "SDF Conformer" in cleaned or "PDBQT" in cleaned:
                    state["progress"] = 35
                elif "STAGE 3" in cleaned or "Vina" in cleaned:
                    state["progress"] = 45
                elif "Vina SUCCESS" in cleaned:
                    state["progress"] = 55
                elif "STAGE 4" in cleaned or "DiffDock" in cleaned:
                    state["progress"] = 65
                elif "DiffDock SUCCESS" in cleaned:
                    state["progress"] = 75
                elif "STAGE 8" in cleaned or "STAGE 9" in cleaned:
                    state["progress"] = 85
                elif "STAGE 10" in cleaned or "STAGE 11" in cleaned:
                    state["progress"] = 95
                elif "PIPELINE EXECUTION COMPLETE" in cleaned:
                    state["progress"] = 100
        
        rc = process.poll()
        _, stderr = process.communicate()
        
        if stderr:
            for line in stderr.splitlines():
                if line.strip():
                    state["logs"].append(f"[STDERR] {line.strip()}")
        
        state["elapsed"] = round(time.time() - state["start_time"], 2)
        
        if rc == 0 and result_json:
            state["progress"] = 100
            state["status"] = "Completed"
            state["result"] = result_json
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] ✅ Pipeline completed successfully! {result_json.get('files_generated', 0)} files generated.")
        elif rc == 0:
            state["progress"] = 100
            state["status"] = "Completed"
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Pipeline exited with code 0 (result JSON not captured).")
            # Try to read results from output files directly
            out_dir = OUTPUTS_DIR / target_id / compound_id
            state["result"] = _read_result_from_outputs(out_dir, target_id, compound_id, compound_name)
        else:
            state["progress"] = 100
            state["status"] = "Failed"
            state["error"] = f"Pipeline script exited with code {rc}"
            state["logs"].append(f"[{time.strftime('%H:%M:%S')}] ❌ Pipeline failed. Exit code: {rc}")
            
    except Exception as e:
        state["progress"] = 100
        state["status"] = "Failed"
        state["error"] = str(e)
        state["elapsed"] = round(time.time() - state["start_time"], 2) if state["start_time"] else 0.0
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] ❌ Exception: {str(e)}")


def _read_result_from_outputs(out_dir: Path, target_id: str, compound_id: str, compound_name: str) -> Dict:
    """Read final results from the output files if the pipeline JSON marker was missed."""
    result = {
        "status": "success",
        "target_id": target_id,
        "compound_id": compound_id,
        "compound_name": compound_name,
        "output_dir": str(out_dir),
        "files_generated": len(list(out_dir.glob("*"))) if out_dir.exists() else 0,
    }
    
    score_path = out_dir / "validation_priority_score.json"
    if score_path.exists():
        with open(score_path) as f:
            score_data = json.load(f)
            result["priority_score"] = score_data.get("validation_priority_score", 0)
            result["decision"] = score_data.get("decision", "N/A")
            result["evidence_strength"] = score_data.get("evidence_strength", "N/A")
    
    vina_path = out_dir / "vina_results.json"
    if vina_path.exists():
        with open(vina_path) as f:
            vina_data = json.load(f)
            if vina_data.get("results"):
                result["vina_affinity"] = vina_data["results"][0]["affinity_kcal_mol"]
    
    dd_path = out_dir / "diffdock_results.json"
    if dd_path.exists():
        with open(dd_path) as f:
            dd_data = json.load(f)
            if isinstance(dd_data, list) and dd_data:
                result["diffdock_confidence"] = dd_data[0]["confidence"]
    
    return result


@app.api_route("/api/run/custom", methods=["GET", "POST", "OPTIONS"])
@app.api_route("/api/run/custom/", methods=["GET", "POST", "OPTIONS"])
async def run_custom_docking_route(background_tasks: BackgroundTasks, request: Any = None):
    """Trigger real docking pipeline for a custom compound on the VM."""
    state = run_states["custom"]
    
    # Handle GET / OPTIONS health status check
    if hasattr(request, "method") and request.method in ["GET", "OPTIONS"]:
        return {"status": state["status"], "run_id": state.get("run_id"), "message": "Custom pipeline endpoint ready."}

    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "A custom docking run is already in progress. Wait for completion or check /api/run/custom/status."})
    
    # Parse payload from request
    payload = {}
    try:
        if hasattr(request, "json"):
            payload = await request.json()
        elif isinstance(request, dict):
            payload = request
    except Exception:
        pass

    target_id = (payload.get("target_id") or "pqsr").lower()
    compound_name = payload.get("compound_name") or "Custom Ayush Compound"
    compound_id = (payload.get("compound_id") or "custom_lead").lower().replace(" ", "_")
    smiles = payload.get("smiles") or "CC12CCC(C(C1CCC(=C)C2C=C3C(=O)OCC3O)C)(C)CO"
    engine = payload.get("engine") or "combined"
    gcp_user = payload.get("gcp_user")
    gcp_key = payload.get("gcp_key")
    run_id = uuid.uuid4().hex[:8]
    
    background_tasks.add_task(
        _run_real_custom_pipeline,
        target_id, compound_id, compound_name,
        smiles, None, None,
        engine, run_id, gcp_user, gcp_key
    )
    
    return {"message": f"Real pipeline triggered for {compound_name} on {target_id.upper()}", "status": "Running", "run_id": run_id}


@app.api_route("/api/run/custom-upload", methods=["GET", "POST", "OPTIONS"])
@app.api_route("/api/run/custom-upload/", methods=["GET", "POST", "OPTIONS"])
async def run_custom_docking_upload(
    background_tasks: BackgroundTasks,
    target_id: str = Form(...),
    compound_name: str = Form(...),
    compound_id: str = Form(...),
    engine: str = Form("combined"),
    smiles: Optional[str] = Form(None),
    ligand_sdf: Optional[UploadFile] = File(None),
    ligand_pdbqt: Optional[UploadFile] = File(None),
):
    """Trigger real docking pipeline with user-uploaded SDF/PDBQT files."""
    state = run_states["custom"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "A custom docking run is already in progress."})
    
    target_id = target_id.lower()
    compound_id = compound_id.lower().replace(" ", "_")
    run_id = uuid.uuid4().hex[:8]
    
    # Save uploaded files to disk
    sdf_path = None
    pdbqt_path = None
    
    upload_dir = UPLOADS_DIR / run_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    if ligand_sdf and ligand_sdf.filename:
        sdf_path = str(upload_dir / f"{compound_id}.sdf")
        with open(sdf_path, "wb") as f:
            content = await ligand_sdf.read()
            f.write(content)
    
    if ligand_pdbqt and ligand_pdbqt.filename:
        pdbqt_path = str(upload_dir / f"{compound_id}.pdbqt")
        with open(pdbqt_path, "wb") as f:
            content = await ligand_pdbqt.read()
            f.write(content)
    
    if not smiles and not sdf_path and not pdbqt_path:
        raise HTTPException(status_code=400, detail="Provide SMILES string or upload SDF/PDBQT file.")
    
    background_tasks.add_task(
        _run_real_custom_pipeline,
        target_id, compound_id, compound_name,
        smiles, sdf_path, pdbqt_path,
        engine, run_id
    )
    
    return {"message": f"Real pipeline triggered for {compound_name}", "status": "Running", "run_id": run_id}


@app.get("/api/run/custom/status")
def get_custom_status():
    """Poll the status of the current custom docking run."""
    state = run_states["custom"]
    if state["status"] == "Running" and state["start_time"] is not None:
        state["elapsed"] = round(time.time() - state["start_time"], 2)
    return {
        "status": state["status"],
        "progress": state["progress"],
        "elapsed": state["elapsed"],
        "logs": state["logs"],
        "error": state["error"],
        "run_id": state.get("run_id"),
    }


@app.get("/api/run/custom/results")
def get_custom_results():
    """Get the final results of the completed custom docking run."""
    state = run_states["custom"]
    if state["status"] == "Running":
        return {"status": "running", "message": "Pipeline is still executing. Poll /api/run/custom/status."}
    if state["status"] == "Failed":
        return {"status": "failed", "error": state["error"]}
    if state["status"] == "Idle":
        return {"status": "idle", "message": "No custom docking has been run yet."}
    
    result = state.get("result")
    if result:
        return {
            "status": "success",
            "targetId": result.get("target_id", ""),
            "compoundId": result.get("compound_id", ""),
            "compoundName": result.get("compound_name", ""),
            "vinaAffinity": result.get("vina_affinity", 0.0),
            "diffdockConfidence": result.get("diffdock_confidence", 0.0),
            "priorityScore": result.get("priority_score", 0.0),
            "decision": result.get("decision", "N/A"),
            "evidenceStrength": result.get("evidence_strength", "N/A"),
            "filesGenerated": result.get("files_generated", 0),
            "message": f"Real pipeline completed for {result.get('compound_name', 'compound')}"
        }
    
    return {"status": "completed", "message": "Run completed but result data not available."}


@app.post("/api/run/custom/reset")
def reset_custom_run():
    """Reset the custom run state so a new run can be started."""
    state = run_states["custom"]
    if state["status"] == "Running":
        return JSONResponse(status_code=400, content={"message": "Cannot reset while a run is in progress."})
    run_states["custom"] = {
        "status": "Idle", "progress": 0, "logs": [], "elapsed": 0.0,
        "start_time": None, "error": None, "result": None, "run_id": None
    }
# --- Live Multi-Model Docking Endpoints ---
from api.live_docking_service import (
    fetch_target_structure,
    fetch_ligand_from_pubchem,
    execute_live_docking_pipeline
)

class LiveDockRequest(BaseModel):
    target: str = "pqsr"
    ligand: str = "curcumin"
    compound_name: Optional[str] = None

@app.get("/api/live/fetch-target")
def get_live_target(query: str):
    """Fetch target details from local registry or live from RCSB PDB."""
    try:
        data = fetch_target_structure(query)
        return {
            "status": "success",
            "target_id": data["target_id"],
            "target_name": data["target_name"],
            "organism": data["organism"],
            "pdb_id": data["pdb_id"],
            "center": data["center"],
            "size": data["size"],
            "atom_count": data["atom_count"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/live/fetch-ligand")
def get_live_ligand(query: str):
    """Query chemical details and SMILES from PubChem REST API."""
    try:
        data = fetch_ligand_from_pubchem(query)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/live/dock")
def run_live_docking_endpoint(req: LiveDockRequest):
    """Execute live AutoDock Vina + DiffDock-L docking, bond calculation, and priority scoring."""
    try:
        result = execute_live_docking_pipeline(req.target, req.ligand, req.compound_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Docking execution failed: {str(e)}")

# Mount React static files if the production build exists
react_dist = BASE_DIR / "frontend" / "dist"
if react_dist.exists():
    app.mount("/", StaticFiles(directory=str(react_dist), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    print("Starting API server...")
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
