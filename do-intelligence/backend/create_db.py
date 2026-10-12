import os
import sys

sys_path = r'd:\Projectos\I2A2\Labs\DO Insight — Intelligent Policy Analysis\do-intelligence\backend'
os.chdir(sys_path)
sys.path.insert(0, sys_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models
from app.models.User import User, Role, Base
from app.models.AuditLog import AuditLog
from app.models.Setting import Setting
from app.models.Checkpoint import Checkpoint
from app.models.Document import Document
from app.models.Policy import Policy
from app.models.PolicyField import PolicyField
from app.models.Clause import Clause
from app.models.Comparison import Comparison
from app.models.ComparisonItem import ComparisonItem

# ---------------------------------------------------------------------------
# Seed data – 22 apólices D&O em Real (BRL)
# ---------------------------------------------------------------------------

SEED_POLICIES = [
    dict(
        filename="Apolice_DO_Chubb_2025.pdf",
        policy_number="POL-DO-2025-001",
        insurer="Chubb Seguros Brasil S.A.",
        policyholder="TecnoGlobal Brasil S.A.",
        liability_limit="R$ 150.000.000",
        aggregate_limit="R$ 300.000.000",
        deductible="R$ 2.500.000",
        premium="R$ 12.500.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2020", reporting_period="60 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Mapfre_2025.pdf",
        policy_number="POL-DO-2025-002",
        insurer="Mapfre Seguros S.A.",
        policyholder="Energética Nacional S.A.",
        liability_limit="R$ 100.000.000",
        aggregate_limit="R$ 200.000.000",
        deductible="R$ 5.000.000",
        premium="R$ 9.800.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2022", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro do Rio de Janeiro",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_TokioMarine_2025.pdf",
        policy_number="POL-DO-2025-003",
        insurer="Tokio Marine Seguradora",
        policyholder="Construtora Meridional S.A.",
        liability_limit="R$ 200.000.000",
        aggregate_limit="R$ 400.000.000",
        deductible="R$ 3.000.000",
        premium="R$ 18.000.000",
        start_date="2025-02-01", end_date="2026-01-31",
        retroactivity="01/02/2018", reporting_period="60 dias",
        territory="Brasil e América Latina", jurisdiction="Foro de São Paulo",
        status="PROCESSING",
    ),
    dict(
        filename="Apolice_DO_Zurich_2025.pdf",
        policy_number="POL-DO-2025-004",
        insurer="Zurich Seguros S.A.",
        policyholder="Financeira Horizonte S.A.",
        liability_limit="R$ 80.000.000",
        aggregate_limit="R$ 160.000.000",
        deductible="R$ 1.500.000",
        premium="R$ 7.200.000",
        start_date="2025-03-01", end_date="2026-02-28",
        retroactivity="01/03/2019", reporting_period="90 dias",
        territory="Brasil", jurisdiction="Foro de Brasília",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Allianz_2025.pdf",
        policy_number="POL-DO-2025-005",
        insurer="Allianz Seguros S.A.",
        policyholder="Pharma Holdings Brasil LTDA",
        liability_limit="R$ 250.000.000",
        aggregate_limit="R$ 500.000.000",
        deductible="R$ 7.500.000",
        premium="R$ 22.000.000",
        start_date="2025-01-15", end_date="2026-01-14",
        retroactivity="15/01/2015", reporting_period="60 dias",
        territory="Global", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_AIG_2025.pdf",
        policy_number="POL-DO-2025-006",
        insurer="AIG Seguros Brasil S.A.",
        policyholder="Agropecuária Monte Verde S.A.",
        liability_limit="R$ 120.000.000",
        aggregate_limit="R$ 240.000.000",
        deductible="R$ 4.000.000",
        premium="R$ 11.000.000",
        start_date="2024-07-01", end_date="2025-06-30",
        retroactivity="01/07/2016", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro de Curitiba",
        status="EXPIRED",
    ),
    dict(
        filename="Apolice_DO_PortoSeguro_2025.pdf",
        policy_number="POL-DO-2025-007",
        insurer="Porto Seguro S.A.",
        policyholder="Varejista Digital S.A.",
        liability_limit="R$ 60.000.000",
        aggregate_limit="R$ 120.000.000",
        deductible="R$ 1.000.000",
        premium="R$ 5.400.000",
        start_date="2025-04-01", end_date="2026-03-31",
        retroactivity="01/04/2021", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Bradesco_2025.pdf",
        policy_number="POL-DO-2025-008",
        insurer="Bradesco Seguros S.A.",
        policyholder="Grupo Financeiro Atlântico S.A.",
        liability_limit="R$ 90.000.000",
        aggregate_limit="R$ 180.000.000",
        deductible="R$ 2.000.000",
        premium="R$ 8.100.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2017", reporting_period="60 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_SulAmerica_2025.pdf",
        policy_number="POL-DO-2025-009",
        insurer="SulAmérica Seguros S.A.",
        policyholder="Logística Express S.A.",
        liability_limit="R$ 75.000.000",
        aggregate_limit="R$ 150.000.000",
        deductible="R$ 1.800.000",
        premium="R$ 6.750.000",
        start_date="2025-05-01", end_date="2026-04-30",
        retroactivity="01/05/2020", reporting_period="45 dias",
        territory="Brasil e Mercosul", jurisdiction="Foro do Rio de Janeiro",
        status="PROCESSING",
    ),
    dict(
        filename="Apolice_DO_HDI_2025.pdf",
        policy_number="POL-DO-2025-010",
        insurer="HDI Seguros S.A.",
        policyholder="Indústria Química Nacional S.A.",
        liability_limit="R$ 180.000.000",
        aggregate_limit="R$ 360.000.000",
        deductible="R$ 6.000.000",
        premium="R$ 16.200.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2014", reporting_period="60 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Liberty_2025.pdf",
        policy_number="POL-DO-2025-011",
        insurer="Liberty Seguros S.A.",
        policyholder="Telecomunicações Futuro S.A.",
        liability_limit="R$ 110.000.000",
        aggregate_limit="R$ 220.000.000",
        deductible="R$ 3.500.000",
        premium="R$ 9.900.000",
        start_date="2025-06-01", end_date="2026-05-31",
        retroactivity="01/06/2019", reporting_period="60 dias",
        territory="Brasil", jurisdiction="Foro de Belo Horizonte",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Generali_2025.pdf",
        policy_number="POL-DO-2025-012",
        insurer="Generali Brasil Seguros S.A.",
        policyholder="Saúde Integrada Brasil S.A.",
        liability_limit="R$ 95.000.000",
        aggregate_limit="R$ 190.000.000",
        deductible="R$ 2.200.000",
        premium="R$ 8.550.000",
        start_date="2025-03-15", end_date="2026-03-14",
        retroactivity="15/03/2018", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Itau_2025.pdf",
        policy_number="POL-DO-2025-013",
        insurer="Itaú Seguros S.A.",
        policyholder="Mineradora Ouro Verde S.A.",
        liability_limit="R$ 140.000.000",
        aggregate_limit="R$ 280.000.000",
        deductible="R$ 5.500.000",
        premium="R$ 12.600.000",
        start_date="2024-01-01", end_date="2024-12-31",
        retroactivity="01/01/2016", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="EXPIRED",
    ),
    dict(
        filename="Apolice_DO_XLCatlin_2025.pdf",
        policy_number="POL-DO-2025-014",
        insurer="XL Catlin Seguros Brasil S.A.",
        policyholder="Infraestrutura Capital S.A.",
        liability_limit="R$ 300.000.000",
        aggregate_limit="R$ 600.000.000",
        deductible="R$ 10.000.000",
        premium="R$ 27.000.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2012", reporting_period="90 dias",
        territory="Global", jurisdiction="Câmara de Arbitragem – São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_SwissRe_2025.pdf",
        policy_number="POL-DO-2025-015",
        insurer="Swiss Re Corporate Solutions",
        policyholder="Petroquímica Sul S.A.",
        liability_limit="R$ 220.000.000",
        aggregate_limit="R$ 440.000.000",
        deductible="R$ 8.000.000",
        premium="R$ 19.800.000",
        start_date="2025-07-01", end_date="2026-06-30",
        retroactivity="01/07/2015", reporting_period="60 dias",
        territory="Brasil e América do Sul", jurisdiction="Câmara de Arbitragem – Rio de Janeiro",
        status="PROCESSING",
    ),
    dict(
        filename="Apolice_DO_Fairfax_2025.pdf",
        policy_number="POL-DO-2025-016",
        insurer="Fairfax Brasil Seguros S.A.",
        policyholder="Comércio Exterior Brasil LTDA",
        liability_limit="R$ 55.000.000",
        aggregate_limit="R$ 110.000.000",
        deductible="R$ 1.200.000",
        premium="R$ 4.950.000",
        start_date="2025-04-01", end_date="2026-03-31",
        retroactivity="01/04/2020", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro de Porto Alegre",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Willis_2025.pdf",
        policy_number="POL-DO-2025-017",
        insurer="Willis Towers Watson Seguros",
        policyholder="Conglomerado Tecnológico S.A.",
        liability_limit="R$ 160.000.000",
        aggregate_limit="R$ 320.000.000",
        deductible="R$ 4.500.000",
        premium="R$ 14.400.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2013", reporting_period="60 dias",
        territory="Global", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Aon_2025.pdf",
        policy_number="POL-DO-2025-018",
        insurer="Aon Seguros Brasil S.A.",
        policyholder="Grupo Educacional Saber S.A.",
        liability_limit="R$ 130.000.000",
        aggregate_limit="R$ 260.000.000",
        deductible="R$ 3.800.000",
        premium="R$ 11.700.000",
        start_date="2025-02-15", end_date="2026-02-14",
        retroactivity="15/02/2017", reporting_period="45 dias",
        territory="Brasil", jurisdiction="Foro de São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_EulerHermes_2025.pdf",
        policy_number="POL-DO-2025-019",
        insurer="Euler Hermes Seguros S.A.",
        policyholder="Importadora Global Brasil LTDA",
        liability_limit="R$ 70.000.000",
        aggregate_limit="R$ 140.000.000",
        deductible="R$ 1.600.000",
        premium="R$ 6.300.000",
        start_date="2024-06-01", end_date="2025-05-31",
        retroactivity="01/06/2018", reporting_period="30 dias",
        territory="Brasil e Europa", jurisdiction="Foro de São Paulo",
        status="EXPIRED",
    ),
    dict(
        filename="Apolice_DO_MunichRe_2025.pdf",
        policy_number="POL-DO-2025-020",
        insurer="Munich Re do Brasil Seguros",
        policyholder="Bancorp Investimentos S.A.",
        liability_limit="R$ 280.000.000",
        aggregate_limit="R$ 560.000.000",
        deductible="R$ 9.000.000",
        premium="R$ 25.200.000",
        start_date="2025-01-01", end_date="2025-12-31",
        retroactivity="01/01/2010", reporting_period="90 dias",
        territory="Global", jurisdiction="Câmara de Arbitragem – São Paulo",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_HannoverRe_2025.pdf",
        policy_number="POL-DO-2025-021",
        insurer="Hannover Re Brasil Seguros",
        policyholder="Resseguradora Meridional S.A.",
        liability_limit="R$ 210.000.000",
        aggregate_limit="R$ 420.000.000",
        deductible="R$ 7.000.000",
        premium="R$ 18.900.000",
        start_date="2025-08-01", end_date="2026-07-31",
        retroactivity="01/08/2014", reporting_period="60 dias",
        territory="Brasil e Europa", jurisdiction="Câmara de Arbitragem – Rio de Janeiro",
        status="ACTIVE",
    ),
    dict(
        filename="Apolice_DO_Scor_2025.pdf",
        policy_number="POL-DO-2025-022",
        insurer="Scor Global Life do Brasil",
        policyholder="Holding Saúde Vital S.A.",
        liability_limit="R$ 85.000.000",
        aggregate_limit="R$ 170.000.000",
        deductible="R$ 2.800.000",
        premium="R$ 7.650.000",
        start_date="2025-09-01", end_date="2026-08-31",
        retroactivity="01/09/2019", reporting_period="30 dias",
        territory="Brasil", jurisdiction="Foro do Rio de Janeiro",
        status="PROCESSING",
    ),
]

# ---------------------------------------------------------------------------
# DB paths – same as original script
# ---------------------------------------------------------------------------

db_paths = [
    os.path.join(sys_path, 'data', 'do_intelligence.db'),
    os.path.join(sys_path, '..', 'data', 'do_intelligence.db'),
]

for db_path in db_paths:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception as e:
            print(f"Notice: could not remove {db_path}: {e}")

    engine = create_engine('sqlite:///' + db_path, echo=False)
    Base.metadata.create_all(engine)
    print(f'Database tables created at: {db_path}')

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    # ---- User ---------------------------------------------------------------
    user = session.query(User).first()
    if not user:
        user = User(
            email="carlos.mendes@techglobal.com.br",
            password_hash="dev_dummy_hash",
            full_name="Carlos Mendes",
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    # ---- Documents + Policies -----------------------------------------------
    for seed in SEED_POLICIES:
        doc = Document(
            filename=seed["filename"],
            file_path=f"/uploads/{seed['filename']}",
            mime_type="application/pdf",
            page_count=12,
            status="PROCESSED",
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)

        pol = Policy(
            document_id=doc.id,
            policy_number=seed["policy_number"],
            insurer=seed["insurer"],
            policyholder=seed["policyholder"],
            currency="BRL",
            start_date=seed["start_date"],
            end_date=seed["end_date"],
            liability_limit=seed["liability_limit"],
            aggregate_limit=seed["aggregate_limit"],
            deductible=seed["deductible"],
            premium=seed["premium"],
            retroactivity=seed["retroactivity"],
            reporting_period=seed["reporting_period"],
            territory=seed["territory"],
            jurisdiction=seed["jurisdiction"],
            status=seed["status"],
            owner_id=user.id,
        )
        session.add(pol)
        session.commit()
        session.refresh(pol)

        # Cláusulas estruturadas por apólice (Evidências de Auditoria)
        c1 = Clause(
            policy_id=pol.id,
            category="COBERTURA",
            name="Cobertura de Responsabilidade Civil de Administradores",
            description="Garante indenização a diretores por perdas decorrentes de atos de gestão culposos.",
            importance="ALTA",
            page=3,
            evidence=f"Garante indenização a diretores da {seed['policyholder']} por perdas decorrentes de atos de gestão ilícitos culposos até o limite contratado de {seed['liability_limit']}.",
        )
        c2 = Clause(
            policy_id=pol.id,
            category="EXCLUSAO",
            name="Exclusão de Atos Dolosos e Fraude Comprovada",
            description="Exclui cobertura para atos intencionalmente ilícitos ou atos de improbidade com trânsito em julgado.",
            importance="CRITICA",
            page=7,
            evidence="Não haverá cobertura sob este contrato para qualquer Reclamação decorrente de ato doloso ou fraude comprovada por sentença judicial transitada em julgado.",
        )
        c3 = Clause(
            policy_id=pol.id,
            category="CONDICAO_ESPECIAL",
            name="Custos de Defesa e Honorários Advocatícios",
            description="Adiantamento de despesas de defesa em processos cíveis, administrativos e arbitrais.",
            importance="ALTA",
            page=5,
            evidence="A Seguradora adiantará os Custos de Defesa razoáveis e necessários incorridos pelos Segurados para contestação de procedimentos legais.",
        )
        c4 = Clause(
            policy_id=pol.id,
            category="COBERTURA",
            name="Período de Notificação Estendido e Retroatividade",
            description="Cobertura para fatos geradores ocorridos a partir da data de retroatividade pactuada.",
            importance="MEDIA",
            page=11,
            evidence=f"A apólice cobre atos de gestão praticados a partir da Data de Retroatividade ({seed['retroactivity']}) e notificados no prazo suplementar de {seed['reporting_period']}.",
        )
        session.add_all([c1, c2, c3, c4])

        # Policy Fields com Evidência de Grounding
        f1 = PolicyField(
            policy_id=pol.id,
            field_name="liability_limit",
            value=seed["liability_limit"],
            confidence=0.98,
            page=2,
            evidence=f"Limite Máximo de Garantia (LMG): {seed['liability_limit']} por apólice e por período de vigência.",
        )
        f2 = PolicyField(
            policy_id=pol.id,
            field_name="deductible",
            value=seed["deductible"],
            confidence=0.95,
            page=2,
            evidence=f"POS / Retention: {seed['deductible']} aplicável a cada sinistro de perdas financeiras.",
        )
        f3 = PolicyField(
            policy_id=pol.id,
            field_name="premium",
            value=seed["premium"],
            confidence=0.97,
            page=1,
            evidence=f"Prêmio Anual Líquido: {seed['premium']} parcelado conforme especificação na proposta.",
        )
        session.add_all([f1, f2, f3])

        # Audit Logs reais por apólice (Sucesso, Info, Aviso, Erro)
        log_upload = AuditLog(
            user_id=user.id,
            action="DOCUMENT_UPLOAD",
            entity="Document",
            entity_id=doc.id,
            dados_depois={"msg": f"Upload do arquivo {seed['filename']} concluído com sucesso. Tamanho: 2.4MB."},
            ip="10.1.40.12",
        )
        log_extraction = AuditLog(
            user_id=user.id,
            action="FIELD_EXTRACTION",
            entity="Policy",
            entity_id=pol.id,
            dados_depois={"msg": f"Extração de campos finalizada para {seed['policy_number']}: Limite {seed['liability_limit']}, Franquia {seed['deductible']}."},
            ip="10.1.40.12",
        )
        log_rag = AuditLog(
            user_id=user.id,
            action="RAG_INGESTION",
            entity="VectorIndex",
            entity_id=doc.id,
            dados_depois={"msg": f"Ingestão vetorial RAG concluída para {seed['filename']}. 142 chunks indexados no ChromaDB."},
            ip="10.1.40.12",
        )
        session.add(log_upload)
        session.add(log_extraction)
        session.add(log_rag)

        # Adicionar avisos (WARNING) e erros (ERROR) pontuais para riqueza de dados
        if seed["status"] == "PROCESSING":
            log_warn = AuditLog(
                user_id=user.id,
                action="RISK_SCORING_WARN",
                entity="Policy",
                entity_id=pol.id,
                dados_depois={"msg": f"Aviso de Qualidade: Cláusula de exclusão com alta abrangência detectada na apólice {seed['policy_number']}."},
                ip="10.1.40.15",
            )
            session.add(log_warn)

        if seed["status"] == "EXPIRED":
            log_err = AuditLog(
                user_id=user.id,
                action="VALIDATION_ERROR",
                entity="Policy",
                entity_id=pol.id,
                dados_depois={"msg": f"Erro de Validação: Apólice {seed['policy_number']} expirou em {seed['end_date']}. Renovação pendente."},
                ip="10.1.40.22",
            )
            session.add(log_err)

    session.commit()
    session.close()
    print(f"  → {len(SEED_POLICIES)} apólices e logs de auditoria (INFO/WARN/ERROR) inseridos em {db_path}")

print("\nInicialização da base de dados concluída com sucesso!")