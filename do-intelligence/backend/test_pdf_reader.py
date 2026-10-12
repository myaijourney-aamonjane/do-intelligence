import fitz

pdf_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\uploads\demos\10_Apolices_DO_PDF\POL-DO-2025-010.pdf'
doc = fitz.open(pdf_path)

print(f"Total Pages: {len(doc)}")
for idx, page in enumerate(doc):
    text = page.get_text("text")
    print(f"\n--- PAGE {idx+1} ---")
    print(text[:1500])
