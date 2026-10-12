import os
import sys

# Add the backend directory to path for imports
backend_dir = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change to the backend directory
os.chdir(backend_dir)

from app import app

print('FastAPI app created successfully')
print('Routes:')

for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ', '.join(route.methods)
        print(f'  {methods:15} {route.path}')