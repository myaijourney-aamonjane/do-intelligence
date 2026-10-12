@echo off
cd /d "d:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend"
python -c "
from app import app

print('FastAPI app created successfully')
print('Routes:')

for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ', '.join(route.methods)
        print(f'  {methods:15} {route.path}')
"