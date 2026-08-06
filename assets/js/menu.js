/* ===================================================================
   Menú «Contenido» · se construye desde assets/js/curso.js

   Cada página solo necesita, dentro de .nav__inner:
     <div class="menu" data-menu></div>
   y saber si está en la raíz o en temas/ (se deduce de la ruta del CSS).
   =================================================================== */

(function () {
  'use strict';

  var host = document.querySelector('[data-menu]');
  if (!host || !window.CURSO) return;

  /* La raíz del sitio se deduce del <link> de estilos: si apunta a
     "../assets/..." estamos dentro de temas/. */
  var css = document.querySelector('link[rel="stylesheet"]');
  var raiz = css && css.getAttribute('href').indexOf('../') === 0 ? '../' : '';

  var aqui = location.pathname.split('/').pop() || 'index.html';

  /* Candado para los talleres que piden código de grupo */
  var ICO_CANDADO =
    '<svg class="ico-candado" viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="5.2" y="11" width="13.6" height="9" rx="2.1"/>' +
    '<path d="M8.6 11V7.9a3.4 3.4 0 0 1 6.8 0V11"/></svg>';

  /* --- Lista plana de páginas, para anterior/siguiente --- */
  var plano = [];
  window.CURSO.bloques.forEach(function (b) {
    b.subtemas.forEach(function (s) {
      if (s.apunte) plano.push({ archivo: s.apunte, clave: s.clave, titulo: s.titulo, tipo: 'Apunte' });
      if (s.taller) plano.push({ archivo: s.taller, clave: s.clave, titulo: s.titulo, tipo: 'Taller' });
    });
  });

  /* --- Construcción del panel --- */
  var partes = [];
  partes.push(
    '<button class="menu__btn" type="button" id="menu-btn" aria-expanded="false"' +
            ' aria-controls="menu-panel" aria-label="Contenido del curso">' +
      '<svg class="ico-lista" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
      '<span>Contenido</span>' +
      '<svg class="ico-galon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5"/></svg>' +
    '</button>' +
    '<div class="menu__fondo" data-fondo hidden></div>' +
    '<div class="menu__panel" id="menu-panel" role="menu" hidden>'
  );

  window.CURSO.bloques.forEach(function (b) {
    partes.push('<p class="menu__bloque">' + b.titulo + '</p>');
    partes.push('<ul class="menu__lista">');
    if (!b.subtemas.length) partes.push('<li class="menu__vacio"><span class="menu__tema">En preparación</span></li>');
    b.subtemas.forEach(function (s) {
      var enlaces = [];
      if (s.apunte) enlaces.push({ url: s.apunte, texto: 'Apunte', cerrado: s.apunteCerrado });
      if (s.taller) enlaces.push({ url: s.taller, texto: 'Taller', cerrado: s.tallerCerrado });

      partes.push('<li>');
      partes.push('<span class="menu__clave">' + s.clave + '</span>');
      partes.push('<span class="menu__tema">' + s.titulo + '</span>');
      if (!enlaces.length) {
        partes.push('<span class="menu__pendiente">en preparación</span>');
      } else {
        partes.push('<span class="menu__accesos">');
        enlaces.forEach(function (e) {
          partes.push(
            '<a href="' + raiz + window.CURSO.carpeta + e.url + '" role="menuitem"' +
            (e.cerrado ? ' title="Requiere código de grupo"' : '') +
            (e.url === aqui ? ' class="aqui" aria-current="page"' : '') + '>' +
            e.texto + (e.cerrado ? ICO_CANDADO : '') + '</a>'
          );
        });
        partes.push('</span>');
      }
      partes.push('</li>');
    });
    partes.push('</ul>');
  });

  partes.push('<a class="menu__inicio" href="' + raiz + 'index.html" role="menuitem">Ir al índice del curso</a>');
  partes.push('</div>');
  host.innerHTML = partes.join('');

  /* --- Comportamiento: abrir, cerrar, teclado --- */
  var btn = host.querySelector('#menu-btn');
  var panel = host.querySelector('#menu-panel');

  var fondo = host.querySelector('[data-fondo]');

  function abrir(si) {
    panel.hidden = !si;
    if (fondo) fondo.hidden = !si;
    btn.setAttribute('aria-expanded', si ? 'true' : 'false');
    host.classList.toggle('abierto', si);
    // En móvil el panel ocupa la pantalla: se bloquea el desplazamiento de fondo
    document.body.classList.toggle('menu-abierto', si);
  }

  if (fondo) fondo.addEventListener('click', function () { abrir(false); });

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    abrir(panel.hidden);
  });

  document.addEventListener('click', function (e) {
    if (!host.contains(e.target)) abrir(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { abrir(false); btn.focus(); }
  });

  // Al salir del menú con el tabulador, cerrarlo
  host.addEventListener('focusout', function () {
    window.setTimeout(function () {
      if (!host.contains(document.activeElement)) abrir(false);
    }, 0);
  });

  /* --- Anterior / siguiente al pie de las páginas de tema ---
     Se expone como función porque en los talleres con candado el pie
     aparece hasta que el alumno desbloquea; candado.js la vuelve a llamar. */
  window.CURSO_NAV = function () {
    var nav = document.querySelector('[data-nav-temas]');
    if (!nav) return;

    var i = plano.findIndex ? plano.findIndex(function (p) { return p.archivo === aqui; }) : -1;
    if (i === -1) for (var k = 0; k < plano.length; k++) if (plano[k].archivo === aqui) { i = k; break; }
    if (i === -1) return;

    var ant = plano[i - 1], sig = plano[i + 1], html = '';
    html += ant
      ? '<a href="' + ant.archivo + '"><small>&larr; Anterior</small><strong>' +
        ant.clave + ' · ' + (ant.tipo === 'Taller' ? 'Taller' : ant.titulo) + '</strong></a>'
      : '<a href="' + raiz + 'index.html"><small>&larr; Volver</small><strong>Índice del curso</strong></a>';
    html += sig
      ? '<a class="der" href="' + sig.archivo + '"><small>Siguiente &rarr;</small><strong>' +
        sig.clave + ' · ' + (sig.tipo === 'Taller' ? 'Taller' : sig.titulo) + '</strong></a>'
      : '<a class="der" href="' + raiz + 'index.html"><small>Volver &rarr;</small><strong>Índice del curso</strong></a>';
    nav.innerHTML = html;
  };

  window.CURSO_NAV();
})();

/* ===================================================================
   Índice y páginas de parcial · desde curso.js
   · En el índice ([data-bloques]): una tarjeta por parcial que enlaza
     a su página. Aquí NO se listan las sesiones.
   · En la página de un parcial ([data-parcial="N"]): la lista de
     sesiones / sub-unidades de ese parcial.
   =================================================================== */
(function () {
  'use strict';
  if (!window.CURSO) return;

  var ICO_CANDADO =
    '<svg class="ico-candado" viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="5.2" y="11" width="13.6" height="9" rx="2.1"/>' +
    '<path d="M8.6 11V7.9a3.4 3.4 0 0 1 6.8 0V11"/></svg>';

  /* Raíz del sitio (por si la página vive en una subcarpeta) */
  var css = document.querySelector('link[rel="stylesheet"]');
  var raiz = css && css.getAttribute('href').indexOf('../') === 0 ? '../' : '';

  function resumen(b) {
    var total = 0, listos = 0, conCodigo = false;
    b.subtemas.forEach(function (s) {
      total++;
      if (s.apunte || s.taller) listos++;
      if (s.apunteCerrado || s.tallerCerrado) conCodigo = true;
    });
    return { total: total, listos: listos, conCodigo: conCodigo };
  }

  /* --- A) Índice: una tarjeta por parcial, enlazando a su página --- */
  var host = document.querySelector('[data-bloques]');
  if (host) {
    var out = [];
    window.CURSO.bloques.forEach(function (b, i) {
      var r = resumen(b);
      var cuenta = r.total
        ? r.total + (r.total === 1 ? ' sesión' : ' sesiones')
        : 'Por publicar';
      var chip = r.total === 0
        ? '<span class="chip chip--wip">En preparación</span>'
        : (r.listos === r.total
          ? '<span class="chip chip--ok">Contenido disponible</span>'
          : (r.listos ? '<span class="chip chip--ok">' + r.listos + ' de ' + r.total + ' disponibles</span>'
                      : '<span class="chip chip--wip">En preparación</span>'));
      if (r.conCodigo) chip += '<span class="chip chip--llave">Con código de grupo</span>';

      out.push(
        '<a class="bloque bloque--' + (i % 2 ? '2' : '1') + '" href="' + raiz + 'parcial-' + b.numero + '.html">' +
          '<div class="bloque__cab">' +
            '<div class="bloque__num">' + b.numero + '</div>' +
            '<div><h3>' + b.titulo + '</h3><p>' + cuenta + '</p></div>' +
          '</div>' +
          '<p>' + (b.descripcion || '') + '</p>' +
          '<div class="bloque__pie">' + chip + '<span class="flecha">&rarr;</span></div>' +
        '</a>'
      );
    });
    host.innerHTML = out.join('');
  }

  /* --- B) Página de un parcial: sus sesiones / sub-unidades --- */
  var det = document.querySelector('[data-parcial]');
  if (det) {
    var num = parseInt(det.getAttribute('data-parcial'), 10);
    var bloque = null;
    window.CURSO.bloques.forEach(function (b) { if (b.numero === num) bloque = b; });
    if (bloque) {
      var descEl = document.querySelector('[data-parcial-desc]');
      if (descEl) descEl.textContent = bloque.descripcion || '';

      var filas = bloque.subtemas.map(function (s) {
        var enlaces = [];
        if (s.apunte) enlaces.push({ url: s.apunte, texto: 'Apunte', cerrado: s.apunteCerrado });
        if (s.taller) enlaces.push({ url: s.taller, texto: 'Taller', cerrado: s.tallerCerrado });
        if (!enlaces.length) {
          return '<li><span><span class="clave">' + s.clave + '</span>' +
                 '<span>' + s.titulo + '</span></span></li>';
        }
        return enlaces.map(function (e) {
          var rotulo = e.texto !== 'Taller' ? s.titulo
                     : (e.cerrado ? 'Taller · requiere código de grupo'
                                  : 'Taller · actividades interactivas');
          return '<li><a href="' + raiz + window.CURSO.carpeta + e.url + '"' +
                 (e.cerrado ? ' title="Requiere código de grupo"' : '') + '>' +
                 '<span class="clave">' + s.clave + '</span>' +
                 '<span>' + rotulo + '</span>' +
                 (e.cerrado ? ICO_CANDADO : '') +
                 '<span class="flecha">&rarr;</span></a></li>';
        }).join('');
      }).join('');
      det.innerHTML = filas || '<li><span><span>En preparación</span></span></li>';
    }
  }
})();
