"""Regras fixas da Liah: previsíveis, rápidas e gratuitas."""
import re, unicodedata

REGRAS = {
    "saudacao": {"frases": ["oi", "ola", "bom dia"], "resposta": "Oi! Eu sou a Liah."},
    "danca":    {"frases": ["danca", "dance", "dancar"], "resposta": "Comando de dança recebido (simulado)."},
    "despedida": {"frases": ["tchau", "ate mais"], "resposta": "Até mais!"},
}

def normalizar(texto):
    texto = unicodedata.normalize("NFD", texto.casefold())
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()

def interpretar(texto):
    """Devolve o nome da intenção ou None."""
    texto = normalizar(texto)
    melhor, tamanho = None, 0
    for intent, dados in REGRAS.items():
        for frase in dados["frases"]:
            if re.search(rf"\b{re.escape(frase)}\b", texto) and len(frase) > tamanho:
                melhor, tamanho = intent, len(frase)
    return melhor