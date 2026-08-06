/* ===================================================================
   Estructura del curso · Dibujo Asistido por Computadora II (ARQ401)

   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR AL AGREGAR CONTENIDO.
   De aquí se construyen el menú «Contenido» de todas las páginas y
   los botones anterior/siguiente.

   El curso se divide en tres bloques, uno por PARCIAL. Para agregar un
   subtema a un parcial, añade una entrada a su "subtemas":
     { clave: '3', titulo: '...', apunte: 'tema-3-apunte.html' }

   - "taller" es opcional: si falta, no se muestra.
   - "apunteCerrado" y "tallerCerrado" dibujan un candado junto a esa página
     y avisan que pide código de grupo. El cifrado en sí lo hace
     taller-fuente/cifrar.py; estas banderas son solo lo que ve el alumno,
     así que deben coincidir con lo que esté en taller-fuente/grupos.json.
   - "descripcion" del parcial se usa en la tarjeta del índice.
   - Un parcial con "subtemas: []" aparece como «En preparación».
   - Si un tema aún no existe, deja "apunte: ''" y saldrá como
     «en preparación», sin enlace.
   =================================================================== */

window.CURSO = {
  titulo: 'Dibujo Asistido por Computadora II',
  carpeta: 'temas/',        // ruta de las páginas de tema desde la raíz del sitio

  bloques: [
    {
      numero: 1,
      titulo: 'Parcial 1',
      descripcion: 'Del encuadre al primer contacto con Revit, alternando teoría y taller: la idea ' +
                   'del curso (de dibujar a modelar información), el museo y su brief, la ' +
                   'representación a mano y, al cierre, el entorno y la interfaz de Revit. ' +
                   'Termina con el examen (S10).',
      subtemas: [
        { clave: 'S1',  titulo: 'Presentación del curso',     apunte: 'sesion-1.html' },
        { clave: 'S2',  titulo: 'Del dibujo a la información', apunte: 'sesion-2.html' },
        { clave: 'S3',  titulo: 'Taller: leer un museo',      apunte: 'sesion-3.html' },
        { clave: 'S4',  titulo: 'El proyecto: un museo',      apunte: 'sesion-4.html' },
        { clave: 'S5',  titulo: 'Taller: el brief, programa y sitio', apunte: 'sesion-5.html' },
        { clave: 'S6',  titulo: 'La representación: planta, sección y alzado', apunte: 'sesion-6.html' },
        { clave: 'S7',  titulo: 'Taller: el anteproyecto a mano', apunte: 'sesion-7.html' },
        { clave: 'S8',  titulo: 'Revit: el entorno y la interfaz', apunte: 'sesion-8.html' },
        { clave: 'S9',  titulo: 'Taller: primer contacto con Revit', apunte: 'sesion-9.html' },
        { clave: 'S10', titulo: 'Presentación y examen del primer parcial', apunte: 'sesion-10.html' }
      ]
    },
    {
      numero: 2,
      titulo: 'Parcial 2',
      descripcion: 'Modelar el museo en Revit: del anteproyecto en papel al modelo BIM. ' +
                   'Contenido en preparación.',
      subtemas: []
    },
    {
      numero: 3,
      titulo: 'Parcial 3',
      descripcion: 'Contenido en preparación.',
      subtemas: []
    }
  ]
};
