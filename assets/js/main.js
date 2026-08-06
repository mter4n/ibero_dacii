/* Dibujo Asistido por Computadora II · comportamiento del sitio */

(function () {
  'use strict';

  /* --- Resaltar la sección activa en el índice lateral --- */
  function activarTOC() {
    var enlaces = Array.prototype.slice.call(
      document.querySelectorAll('.toc a[href^="#"]')
    );
    if (!enlaces.length) return;

    var destinos = enlaces
      .map(function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        return el ? { enlace: a, el: el } : null;
      })
      .filter(Boolean);
    if (!destinos.length) return;

    var actual = null;

    function marcar() {
      var y = window.scrollY + 130;
      var encontrado = destinos[0];
      for (var i = 0; i < destinos.length; i++) {
        if (destinos[i].el.offsetTop <= y) encontrado = destinos[i];
        else break;
      }
      // Al final de la página, marcar el último
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
        encontrado = destinos[destinos.length - 1];
      }
      if (encontrado === actual) return;
      if (actual) actual.enlace.classList.remove('activo');
      encontrado.enlace.classList.add('activo');
      actual = encontrado;
    }

    var esperando = false;
    window.addEventListener(
      'scroll',
      function () {
        if (esperando) return;
        esperando = true;
        window.requestAnimationFrame(function () {
          marcar();
          esperando = false;
        });
      },
      { passive: true }
    );
    marcar();
  }

  /* --- Modo día / noche ---
     El tema ya se aplicó en el <head> para evitar el parpadeo blanco.
     Aquí solo se conecta el botón y se sigue al sistema mientras el
     usuario no haya elegido manualmente. --- */
  function tema() {
    var raiz = document.documentElement;
    var btn = document.getElementById('tema-btn');
    var mq = window.matchMedia('(prefers-color-scheme: dark)');

    function guardado() {
      try { return localStorage.getItem('dacii-tema'); } catch (e) { return null; }
    }

    function aplicar(t) {
      if (t === 'oscuro') raiz.setAttribute('data-tema', 'oscuro');
      else raiz.removeAttribute('data-tema');
      if (btn) {
        btn.setAttribute('aria-pressed', t === 'oscuro' ? 'true' : 'false');
        btn.title = t === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      }
    }

    aplicar(guardado() || (mq.matches ? 'oscuro' : 'claro'));

    if (btn) {
      btn.addEventListener('click', function () {
        var nuevo = raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
        aplicar(nuevo);
        try { localStorage.setItem('dacii-tema', nuevo); } catch (e) {}
      });
    }

    // Si nunca eligió a mano, seguir los cambios del sistema
    var alCambiar = function (e) {
      if (!guardado()) aplicar(e.matches ? 'oscuro' : 'claro');
    };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
    else if (mq.addListener) mq.addListener(alCambiar);
  }

  /* --- Año actual en el pie --- */
  function anioPie() {
    var n = document.querySelectorAll('[data-anio]');
    for (var i = 0; i < n.length; i++) n[i].textContent = new Date().getFullYear();
  }

  function iniciar() {
    tema();
    activarTOC();
    anioPie();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
