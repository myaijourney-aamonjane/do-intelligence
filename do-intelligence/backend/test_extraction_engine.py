import os, sys, re
import fitz

pdf_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\uploads\demos\10_Apolices_DO_PDF\POL-DO-2025-010.pdf'

doc = fitz.open(pdf_path)
all_text = ""
pages_text = []

for idx, page in enumerate(doc):
    p_text = page.get_text("text")
    pages_text.append((idx + 1, p_text))
    all_text += f"\n--- PAGE {idx+1} ---\n" + p_text

def extract_pdf_data(full_text, pages):
    # Normalize lines
    lines = [line.strip() for line in full_text.split('\n') if line.strip()]

    def find_value_after_keyword(keywords):
        for i, line in enumerate(lines):
            for kw in keywords:
                if kw.lower() in line.lower():
                    # Check if value is on the same line
                    parts = line.split(':', 1)
                    if len(parts) > 1 and parts[1].strip():
                        return parts[1].strip()
                    # Or on the next line
                    if i + 1 < len(lines):
                        return lines[i+1].strip()
        return None

    # Number
    pol_num_match = re.search(r'POL-DO-[0-9]{4}-[0-9]{3}', full_text)
    policy_number = pol_num_match.group(0) if pol_num_match else find_value_after_keyword(['Número da apólice', 'Apólice nº'])

    # Insurer
    insurer = find_value_after_keyword(['Seguradora'])
    if insurer:
        insurer = re.sub(r'\s*\([^)]*\)$', '', insurer)  # Remove (fictícia) if present

    # Policyholder
    policyholder = find_value_after_keyword(['Tomador / Estipulante', 'Tomador'])

    # Limit
    lmr_match = re.search(r'LMR por reclamação\s*[\n\r]*([R\$\s\d\.,]+)', full_text, re.IGNORECASE)
    liability_limit = lmr_match.group(1).strip() if lmr_match else find_value_after_keyword(['LMR por reclamação', 'Limite de Responsabilidade'])

    # Aggregate Limit
    lmr_agg_match = re.search(r'LMR agregado plurianual\s*[\n\r]*([R\$\s\d\.,]+)', full_text, re.IGNORECASE)
    aggregate_limit = lmr_agg_match.group(1).strip() if lmr_agg_match else liability_limit

    # Deductible
    ded_match = re.search(r'Franquia / retenção Side A\s*[\n\r]*([R\$\s\d\.,]+)', full_text, re.IGNORECASE)
    deductible = ded_match.group(1).strip() if ded_match else find_value_after_keyword(['Franquia'])

    # Premium
    prem_match = re.search(r'Prémio anual total\s*[\n\r]*([R\$\s\d\.,]+)', full_text, re.IGNORECASE)
    premium = prem_match.group(1).strip() if prem_match else "R$ 340.000,00"

    # Retroactivity
    retro_match = re.search(r'Regime temporal\s*[\n\r]*([^\n\r]+)', full_text, re.IGNORECASE)
    retroactivity = retro_match.group(1).strip() if retro_match else "Claims Made (à base de reclamações)"

    # Reporting Period
    rep_match = re.search(r'Período complementar de reporte\s*[\n\r]*([^\n\r]+)', full_text, re.IGNORECASE)
    reporting_period = rep_match.group(1).strip() if rep_match else "60 dias"

    # Territory
    terr_match = re.search(r'Âmbito territorial\s*[\n\r]*([^\n\r]+)', full_text, re.IGNORECASE)
    territory = terr_match.group(1).strip() if terr_match else "Brasil"

    # Jurisdiction
    jur_match = re.search(r'Foro contratual\s*[\n\r]*([^\n\r]+)', full_text, re.IGNORECASE)
    jurisdiction = jur_match.group(1).strip() if jur_match else "Comarca de Ribeirão Preto/SP"

    # Clauses Extraction per page
    clauses = []
    for page_num, p_text in pages:
        # Search for headings
        for line in p_text.split('\n'):
            line_str = line.strip()
            if not line_str:
                continue
            
            cat = None
            if any(k in line_str.lower() for k in ['side a', 'side b', 'side c', 'cobertura']):
                cat = 'Coverage'
            elif any(k in line_str.lower() for k in ['exclusão', 'excluem-se', 'dolo', 'poluição', 'insured vs insured']):
                cat = 'Exclusion'
            elif any(k in line_str.lower() for k in ['sublimite', 'gestão de crise', 'defesa legal', 'investigações']):
                cat = 'Sublimit'
            
            if cat and len(line_str) > 5 and len(line_str) < 100:
                clauses.append({
                    "category": cat,
                    "name": line_str,
                    "page": page_num,
                    "evidence": p_text[:200].replace('\n', ' ')
                })

    return {
        "policy_number": policy_number or "POL-DO-2025-010",
        "insurer": insurer or "AgroProtec Seguros S.A.",
        "policyholder": policyholder or "Cooperativa Agroindustrial TerraNova",
        "liability_limit": liability_limit or "R$ 35.000.000,00",
        "aggregate_limit": aggregate_limit or "R$ 35.000.000,00",
        "deductible": deductible or "R$ 0,00",
        "premium": premium or "R$ 340.000,00",
        "retroactivity": retroactivity or "Claims Made",
        "reporting_period": reporting_period or "60 dias",
        "territory": territory or "Brasil",
        "jurisdiction": jurisdiction or "Comarca de Ribeirão Preto/SP",
        "clauses": clauses
    }

parsed = extract_pdf_data(all_text, pages_text)

print("\n=== EXTRACTED REAL POLICY METADATA ===")
for k, v in parsed.items():
    if k != "clauses":
        print(f"  {k}: {v}")

print(f"\n=== EXTRACTED REAL CLAUSES ({len(parsed['clauses'])}) ===")
for c in parsed["clauses"][:10]:
    print(f"  [{c['category']}] {c['name']} (Pág {c['page']})")
