import os
import sys

sys_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
os.chdir(sys_path)
sys.path.insert(0, sys_path)

from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///d:/Projectos/I2A2/Labs/DO Insight — Intelligent Policy Analysis/data/do_intelligence.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT name FROM sqlite_master WHERE type="table"')).fetchall()
    print('Tables:', result)