"""
Mock LLM Provider for offline development and testing.

This provider simulates LLM responses without requiring an external API key.
Essential for:
- Offline/MVP demonstration
- Unit testing
- Development without API costs
- Fallback when external LLM is unavailable
"""

import json
import random
from typing import Any, Dict, List, Optional, cast

from pydantic import BaseModel, Field


class MockLLMProvider:
    """
    Mock LLM Provider that generates deterministic responses for development.
    
    Features:
    - Structured output respecting Pydantic schemas
    - Evidence preservation (page, document sourcing)
    - Controlled confidence levels
    - Null/hallucination avoidance
    - Configurable response patterns
    """
    
    def __init__(self, seed: Optional[int] = 42):
        self.seed = seed
        random.seed(seed)
        self.call_count = 0
    
    def generate(self, prompt: str, schema: type[BaseModel], **kwargs) -> BaseModel:
        """
        Generate a structured response based on a prompt and expected schema.
        
        Args:
            prompt: The prompt to send to the "LLM"
            schema: Pydantic BaseModel class expecting the output
            **kwargs: Additional options (temperature, confidence_base, etc.)
            
        Returns:
            Instantiated Pydantic model with mock data
        """
        self.call_count += 1
        call_id = self.call_count
        
        # Extract base model fields, excluding computed/internal ones
        model_fields = {name: field for name, field in schema.model_fields.items()}
        
        # Build mock data respecting the schema
        mock_data = {}
        for field_name, field_info in model_fields.items():
            if field_info.is_required() and field_name not in kwargs.get('ignore_fields', []):
                # Generate mock value based on field type and name
                mock_data[field_name] = self._mock_field_value(
                    field_name, field_info.annotation, kwargs
                )
        
        # Instantiate the Pydantic model
        try:
            return schema(**mock_data)
        except Exception:
            # Fallback: return model with default/required only
            minimal = {k: v for k, v in mock_data.items() if v is not None}
            return schema(**minimal)
    
    def _mock_field_value(
        self, 
        field_name: str, 
        field_type: type, 
        kwargs: Dict[str, Any]
    ) -> Any:
        """Generate a mock value for a given field based on its name and type."""
        # Normalize field name for category detection
        name_lower = field_name.lower()
        
        # Percentage/confidence fields (must come BEFORE number/check ID checks)
        if any(kw in name_lower for kw in ['confidence', 'percent', 'rate']):
            return round(random.uniform(0.75, 0.99), 2)
        
        # Identity/identification fields
        if any(kw in name_lower for kw in ['number', 'id', 'policy', 'document']):
            return f"POL-MOCK-{random.randint(1000, 9999)}"
        
        # Name fields
        if any(kw in name_lower for kw in ['name', 'holder', 'insurer', 'company']):
            return f"Mock {field_name.title()}"
        
        # Currency/value fields
        if any(kw in name_lower for kw in ['limit', 'deductible', 'premium', 'value', 'amount', 'currency']):
            # Generate realistic-looking but fake values
            prefixes = ["USD ", "EUR ", "GBP ", "BRL "]
            return f"{random.choice(prefixes)}{random.uniform(1000, 10000000):,.2f}"
        
        # Percentage/confidence fields
        if any(kw in name_lower for kw in ['confidence', 'percent', 'rate']):
            return round(random.uniform(0.75, 0.99), 2)
        
        # Page fields
        if any(kw in name_lower for kw in ['page']):
            return random.randint(1, 100)
        
        # Text/evidence fields
        if any(kw in name_lower for kw in ['evidence', 'text', 'clause', 'description']):
            return f"Evidence excerpt for {field_name} from policy document page {random.randint(1, 50)}"
        
        # Category fields (clause types, criteria)
        if any(kw in name_lower for kw in ['category', 'criterion', 'type']):
            categories = [
                "Coverage", "Exclusion", "Limitation", "Deductible",
                "Sublimit", "Condition", "Extension", "Obligation"
            ]
            return random.choice(categories)
        
        # Boolean fields
        if field_type == bool:
            return random.choice([True, False])
        
        # List fields
        if hasattr(field_type, '__origin__') and field_type.__origin__ == list:
            return [f"Mock item {i}" for i in range(random.randint(1, 5))]
        
        # Default: return a sensible mock string
        return f"MOCK_{field_name.upper()}"
    
    def extract_text(self, image_data: Any) -> str:
        """
        Mock OCR/text extraction.
        
        Args:
            image_data: Image or PDF page data
            
        Returns:
            Mock extracted text preserving page/document relationship
        """
        self.call_count += 1
        # Simulate text extraction with page preservation
        return (
            f"[MOCK OCR] Document information extracted with confidence. "
            f"Key fields identified with page references. "
            f"Confidence score: {round(random.uniform(0.85, 0.98), 2)}"
        )
    
    def count_tokens(self, text: str) -> int:
        """Mock token counting."""
        return max(len(text) // 4, 1)
    
    def estimate_cost(self, tokens: int) -> float:
        """Mock cost estimation (always $0 for mock)."""
        return 0.0
    
    def reset(self):
        """Reset the provider state."""
        self.call_count = 0
        random.seed(self.seed)


# Convenience function for quick usage
def create_mock_provider(seed: int = 42) -> MockLLMProvider:
    """Create a mock LLM provider with optional seed for reproducibility."""
    return MockLLMProvider(seed=seed)


# Default mock provider instance
default_provider = create_mock_provider()


# Compatibility shim for environments expecting LLMProvider interface
class LLMProvider:
    """Compatibility shim - aliases to MockLLMProvider."""
    
    def __init__(self, *args, **kwargs):
        self.mock = MockLLMProvider(*args, **kwargs)
    
    def generate(self, prompt: str, schema: type[BaseModel], **kwargs) -> BaseModel:
        return self.mock.generate(prompt, schema, **kwargs)
    
    def extract_text(self, image_data: Any) -> str:
        return self.mock.extract_text(image_data)
    
    def __getattr__(self, name):
        """Delegate any unhandled attributes to the mock provider."""
        return getattr(self.mock, name)


# Export for convenience
__all__ = [
    "MockLLMProvider",
    "LLMProvider", 
    "create_mock_provider",
    "default_provider",
]