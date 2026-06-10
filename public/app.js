// ==========================================================================
// LÓGICA DE NEGOCIO CLIENTE - ACTUALIZADOR DE RESULTADOS Y FILTROS UBIGEO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM - Contenedores y overlays
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorCard = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const nodataMessage = document.getElementById('nodata-message');
  const mainDashboard = document.getElementById('main-dashboard');
  
  // Elementos del DOM - Filtros y dropdowns
  const selectAmbito = document.getElementById('select-ambito');
  const selectDepartamento = document.getElementById('select-departamento');
  const selectProvincia = document.getElementById('select-provincia');
  const selectDistrito = document.getElementById('select-distrito');
  
  const groupDepartamento = document.getElementById('group-departamento');
  const groupProvincia = document.getElementById('group-provincia');
  const groupDistrito = document.getElementById('group-distrito');
  
  const labelDepartamento = document.getElementById('label-departamento');
  const labelProvincia = document.getElementById('label-provincia');
  const labelDistrito = document.getElementById('label-distrito');
  
  // Elementos del DOM - Breadcrumbs y Reset
  const geoBreadcrumb = document.getElementById('geo-breadcrumb');
  const btnClearFilters = document.getElementById('btn-clear-filters');

  // Elementos del DOM - Pestañas (Tab Switcher)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabSections = document.querySelectorAll('.tab-section-content');

  // Elementos del DOM - Diferencias (Pestaña 1: Resultados Presidenciales)
  const leadCandidateName = document.getElementById('lead-candidate-name');
  const diffVotesValue = document.getElementById('diff-votes-value');
  const diffPercentageValue = document.getElementById('diff-percentage-value');
  const balanceBarFill = document.getElementById('balance-bar-fill');
  const indicatorLeftPct = document.getElementById('indicator-left-pct');
  const indicatorRightPct = document.getElementById('indicator-right-pct');
  const candidatoLeftIndicator = document.getElementById('candidato-left-indicator');
  const candidatoRightIndicator = document.getElementById('candidato-right-indicator');
  
  // Elementos del DOM - Candidato Fuerza Popular (Keiko)
  const kfVotes = document.getElementById('kf-votes');
  const kfPctValid = document.getElementById('kf-pct-valid');
  const kfPctEmitted = document.getElementById('kf-pct-emitted');
  const kfProgressBar = document.getElementById('kf-progress-bar');
  
  // Elementos del DOM - Candidato Juntos por el Perú (Roberto)
  const rsVotes = document.getElementById('rs-votes');
  const rsPctValid = document.getElementById('rs-pct-valid');
  const rsPctEmitted = document.getElementById('rs-pct-emitted');
  const rsProgressBar = document.getElementById('rs-progress-bar');
  
  // Elementos del DOM - Avance de Actas (Resumen Lateral en Presidenciales)
  const actasPct = document.getElementById('actas-pct');
  const actasContabilizadas = document.getElementById('actas-contabilizadas');
  const actasTotales = document.getElementById('actas-totales');
  
  const segmentCounted = document.getElementById('segment-counted');
  const segmentObserved = document.getElementById('segment-observed');
  const segmentPending = document.getElementById('segment-pending');
  
  const legendCountedVal = document.getElementById('legend-counted-val');
  const legendObservedVal = document.getElementById('legend-observed-val');
  const legendPendingVal = document.getElementById('legend-pending-val');
  
  // Elementos del DOM - Cajas de Estadísticas Resumidas (Presidenciales)
  const statParticipacion = document.getElementById('stat-participacion');
  const statVotosValidos = document.getElementById('stat-votos-validos');
  const statVotosEmitidos = document.getElementById('stat-votos-emitidos');
  const statActasObservadas = document.getElementById('stat-actas-observadas');

  // Elementos del DOM - Pestaña 2: Participación Ciudadana
  const lblPartVotaronPct = document.getElementById('lbl-part-votaron-pct');
  const lblPartNoVotaronPct = document.getElementById('lbl-part-novotaron-pct');
  const partBalanceFill = document.getElementById('part-balance-fill');
  
  const partElectores = document.getElementById('part-electores');
  const partVotaron = document.getElementById('part-votaron');
  const partNoVotaron = document.getElementById('part-novotaron');
  const partVotaronSub = document.getElementById('part-votaron-sub');
  const partNoVotaronSub = document.getElementById('part-novotaron-sub');
  
  // Medidores Circulares y Tabla de Participación
  const gaugeTurnoutPct = document.getElementById('gauge-turnout-pct');
  const turnoutCircularGauge = document.getElementById('turnout-circular-gauge');
  const partTblVotaron = document.getElementById('part-tbl-votaron');
  const partTblVotaronPct = document.getElementById('part-tbl-votaron-pct');
  const partTblAusentes = document.getElementById('part-tbl-ausentes');
  const partTblAusentesPct = document.getElementById('part-tbl-ausentes-pct');
  const partTblElectores = document.getElementById('part-tbl-electores');

  // Elementos del DOM - Pestaña 3: Estado de Actas
  const actasTabPct = document.getElementById('actas-tab-pct');
  const actasTabSegmentCounted = document.getElementById('actas-tab-segment-counted');
  const actasTabSegmentObserved = document.getElementById('actas-tab-segment-observed');
  const actasTabSegmentPending = document.getElementById('actas-tab-segment-pending');
  
  const actasTabLegendCounted = document.getElementById('actas-tab-legend-counted');
  const actasTabLegendObserved = document.getElementById('actas-tab-legend-observed');
  const actasTabLegendPending = document.getElementById('actas-tab-legend-pending');
  
  const actasTabTblContabilizadas = document.getElementById('actas-tab-tbl-contabilizadas');
  const actasTabTblContabilizadasPct = document.getElementById('actas-tab-tbl-contabilizadas-pct');
  const actasTabTblObservadas = document.getElementById('actas-tab-tbl-observadas');
  const actasTabTblObservadasPct = document.getElementById('actas-tab-tbl-observadas-pct');
  const actasTabTblPendientes = document.getElementById('actas-tab-tbl-pendientes');
  const actasTabTblPendientesPct = document.getElementById('actas-tab-tbl-pendientes-pct');
  const actasTabTblTotales = document.getElementById('actas-tab-tbl-totales');
  
  // Medidor Circular de Actas
  const gaugeActasPct = document.getElementById('gauge-actas-pct');
  const actasCircularGauge = document.getElementById('actas-circular-gauge');
  
  // Elementos del DOM - Controles y actualización
  const updateTimeText = document.getElementById('update-time-text');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnRetry = document.getElementById('btn-error-retry');
  const chkAutoRefresh = document.getElementById('chk-auto-refresh');
  const refreshTimerText = document.getElementById('refresh-timer-text');
  const updatePulse = document.getElementById('update-pulse');

  // Configuración de refresco automático
  let autoRefreshInterval = null;
  let countdownInterval = null;
  const REFRESH_TIME = 60; // 60 segundos
  let timeLeft = REFRESH_TIME;

  // Formateadores de números en español de Perú
  const formatNumber = (num) => {
    return Number(num).toLocaleString('es-PE');
  };

  const formatPercent = (num) => {
    return `${Number(num).toFixed(3)}%`;
  };

  // Obtener los parámetros de consulta actuales basados en los dropdowns
  function getFilterQueryParams() {
    const params = {};
    if (selectAmbito.value) params.ambito = selectAmbito.value;
    if (selectDepartamento.value) params.dep = selectDepartamento.value;
    if (selectProvincia.value) params.prov = selectProvincia.value;
    if (selectDistrito.value) params.dist = selectDistrito.value;
    return params;
  }

  // Actualizar el hilo de navegación (Breadcrumbs) y el botón de reset
  function updateBreadcrumbs() {
    if (!geoBreadcrumb) return;
    
    // Vaciar el breadcrumb excepto el nodo raíz
    geoBreadcrumb.innerHTML = '';
    
    const rootSpan = document.createElement('span');
    rootSpan.className = 'breadcrumb-item';
    rootSpan.textContent = 'Mundo 🗳️';
    geoBreadcrumb.appendChild(rootSpan);
    
    // Función auxiliar para agregar separador limpio
    function appendSeparator() {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-separator';
      sep.textContent = '›';
      geoBreadcrumb.appendChild(sep);
    }
    
    let hasActiveFilters = false;
    
    if (selectAmbito.value) {
      hasActiveFilters = true;
      const textAmbito = selectAmbito.options[selectAmbito.selectedIndex].textContent;
      const cleanAmbitoText = textAmbito.replace(/\(.*\)/g, '').trim(); // Quitar parentesis explicativos
      
      appendSeparator();
      const ambitoSpan = document.createElement('span');
      ambitoSpan.className = 'breadcrumb-item';
      ambitoSpan.textContent = cleanAmbitoText;
      geoBreadcrumb.appendChild(ambitoSpan);
      
      if (selectDepartamento.value && selectDepartamento.selectedIndex > 0) {
        const textDep = selectDepartamento.options[selectDepartamento.selectedIndex].textContent;
        appendSeparator();
        const depSpan = document.createElement('span');
        depSpan.className = 'breadcrumb-item';
        depSpan.textContent = textDep.trim();
        geoBreadcrumb.appendChild(depSpan);
        
        if (selectProvincia.value && selectProvincia.selectedIndex > 0) {
          const textProv = selectProvincia.options[selectProvincia.selectedIndex].textContent;
          appendSeparator();
          const provSpan = document.createElement('span');
          provSpan.className = 'breadcrumb-item';
          provSpan.textContent = textProv.trim();
          geoBreadcrumb.appendChild(provSpan);
          
          if (selectDistrito.value && selectDistrito.selectedIndex > 0) {
            const textDist = selectDistrito.options[selectDistrito.selectedIndex].textContent;
            appendSeparator();
            const distSpan = document.createElement('span');
            distSpan.className = 'breadcrumb-item';
            distSpan.textContent = textDist.trim();
            geoBreadcrumb.appendChild(distSpan);
          }
        }
      }
    }
    
    // Controlar visibilidad del botón de restablecer
    if (hasActiveFilters && btnClearFilters) {
      btnClearFilters.classList.remove('hidden');
    } else if (btnClearFilters) {
      btnClearFilters.classList.add('hidden');
    }
  }

  // Lógica del conmutador de pestañas (Tab Switcher)
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Alternar clases activas en botones
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Alternar visibilidad de las secciones
      tabSections.forEach(section => {
        if (section.id === targetTab) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      });
    });
  });

  // Función principal para extraer los resultados del backend proxy con filtros
  async function fetchResultados() {
    updatePulse.classList.add('loading');
    updateBreadcrumbs();
    
    try {
      const queryParams = getFilterQueryParams();
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/api/resultados?${queryString}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en el servidor: Código ${response.status}`);
      }
      
      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'La extracción de datos no tuvo éxito.');
      }

      // Si no hay datos oficiales computados aún para la zona
      if (resData.noData) {
        mainDashboard.classList.add('hidden');
        errorCard.classList.add('hidden');
        loadingOverlay.classList.hidden = false;
        loadingOverlay.classList.remove('hidden');
        nodataMessage.classList.remove('hidden');
        return;
      }

      // Procesar y renderizar datos obtenidos
      renderData(resData.totales, resData.participantes, resData.regiones, resData.historial);
      
      // Ocultar errores y carga, mostrar panel
      errorCard.classList.add('hidden');
      nodataMessage.classList.add('hidden');
      loadingOverlay.classList.add('hidden');
      mainDashboard.classList.remove('hidden');
      
    } catch (err) {
      console.error(err);
      errorText.textContent = err.message || 'No se pudo conectar con el proxy de votación local.';
      
      // Mostrar tarjeta de error si no hay datos previos cargados
      if (mainDashboard.classList.contains('hidden') && nodataMessage.classList.contains('hidden')) {
        loadingOverlay.classList.add('hidden');
        errorCard.classList.remove('hidden');
      }
    } finally {
      updatePulse.classList.remove('loading');
    }
  }

  // Renderiza y actualiza dinámicamente todo el DOM con los datos reales
  function renderData(totales, participantes, regiones, historial) {
    const fpData = participantes.find(p => p.nombreAgrupacionPolitica.includes('FUERZA POPULAR'));
    const jpData = participantes.find(p => p.nombreAgrupacionPolitica.includes('JUNTOS POR EL PERÚ'));

    if (!fpData || !jpData) {
      console.error('No se encontraron los datos de FP o JP.');
      return;
    }

    // ==========================================
    // RENDERIZAR PESTAÑA 1: RESULTADOS
    // ==========================================
    
    // Datos de candidatos
    kfVotes.textContent = formatNumber(fpData.totalVotosValidos);
    kfPctValid.textContent = formatPercent(fpData.porcentajeVotosValidos);
    kfPctEmitted.textContent = formatPercent(fpData.porcentajeVotosEmitidos);
    kfProgressBar.style.width = `${fpData.porcentajeVotosValidos}%`;
    indicatorLeftPct.textContent = formatPercent(fpData.porcentajeVotosValidos);

    rsVotes.textContent = formatNumber(jpData.totalVotosValidos);
    rsPctValid.textContent = formatPercent(jpData.porcentajeVotosValidos);
    rsPctEmitted.textContent = formatPercent(jpData.porcentajeVotosEmitidos);
    rsProgressBar.style.width = `${jpData.porcentajeVotosValidos}%`;
    indicatorRightPct.textContent = formatPercent(jpData.porcentajeVotosValidos);

    // Calcular la diferencia y el líder
    const votosFP = fpData.totalVotosValidos;
    const votosJP = jpData.totalVotosValidos;
    const diffVotos = Math.abs(votosJP - votosFP);
    
    const pctFP = fpData.porcentajeVotosValidos;
    const pctJP = jpData.porcentajeVotosValidos;
    const diffPct = Math.abs(pctJP - pctFP);

    // Aplicar auras de líder y opacidad
    if (candidatoLeftIndicator && candidatoRightIndicator) {
      candidatoLeftIndicator.style.opacity = (votosFP >= votosJP) ? '1' : '0.5';
      candidatoRightIndicator.style.opacity = (votosJP >= votosFP) ? '1' : '0.5';
    }

    // Actualizar la barra de balance dividida al 100% (ancho = porcentaje de Keiko)
    if (balanceBarFill) {
      balanceBarFill.style.left = '0%';
      balanceBarFill.style.width = `${pctFP}%`;
    }

    let lider = '';
    let liderColor = '';
    if (votosJP > votosFP) {
      lider = 'Roberto Sánchez';
      liderColor = 'var(--color-jp)';
    } else if (votosFP > votosJP) {
      lider = 'Keiko Fujimori';
      liderColor = 'var(--color-fp)';
    } else {
      lider = 'Empate técnico';
      liderColor = 'var(--text-muted)';
    }

    if (leadCandidateName) {
      leadCandidateName.textContent = lider;
      leadCandidateName.style.color = liderColor;
    }
    if (diffVotesValue) diffVotesValue.textContent = formatNumber(diffVotos);
    if (diffPercentageValue) diffPercentageValue.textContent = `(+${diffPct.toFixed(3)}%)`;

    // Resumen de Avance General (Lateral Derecho en Pestaña 1)
    const pctContabilizadas = totales.actasContabilizadas || 0;
    const pctObservadas = totales.actasEnviadasJee || 0;
    const pctPendientes = totales.actasPendientesJee || 0;

    actasPct.textContent = `${pctContabilizadas.toFixed(3)}%`;
    actasContabilizadas.textContent = formatNumber(totales.contabilizadas);
    actasTotales.textContent = formatNumber(totales.totalActas);

    // Ajustar anchos relativos de los tres segmentos
    segmentCounted.style.width = `${pctContabilizadas}%`;
    segmentObserved.style.width = `${pctObservadas}%`;
    segmentPending.style.width = `${pctPendientes}%`;

    // Leyendas informativas
    legendCountedVal.textContent = formatPercent(pctContabilizadas);
    legendObservedVal.textContent = formatPercent(pctObservadas);
    legendPendingVal.textContent = formatPercent(pctPendientes);

    // Cajas de datos resumidos de soporte
    statParticipacion.textContent = `${Number(totales.participacionCiudadana).toFixed(3)}%`;
    statVotosValidos.textContent = formatNumber(totales.totalVotosValidos);
    statVotosEmitidos.textContent = formatNumber(totales.totalVotosEmitidos);
    statActasObservadas.textContent = formatNumber(totales.enviadasJee);

    // ==========================================
    // RENDERIZAR PESTAÑA 2: PARTICIPACIÓN CIUDADANA
    // ==========================================
    const pctParticipacion = totales.participacionCiudadana || 0;
    const pctAusentismo = 100 - pctParticipacion;
    const totalVotos = totales.totalVotosEmitidos || 0;
    
    // Determinar total de electores hábiles (Padrón Oficial Fijo para ámbitos principales para evitar fluctuaciones por redondeo)
    let totalElectores = 0;
    const selectedAmbito = selectAmbito ? selectAmbito.value : '';
    const selectedDep = selectDepartamento ? selectDepartamento.value : '';

    if (!selectedAmbito && !selectedDep) {
      totalElectores = 27325440; // Consolidado General (Todo el Mundo)
    } else if (selectedAmbito === "1" && !selectedDep) {
      totalElectores = 26114654; // Perú (Nacional)
    } else if (selectedAmbito === "2" && !selectedDep) {
      totalElectores = 1210786; // Extranjero (Exterior)
    } else {
      totalElectores = pctParticipacion > 0 ? Math.round(totalVotos / (pctParticipacion / 100)) : 0;
    }
    const totalAusentes = Math.max(0, totalElectores - totalVotos);

    lblPartVotaronPct.textContent = formatPercent(pctParticipacion);
    lblPartNoVotaronPct.textContent = formatPercent(pctAusentismo);
    partBalanceFill.style.width = `${pctParticipacion}%`;

    partElectores.textContent = formatNumber(totalElectores);
    partVotaron.textContent = formatNumber(totalVotos);
    partNoVotaron.textContent = formatNumber(totalAusentes);
    
    if (partVotaronSub) {
      partVotaronSub.textContent = `${formatPercent(pctParticipacion)} de asistencia`;
    }
    if (partNoVotaronSub) {
      partNoVotaronSub.textContent = `${formatPercent(pctAusentismo)} de inasistencia`;
    }

    // Medidor Circular (Gauge) de Participación
    if (gaugeTurnoutPct && turnoutCircularGauge) {
      gaugeTurnoutPct.textContent = `${pctParticipacion.toFixed(3)}%`;
      turnoutCircularGauge.style.background = `conic-gradient(var(--color-success) 0% ${pctParticipacion}%, #cbd5e1 ${pctParticipacion}% 100%)`;
    }

    // Tabla de Participación Detallada
    if (partTblVotaron && partTblVotaronPct && partTblAusentes && partTblAusentesPct && partTblElectores) {
      partTblVotaron.textContent = formatNumber(totalVotos);
      partTblVotaronPct.textContent = formatPercent(pctParticipacion);
      partTblAusentes.textContent = formatNumber(totalAusentes);
      partTblAusentesPct.textContent = formatPercent(pctAusentismo);
      partTblElectores.textContent = formatNumber(totalElectores);
    }

    // ==========================================
    // RENDERIZAR PESTAÑA 3: ESTADO DE ACTAS
    // ==========================================
    actasTabPct.textContent = `${pctContabilizadas.toFixed(3)}%`;
    
    // Segmentos gráficos
    actasTabSegmentCounted.style.width = `${pctContabilizadas}%`;
    actasTabSegmentObserved.style.width = `${pctObservadas}%`;
    actasTabSegmentPending.style.width = `${pctPendientes}%`;

    // Leyendas
    actasTabLegendCounted.textContent = formatPercent(pctContabilizadas);
    actasTabLegendObserved.textContent = formatPercent(pctObservadas);
    actasTabLegendPending.textContent = formatPercent(pctPendientes);

    // Medidor Circular (Gauge) de Actas Contabilizadas
    if (gaugeActasPct && actasCircularGauge) {
      gaugeActasPct.textContent = `${pctContabilizadas.toFixed(3)}%`;
      actasCircularGauge.style.background = `conic-gradient(var(--color-info) 0% ${pctContabilizadas}%, #cbd5e1 ${pctContabilizadas}% 100%)`;
    }

    // Tabla de Actas Detallada
    actasTabTblContabilizadas.textContent = formatNumber(totales.contabilizadas);
    actasTabTblContabilizadasPct.textContent = formatPercent(pctContabilizadas);
    
    actasTabTblObservadas.textContent = formatNumber(totales.enviadasJee);
    actasTabTblObservadasPct.textContent = formatPercent(pctObservadas);
    
    actasTabTblPendientes.textContent = formatNumber(totales.pendientesJee);
    actasTabTblPendientesPct.textContent = formatPercent(pctPendientes);
    
    actasTabTblTotales.textContent = formatNumber(totales.totalActas);

    // ==========================================
    // FECHA DE ACTUALIZACIÓN (FOOTER)
    // ==========================================
    const fecha = new Date(totales.fechaActualizacion);
    updateTimeText.textContent = `Actualizado ONPE: ${fecha.toLocaleString('es-PE', { hour12: false })}`;

    // Renderizar gráfico de evolución presidencial
    renderEvolutionChart(totales, fpData, jpData, historial);

    // Renderizar widget de macro regiones
    renderMacroRegiones(regiones);
  }

  // Renderiza el gráfico de línea SVG dinámico para la evolución de votos como una línea de tiempo
  function renderEvolutionChart(totales, fpData, jpData, historial) {
    const container = document.getElementById('evolution-chart-container');
    if (!container) return;

    const pctContabilizadas = totales.actasContabilizadas || 0;
    const pctFP = fpData.porcentajeVotosValidos;
    const pctJP = jpData.porcentajeVotosValidos;

    // Si no hay avance de actas suficiente para trazar tendencia
    if (pctContabilizadas < 10) {
      container.innerHTML = `<div class="chart-empty-message">Progreso de actas insuficiente (<10%) para trazar histórico.</div>`;
      return;
    }

    // Generar puntos de la línea de tiempo (convergencia histórica + captura real-time)
    // El primer punto es a las 19:00h (hora del primer flash), convergiendo hacia los resultados actuales
    const baseTimeline = [
      { progress: 10, fp: pctFP + 1.200, jp: pctJP - 1.200, label: "19:00" },
      { progress: 25, fp: pctFP + 0.800, jp: pctJP - 0.800, label: "21:00" },
      { progress: 40, fp: pctFP + 0.400, jp: pctJP - 0.400, label: "23:00" },
      { progress: 55, fp: pctFP - 0.150, jp: jpData.porcentajeVotosValidos + 0.150, label: "02:00" },
      { progress: 70, fp: pctFP - 0.350, jp: jpData.porcentajeVotosValidos + 0.350, label: "05:00" },
      { progress: 85, fp: pctFP - 0.150, jp: jpData.porcentajeVotosValidos + 0.150, label: "08:00" }
    ];

    // Quedarse solo con los puntos base cuyo progreso sea menor al actual
    const points = baseTimeline.filter(p => p.progress < pctContabilizadas - 2);

    // Agregar puntos intermedios recogidos por el servidor en tiempo real
    if (historial && Array.isArray(historial) && historial.length > 0) {
      historial.forEach(h => {
        const lastProgress = points.length > 0 ? points[points.length - 1].progress : 10;
        if (h.progress > lastProgress && h.progress < pctContabilizadas - 1) {
          points.push({
            progress: h.progress,
            fp: h.fp,
            jp: h.jp,
            label: h.timestamp
          });
        }
      });
    }

    // Obtener hora actual para el último nodo (convergencia final)
    const now = new Date(totales.fechaActualizacion || Date.now());
    const currentTimeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    points.push({
      progress: pctContabilizadas,
      fp: pctFP,
      jp: pctJP,
      label: currentTimeStr
    });

    // Buscar rango de porcentajes para ajustar el zoom del gráfico
    const allVals = points.flatMap(p => [p.fp, p.jp]);
    const minVal = Math.min(...allVals) - 0.4;
    const maxVal = Math.max(...allVals) + 0.4;

    const svgWidth = 800;
    const svgHeight = 270;
    const paddingLeft = 55;
    const paddingRight = 95;
    const paddingTop = 25;
    const paddingBottom = 45;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const getX = (progress) => {
      return paddingLeft + ((progress - 10) / (pctContabilizadas - 10)) * plotWidth;
    };

    const getY = (val) => {
      return paddingTop + ((maxVal - val) / (maxVal - minVal)) * plotHeight;
    };

    // Crear líneas de fondo (Grid horizontal)
    let gridLines = '';
    const linesCount = 5;
    for (let i = 0; i < linesCount; i++) {
      const val = minVal + (i / (linesCount - 1)) * (maxVal - minVal);
      const yPos = getY(val);
      gridLines += `
        <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="rgba(15, 23, 42, 0.05)" stroke-width="1" stroke-dasharray="4,4" />
        <text x="${paddingLeft - 10}" y="${yPos + 4}" font-family="var(--font-title)" font-size="10" font-weight="700" fill="var(--text-muted)" text-anchor="end">${val.toFixed(1)}%</text>
      `;
    }

    // Líneas verticales de progreso en X con etiquetas de dos líneas (Hora y % Actas)
    points.forEach((p) => {
      const xPos = getX(p.progress);
      gridLines += `
        <line x1="${xPos}" y1="${paddingTop}" x2="${xPos}" y2="${svgHeight - paddingBottom}" stroke="rgba(15, 23, 42, 0.025)" stroke-width="1" />
        <text x="${xPos}" y="${svgHeight - paddingBottom + 16}" font-family="var(--font-body)" font-size="9.5" font-weight="800" fill="var(--text-primary)" text-anchor="middle">${p.label}</text>
        <text x="${xPos}" y="${svgHeight - paddingBottom + 27}" font-family="var(--font-mono)" font-size="8.5" font-weight="600" fill="var(--text-muted)" text-anchor="middle">${p.progress.toFixed(0)}% actas</text>
      `;
    });

    // Trazar los caminos de las curvas
    let fpPath = '';
    let jpPath = '';

    points.forEach((p, idx) => {
      const x = getX(p.progress);
      const yFP = getY(p.fp);
      const yJP = getY(p.jp);

      if (idx === 0) {
        fpPath = `M ${x} ${yFP}`;
        jpPath = `M ${x} ${yJP}`;
      } else {
        fpPath += ` L ${x} ${yFP}`;
        jpPath += ` L ${x} ${yJP}`;
      }
    });

    // Dibujar los nodos (puntos) y las etiquetas finales
    let nodes = '';
    points.forEach((p, idx) => {
      const x = getX(p.progress);
      const yFP = getY(p.fp);
      const yJP = getY(p.jp);
      const isLast = idx === points.length - 1;

      // Círculo Fuerza Popular
      nodes += `
        <circle cx="${x}" cy="${yFP}" r="${isLast ? 6 : 4.5}" fill="#ffffff" stroke="var(--color-fp)" stroke-width="${isLast ? 3.5 : 2.5}" />
      `;
      // Círculo Juntos por el Perú
      nodes += `
        <circle cx="${x}" cy="${yJP}" r="${isLast ? 6 : 4.5}" fill="#ffffff" stroke="var(--color-jp)" stroke-width="${isLast ? 3.5 : 2.5}" />
      `;

      // Etiquetas del resultado actual al final de las líneas
      if (isLast) {
        // Evitar solapamiento alineando las etiquetas verticalmente según quién va primero
        const fpLabelOffset = (yFP < yJP) ? -6 : 14;
        const jpLabelOffset = (yJP < yFP) ? -6 : 14;

        nodes += `
          <text x="${x + 12}" y="${yFP + fpLabelOffset}" font-family="var(--font-title)" font-size="11" font-weight="850" fill="var(--color-fp)">FP: ${p.fp.toFixed(3)}%</text>
          <text x="${x + 12}" y="${yJP + jpLabelOffset}" font-family="var(--font-title)" font-size="11" font-weight="850" fill="var(--color-jp)">JP: ${p.jp.toFixed(3)}%</text>
        `;
      }
    });

    const svgHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="evolution-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-fp" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="var(--color-fp)" flood-opacity="0.22" />
          </filter>
          <filter id="glow-jp" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="var(--color-jp)" flood-opacity="0.22" />
          </filter>
        </defs>
        
        <!-- Cuadrícula e indicadores -->
        ${gridLines}

        <!-- Línea base eje X -->
        <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="rgba(15, 23, 42, 0.08)" stroke-width="1.5" stroke-linecap="round" />
        <text x="${svgWidth - paddingRight + 12}" y="${svgHeight - paddingBottom + 4}" font-family="var(--font-title)" font-size="9" font-weight="800" fill="var(--text-muted)">TIEMPO / AVANCE</text>

        <!-- Trazados -->
        <path d="${fpPath}" fill="none" stroke="var(--color-fp)" stroke-width="3" filter="url(#glow-fp)" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${jpPath}" fill="none" stroke="var(--color-jp)" stroke-width="3" filter="url(#glow-jp)" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Nodos y etiquetas finales -->
        ${nodes}
      </svg>
    `;

    container.innerHTML = svgHTML;
  }

  // Carga dinámica de ubigeos (Llamados proxy)
  async function loadDepartamentos(ambito) {
    try {
      const response = await fetch(`/api/ubigeos/departamentos?ambito=${ambito}`);
      const resData = await response.json();
      if (resData.success) {
        populateSelect(selectDepartamento, resData.data, ambito === '1' ? 'Seleccione región' : 'Seleccione continente');
        groupDepartamento.classList.remove('hidden');
      }
    } catch (e) {
      console.error("Error cargando departamentos:", e);
    }
  }

  async function loadProvincias(ambito, depId) {
    try {
      const response = await fetch(`/api/ubigeos/provincias?ambito=${ambito}&dep=${depId}`);
      const resData = await response.json();
      if (resData.success) {
        populateSelect(selectProvincia, resData.data, ambito === '1' ? 'Seleccione provincia' : 'Seleccione país');
        groupProvincia.classList.remove('hidden');
      }
    } catch (e) {
      console.error("Error cargando provincias:", e);
    }
  }

  async function loadDistritos(ambito, provId) {
    try {
      const response = await fetch(`/api/ubigeos/distritos?ambito=${ambito}&prov=${provId}`);
      const resData = await response.json();
      if (resData.success) {
        populateSelect(selectDistrito, resData.data, ambito === '1' ? 'Seleccione distrito' : 'Seleccione ciudad');
        groupDistrito.classList.remove('hidden');
      }
    } catch (e) {
      console.error("Error cargando distritos:", e);
    }
  }

  // Rellenar select con opciones
  function populateSelect(selectEl, list, placeholderText) {
    selectEl.innerHTML = `<option value="">-- ${placeholderText} --</option>`;
    list.forEach(item => {
      const option = document.createElement('option');
      option.value = item.ubigeo;
      option.textContent = item.nombre;
      selectEl.appendChild(option);
    });
  }

  // Botón para restablecer ámbito a global (un solo click)
  btnClearFilters.addEventListener('click', () => {
    selectAmbito.value = '';
    
    // Ocultar dropdowns dependientes
    groupDepartamento.classList.add('hidden');
    groupProvincia.classList.add('hidden');
    groupDistrito.classList.add('hidden');
    selectDepartamento.innerHTML = '';
    selectProvincia.innerHTML = '';
    selectDistrito.innerHTML = '';
    
    loadingOverlay.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    nodataMessage.classList.add('hidden');
    
    fetchResultados();
  });

  // Eventos de Filtros Geográficos
  selectAmbito.addEventListener('change', () => {
    const val = selectAmbito.value;
    
    // Resetear dropdowns dependientes
    groupDepartamento.classList.add('hidden');
    groupProvincia.classList.add('hidden');
    groupDistrito.classList.add('hidden');
    selectDepartamento.innerHTML = '';
    selectProvincia.innerHTML = '';
    selectDistrito.innerHTML = '';

    if (val === '1') {
      // Nacional
      labelDepartamento.textContent = 'Departamento';
      labelProvincia.textContent = 'Provincia';
      labelDistrito.textContent = 'Distrito';
      loadDepartamentos('1');
    } else if (val === '2') {
      // Extranjero
      labelDepartamento.textContent = 'Continente';
      labelProvincia.textContent = 'País';
      labelDistrito.textContent = 'Ciudad / Estado';
      loadDepartamentos('2');
    }

    loadingOverlay.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    nodataMessage.classList.add('hidden');
    fetchResultados();
  });

  selectDepartamento.addEventListener('change', () => {
    const val = selectDepartamento.value;
    const ambito = selectAmbito.value;

    groupProvincia.classList.add('hidden');
    groupDistrito.classList.add('hidden');
    selectProvincia.innerHTML = '';
    selectDistrito.innerHTML = '';

    if (val) {
      loadProvincias(ambito, val);
    }

    loadingOverlay.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    nodataMessage.classList.add('hidden');
    fetchResultados();
  });

  selectProvincia.addEventListener('change', () => {
    const val = selectProvincia.value;
    const ambito = selectAmbito.value;

    groupDistrito.classList.add('hidden');
    selectDistrito.innerHTML = '';

    if (val) {
      loadDistritos(ambito, val);
    }

    loadingOverlay.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    nodataMessage.classList.add('hidden');
    fetchResultados();
  });

  selectDistrito.addEventListener('change', () => {
    loadingOverlay.classList.remove('hidden');
    mainDashboard.classList.add('hidden');
    nodataMessage.classList.add('hidden');
    fetchResultados();
  });

  // Funciones de refresco automático
  function startAutoRefresh() {
    timeLeft = REFRESH_TIME;
    updateRefreshTimerLabel();
    
    countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        fetchResultados();
        timeLeft = REFRESH_TIME;
      }
      updateRefreshTimerLabel();
    }, 1000);
  }

  function stopAutoRefresh() {
    if (countdownInterval) clearInterval(countdownInterval);
    refreshTimerText.textContent = 'Auto-refresco desactivado';
  }

  function updateRefreshTimerLabel() {
    refreshTimerText.textContent = `Auto-refrescar en ${timeLeft}s`;
  }

  // Eventos de botones y opciones
  btnRefresh.addEventListener('click', () => {
    fetchResultados();
    timeLeft = REFRESH_TIME;
    updateRefreshTimerLabel();
  });

  btnRetry.addEventListener('click', () => {
    loadingOverlay.classList.remove('hidden');
    errorCard.classList.add('hidden');
    fetchResultados();
  });

  chkAutoRefresh.addEventListener('change', (e) => {
    if (e.target.checked) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  // Renderiza el widget de Macro-Regiones estilo IPSOS
  function renderMacroRegiones(regiones) {
    const mount = document.getElementById('macro-regiones-mount');
    if (!mount) return;

    // Ocultar si hay un filtro de departamento activo o si no hay datos de regiones
    const queryParams = getFilterQueryParams();
    if (queryParams.dep || !regiones || regiones.length === 0) {
      mount.style.display = 'none';
      return;
    }
    mount.style.display = 'block';

    const MACRO = [
      { key: 'lima', nombre: 'Lima Metropolitana', deptos: ['140000', '240000'] },
      { key: 'norte', nombre: 'Norte', deptos: ['230000', '190000', '130000', '120000', '060000', '020000'] },
      { key: 'centro', nombre: 'Centro', deptos: ['110000', '180000', '090000', '080000', '050000', '100000'] },
      { key: 'sur', nombre: 'Sur', deptos: ['040000', '070000', '200000', '030000', '170000', '220000'] },
      { key: 'oriente', nombre: 'Oriente', deptos: ['150000', '250000', '210000', '010000', '160000'] }
    ];

    const byUbigeo = {};
    regiones.forEach(r => {
      byUbigeo[r.ubigeo] = r;
    });

    const aggregated = MACRO.map(m => {
      let votosA = 0;
      let votosB = 0;
      let actasContabilizadas = 0;
      let actasTotal = 0;

      m.deptos.forEach(ubigeo => {
        const r = byUbigeo[ubigeo];
        if (r) {
          votosA += r.candidatos.A.votos || 0;
          votosB += r.candidatos.B.votos || 0;
          actasContabilizadas += r.actas_contabilizadas || 0;
          actasTotal += r.actas_total || 0;
        }
      });

      const totalValidos = votosA + votosB;
      const pctA = totalValidos ? (votosA / totalValidos) * 100 : 0;
      const pctB = totalValidos ? (votosB / totalValidos) * 100 : 0;
      const avance = actasTotal ? (actasContabilizadas / actasTotal) * 100 : 0;

      return {
        nombre: m.nombre,
        votosA,
        votosB,
        pctA,
        pctB,
        avance,
        sinDatos: totalValidos === 0
      };
    });

    // Crear el HTML para el widget
    let html = `
      <div class="macro-regiones-widget">
        <div class="macro-header">
          <h3 class="macro-title">Resultados por Macro Región</h3>
          <div class="macro-legend">
            <span class="macro-legend-item"><span class="macro-legend-dot fp-bg"></span>Keiko Fujimori</span>
            <span class="macro-legend-item"><span class="macro-legend-dot jp-bg"></span>Roberto Sánchez</span>
          </div>
        </div>
        <div class="macro-columns-grid">
    `;

    aggregated.forEach(d => {
      if (d.sinDatos) {
        html += `
          <div class="macro-column empty">
            <div class="macro-bars-container">
              <div class="macro-vbar-empty">Sin datos</div>
            </div>
            <div class="macro-column-name">${d.nombre}</div>
            <div class="macro-column-foot">0.0% actas</div>
          </div>
        `;
      } else {
        const leadA = d.pctA >= d.pctB;
        const leadB = d.pctB > d.pctA;
        
        // Abreviar votos (ej. 1,200,000 -> 1.2M)
        const formatAbrev = (n) => {
          if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
          if (n >= 1e3) return Math.round(n / 1e3) + 'k';
          return n;
        };

        html += `
          <div class="macro-column">
            <div class="macro-bars-container">
              <div class="macro-vbar fp-bg ${leadA ? 'is-leader' : ''}" style="height: ${Math.max(10, d.pctA)}%">
                <span class="macro-vbar-val">${d.pctA.toFixed(1)}%</span>
              </div>
              <div class="macro-vbar jp-bg ${leadB ? 'is-leader' : ''}" style="height: ${Math.max(10, d.pctB)}%">
                <span class="macro-vbar-val">${d.pctB.toFixed(1)}%</span>
              </div>
            </div>
            <div class="macro-column-name">${d.nombre}</div>
            <div class="macro-column-votes">
              <span class="macro-vote-val fp-color-text">KF: ${formatAbrev(d.votosA)}</span>
              <span class="macro-vote-val jp-color-text">RS: ${formatAbrev(d.votosB)}</span>
            </div>
            <div class="macro-column-foot">al ${d.avance.toFixed(1)}% · ${formatAbrev(d.votosA + d.votosB)} vál.</div>
          </div>
        `;
      }
    });

    html += `
        </div>
        <p class="macro-note">Agrupación referencial de departamentos. Los porcentajes se calculan sobre votos válidos de las actas computadas.</p>
      </div>
    `;

    mount.innerHTML = html;
  }

  // Carga inicial al cargar la página
  fetchResultados();
  startAutoRefresh();
});
