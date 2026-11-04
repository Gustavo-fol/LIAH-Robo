"""Informações de estado do sistema (usadas por /api/status/ e pelo painel)."""
from .llm import llm_ligado
from .regras import REGRAS

VERSAO = "0.3-prototipo"


def estado_sistema():
    return {
        "nome": "Liah",
        "versao": VERSAO,
        "etapa": "Protótipo conversacional (etapa 1)",
        "intencoes": sorted(REGRAS.keys()),
        "llm": "ligado" if llm_ligado() else "desligado",
        "hardware": {
            "microfone": "planejado",
            "alto_falante": "planejado",
            "display": "simulado",
            "servos": "simulado",
            "sensores": "planejado",
        },
    }
