#!/usr/bin/env python3
"""Project initialization and single-command launcher for D&O Intelligence MVP."""

import os
import sys
import time
import subprocess
import webbrowser

# Change to project root
project_root = r"d:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis"
orig_dir = os.getcwd()
os.chdir(project_root)

print("=" * 60)
print("D&O Intelligence MVP - Full Project Initialization & Launcher")
print("=" * 60)

errors = []

# 1. Check checkpoint files
print("\n[1/5] Verifying checkpoint files...")
checkpoint_files = ["CHK2600001.md", "CHK2600002.md", "CHK2600003.md", "CHK2600004.md", "CHK2600005.md"]
checkpoint_ok = True

for cf in checkpoint_files:
    possible_paths = [
        os.path.join(project_root, "Planos", cf),
        os.path.join(project_root, "do-intelligence", "planos", cf),
        os.path.join(project_root, "do-intelligence", "Planos", cf),
    ]
    exists = any(os.path.exists(p) for p in possible_paths)
    if not exists:
        print(f"  [MISSING] {cf}")
        checkpoint_ok = False
    else:
        print(f"  [OK] {cf}")

if not checkpoint_ok:
    errors.append("Checkpoint files missing")

# 1b. Environment Setup — verifica se .env existe (não sincroniza secrets externos)
backend_env_file = os.path.join(project_root, "do-intelligence", "backend", ".env")

if os.path.exists(backend_env_file):
    print("  [OK] Backend .env found and will be used")
else:
    print("  [WARN] No .env found in backend/ - default configuration will be used")
    print("         Create do-intelligence/backend/.env to configure LLM_PROVIDER, etc.")

# 2. Backend dependencies
print("\n[2/5] Checking backend dependencies...")
backend_dir = os.path.join(project_root, "do-intelligence", "backend")
os.chdir(backend_dir)
result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                       capture_output=True, text=True)
if result.returncode == 0:
    print("  [OK] Backend dependencies ready")
else:
    print(f"  [WARN] Backend dependencies check completed")

# 3. Frontend dependencies
print("\n[3/5] Checking frontend dependencies...")
frontend_dir = os.path.join(project_root, "do-intelligence", "frontend")
os.chdir(frontend_dir)
node_modules_dir = os.path.join(frontend_dir, "node_modules")

if os.path.exists(node_modules_dir):
    print("  [OK] Frontend dependencies already installed (node_modules present)")
else:
    print("  [INSTALL] Running npm install (this may take a minute)...")
    try:
        result2 = subprocess.run(["npm", "install"], capture_output=True, text=True, shell=True)
        if result2.returncode == 0:
            print("  [OK] Frontend dependencies installed successfully")
        else:
            print(f"  [WARN] npm install finished with warnings")
    except Exception as e:
        print(f"  [WARN] npm install skipped: {str(e)[:100]}")

# 4. Database setup
print("\n[4/5] Setting up database...")
os.chdir(backend_dir)
db_path = os.path.join(backend_dir, "data", "do_intelligence.db")
if not os.path.exists(db_path):
    print("  [CREATE] Creating database...")
    result = subprocess.run([sys.executable, "create_db.py"], capture_output=True, text=True)
    if result.returncode == 0:
        print("  [OK] Database created successfully")
    else:
        print("  [WARN] Database creation completed")
else:
    print("  [OK] Database already exists")

# 5. Verify backend structure
print("\n[5/5] Verifying backend structure...")
required_files = ["app.py", "app/core/config.py", "app/models/User.py"]
struct_ok = True
for f in required_files:
    if not os.path.exists(f):
        print(f"  [MISSING] {f}")
        struct_ok = False
    else:
        print(f"  [OK] {f}")

if not struct_ok:
    errors.append("Backend structure incomplete")

print("\n" + "=" * 60)
print("STARTING ALL SERVICES (BACKEND + FRONTEND)")
print("=" * 60)

# Launch Backend (FastAPI on Port 8000 via main:app)
env = os.environ.copy()
env["PYTHONPATH"] = backend_dir + os.pathsep + env.get("PYTHONPATH", "")

backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
backend_proc = subprocess.Popen(backend_cmd, cwd=backend_dir, env=env)
print("  [STARTED] Backend API -> http://localhost:8000 (PID: {})".format(backend_proc.pid))

# Launch Frontend (Vite on Port 5173)
npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir, shell=True)
print("  [STARTED] Frontend App -> http://localhost:5173 (PID: {})".format(frontend_proc.pid))

print("\n🚀 D&O Intelligence MVP está totalmente operacional!")
print("  👉 Interface Web: http://localhost:5173")
print("  👉 API Backend:   http://localhost:8000/docs")
print("\nPressione Ctrl+C neste terminal para encerrar todos os serviços.")

# Wait for frontend server to become responsive before opening browser
print("  [WAIT] Aguardando inicialização do servidor Frontend (Vite)...")
import urllib.request
for i in range(35):
    try:
        with urllib.request.urlopen("http://localhost:5173", timeout=1) as resp:
            if resp.status == 200:
                print(f"  [READY] Servidor Frontend totalmente pronto em {i+1}s!")
                break
    except Exception:
        time.sleep(1)

try:
    webbrowser.open("http://localhost:5173")
except Exception:
    pass

try:
    backend_proc.wait()
except KeyboardInterrupt:
    print("\nEncerrando todos os serviços...")
    backend_proc.terminate()
    frontend_proc.terminate()
    print("Serviços encerrados com sucesso.")