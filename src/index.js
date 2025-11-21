export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/analyzer") {
      // Tu formulario HTML
      return new Response(getHTML(), {
        headers: { "content-type": "text/html; charset=UTF-8" }
      });
    }

    if (url.pathname === "/analizar" && request.method === "POST") {
      // Procesar el análisis del texto del formulario
      try {
        const formData = await request.formData();
        const texto = formData.get("texto");
        const nombre = formData.get("nombre") || "Libro sin nombre";

        if (!texto || texto.length < 100) {
          return new Response("Error: El texto debe tener al menos 100 caracteres", { status: 400 });
        }

        const analisis = analizarTexto(texto, nombre);
        return new Response(JSON.stringify(analisis, null, 2), {
          headers: { "content-type": "application/json; charset=UTF-8" }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response("404 - Ruta no encontrada", { status: 404 });
  }
};

function analizarTexto(texto, nombre) {
  const lineas = texto.split("\n");
  const palabras = texto.split(/\s+/).filter(p => p.length > 0);
  const oraciones = texto.split(/[.!?]+/).filter(o => o.trim().length > 0);

  const frecuenciaPalabras = {};
  palabras.forEach(palabra => {
    const limpia = palabra.toLowerCase().replace(/[^a-záéíóúñü]/g, "");
    if (limpia.length > 3) {
      frecuenciaPalabras[limpia] = (frecuenciaPalabras[limpia] || 0) + 1;
    }
  });

  const topPalabras = Object.entries(frecuenciaPalabras)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([palabra, freq]) => ({ palabra, frecuencia: freq }));

  const palabrasUnicas = Object.keys(frecuenciaPalabras).length;
  const promedioPalabrasOracion = oraciones.length > 0
    ? (palabras.length / oraciones.length).toFixed(1)
    : 0;

  const recomendaciones = [];
  if (palabras.length < 10000) {
    recomendaciones.push("⚠️ Texto breve");
  } else if (palabras.length > 100000) {
    recomendaciones.push("✅ Extensión de novela");
  } else {
    recomendaciones.push("✅ Cuento o novela corta");
  }

  const promedio = palabras.length / oraciones.length;
  if (promedio < 10) {
    recomendaciones.push("📝 Estilo directo");
  } else if (promedio > 20) {
    recomendaciones.push("📝 Estilo elaborado");
  } else {
    recomendaciones.push("📝 Estilo balanceado");
  }

  return {
    nombre,
    fecha: new Date().toISOString(),
    estadisticas: {
      caracteres: texto.length,
      caracteresSinEspacios: texto.replace(/\s/g, "").length,
      palabras: palabras.length,
      palabrasUnicas,
      oraciones: oraciones.length,
      lineas: lineas.length,
      promedioPalabrasOracion: parseFloat(promedioPalabrasOracion)
    },
    topPalabras,
    recomendaciones
  };
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ecdotica Analyzer</title>
</head>
<body>
  <h1>Ecdotica Analyzer</h1>
  <p>Ingresa el texto y nombre del libro para analizarlos:</p>
  <form id="form">
    <input type="text" id="nombre" name="nombre" placeholder="Nombre del libro" required><br><br>
    <textarea id="texto" name="texto" placeholder="Pega aquí el texto..." required></textarea><br><br>
    <button type="submit">Analizar</button>
  </form>
  <div id="resultado"></div>
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value;
      const texto = document.getElementById('texto').value;
      const btn = e.target.querySelector('button');
      btn.textContent = 'Analizando...';
      btn.disabled = true;

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('texto', texto);
      const res = await fetch('/analizar', { method: 'POST', body: formData });
      if (!res.ok) {
        alert('Error: ' + await res.text());
        btn.textContent = 'Analizar';
        btn.disabled = false;
        return;
      }
      const data = await res.json();
      let html = '<h2>Resultados: ' + data.nombre + '</h2>';
      html += '<pre>' + JSON.stringify(data.estadisticas, null, 2) + '</pre>';
      html += '<b>Recomendaciones:</b><ul>' + data.recomendaciones.map(r => '<li>' + r + '</li>').join('') + '</ul>';
      html += '<b>Top Palabras:</b><ul>' + data.topPalabras.slice(0,10).map(p => '<li>' + p.palabra + ': ' + p.frecuencia + '</li>').join('') + '</ul>';
      document.getElementById('resultado').innerHTML = html;
      document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
      btn.textContent = 'Analizar';
      btn.disabled = false;
    });
  </script>
</body>
</html>`;
}

