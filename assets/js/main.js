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

  /* --- Botón de imprimir / guardar en PDF --- */
  function imprimir() {
    var botones = document.querySelectorAll('[data-imprimir]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].hidden = false;
      botones[i].addEventListener('click', function () { window.print(); });
    }
  }

  /* --- Acordeón de zonas: abrir/cerrar todas --- */
  function zonas() {
    var grupos = document.querySelectorAll('[data-zonas]');
    for (var i = 0; i < grupos.length; i++) {
      (function (grupo) {
        var btn = grupo.querySelector('[data-zonas-todo]');
        var detalles = grupo.querySelectorAll('details');
        if (!btn || !detalles.length) return;
        btn.hidden = false;

        function refrescar() {
          var abiertas = 0;
          for (var k = 0; k < detalles.length; k++) if (detalles[k].open) abiertas++;
          btn.textContent = abiertas === detalles.length ? 'Cerrar todas' : 'Abrir todas';
        }
        btn.addEventListener('click', function () {
          var abrir = btn.textContent === 'Abrir todas';
          for (var k = 0; k < detalles.length; k++) detalles[k].open = abrir;
          refrescar();
        });
        for (var j = 0; j < detalles.length; j++) {
          detalles[j].addEventListener('toggle', refrescar);
        }
        refrescar();
      })(grupos[i]);
    }
  }

  /* --- Al imprimir, desplegar todo lo plegable y restaurarlo después --- */
  function imprimirDesplegado() {
    var previos = null;
    function antes() {
      var d = document.querySelectorAll('details');
      previos = [];
      for (var i = 0; i < d.length; i++) { previos.push(d[i].open); d[i].open = true; }
    }
    function despues() {
      if (!previos) return;
      var d = document.querySelectorAll('details');
      for (var i = 0; i < d.length; i++) d[i].open = previos[i];
      previos = null;
    }
    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', despues);
    if (window.matchMedia) {
      var mq = window.matchMedia('print');
      var alCambiar = function (e) { e.matches ? antes() : despues(); };
      if (mq.addEventListener) mq.addEventListener('change', alCambiar);
      else if (mq.addListener) mq.addListener(alCambiar);
    }
  }

  /* --- Lo que depende del contenido de la página ---
     En las sesiones cerradas con candado, al cargar la página el contenido
     todavía no existe: solo está la pantalla del código. Por eso esta parte
     se separa, y candado.js la vuelve a llamar cuando el alumno desbloquea.
     Al correr en la página abierta no hace nada: no hay TOC, ni botón de
     imprimir, ni acordeón que enganchar. */
  function iniciarContenido() {
    activarTOC();
    anioPie();
    imprimir();
    zonas();
  }

  window.CURSO_CONTENIDO = iniciarContenido;

  function iniciar() {
    tema();
    iniciarContenido();
    imprimirDesplegado();   /* escucha en window: se conecta una sola vez */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
