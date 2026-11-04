/* Controle do robô (SVG). Uso:  svg.__robo.setEstado("feliz", 3000)  /  .reagir(resposta) */
(function () {
  "use strict";

  var ROTULOS = {
    idle: "em espera", atento: "atenta", feliz: "feliz", pensando: "pensando…",
    falando: "respondendo", duvida: "em dúvida", danca: "dançando", dormindo: "descansando"
  };

  function movimentoReduzido() {
    var pref = document.documentElement.dataset.movimento;
    if (pref === "reduzido") return true;
    if (pref === "normal") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function Robo(svg) {
    this.svg = svg;
    this.estado = "idle";
    this.timer = null;
    svg.__robo = this;
    var self = this;
    var alvo = svg.closest(".palco-robo") || svg;
    alvo.addEventListener("click", function () { self.cutucar(); });
    var palco = svg.closest("[data-palco]");
    var botao = palco && palco.querySelector("[data-dancar]");
    if (botao) botao.addEventListener("click", function () { self.alternarDanca(); });
    this._acompanharPonteiro();
    if (palco && palco.hasAttribute("data-boas-vindas") && !movimentoReduzido()) {
      setTimeout(function () { if (self.estado === "idle") self.tocar([["danca", 3600]]); }, 700);
    }
  }

  Robo.prototype.setEstado = function (estado, ms) {
    if (!ROTULOS[estado]) estado = "idle";
    clearTimeout(this.timer);
    this.estado = estado;
    this.svg.dataset.estado = estado;
    var palco = this.svg.closest("[data-palco]");
    var rotulo = palco && palco.querySelector("[data-estado-texto]");
    if (rotulo) rotulo.textContent = ROTULOS[estado];
    var botao = palco && palco.querySelector("[data-dancar]");
    if (botao) {
      var dancando = estado === "danca";
      botao.textContent = dancando ? "Parar dança" : "Dançar";
      botao.setAttribute("aria-pressed", String(dancando));
    }
    if (ms) {
      var self = this;
      this.timer = setTimeout(function () { self.setEstado("idle"); }, ms);
    }
  };

  /* Toca uma sequência: [["falando", 1800], ["feliz", 2800]] e volta para "idle". */
  Robo.prototype.tocar = function (passos) {
    var self = this;
    clearTimeout(this.timer);
    (function proximo(i) {
      if (i >= passos.length) { self.setEstado("idle"); return; }
      self.setEstado(passos[i][0]);
      self.timer = setTimeout(function () { proximo(i + 1); }, passos[i][1]);
    })(0);
  };

  /* Reage a uma resposta da API: { resposta, estado, ... } */
  Robo.prototype.reagir = function (resp) {
    var estado = (resp && resp.estado) || "idle";
    var texto = (resp && resp.resposta) || "";
    if (estado === "danca") { this.tocar([["danca", 9000]]); return; }
    var fala = Math.min(4200, 700 + texto.length * 38);
    this.tocar([["falando", fala], [estado, estado === "dormindo" ? 7000 : 2800]]);
  };

  Robo.prototype.alternarDanca = function () {
    if (this.estado === "danca") this.setEstado("idle");
    else this.setEstado("danca", 16000);
  };

  Robo.prototype.cutucar = function () {
    if (this.estado === "idle") this.tocar([["feliz", 1600]]);
  };

  Robo.prototype._acompanharPonteiro = function () {
    var svg = this.svg, quadro = 0;
    window.addEventListener("pointermove", function (ev) {
      if (quadro || movimentoReduzido()) return;
      quadro = requestAnimationFrame(function () {
        quadro = 0;
        var r = svg.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
        var dy = (ev.clientY - (r.top + r.height * 0.33)) / (window.innerHeight / 2);
        var lim = function (v) { return Math.max(-1, Math.min(1, v)); };
        svg.style.setProperty("--ox", (lim(dx) * 8).toFixed(1));
        svg.style.setProperty("--oy", (lim(dy) * 5).toFixed(1));
      });
    }, { passive: true });
  };

  Robo.movimentoReduzido = movimentoReduzido;
  window.Robo = Robo;

  function iniciar() {
    document.querySelectorAll("svg.bot").forEach(function (svg) { if (!svg.__robo) new Robo(svg); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
