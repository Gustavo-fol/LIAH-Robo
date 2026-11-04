"""Regras fixas da Liah: previsíveis, rápidas e gratuitas.

Cada intenção tem:
  - frases:   palavras/expressões que a ativam (já sem acento e minúsculas)
  - resposta: texto devolvido ao usuário
  - estado:   expressão que o robô deve mostrar (usada pelo front-end)
"""
import re
import unicodedata

REGRAS = {
    "saudacao": {
        "frases": ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "hello", "hey"],
        "resposta": "Olá! Eu sou a Liah. Como posso ajudar você?",
        "estado": "feliz",
    },
    "identidade": {
        "frases": ["quem e voce", "quem e vc", "seu nome", "como voce se chama", "quem e a liah", "o que e a liah"],
        "resposta": ("Eu sou a Liah, um protótipo de robô interativo criado para estudar "
                     "a comunicação entre pessoas e sistemas inteligentes."),
        "estado": "atento",
    },
    "status": {
        "frases": ["status", "como voce esta", "como vai voce", "tudo bem", "voce esta pronta", "esta pronta", "esta funcionando"],
        "resposta": ("Estou funcionando em modo de protótipo: converso por texto, respondo por regras "
                     "e guardo as últimas interações. Voz e corpo físico são as próximas etapas."),
        "estado": "atento",
    },
    "capacidades": {
        "frases": ["o que voce consegue", "o que voce faz", "o que voce sabe", "o que voce pode", "suas funcoes"],
        "resposta": ("Hoje eu consigo conversar por texto, responder a comandos simples, mostrar "
                     "expressões no meu rosto e dançar na simulação. Futuramente vou usar voz, display e movimentos."),
        "estado": "feliz",
    },
    "ajuda": {
        "frases": ["ajuda", "ajudar", "comandos", "socorro", "como usar", "como funciona"],
        "resposta": ("Experimente: 'oi', 'quem é você?', 'o que você consegue fazer?', "
                     "'dance', 'status' ou 'tchau'."),
        "estado": "atento",
    },
    "danca": {
        "frases": ["danca", "dance", "dancar", "danca ai", "vamos dancar", "mostra uma danca"],
        "resposta": "Comando de dança recebido! Na simulação eu já danço; no corpo físico isso virá com os servomotores.",
        "estado": "danca",
    },
    "despedida": {
        "frases": ["tchau", "ate mais", "ate logo", "adeus", "flw", "valeu"],
        "resposta": "Até mais! Foi bom conversar com você.",
        "estado": "dormindo",
    },
}

# Intenções que o classificador de LLM (se ligado) tem permissão de sugerir.
INTENCOES_VALIDAS = tuple(REGRAS.keys())


def normalizar(texto):
    """minúsculas, sem acento, sem pontuação, espaços únicos."""
    texto = unicodedata.normalize("NFD", str(texto).casefold())
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


def interpretar(texto):
    """Devolve o nome da intenção (a de frase mais longa que casar) ou None."""
    texto = normalizar(texto)
    melhor, tamanho = None, 0
    for intent, dados in REGRAS.items():
        for frase in dados["frases"]:
            if re.search(rf"\b{re.escape(frase)}\b", texto) and len(frase) > tamanho:
                melhor, tamanho = intent, len(frase)
    return melhor
