/* ===================================================================
   Taller interactivo · Dibujo Asistido por Computadora II

   Las respuestas correctas NO viajan en claro: cada variante aceptada
   se guarda como hash FNV-1a de 32 bits en data-r. El navegador hashea
   lo que escribe el alumno y compara. Así se puede autoevaluar sin que
   la clave sea legible desde el código de la página.

   Nota: es una barrera contra la lectura casual, no un cifrado. Con
   suficiente empeño un hash de respuesta corta se puede tantear.
   =================================================================== */

(function () {
  'use strict';


  /* ---------- Normalización y hash ---------- */

  function normalizar(s) {
    return (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')      // quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9+\u2212]+/g, ' ')   // el guion se vuelve espacio: \u00abACI 318-14\u00bb = \u00abACI 318 14\u00bb
      .replace(/\s+/g, ' ')
      .trim();
  }

  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
  }

  function esperados(el) {
    return (el.getAttribute('data-r') || '').split('|').filter(Boolean);
  }

  function acierta(el, valor) {
    var v = normalizar(valor);
    if (!v) return null;                       // sin responder
    var ok = esperados(el);
    if (!ok.length) return null;
    if (ok.indexOf(hash(v)) !== -1) return true;
    // modo "palabra": basta con que un término de la respuesta coincida
    if (el.getAttribute('data-modo') === 'palabra') {
      var partes = v.split(' ');
      for (var i = 0; i < partes.length; i++) {
        if (ok.indexOf(hash(partes[i])) !== -1) return true;
      }
      for (var j = 0; j < partes.length - 1; j++) {
        if (ok.indexOf(hash(partes[j] + ' ' + partes[j + 1])) !== -1) return true;
      }
    }
    return false;
  }

  /* ---------- Inventario de reactivos ---------- */

  var taller = document.getElementById('taller');
  if (!taller) return;

  var CLAVE  = taller.getAttribute('data-clave')  || 'dacii-taller';
  var APUNTE = taller.getAttribute('data-apunte') || '';

  var campos  = [].slice.call(taller.querySelectorAll('.hueco[data-r], .hueco-sel[data-r]'));
  var grupos  = [].slice.call(taller.querySelectorAll('.eleccion[data-r]'));
  var multis  = [].slice.call(taller.querySelectorAll('.opciones[data-r]'));
  var totalReactivos = campos.length + grupos.length + multis.length;

  var totalEl = document.getElementById('total');
  if (totalEl) totalEl.textContent = totalReactivos;

  /* ---------- Botones V/F, +/−, C/A ---------- */

  grupos.forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !g.contains(b)) return;
      var ya = b.getAttribute('aria-pressed') === 'true';
      [].forEach.call(g.querySelectorAll('button'), function (o) {
        o.setAttribute('aria-pressed', 'false');
      });
      b.setAttribute('aria-pressed', ya ? 'false' : 'true');
      limpiarMarca(g);
      guardar();
    });
  });

  function valorGrupo(g) {
    var b = g.querySelector('button[aria-pressed="true"]');
    return b ? b.getAttribute('data-v') : '';
  }

  /* ---------- Guardado local ---------- */

  function idDe(el, i) { return (el.getAttribute('aria-label') || el.name || '') + '#' + i; }

  function guardar() {
    var datos = { campos: {}, grupos: {}, multis: {}, libres: {} };
    campos.forEach(function (el, i) { datos.campos[idDe(el, i)] = el.value; });
    grupos.forEach(function (g, i) { datos.grupos[idDe(g, i)] = valorGrupo(g); });
    multis.forEach(function (m, i) {
      var r = m.querySelector('input:checked');
      datos.multis[idDe(m, i)] = r ? r.value : '';
    });
    [].forEach.call(taller.querySelectorAll('textarea, [data-libre]'), function (el, i) {
      datos.libres[idDe(el, i)] = el.value;
    });
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }

  function restaurar() {
    var datos;
    try { datos = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return; }
    if (!datos || !datos.campos) return;
    campos.forEach(function (el, i) {
      var v = datos.campos[idDe(el, i)];
      if (v) el.value = v;
    });
    grupos.forEach(function (g, i) {
      var v = datos.grupos[idDe(g, i)];
      if (!v) return;
      [].forEach.call(g.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false');
      });
    });
    multis.forEach(function (m, i) {
      var v = datos.multis[idDe(m, i)];
      if (!v) return;
      var r = m.querySelector('input[value="' + v + '"]');
      if (r) r.checked = true;
    });
    [].forEach.call(taller.querySelectorAll('textarea, [data-libre]'), function (el, i) {
      var v = (datos.libres || {})[idDe(el, i)];
      if (v) el.value = v;
    });
  }

  /* ---------- Marcas de corrección ---------- */

  function limpiarMarca(el) {
    el.classList.remove('bien', 'mal');
    if (el._marca && el._marca.parentNode) el._marca.parentNode.removeChild(el._marca);
    el._marca = null;
  }

  function marcar(el, ok) {
    limpiarMarca(el);
    el.classList.add(ok ? 'bien' : 'mal');
    var m = document.createElement('span');
    m.className = 'marca ' + (ok ? 'ok' : 'no');
    m.textContent = ok ? '\u2713' : '\u2717';
    m.setAttribute('aria-label', ok ? 'correcto' : 'incorrecto');
    // V/F, +/- y C/A: la marca va al final de su renglón; el resto, junto al campo
    if (el.classList.contains('eleccion')) (el.closest('li') || el.parentNode).appendChild(m);
    else el.insertAdjacentElement('afterend', m);
    el._marca = m;
  }

  /* ---------- Comprobar ---------- */

  function comprobar() {
    var bien = 0, contestados = 0;

    campos.forEach(function (el) {
      var r = acierta(el, el.value);
      if (r === null) { limpiarMarca(el); return; }
      contestados++;
      if (r) bien++;
      marcar(el, r);
    });

    grupos.forEach(function (g) {
      var v = valorGrupo(g);
      if (!v) { limpiarMarca(g); return; }
      contestados++;
      var r = esperados(g).indexOf(hash(normalizar(v))) !== -1;
      if (r) bien++;
      marcar(g, r);
    });

    multis.forEach(function (m) {
      var sel = m.querySelector('input:checked');
      if (!sel) { limpiarMarca(m); return; }
      contestados++;
      var r = esperados(m).indexOf(hash(normalizar(sel.value))) !== -1;
      if (r) bien++;
      marcar(m, r);
    });

    // Aviso de revisión manual en las preguntas abiertas con contenido
    [].forEach.call(taller.querySelectorAll('textarea[data-manual]'), function (t) {
      var host = t.parentNode;
      var vieja = host.querySelector(':scope > .revisar');
      if (vieja) vieja.remove();
      if (!t.value.trim()) return;
      var p = document.createElement('p');
      p.className = 'revisar';
      p.textContent = 'Respuesta abierta · la revisa tu profesor';
      var destino = t.getAttribute('data-manual');
      if (APUNTE && destino) {
        var a = document.createElement('a');
        a.href = APUNTE + '#' + destino;
        a.textContent = t.getAttribute('data-seccion') || 'repasar el apunte';
        p.appendChild(document.createTextNode(' · '));
        p.appendChild(a);
      }
      t.insertAdjacentElement('afterend', p);
    });

    var marcador = document.getElementById('marcador');
    if (marcador) {
      if (!contestados) {
        marcador.innerHTML = 'Aún no has respondido nada · <strong>0</strong> de <strong>' +
                             totalReactivos + '</strong> reactivos';
      } else {
        var pct = Math.round((bien / contestados) * 100);
        marcador.innerHTML = '<strong>' + bien + '</strong> de <strong>' + contestados +
                             '</strong> respondidos correctamente (' + pct + '%) · ' +
                             totalReactivos + ' reactivos en total';
      }
    }
    guardar();
  }

  function limpiar() {
    if (!window.confirm('Se borrarán todas tus respuestas de este taller. ¿Continuar?')) return;
    campos.forEach(function (el) { el.value = ''; limpiarMarca(el); });
    grupos.forEach(function (g) {
      [].forEach.call(g.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', 'false'); });
      limpiarMarca(g);
    });
    multis.forEach(function (m) {
      [].forEach.call(m.querySelectorAll('input'), function (r) { r.checked = false; });
      limpiarMarca(m);
    });
    [].forEach.call(taller.querySelectorAll('textarea, [data-libre]'), function (el) { el.value = ''; });
    [].forEach.call(taller.querySelectorAll('.revisar'), function (p) {
      if (p.parentNode && p.previousElementSibling && p.previousElementSibling.tagName === 'TEXTAREA') p.remove();
    });
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    var marcador = document.getElementById('marcador');
    if (marcador) marcador.innerHTML = 'Sin comprobar · <strong>0</strong> de <strong>' +
                                       totalReactivos + '</strong> reactivos';
  }

  /* ---------- Enlaces ---------- */

  taller.addEventListener('input', function (e) {
    if (e.target.matches('.hueco, .abierta, textarea')) { limpiarMarca(e.target); guardar(); }
  });
  taller.addEventListener('change', function (e) {
    if (e.target.matches('.hueco-sel, input[type="radio"]')) {
      limpiarMarca(e.target.closest('.opciones') || e.target);
      guardar();
    }
  });

  var bC = document.getElementById('btn-comprobar');
  var bL = document.getElementById('btn-limpiar');
  var bI = document.getElementById('btn-imprimir');
  if (bC) bC.addEventListener('click', comprobar);
  if (bL) bL.addEventListener('click', limpiar);
  if (bI) bI.addEventListener('click', function () { window.print(); });

  restaurar();
})();
