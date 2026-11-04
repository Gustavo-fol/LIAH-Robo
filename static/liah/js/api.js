/* Pequeno cliente HTTP da Liah: envia o token CSRF e traduz erros em mensagens claras. */
(function () {
  "use strict";

  function csrf() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (meta && meta.content) return meta.content;
    var par = document.cookie.split("; ").find(function (c) { return c.indexOf("csrftoken=") === 0; });
    return par ? decodeURIComponent(par.split("=")[1]) : "";
  }

  async function requisitar(url, opcoes) {
    var resposta;
    try {
      resposta = await fetch(url, opcoes);
    } catch (e) {
      var semRede = new Error("Sem conexão com o servidor. Confira se o runserver está ligado.");
      semRede.status = 0;
      throw semRede;
    }
    var dados = null;
    try { dados = await resposta.json(); } catch (e) { /* resposta sem JSON */ }
    if (!resposta.ok) {
      var erro = new Error((dados && dados.erro) || ("Erro " + resposta.status));
      erro.status = resposta.status;
      throw erro;
    }
    return dados;
  }

  window.LiahAPI = {
    post: function (url, corpo) {
      return requisitar(url, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
        body: JSON.stringify(corpo)
      });
    },
    get: function (url) {
      return requisitar(url, { credentials: "same-origin", headers: { Accept: "application/json" } });
    }
  };
})();

