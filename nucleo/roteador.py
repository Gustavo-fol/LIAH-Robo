from .regras import REGRAS, interpretar

def processar(texto):
    texto = texto.strip()[:500]
    if not texto:
        return {"intent": "vazio", "resposta": "Pode me contar um pouco mais?", "origem": "regras"}
    intent = interpretar(texto)
    if intent is None:
        return {"intent": "desconhecido", "resposta": "Ainda não sei responder isso.", "origem": "fallback"}
    return {"intent": intent, "resposta": REGRAS[intent]["resposta"], "origem": "regras"}