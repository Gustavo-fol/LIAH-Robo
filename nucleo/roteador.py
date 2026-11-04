"""Decide como responder: regras primeiro, LLM (opcional) como reserva, fallback no fim."""
from . import llm
from .regras import REGRAS, interpretar

LIMITE_TEXTO = 500


def _montar(intent, origem):
    dados = REGRAS[intent]
    return {"intent": intent, "resposta": dados["resposta"], "estado": dados["estado"], "origem": origem}


def processar(texto):
    texto = str(texto).strip()[:LIMITE_TEXTO]
    if not texto:
        return {"intent": "vazio", "resposta": "Pode me contar um pouco mais?", "estado": "atento", "origem": "regras"}

    intent = interpretar(texto)
    if intent is not None:
        return _montar(intent, "regras")

    sugerida = llm.classificar(texto)  # None se desligado ou se falhar
    if sugerida in REGRAS:             # o código decide: só aceita intenção conhecida
        return _montar(sugerida, "llm")

    return {"intent": "desconhecido",
            "resposta": "Ainda não sei responder isso. Digite 'ajuda' para ver o que eu entendo.",
            "estado": "duvida", "origem": "fallback"}
