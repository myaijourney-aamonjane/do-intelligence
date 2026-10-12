import os, sys

sys_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
if sys_path not in sys.path:
    sys.path.insert(0, sys_path)

# Import from app.agents
from app.agents import (
    AnalysisState, initialize_state, transition_state,
    DocumentAgent, PolicyData, ExtractedField,
    ClauseAnalysisResult, ClauseCategory,
    PolicyComparisonResult, ComparisonCriterion,
    Insight, RiskInsights,
    ComparisonReport, ExecutiveSummary, ReportSection
)

# Test initialize_state
state = initialize_state("doc_001")
print("✓ initialize_state works")
print(f"  document_id: {state['document_id']}")
print(f"  processing_status: {state['processing_status']}")

# Test transition_state
new_state = transition_state(state, "processing")
print("✓ transition_state works")
print(f"  current_step: {new_state['current_step']}")
print(f"  processing_status: {new_state['processing_status']}")

# Test PolicyData
policy = PolicyData(
    seguradora="Example Insurance",
    numero_apolice="POL-001",
    limite_responsabilidade="R$ 5M",
    confianca_geral=0.92
)
print("✓ PolicyData works")
print(f"  seguradora: {policy.seguradora}")
print(f"  limite_responsabilidade: {policy.limite_responsabilidade}")

# Test ClauseCategory
clause = ClauseCategory(
    category="Exclusion",
    name="Prior Acts Exclusion",
    description="Cláusula que exclui sinistros de atos anteriores",
    importance="high",
    confidence=0.91,
    page=27,
    evidence="The insurer shall not indemnify...",
    source="policy_a.pdf"
)
print("✓ ClauseCategory works")
print(f"  category: {clause.category}")
print(f"  importance: {clause.importance}")

# Test ComparisonCriterion
criterion = ComparisonCriterion(
    criterion="Liability Limit",
    value_a="R$ 5M",
    value_b="R$ 10M",
    difference="R$ 5M",
    impact="Increased risk exposure",
    severity="high",
    evidence_a={"page": 18, "text": "Limit clause"},
    evidence_b={"page": 22, "text": "Limit clause"}
)
print("✓ ComparisonCriterion works")
print(f"  criterion: {criterion.criterion}")
print(f"  severity: {criterion.severity}")

# Test Insight
insight = Insight(
    criterion="Liability Limit",
    policy_a="R$ 5M",
    policy_b="R$ 10M",
    insight_text="A Apólice B apresenta limite superior neste critério.",
    confidence=0.94,
    severity="high",
    evidence_a={"page": 18},
    evidence_b={"page": 22}
)
print("✓ Insight works")
print(f"  insight_text: {insight.insight_text}")
print(f"  severity: {insight.severity}")

# Test RiskInsights
risks = RiskInsights()
risks.add_insight(
    criterion="Liability Limit",
    insight_text="A Apólice B apresenta limite superior neste critério.",
    confidence=0.94,
    severity="high"
)
risks.add_insight(
    criterion="Deductible",
    insight_text="A Apólice A tem franquia maior.",
    confidence=0.88,
    severity="medium"
)
print("✓ RiskInsights works")
print(f"  total_insights: {risks.total_insights}")
print(f"  high_severity_count: {risks.high_severity_count}")
print(f"  summary: {risks.get_summary()}")

# Test ComparisonReport
report = ComparisonReport(
    policy_a_id="POL-001",
    policy_b_id="POL-002",
    policy_a_number="APÓLICE A",
    policy_b_number="APÓLICE B"
)
report.add_section("Resumo Executivo", "Comparação entre duas apólices D&O", 0)
report.add_section("Diferenças Principais", "5 critérios com diferenças significativas", 1)
print("✓ ComparisonReport works")
print(f"  report_id: {report.report_id}")
print(f"  status: {report.status}")
print(f"  sections count: {len(report.sections)}")
print(f"  to_dict keys: {list(report.to_dict().keys())}")

print("\n✅ All agent imports and basic tests passed!")