from django.conf import settings
from django.db import models


class Interacao(models.Model):
    """Memória das conversas (substitui o memory.json do protótipo antigo)."""
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interacoes")
    mensagem = models.CharField(max_length=500)
    resposta = models.TextField()
    intent = models.CharField(max_length=40)
    origem = models.CharField(max_length=20, default="regras")
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criada_em", "-id"]
        verbose_name = "interação"
        verbose_name_plural = "interações"

    def __str__(self):
        return f"{self.usuario} · {self.intent} · {self.mensagem[:30]}"


LIMITE_MEMORIA = 50  # igual ao protótipo antigo


def registrar(usuario, mensagem, resultado):
    Interacao.objects.create(
        usuario=usuario, mensagem=mensagem[:500], resposta=resultado["resposta"],
        intent=resultado["intent"], origem=resultado["origem"],
    )
    ids_manter = list(Interacao.objects.filter(usuario=usuario).values_list("id", flat=True)[:LIMITE_MEMORIA])
    Interacao.objects.filter(usuario=usuario).exclude(id__in=ids_manter).delete()
