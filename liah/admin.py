from django.contrib import admin

from .models import Interacao


@admin.register(Interacao)
class InteracaoAdmin(admin.ModelAdmin):
    list_display = ("criada_em", "usuario", "intent", "origem", "mensagem")
    list_filter = ("intent", "origem")
    search_fields = ("mensagem", "resposta")
