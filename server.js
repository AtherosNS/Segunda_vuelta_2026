const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Headers necesarios para consultar la API de ONPE evadiendo el bloqueo de WAF/CDN
const ONPE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Referer": "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin"
};

// Utilidad para construir la URL con parámetros de filtrado geográfico
function buildOnpeUrl(endpoint, query) {
  const { ambito, dep, prov, dist } = query;
  let tipoFiltro = "eleccion";
  let params = new URLSearchParams({ idEleccion: "10" });

  if (dist) {
    tipoFiltro = "ubigeo_nivel_03";
    params.append("idAmbitoGeografico", ambito);
    params.append("idUbigeoDepartamento", dep);
    params.append("idUbigeoProvincia", prov);
    params.append("idUbigeoDistrito", dist);
  } else if (prov) {
    tipoFiltro = "ubigeo_nivel_02";
    params.append("idAmbitoGeografico", ambito);
    params.append("idUbigeoDepartamento", dep);
    params.append("idUbigeoProvincia", prov);
  } else if (dep) {
    tipoFiltro = "ubigeo_nivel_01";
    params.append("idAmbitoGeografico", ambito);
    params.append("idUbigeoDepartamento", dep);
  } else if (ambito) {
    tipoFiltro = "ambito_geografico";
    params.append("idAmbitoGeografico", ambito);
  }

  params.append("tipoFiltro", tipoFiltro);
  return `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/${endpoint}?${params.toString()}`;
}

// Endpoint API que actúa como Proxy para resultados filtrados
app.get('/api/resultados', async (req, res) => {
  try {
    // Evitar almacenamiento en caché a nivel de navegador y CDN intermedias
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    // Asegurar que la caché y el historial estén actualizados (no bloqueante si ya hay datos)
    await getOrUpdateCache();

    const urlTotals = buildOnpeUrl('totales', req.query);
    const urlPart = buildOnpeUrl('participantes', req.query);

    // Realizar ambas peticiones en paralelo (con un timeout de 5 segundos)
    const [resTotals, resPart] = await Promise.all([
      fetch(urlTotals, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) }),
      fetch(urlPart, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) })
    ]);

    // Verificar si el recurso no existe en este nivel (204 No Content)
    if (resTotals.status === 204 || resPart.status === 204) {
      return res.json({
        success: true,
        noData: true,
        message: "No se encontraron actas computadas o registradas para esta ubicación."
      });
    }

    if (!resTotals.ok || !resPart.ok) {
      throw new Error(`ONPE API error: Totales ${resTotals.status}, Participantes ${resPart.status}`);
    }

    const textTotals = await resTotals.text();
    const textPart = await resPart.text();

    // Validar si devolvió HTML
    if (textTotals.trim().startsWith('<') || textPart.trim().startsWith('<')) {
      throw new Error("La API de la ONPE devolvió HTML en lugar de JSON (bloqueo CDN)");
    }

    const dataTotals = JSON.parse(textTotals);
    const dataPart = JSON.parse(textPart);

    if (!dataTotals.success || !dataPart.success) {
      throw new Error("Peticiones infructuosas según la respuesta del backend de la ONPE");
    }

    res.json({
      success: true,
      totales: dataTotals.data,
      participantes: dataPart.data,
      regiones: cachedRegiones,
      historial: globalHistory
    });

  } catch (error) {
    console.error("Error en el proxy API:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Proxy para obtener los departamentos/continentes
app.get('/api/ubigeos/departamentos', async (req, res) => {
  try {
    const { ambito } = req.query;
    if (!ambito) {
      return res.status(400).json({ success: false, error: "Falta el parámetro 'ambito'" });
    }
    const url = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=${ambito}`;
    const response = await fetch(url, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) });
    const text = await response.text();

    if (text.trim().startsWith('<')) {
      throw new Error("Respuesta bloqueada (HTML)");
    }

    const data = JSON.parse(text);
    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("Error ubigeos departamentos:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy para obtener las provincias/países
app.get('/api/ubigeos/provincias', async (req, res) => {
  try {
    const { ambito, dep } = req.query;
    if (!ambito || !dep) {
      return res.status(400).json({ success: false, error: "Faltan parámetros 'ambito' o 'dep'" });
    }
    const url = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/ubigeos/provincias?idEleccion=10&idAmbitoGeografico=${ambito}&idUbigeoDepartamento=${dep}`;
    const response = await fetch(url, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) });
    const text = await response.text();

    if (text.trim().startsWith('<')) {
      throw new Error("Respuesta bloqueada (HTML)");
    }

    const data = JSON.parse(text);
    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("Error ubigeos provincias:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy para obtener los distritos/ciudades
app.get('/api/ubigeos/distritos', async (req, res) => {
  try {
    const { ambito, prov } = req.query;
    if (!ambito || !prov) {
      return res.status(400).json({ success: false, error: "Faltan parámetros 'ambito' o 'prov'" });
    }
    const url = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/ubigeos/distritos?idEleccion=10&idAmbitoGeografico=${ambito}&idUbigeoProvincia=${prov}`;
    const response = await fetch(url, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) });
    const text = await response.text();

    if (text.trim().startsWith('<')) {
      throw new Error("Respuesta bloqueada (HTML)");
    }

    const data = JSON.parse(text);
    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("Error ubigeos distritos:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lista de ubigeos de departamentos de la ONPE para el widget de Macro-Regiones
const DEPARTAMENTOS_UBIGEOS = [
  "010000", "020000", "030000", "040000", "050000",
  "060000", "240000", "070000", "080000", "090000",
  "100000", "110000", "120000", "130000", "140000",
  "150000", "160000", "170000", "180000", "190000",
  "200000", "210000", "220000", "230000", "250000"
];

let cachedRegiones = [];
let globalHistory = [];
let lastCacheUpdate = 0;
let lastHistoryUpdate = 0;
let cacheUpdatePromise = null;
let historyUpdatePromise = null;

async function updateGlobalHistory() {
  try {
    const urlTotals = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion`;
    const urlPart = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/participantes?idEleccion=10&tipoFiltro=eleccion`;
    
    const [resTotals, resPart] = await Promise.all([
      fetch(urlTotals, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) }),
      fetch(urlPart, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(5000) })
    ]);
    
    if (resTotals.ok && resPart.ok) {
      const dataTotals = await resTotals.json();
      const dataPart = await resPart.json();
      
      if (dataTotals.success && dataPart.success && dataTotals.data && dataPart.data) {
        const fpData = dataPart.data.find(p => p.nombreAgrupacionPolitica && p.nombreAgrupacionPolitica.includes('FUERZA POPULAR'));
        const jpData = dataPart.data.find(p => p.nombreAgrupacionPolitica && p.nombreAgrupacionPolitica.includes('JUNTOS POR EL PERÚ'));
        
        const progress = dataTotals.data.actasContabilizadas || 0;
        const fpPct = fpData ? fpData.porcentajeVotosValidos : 0;
        const jpPct = jpData ? jpData.porcentajeVotosValidos : 0;
        
        if (globalHistory.length === 0 || globalHistory[globalHistory.length - 1].progress !== progress) {
          const nowHist = new Date();
          const day = String(nowHist.getDate()).padStart(2, '0');
          const month = String(nowHist.getMonth() + 1).padStart(2, '0');
          const hours = String(nowHist.getHours()).padStart(2, '0');
          const minutes = String(nowHist.getMinutes()).padStart(2, '0');
          const formattedTimestamp = `${day}/${month} ${hours}:${minutes}`;

          globalHistory.push({
            timestamp: formattedTimestamp,
            progress: progress,
            fp: fpPct,
            jp: jpPct
          });
          console.log(`[Historial] Punto añadido: ${progress}% (FP: ${fpPct}%, JP: ${jpPct}%)`);
        }
      }
    }
  } catch (err) {
    console.error("[Historial] Error al actualizar:", err.message);
  }
}

async function updateRegionalCache(runInParallel = false) {
  console.log(`Iniciando actualización de caché regional (paralelo: ${runInParallel})...`);
  const tempRegiones = [];
  
  const fetchUbigeo = async (ubigeo) => {
    try {
      const urlTotals = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/totales?idEleccion=10&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&idUbigeoDepartamento=${ubigeo}`;
      const urlPart = `https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/participantes?idEleccion=10&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&idUbigeoDepartamento=${ubigeo}`;
      
      const [resTotals, resPart] = await Promise.all([
        fetch(urlTotals, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(3000) }),
        fetch(urlPart, { headers: ONPE_HEADERS, signal: AbortSignal.timeout(3000) })
      ]);
      
      if (resTotals.status === 204 || resPart.status === 204) {
        return null;
      }
      
      if (!resTotals.ok || !resPart.ok) {
        throw new Error(`ONPE status error: ${resTotals.status}/${resPart.status}`);
      }
      
      const dataTotals = await resTotals.json();
      const dataPart = await resPart.json();
      
      if (dataTotals.success && dataPart.success && dataTotals.data && dataPart.data) {
        const fpData = dataPart.data.find(p => p.nombreAgrupacionPolitica && p.nombreAgrupacionPolitica.includes('FUERZA POPULAR'));
        const jpData = dataPart.data.find(p => p.nombreAgrupacionPolitica && p.nombreAgrupacionPolitica.includes('JUNTOS POR EL PERÚ'));
        
        return {
          ubigeo: ubigeo,
          actas_contabilizadas: dataTotals.data.contabilizadas || 0,
          actas_total: dataTotals.data.totalActas || 0,
          candidatos: {
            A: { votos: fpData ? fpData.totalVotosValidos : 0 },
            B: { votos: jpData ? jpData.totalVotosValidos : 0 }
          }
        };
      }
    } catch (err) {
      console.warn(`[Macro-Regiones] Error al actualizar ubigeo ${ubigeo}:`, err.message);
      // Reutilizar la caché anterior si existe para evitar huecos en caso de fallos temporales
      const prevDepto = cachedRegiones.find(r => r.ubigeo === ubigeo);
      if (prevDepto) {
        return prevDepto;
      }
    }
    return null;
  };

  if (runInParallel) {
    const results = await Promise.all(DEPARTAMENTOS_UBIGEOS.map(ubigeo => fetchUbigeo(ubigeo)));
    for (const res of results) {
      if (res) tempRegiones.push(res);
    }
  } else {
    for (const ubigeo of DEPARTAMENTOS_UBIGEOS) {
      const res = await fetchUbigeo(ubigeo);
      if (res) tempRegiones.push(res);
      // Retraso de cortesía de 200ms para evitar rate-limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  if (tempRegiones.length > 0) {
    cachedRegiones = tempRegiones;
    console.log(`[Macro-Regiones] Caché regional actualizada. ${cachedRegiones.length} regiones cargadas.`);
  } else {
    console.warn("[Macro-Regiones] Falló la carga de regiones; se mantiene la caché previa.");
  }
}

// Función auxiliar para inicializar/actualizar caché e historial bajo demanda (Stale-While-Revalidate)
async function getOrUpdateCache() {
  const now = Date.now();
  
  const needsRegional = cachedRegiones.length === 0 || (now - lastCacheUpdate > 180000);
  const needsHistory = globalHistory.length === 0 || (now - lastHistoryUpdate > 120000);
  
  const backgroundPromises = [];
  const blockingPromises = [];
  
  if (needsRegional) {
    if (!cacheUpdatePromise) {
      const runInParallel = true;
      cacheUpdatePromise = updateRegionalCache(runInParallel).then(() => {
        lastCacheUpdate = Date.now();
        cacheUpdatePromise = null;
      }).catch(err => {
        cacheUpdatePromise = null;
        console.error("Error actualizando cache regional:", err.message);
      });
    }
    // Solo bloqueamos el request si la caché está completamente vacía (carga inicial en frío)
    if (cachedRegiones.length === 0) {
      blockingPromises.push(cacheUpdatePromise);
    } else {
      backgroundPromises.push(cacheUpdatePromise);
    }
  }
  
  if (needsHistory) {
    if (!historyUpdatePromise) {
      historyUpdatePromise = updateGlobalHistory().then(() => {
        lastHistoryUpdate = Date.now();
        historyUpdatePromise = null;
      }).catch(err => {
        historyUpdatePromise = null;
        console.error("Error actualizando historial global:", err.message);
      });
    }
    // Solo bloqueamos el request si el historial está completamente vacío (carga inicial en frío)
    if (globalHistory.length === 0) {
      blockingPromises.push(historyUpdatePromise);
    } else {
      backgroundPromises.push(historyUpdatePromise);
    }
  }
  
  // Si la caché o el historial están vacíos, bloqueamos y esperamos a que carguen (reducido a máx 3s por timeout de fetch).
  // Si ya tiene datos previos, respondemos inmediatamente con datos viejos (stale) mientras refrescamos en background.
  if (blockingPromises.length > 0) {
    await Promise.all(blockingPromises);
  }
}

// Arrancar servidor (solo si no estamos en Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado correctamente.`);
    console.log(`Accede localmente en: http://localhost:${PORT}`);
    
    // Iniciar bucle de caché y de historial en segundo plano
    setTimeout(async () => {
      await updateGlobalHistory();
      lastHistoryUpdate = Date.now();
      await updateRegionalCache(true);
      lastCacheUpdate = Date.now();
    }, 1000); // Ejecutar primer ciclo después de 1s
    
    setInterval(async () => {
      await updateGlobalHistory();
      lastHistoryUpdate = Date.now();
    }, 120000); // Refrescar historial cada 2 minutos
    
    setInterval(async () => {
      await updateRegionalCache(true);
      lastCacheUpdate = Date.now();
    }, 180000); // Refrescar regional cada 3 minutos
  });
}

// Exportar la aplicación para Vercel
module.exports = app;
