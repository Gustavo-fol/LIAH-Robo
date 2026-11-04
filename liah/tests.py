import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from .models import Interacao, LIMITE_MEMORIA, registrar


class BaseTest(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user("gustavo", password="senha-forte-123")

    def post(self, nome, corpo, **extra):
        dados = corpo if isinstance(corpo, str) else json.dumps(corpo)
        return self.client.post(reverse(nome), dados, content_type="application/json", **extra)


class PaginasTests(BaseTest):
    def test_publicas(self):
        for nome in ("home", "login"):
            self.assertEqual(self.client.get(reverse(nome)).status_code, 200, nome)

    def test_privadas_redirecionam_para_login(self):
        for nome in ("painel", "chat", "configuracoes"):
            r = self.client.get(reverse(nome))
            self.assertEqual(r.status_code, 302, nome)
            self.assertIn("/login/", r["Location"])

    def test_logado_ve_tudo(self):
        self.client.force_login(self.user)
        for nome in ("home", "painel", "chat", "configuracoes"):
            self.assertEqual(self.client.get(reverse(nome)).status_code, 200, nome)

    def test_login_certo_e_errado(self):
        r = self.client.post(reverse("login"), {"username": "gustavo", "password": "errada"})
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, "Usuário ou senha incorretos")
        r = self.client.post(reverse("login"), {"username": "gustavo", "password": "senha-forte-123"})
        self.assertRedirects(r, reverse("painel"), fetch_redirect_response=False)

    def test_logout_so_por_post(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse("logout")).status_code, 405)
        self.assertEqual(self.client.post(reverse("logout")).status_code, 302)


class ApiTests(BaseTest):
    def test_chat_exige_login_e_devolve_json_401(self):
        r = self.post("api_chat", {"mensagem": "oi"})
        self.assertEqual(r.status_code, 401)
        self.assertIn("erro", r.json())

    def test_chat_ok_grava_memoria(self):
        self.client.force_login(self.user)
        r = self.post("api_chat", {"mensagem": "Olá"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["intent"], "saudacao")
        self.assertEqual(Interacao.objects.filter(usuario=self.user).count(), 1)

    def test_chat_entradas_invalidas(self):
        self.client.force_login(self.user)
        for corpo in ("não é json", "{}", json.dumps({"mensagem": 5}), json.dumps([1, 2])):
            self.assertEqual(self.post("api_chat", corpo).status_code, 400, corpo)

    def test_chat_so_post(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse("api_chat")).status_code, 405)

    def test_chat_exige_csrf(self):
        from django.test import Client
        c = Client(enforce_csrf_checks=True)
        c.force_login(self.user)
        r = c.post(reverse("api_chat"), json.dumps({"mensagem": "oi"}), content_type="application/json")
        self.assertEqual(r.status_code, 403)

    def test_limite_por_minuto(self):
        from . import views
        self.client.force_login(self.user)
        for _ in range(views.LIMITE_POR_MINUTO):
            self.assertEqual(self.post("api_chat", {"mensagem": "oi"}).status_code, 200)
        self.assertEqual(self.post("api_chat", {"mensagem": "oi"}).status_code, 429)

    def test_demo_publica_nao_grava(self):
        r = self.post("api_demo", {"mensagem": "dance"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["estado"], "danca")
        self.assertEqual(Interacao.objects.count(), 0)

    def test_status_publico(self):
        d = self.client.get(reverse("api_status")).json()
        self.assertEqual(d["llm"], "desligado")
        self.assertIn("danca", d["intencoes"])

    def test_historico_so_do_proprio_usuario(self):
        outro = get_user_model().objects.create_user("outra", password="x-y-z-12345")
        registrar(outro, "segredo", {"resposta": "r", "intent": "saudacao", "origem": "regras"})
        self.assertEqual(self.client.get(reverse("api_historico")).status_code, 401)
        self.client.force_login(self.user)
        self.post("api_chat", {"mensagem": "oi"})
        itens = self.client.get(reverse("api_historico")).json()["interacoes"]
        self.assertEqual([i["mensagem"] for i in itens], ["oi"])


class MemoriaTests(BaseTest):
    def test_limite_de_50(self):
        for n in range(LIMITE_MEMORIA + 7):
            registrar(self.user, f"msg {n}", {"resposta": "r", "intent": "saudacao", "origem": "regras"})
        self.assertEqual(Interacao.objects.filter(usuario=self.user).count(), LIMITE_MEMORIA)
        mais_nova = Interacao.objects.filter(usuario=self.user).first()
        self.assertEqual(mais_nova.mensagem, f"msg {LIMITE_MEMORIA + 6}")
