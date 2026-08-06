/* ===================================================================
   Candado · abre un taller cifrado con el código del grupo

   El contenido del taller no está escondido en esta página: está
   cifrado. Lo que viaja por internet es un bloque ilegible. Aquí se
   descifra, en el navegador del alumno, con el código que teclea.

   El archivo lo genera taller-fuente/cifrar.py, que deja la carga
   cifrada en <script id="cerrojo">.
   =================================================================== */

(function () {
  'use strict';

  var cerrojo = document.getElementById('cerrojo');
  var pantalla = document.querySelector('[data-candado]');
  var destino = document.querySelector('[data-destino]');
  if (!cerrojo || !pantalla || !destino) return;

  var carga = JSON.parse(cerrojo.textContent);
  var forma = pantalla.querySelector('[data-forma]');
  var campo = pantalla.querySelector('.candado__campo');
  var boton = pantalla.querySelector('[data-enviar]');
  var aviso = pantalla.querySelector('[data-aviso]');

  /* La raíz del sitio se deduce del <link> de estilos, igual que en menu.js */
  var css = document.querySelector('link[rel="stylesheet"]');
  var raiz = css && css.getAttribute('href').indexOf('../') === 0 ? '../' : '';

  var MEMORIA = 'dacii-candado-' + carga.sello;

  /* ---------- Utilidades ---------- */

  /* Debe coincidir EXACTAMENTE con normalizar() de cifrar.py */
  function normalizar(texto) {
    return texto.trim().toUpperCase().split(/\s+/).join(' ');
  }

  function deBase64(texto) {
    var bin = atob(texto), n = bin.length, salida = new Uint8Array(n);
    for (var i = 0; i < n; i++) salida[i] = bin.charCodeAt(i);
    return salida;
  }

  function aBase64(bytes) {
    var s = '', b = new Uint8Array(bytes);
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  function decir(texto, tipo) {
    aviso.textContent = texto || '';
    aviso.className = 'candado__aviso' + (tipo ? ' candado__aviso--' + tipo : '');
  }

  function ocupado(si, texto) {
    pantalla.classList.toggle('candado--trabajando', si);
    boton.disabled = si;
    campo.readOnly = si;
    boton.textContent = si ? (texto || 'Abriendo…') : 'Abrir';
  }

  /* ---------- Criptografía ---------- */

  /* Prueba el código contra la envoltura de cada grupo. AES-GCM viene
     autenticado: si el código no es el de ese grupo, el descifrado
     falla y se pasa al siguiente. */
  function abrirEnvoltura(codigo) {
    var bytes = new TextEncoder().encode(codigo);

    return crypto.subtle
      .importKey('raw', bytes, 'PBKDF2', false, ['deriveBits'])
      .then(function (base) {
        var intento = Promise.resolve(null);

        carga.grupos.forEach(function (g) {
          intento = intento.then(function (hallado) {
            if (hallado) return hallado;

            return crypto.subtle
              .deriveBits({
                name: 'PBKDF2',
                salt: deBase64(g.sal),
                iterations: carga.iter,
                hash: 'SHA-256'
              }, base, 256)
              .then(function (bits) {
                return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['decrypt']);
              })
              .then(function (envoltura) {
                return crypto.subtle.decrypt(
                  { name: 'AES-GCM', iv: deBase64(g.iv) }, envoltura, deBase64(g.ct)
                );
              })
              .then(function (llave) {
                return { llave: new Uint8Array(llave), grupo: g.nombre };
              })
              .catch(function () { return null; });   // no era este grupo
          });
        });

        return intento;
      });
  }

  function descifrarTaller(llave) {
    return crypto.subtle
      .importKey('raw', llave, 'AES-GCM', false, ['decrypt'])
      .then(function (K) {
        return crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: deBase64(carga.iv) }, K, deBase64(carga.ct)
        );
      })
      .then(function (claro) {
        return new TextDecoder().decode(claro);
      });
  }

  /* ---------- Mostrar el taller ---------- */

  function cargarScript(ruta) {
    return new Promise(function (listo, falla) {
      var s = document.createElement('script');
      s.src = ruta;
      s.onload = listo;
      s.onerror = falla;
      document.body.appendChild(s);
    });
  }

  function mostrar(html, grupo) {
    destino.innerHTML = html;
    destino.removeAttribute('data-destino');
    document.body.classList.add('taller-abierto');

    /* Sello discreto de grupo, para que el alumno confirme que entró bien */
    var cab = destino.querySelector('.apunte__cab');
    if (cab && grupo) {
      var marca = document.createElement('p');
      marca.className = 'candado__sello';
      marca.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Abierto para el grupo <strong>' +
        grupo.replace(/[<>&]/g, '') + '</strong>';
      cab.appendChild(marca);
    }

    /* Estos scripts se cargan hasta ahora: necesitan el contenido en la página */
    var pendientes = Promise.resolve();
    ['taller.js', 'lupa.js'].forEach(function (archivo) {
      pendientes = pendientes.then(function () {
        return cargarScript(raiz + 'assets/js/' + archivo);
      });
    });

    pendientes
      .then(function () {
        if (window.CURSO_NAV) window.CURSO_NAV();          // anterior / siguiente
        if (window.MathJax && window.MathJax.typesetPromise) {
          return window.MathJax.typesetPromise([destino]);
        }
      })
      .catch(function () { /* si algo no carga, el taller sigue legible */ });

    /* Si la dirección traía un ancla (#act3), ir ahí ahora que ya existe */
    if (location.hash) {
      var meta = document.getElementById(location.hash.slice(1));
      if (meta) meta.scrollIntoView();
    }
  }

  /* ---------- Intento de apertura ---------- */

  function intentar(codigo) {
    ocupado(true);
    decir('Comprobando el código…');

    return abrirEnvoltura(codigo)
      .then(function (hallado) {
        if (!hallado) {
          ocupado(false);
          decir('Ese código no corresponde a ningún grupo de este taller. Revísalo y vuelve a intentar.', 'error');
          campo.select();
          campo.focus();
          return;
        }

        return descifrarTaller(hallado.llave).then(function (html) {
          try {
            sessionStorage.setItem(MEMORIA, aBase64(hallado.llave) + '|' + hallado.grupo);
          } catch (e) { /* navegador en modo privado: no pasa nada */ }
          mostrar(html, hallado.grupo);
        });
      })
      .catch(function () {
        ocupado(false);
        decir('Algo falló al abrir el taller. Recarga la página e intenta de nuevo.', 'error');
      });
  }

  /* ---------- Arranque ---------- */

  /* Web Crypto solo existe en páginas servidas por https:// (o localhost).
     Si alguien abre el archivo con doble clic, avisarlo con claridad. */
  if (!window.crypto || !window.crypto.subtle) {
    decir('Este taller debe abrirse desde la dirección del curso (https://…), no como archivo local.', 'error');
    boton.disabled = true;
    campo.disabled = true;
    return;
  }

  /* ¿Ya lo abrió en esta misma sesión del navegador? */
  var guardado = null;
  try { guardado = sessionStorage.getItem(MEMORIA); } catch (e) { /* sin almacenamiento */ }

  if (guardado) {
    var corte = guardado.lastIndexOf('|');
    var llave = deBase64(guardado.slice(0, corte));
    descifrarTaller(llave)
      .then(function (html) { mostrar(html, guardado.slice(corte + 1)); })
      .catch(function () {
        try { sessionStorage.removeItem(MEMORIA); } catch (e) {}
      });
  }

  forma.addEventListener('submit', function (e) {
    e.preventDefault();
    var codigo = normalizar(campo.value);
    if (!codigo) {
      decir('Escribe el código de tu grupo.', 'error');
      campo.focus();
      return;
    }
    intentar(codigo);
  });

  campo.addEventListener('input', function () {
    if (aviso.textContent) decir('');
  });
})();
