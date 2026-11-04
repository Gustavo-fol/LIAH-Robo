import os
import sys
import types
from unittest import mock

from django.test import SimpleTestCase

from nucleo import llm
from nucleo.regras import interpretar, normalizar
from nucleo.roteador import processar


class RegrasTests(SimpleTestCase):
    def test_normalizar_remove_acento_e_pontuacao(self):
        self.assertEqual(normalizar("  Olá,   LIAH!! "), "ola liah")

    def test_intencoes_basicas(self):
        casos = {
            "Olá, Liah": "saudacao", "Quem é você?": "identidade", "status": "status",
            "O que você consegue fazer?": "capacidades", "ajuda": "ajuda",
            "Dance!": "danca", "Tchau": "despedida",
        }
        for texto, esperado in casos.items():
            self.assertEqual(interpretar(texto), esperado, texto)

    def test_nao_casa_pedaco_de_palavra(self):
        self.assertIsNone(interpretar("oitenta e dois"))  # 'oi' dentro de 'oitenta'

    def test_desconhecido(self):
        self.assertIsNone(interpretar("qual a capital da Mongólia"))


class RoteadorTests(SimpleTestCase):
    def setUp(self):
        os.environ.pop("LIAH_USAR_LLM", None)

    def test_vazio(self):
        self.assertEqual(processar("   ")["intent"], "vazio")

    def test_regra_tem_estado_e_origem(self):
        r = processar("dance")
        self.assertEqual((r["intent"], r["estado"], r["origem"]), ("danca", "danca", "regras"))

    def test_fallback_sem_llm(self):
        r = processar("qual a capital da Mongólia")
        self.assertEqual((r["intent"], r["origem"], r["estado"]), ("desconhecido", "fallback", "duvida"))

    def test_texto_longo_e_cortado(self):
        self.assertEqual(processar("x" * 5000)["intent"], "desconhecido")

    def test_entrada_nao_texto_nao_quebra(self):
        self.assertEqual(processar(123)["intent"], "desconhecido")


def _ollama_falso(conteudo=None, erro=None):
    mod = types.ModuleType("ollama")
    def chat(**kwargs):
        if erro:
            raise erro
        return {"message": {"content": conteudo}}
    setattr(mod, "chat", chat)
    return mod


class LLMTests(SimpleTestCase):
    def setUp(self):
        os.environ.pop("LIAH_USAR_LLM", None)

    def tearDown(self):
        os.environ.pop("LIAH_USAR_LLM", None)

    def test_desligado_por_padrao_nao_importa_ollama(self):
        with mock.patch.dict(sys.modules, {"ollama": None}):
            self.assertIsNone(llm.classificar("qualquer coisa"))

    def test_ligado_sem_ollama_instalado_nao_quebra(self):
        os.environ["LIAH_USAR_LLM"] = "1"
        with mock.patch.dict(sys.modules, {"ollama": None}):  # import falha
            r = processar("qual a capital da Mongólia")
        self.assertEqual(r["origem"], "fallback")

    def test_ligado_aceita_intencao_valida_ignorando_caixa_e_pontuacao(self):
        os.environ["LIAH_USAR_LLM"] = "1"
        with mock.patch.dict(sys.modules, {"ollama": _ollama_falso("Danca.")}):
            self.assertEqual(llm.classificar("mexa o corpinho"), "danca")
            r = processar("mexa o corpinho")
        self.assertEqual((r["intent"], r["origem"]), ("danca", "llm"))

    def test_ligado_rejeita_intencao_inventada(self):
        os.environ["LIAH_USAR_LLM"] = "1"
        with mock.patch.dict(sys.modules, {"ollama": _ollama_falso("apagar_tudo")}):
            r = processar("mexa o corpinho")
        self.assertEqual(r["origem"], "fallback")

    def test_ligado_erro_do_ollama_vira_fallback(self):
        os.environ["LIAH_USAR_LLM"] = "1"
        with mock.patch.dict(sys.modules, {"ollama": _ollama_falso(erro=ConnectionError("fora do ar"))}):
            r = processar("mexa o corpinho")
        self.assertEqual(r["origem"], "fallback")

    def test_regra_vence_llm(self):
        os.environ["LIAH_USAR_LLM"] = "1"
        with mock.patch.dict(sys.modules, {"ollama": _ollama_falso("despedida")}):
            r = processar("oi")
        self.assertEqual((r["intent"], r["origem"]), ("saudacao", "regras"))
