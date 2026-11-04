/* Botão "Sobre a Liah": abre a janela com o texto de apresentação. */
(function () {
  "use strict";
  var dialogo = document.getElementById("sobre");
  if (!dialogo || typeof dialogo.showModal !== "function") return;

  document.querySelectorAll("[data-abrir-sobre]").forEach(function (b) {
    b.addEventListener("click", function () { dialogo.showModal(); });
  });
  /* clicar fora da janela também fecha */
  dialogo.addEventListener("click", function (ev) {
    if (ev.target === dialogo) dialogo.close();
  });
})();
