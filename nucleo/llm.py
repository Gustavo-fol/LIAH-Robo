"""Classificador opcional com LLM local (Ollama). DESLIGADO por padrão.

Regra do projeto: o LLM só SUGERE uma intenção; o código valida.
Se o Ollama não estiver instalado/rodando, nada quebra: devolve None.

Para ligar (só depois de instalar o Ollama e baixar um modelo):
    PowerShell:  $env:LIAH_USAR_LLM = "1"
                 $env:LIAH_MODELO = "llama3.2"   # opcional
"""
import os

from .regras import INTENCOES_VALIDAS


def llm_ligado():
    return os.environ.get("LIAH_USAR_LLM", "0") == "1"


def classificar(texto):
    """Devolve uma intenção válida sugerida pelo LLM, ou None em qualquer falha."""
    if not llm_ligado():
        return None
    try:
        import ollama  # import preguiçoso: só é necessário se a flag estiver ligada
    except Exception:
        return None
    modelo = os.environ.get("LIAH_MODELO", "llama3.2")
    pedido = (
        "Classifique a mensagem em UMA destas intenções: "
        + ", ".join(INTENCOES_VALIDAS)
        + ". Se nenhuma servir, responda: nenhuma. Responda só com a palavra.\n"
        f"Mensagem: {texto[:300]}"
    )
    try:
        r = ollama.chat(model=modelo, messages=[{"role": "user", "content": pedido}])
        bruto = str(r["message"]["content"]).strip().lower()
    except Exception:
        return None
    palavra = bruto.split()[0].strip(".,;:!\"'") if bruto.split() else ""
    return palavra if palavra in INTENCOES_VALIDAS else None
