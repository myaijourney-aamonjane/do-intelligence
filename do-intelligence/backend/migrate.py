import os
import sys
sys_path = r"d:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend"
if sys_path not in sys.path:
    sys.path.insert(0, sys_path)

os.chdir(sys_path)

from alembic.config import Config
from alembic import command

# Use absolute path for the alembic config
c = Config(r"d:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend\alembic\alembic.ini")
command.revision(c, autogenerate=True, head='base')
print("Migration created successfully")