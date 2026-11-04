import json
from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from nucleo.info import estado_sistema
from nucleo.roteador import processar

from .models import Interacao, registrar

LIMITE_POR_MINUTO = 30


def api_login_required(view):
    """Como @login_required, mas devolve JSON 401 (e não redireciona) para chamadas de API."""
    @wraps(view)
    def interna(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"erro": "faça login para usar a API"}, status=401)
        return view(request, *args, **kwargs)
    return interna


def _excedeu_limite(usuario_id):
    chave = f"liah-rate-{usuario_id}"
    cache.add(chave, 0, timeout=60)
    try:
        return cache.incr(chave) > LIMITE_POR_MINUTO
    except ValueError:
        return False


def index(request):
    return render(request, "liah/index.html")


@login_required
def painel(request):
    interacoes = Interacao.objects.filter(usuario=request.user)
    return render(request, "liah/painel.html", {
        "estado": estado_sistema(),
        "total": interacoes.count(),
        "recentes": interacoes[:5],
    })


@login_required
def chat(request):
    return render(request, "liah/chat.html")


@login_required
def configuracoes(request):
    return render(request, "liah/configuracoes.html", {"estado": estado_sistema()})


@require_POST
def api_demo(request):
    """Demonstração pública da página inicial: responde, mas NÃO grava memória."""
    return _responder(request, salvar=False)


@api_login_required
@require_POST
def api_chat(request):
    if _excedeu_limite(request.user.id):
        return JsonResponse({"erro": "muitas mensagens; aguarde um minuto"}, status=429)
    return _responder(request, salvar=True)


def _responder(request, salvar):
    try:
        mensagem = json.loads(request.body)["mensagem"]
    except (json.JSONDecodeError, KeyError, TypeError, UnicodeDecodeError):
        return JsonResponse({"erro": "envie {'mensagem': '...'}"}, status=400)
    if not isinstance(mensagem, str):
        return JsonResponse({"erro": "'mensagem' deve ser texto"}, status=400)
    resultado = processar(mensagem)
    if salvar:
        registrar(request.user, mensagem, resultado)
    return JsonResponse(resultado)


@require_GET
def api_status(request):
    return JsonResponse(estado_sistema())


@api_login_required
@require_GET
def api_historico(request):
    itens = Interacao.objects.filter(usuario=request.user)[:50]
    return JsonResponse({"interacoes": [
        {"mensagem": i.mensagem, "resposta": i.resposta, "intent": i.intent,
         "origem": i.origem, "quando": i.criada_em.isoformat()} for i in itens
    ]})
