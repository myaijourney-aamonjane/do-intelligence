import sys
import importlib.util

sys.path.insert(0, r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend')

# Load the module manually
spec = importlib.util.spec_from_file_location(
    "mock_provider",
    r"d:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend/app/llm/mock_provider.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Test creating provider
provider = module.MockLLMProvider(seed=123)
print('OK MockLLMProvider created')

# Test generate with a schema
from pydantic import BaseModel

class TestSchema(BaseModel):
    name: str
    value: str
    confidence: float
    page: int = None

result = provider.generate('Test prompt', TestSchema)
print(f'OK generate() works: name={result.name}, confidence={result.confidence}, page={result.page}')

# Test default provider
print(f'OK provider calls: {provider.call_count}')

# Test that provider can be reset
provider.reset()
print(f'OK provider reset: {provider.call_count} calls')

print('OK Mock LLM Provider functional!')