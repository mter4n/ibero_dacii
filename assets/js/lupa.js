/* ===================================================================
   Lupa · tocar una figura la abre a pantalla completa

   Funciona con imágenes y con los esquemas en SVG (que se clonan, así
   que escalan sin perder nitidez y conservan el tema claro/oscuro).
   =================================================================== */

(function () {
  'use strict';

  var figuras = [].slice.call(document.querySelectorAll('figure img, figure svg, .obras img'));
  if (!figuras.length) return;

  var ICONO_LUPA = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/>' +
                   '<path d="M15.5 15.5 21 21M10.5 7.8v5.4M7.8 10.5h5.4"/></svg>';

  /* ---------- Visor ---------- */
  var visor = document.createElement('div');
  visor.className = 'visor';
  visor.hidden = true;
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Figura ampliada');
  visor.innerHTML =
    '<div class="visor__barra">' +
      '<span class="visor__titulo" data-titulo></span>' +
      '<button class="visor__accion" type="button" data-zoom aria-label="Acercar" title="Acercar">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/>' +
        '<path d="M15.5 15.5 21 21M10.5 7.8v5.4M7.8 10.5h5.4"/></svg>' +
      '</button>' +
      '<button class="visor__accion" type="button" data-cerrar aria-label="Cerrar" title="Cerrar (Esc)">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="visor__lienzo" data-lienzo></div>' +
    '<div class="visor__pie" data-pie></div>';
  document.body.appendChild(visor);

  var lienzo = visor.querySelector('[data-lienzo]');
  var pie = visor.querySelector('[data-pie]');
  var titulo = visor.querySelector('[data-titulo]');
  var btnZoom = visor.querySelector('[data-zoom]');
  var btnCerrar = visor.querySelector('[data-cerrar]');
  var origen = null;

  function zoom(si) {
    visor.classList.toggle('zoom', si);
    btnZoom.setAttribute('aria-label', si ? 'Alejar' : 'Acercar');
    btnZoom.title = si ? 'Alejar' : 'Acercar';
    lienzo.firstChild && (lienzo.firstChild.style.cursor = si ? 'zoom-out' : 'zoom-in');
    if (si) {
      // Centrar el desplazamiento al acercar, para no aterrizar en la esquina
      lienzo.scrollLeft = (lienzo.scrollWidth - lienzo.clientWidth) / 2;
      lienzo.scrollTop = (lienzo.scrollHeight - lienzo.clientHeight) / 2;
    }
  }

  function abrir(el) {
    origen = el;
    lienzo.innerHTML = '';
    zoom(false);

    var copia;
    if (el.tagName.toLowerCase() === 'svg') {
      copia = el.cloneNode(true);
      copia.removeAttribute('style');
      copia.style.width = 'min(100%, 900px)';
      copia.style.background = 'var(--tarjeta)';
    } else {
      copia = document.createElement('img');
      copia.src = el.currentSrc || el.src;
      copia.alt = el.alt || '';
      copia.style.filter = 'none';   // sin el atenuado del modo oscuro: aquí se quiere ver bien
    }
    copia.style.cursor = 'zoom-in';
    copia.addEventListener('click', function () { zoom(!visor.classList.contains('zoom')); });
    lienzo.appendChild(copia);

    // Leyenda de la figura, si la hay
    var fig = el.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    pie.innerHTML = cap ? cap.innerHTML : '';
    pie.hidden = !cap;

    var m = (cap ? cap.textContent : '').match(/(Figura|Tabla)\s+\d+/);
    titulo.textContent = m ? m[0] : '';

    visor.hidden = false;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(function () { visor.classList.add('visible'); });
    btnCerrar.focus();

    if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([pie]);
  }

  function cerrar() {
    visor.classList.remove('visible');
    window.setTimeout(function () {
      visor.hidden = true;
      lienzo.innerHTML = '';
      document.body.style.overflow = '';
      if (origen && origen.focus) origen.focus();
      origen = null;
    }, 180);
  }

  btnCerrar.addEventListener('click', cerrar);
  btnZoom.addEventListener('click', function () { zoom(!visor.classList.contains('zoom')); });
  visor.addEventListener('click', function (e) {
    if (e.target === visor || e.target === lienzo) cerrar();
  });
  document.addEventListener('keydown', function (e) {
    if (visor.hidden) return;
    if (e.key === 'Escape') cerrar();
    // Mantener el foco dentro del visor
    if (e.key === 'Tab') {
      var foco = visor.querySelectorAll('button');
      var pri = foco[0], ult = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    }
  });

  /* ---------- Preparar cada figura ---------- */
  figuras.forEach(function (el) {
    el.classList.add('ampliable');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    var desc = el.getAttribute('alt') || el.getAttribute('aria-label') || 'la figura';
    el.setAttribute('aria-label', 'Ampliar: ' + desc);

    el.addEventListener('click', function () { abrir(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(el); }
    });

    /* Distintivo de lupa: se envuelve la figura para anclarlo a la imagen
       y no al <figure>, que incluye el pie de foto. */
    var env = document.createElement('span');
    env.className = 'lupa-env';
    el.parentNode.insertBefore(env, el);
    env.appendChild(el);

    var marca = document.createElement('span');
    marca.className = 'lupa-marca';
    marca.setAttribute('aria-hidden', 'true');
    marca.innerHTML = ICONO_LUPA;
    env.appendChild(marca);
  });
})();
