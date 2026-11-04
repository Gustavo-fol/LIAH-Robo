/* Console de conversa: envia mensagens para a API e anima o robô do mesmo palco. */
(function () {
  "use strict";

  var espera = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
  var guardado = function (chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } };
  var guardar = function (chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) { /* sem storage */ } };

  function iniciar(el) {
    var log = el.querySelector("[data-log]");
    var form = el.querySelector("form");
    var campo = form.elements.mensagem;
    var botao = form.querySelector("button[type=submit]");
    var endpoint = el.dataset.endpoint;
    var palco = el.closest("[data-palco]");
    var svg = palco && palco.querySelector("svg.bot");
    var falar = palco && palco.querySelector("[data-falar]");
    var ocupado = false;

    if (falar) {
      falar.checked = guardado("liah-falar") === "1";
      falar.addEventListener("change", function () { guardar("liah-falar", falar.checked ? "1" : "0"); });
    }

    function robo() { return svg && svg.__robo; }

    function bolha(tipo, texto, meta) {
      var li = document.createElement("li");
      li.className = "msg msg-" + tipo;
      var p = document.createElement("p");
      p.textContent = texto;
      li.appendChild(p);
      if (meta) {
        var s = document.createElement("span");
        s.className = "msg-meta";
        s.textContent = meta;
        li.appendChild(s);
      }
      log.appendChild(li);
      log.scrollTop = log.scrollHeight;
      return p;
    }

    function digitar(p, texto) {
      if (window.Robo && Robo.movimentoReduzido()) { p.textContent = texto; return; }
      var i = 0;
      var id = setInterval(function () {
        i += 1;
        p.textContent = texto.slice(0, i);
        log.scrollTop = log.scrollHeight;
        if (i >= texto.length) clearInterval(id);
      }, 16);
    }

    function lerEmVozAlta(texto) {
      if (!falar || !falar.checked || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        var fala = new SpeechSynthesisUtterance(texto);
        fala.lang = "pt-BR";
        window.speechSynthesis.speak(fala);
      } catch (e) { /* voz indisponível */ }
    }

    async function enviar(texto) {
      texto = (texto || "").trim();
      if (!texto || ocupado) return;
      ocupado = true;
      botao.disabled = true;
      bolha("user", texto);
      var r = robo();
      if (r) r.setEstado("pensando");
      try {
        var resultado = await Promise.all([LiahAPI.post(endpoint, { mensagem: texto }), espera(550)]);
        var resp = resultado[0];
        var p = bolha("liah", "", resp.origem + " · " + resp.intent);
        digitar(p, resp.resposta);
        if (r) r.reagir(resp);
        lerEmVozAlta(resp.resposta);
        document.dispatchEvent(new CustomEvent("liah:resposta", { detail: resp }));
      } catch (err) {
        var li = document.createElement("li");
        li.className = "msg msg-erro";
        var p2 = document.createElement("p");
        if (err.status === 401) {
          p2.append("Sua sessão expirou. ");
          var a = document.createElement("a");
          a.href = "/login/";
          a.textContent = "Entre novamente";
          p2.append(a, ".");
        } else if (err.status === 429) {
          p2.textContent = "Muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.";
        } else {
          p2.textContent = err.message || "Não foi possível falar com a Liah agora.";
        }
        li.appendChild(p2);
        log.appendChild(li);
        log.scrollTop = log.scrollHeight;
        if (r) r.tocar([["duvida", 3000]]);
      } finally {
        ocupado = false;
        botao.disabled = false;
        campo.focus({ preventScroll: true });
      }
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var texto = campo.value;
      campo.value = "";
      enviar(texto);
    });

    el.querySelectorAll("[data-msg]").forEach(function (b) {
      b.addEventListener("click", function () { enviar(b.dataset.msg); });
    });

    if (el.dataset.historico) {
      LiahAPI.get(el.dataset.historico).then(function (d) {
        var itens = (d.interacoes || []).slice().reverse();
        if (!itens.length) return;
        itens.forEach(function (i) {
          bolha("user", i.mensagem);
          bolha("liah", i.resposta, i.origem + " · " + i.intent);
        });
        bolha("sep", "Conversa anterior acima");
      }).catch(function () { /* histórico é opcional */ });
    }
  }

  function arrancar() { document.querySelectorAll("[data-console]").forEach(iniciar); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
