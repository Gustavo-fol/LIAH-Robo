/* Página inicial: etapas do fluxo clicáveis + caminho "aceso" após cada resposta. */
(function () {
  "use strict";

  var raiz = document.querySelector("[data-pipeline]");
  if (!raiz) return;

  var detalhe = raiz.querySelector("[data-detalhe]");
  var leitura = raiz.querySelector("[data-leitura]");
  var nos = Array.prototype.slice.call(raiz.querySelectorAll("[data-no]"));
  var llmEstado = "desligado";

  function textos() {
    return {
      mensagem: "O texto é limpo antes de qualquer decisão: minúsculas, sem acento, sem pontuação e com no máximo 500 caracteres.",
      regras: "Primeiro a Liah compara a mensagem com frases conhecidas. É rápido, gratuito e dá sempre a mesma resposta para a mesma pergunta.",
      llm: "Só entra se nenhuma regra servir e se estiver ligado (agora: " + llmEstado + "). Ele apenas sugere uma intenção; o código confere se ela existe antes de aceitar.",
      resposta: "Texto, expressão do rosto e origem voltam juntos para a tela. Se algo falhar no caminho, nada quebra: a Liah devolve uma resposta padrão."
    };
  }

  nos.forEach(function (no) {
    no.addEventListener("click", function () {
      nos.forEach(function (n) { n.setAttribute("aria-pressed", String(n === no)); });
      detalhe.textContent = textos()[no.dataset.no];
    });
  });

  /* quais etapas ficam acesas para cada origem de resposta */
  var CAMINHOS = {
    regras: ["mensagem", "regras", "resposta"],
    llm: ["mensagem", "regras", "llm", "resposta"],
    fallback: ["mensagem", "regras", "resposta"]
  };

  document.addEventListener("liah:resposta", function (ev) {
    var r = ev.detail;
    var caminho = CAMINHOS[r.origem] || CAMINHOS.regras;
    nos.forEach(function (no) {
      var aceso = caminho.indexOf(no.dataset.no) !== -1;
      no.classList.toggle("aceso", aceso);
      no.parentElement.classList.toggle("aceso", aceso && no.dataset.no !== "resposta");
    });
    var origem = { regras: "resolvida pelas regras", llm: "resolvida pelo LLM local", fallback: "sem regra: resposta padrão" }[r.origem] || r.origem;
    leitura.textContent = "";
    var forte = document.createElement("strong");
    forte.textContent = "Última mensagem: ";
    leitura.append(forte, "intenção “" + r.intent + "”, " + origem + ", rosto “" + r.estado + "”.");
  });

  /* estado real do servidor */
  var vivo = document.querySelector("[data-ao-vivo]");
  var selo = document.querySelector("[data-llm-selo]");
  LiahAPI.get(raiz.dataset.statusUrl).then(function (s) {
    llmEstado = s.llm;
    if (selo) selo.textContent = s.llm;
    if (vivo) vivo.textContent = "Servidor respondeu agora: versão " + s.versao + ", " + s.intencoes.length + " intenções conhecidas, LLM " + s.llm + ".";
  }).catch(function () {
    if (vivo) vivo.textContent = "Não foi possível ler o estado do servidor agora.";
  });
})();
