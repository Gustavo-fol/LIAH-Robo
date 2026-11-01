import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from nucleo.roteador import processar
# Create your views here.
from django.shortcuts import render

def index(request):
    return render(request, 'liah/index.html')


@login_required
def painel(request):
    return render(request, 'liah/painel.html')

@login_required
@require_POST
def api_chat(request):
    try:
        mensagem = json.loads(request.body)["mensagem"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return JsonResponse({"erro": "envie {'mensagem': '...'}"}, status=400)
    if not isinstance(mensagem, str):
        return JsonResponse({"erro": "'mensagem' deve ser texto"}, status=400)
    return JsonResponse(processar(mensagem))
