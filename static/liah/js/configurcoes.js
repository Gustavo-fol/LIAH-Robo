/* Preferências guardadas só neste navegador (localStorage). */
(function () {
  "use strict";

  var lerPref = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var gravarPref = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } };

  var raiz = document.querySelector("[data-prefs]");
  if (!raiz) return;

  var radios = raiz.querySelectorAll('input[name="movimento"]');
  var atual = lerPref("liah-movimento");
  radios.forEach(function (r) {
    r.checked = r.value === (atual === "normal" || atual === "reduzido" ? atual : "auto");
    r.addEventListener("change", function () {
      if (!r.checked) return;
      if (r.value === "auto") {
        try { localStorage.removeItem("liah-movimento"); } catch (e) { /* ok */ }
        delete document.documentElement.dataset.movimento;
      } else {
        gravarPref("liah-movimento", r.value);
        document.documentElement.dataset.movimento = r.value;
      }
    });
  });

  var falar = raiz.querySelector('input[name="falar"]');
  falar.checked = lerPref("liah-falar") === "1";
  falar.addEventListener("change", function () { gravarPref("liah-falar", falar.checked ? "1" : "0"); });
})();
