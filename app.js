/**
 * ChilePlate Forensics — Application Controller & UI Orchestration
 */

const APP_STATE = {
    activeSourceTab: 'presets',
    activePresetId: 'sample_authentic_new',
    activeFilter: 'original',
    currentReport: null,
    history: [],
    mediaStream: null,
    isScanning: false,
    isAutoScanning: false,
    autoScanInterval: null
};

// DOM Elements Registry
const DOM = {
    // Tabs
    sourceTabs: document.querySelectorAll('.source-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    presetButtonsContainer: document.getElementById('presetButtonsContainer'),
    
    // CVAT Modal
    openCvatModalBtn: document.getElementById('openCvatModalBtn'),
    cvatModal: document.getElementById('cvatModal'),
    closeCvatBtn: document.getElementById('closeCvatBtn'),
    closeCvatModalFooterBtn: document.getElementById('closeCvatModalFooterBtn'),
    exportYoloAnnotationBtn: document.getElementById('exportYoloAnnotationBtn'),

    // Upload & Camera
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    startCameraBtn: document.getElementById('startCameraBtn'),
    autoScanCameraBtn: document.getElementById('autoScanCameraBtn'),
    autoScanDot: document.getElementById('autoScanDot'),
    autoScanBtnText: document.getElementById('autoScanBtnText'),
    captureCameraBtn: document.getElementById('captureCameraBtn'),
    stopCameraBtn: document.getElementById('stopCameraBtn'),
    cameraViewContainer: document.getElementById('cameraViewContainer'),
    videoFeed: document.getElementById('videoFeed'),
    cameraReticle: document.getElementById('cameraReticle'),
    cameraLiveHud: document.getElementById('cameraLiveHud'),
    hudStatusBadge: document.getElementById('hudStatusBadge'),

    // OCR Bar
    detectedPlateInput: document.getElementById('detectedPlateInput'),
    applyPlateTextBtn: document.getElementById('applyPlateTextBtn'),

    // Canvas & Viewport
    forensicCanvas: document.getElementById('forensicCanvas'),
    scannerOverlay: document.getElementById('scannerOverlay'),
    forensicFilterSelect: document.getElementById('forensicFilterSelect'),
    imgResMetric: document.getElementById('imgResMetric'),
    imgAspectMetric: document.getElementById('imgAspectMetric'),
    imgContrastMetric: document.getElementById('imgContrastMetric'),
    inferenceTimeMetric: document.getElementById('inferenceTimeMetric'),

    // Verdict Card
    verdictCard: document.getElementById('verdictCard'),
    verdictIcon: document.getElementById('verdictIcon'),
    verdictTitle: document.getElementById('verdictTitle'),
    verdictSummary: document.getElementById('verdictSummary'),
    confidencePill: document.getElementById('confidencePill'),
    authenticityScoreText: document.getElementById('authenticityScoreText'),
    authenticityProgress: document.getElementById('authenticityProgress'),

    // Plate Breakdown
    plateTextRender: document.getElementById('plateTextRender'),
    plateSealIndicator: document.getElementById('plateSealIndicator'),
    plateFormatSpec: document.getElementById('plateFormatSpec'),
    plateDvSpec: document.getElementById('plateDvSpec'),
    plateVowelsSpec: document.getElementById('plateVowelsSpec'),
    plateFontSpec: document.getElementById('plateFontSpec'),

    // Criteria & Anomalies
    criteriaList: document.getElementById('criteriaList'),
    anomaliesList: document.getElementById('anomaliesList'),
    anomalyCountBadge: document.getElementById('anomalyCountBadge'),

    // Actions & History
    reAnalyzeBtn: document.getElementById('reAnalyzeBtn'),
    exportReportBtn: document.getElementById('exportReportBtn'),
    printReportBtn: document.getElementById('printReportBtn'),
    historyTableBody: document.getElementById('historyTableBody'),
    exportHistoryCsvBtn: document.getElementById('exportHistoryCsvBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    totalInspectionsCount: document.getElementById('totalInspectionsCount'),
    toastContainer: document.getElementById('toastContainer')
};

// Canvas context reference
let canvasCtx = null;
let rawBaseImageData = null; // Unfiltered snapshot

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    canvasCtx = DOM.forensicCanvas.getContext('2d');
    loadHistory();
    renderPresetChips();
    bindEvents();

    // Load initial sample
    loadSamplePreset('sample_authentic_new');
});

// ============================================================================
// Presets Rendering & Selection
// ============================================================================
function renderPresetChips() {
    DOM.presetButtonsContainer.innerHTML = '';
    SAMPLE_CASES.forEach(sample => {
        const chip = document.createElement('div');
        chip.className = `preset-chip ${sample.id === APP_STATE.activePresetId ? 'active' : ''}`;
        chip.dataset.sampleId = sample.id;
        chip.innerHTML = `
            <div class="preset-chip-header">
                <span class="preset-chip-plate">${sample.name.split(' ')[0]}</span>
                <span class="preset-badge-tag ${sample.badgeType}">${sample.badge}</span>
            </div>
            <p class="preset-chip-desc">${sample.desc}</p>
        `;
        chip.addEventListener('click', () => loadSamplePreset(sample.id));
        DOM.presetButtonsContainer.appendChild(chip);
    });
}

async function loadSamplePreset(presetId) {
    const sample = SAMPLE_CASES.find(s => s.id === presetId);
    if (!sample) return;

    APP_STATE.activePresetId = presetId;
    document.querySelectorAll('.preset-chip').forEach(el => {
        el.classList.toggle('active', el.dataset.sampleId === presetId);
    });

    // Setup high resolution canvas (800 x 360)
    DOM.forensicCanvas.width = 720;
    DOM.forensicCanvas.height = 300;

    // Trigger visual scan
    startScanAnimation();

    // Render plate
    sample.draw(canvasCtx, DOM.forensicCanvas.width, DOM.forensicCanvas.height);
    rawBaseImageData = canvasCtx.getImageData(0, 0, DOM.forensicCanvas.width, DOM.forensicCanvas.height);

    // Apply active filter if not original
    if (APP_STATE.activeFilter !== 'original') {
        window.ChilePlateForensics.applyFilter(DOM.forensicCanvas, APP_STATE.activeFilter);
    }

    // Run Forensic Analysis
    const report = await window.ChilePlateForensics.analyzePlate(
        sample.expectedText,
        DOM.forensicCanvas,
        sample
    );

    updateUIWithReport(report);
    logInspection(report);
}

// ============================================================================
// UI Updates from Forensic Report
// ============================================================================
function updateUIWithReport(report) {
    APP_STATE.currentReport = report;
    if (DOM.detectedPlateInput) {
        DOM.detectedPlateInput.value = report.normalizedPlate || report.rawText;
    }

    // 1. Verdict Card
    DOM.verdictCard.className = 'verdict-card';
    if (report.verdict === 'AUTENTICA') {
        DOM.verdictCard.classList.add('verdict-authentic');
        DOM.verdictIcon.textContent = '🛡️';
        DOM.verdictTitle.textContent = 'PLACA AUTÉNTICA Y CONFORME';
        DOM.verdictSummary.textContent = 'La placa cumple con la normativa legal de combinaciones de caracteres, reflectancia y sellos del Registro Civil de Chile.';
        DOM.authenticityProgress.style.backgroundColor = '#10b981';
    } else if (report.verdict === 'SOSPECHOSA') {
        DOM.verdictCard.classList.add('verdict-warning');
        DOM.verdictIcon.textContent = '⚠️';
        DOM.verdictTitle.textContent = 'REVISIÓN PERICIAL REQUERIDA';
        DOM.verdictSummary.textContent = 'Se detectaron discrepancias leves en trazos o parámetros que requieren inspección táctil y de reflectancia bajo luz UV.';
        DOM.authenticityProgress.style.backgroundColor = '#f59e0b';
    } else {
        DOM.verdictCard.classList.add('verdict-alert');
        DOM.verdictIcon.textContent = '🚨';
        DOM.verdictTitle.textContent = 'ALERTA: PATENTE ADULTERADA / FALSIFICADA';
        DOM.verdictSummary.textContent = 'Se detectaron alteraciones deliberadas de caracteres con cinta adhesiva, pintura o violación a la ley de combinaciones.';
        DOM.authenticityProgress.style.backgroundColor = '#ef4444';
    }

    DOM.confidencePill.textContent = `Confianza: ${report.confidence}%`;
    DOM.authenticityScoreText.textContent = `${report.authenticityScore}%`;
    DOM.authenticityProgress.style.width = `${report.authenticityScore}%`;

    // 2. Plate Display
    DOM.plateTextRender.textContent = report.formattedDisplay;
    const hasSealCrit = report.criteria.find(c => c.id === 'official_seal');
    DOM.plateSealIndicator.style.opacity = hasSealCrit && hasSealCrit.status === 'PASS' ? '1' : '0.25';

    // 3. Specs Grid
    const FORMAT_LABELS = {
        'FORMATO_2026_5L1D':         'Nuevo 2026 — 5L+1D (D.S. Nº 53)',
        'FORMATO_2026_MOTO_4L1D':    'Moto 2026 — 4L+1D (D.S. Nº 53)',
        'FORMATO_2007_NUEVO':        'Vigente 2007+ — 4L+2D',
        'FORMATO_MOTO_3L2D':         'Moto Vigente — 3L+2D',
        'FORMATO_1985_ANTIGUO':      'Histórico 1985-2007',
        'FORMATO_2026_ILEGAL':       '❌ 2026 Ilegal (Vocales/Ñ/Q)',
        'FORMATO_MOTO_2026_ILEGAL':  '❌ Moto 2026 Ilegal',
        'FORMATO_2007_ILEGAL':       '❌ 2007+ Ilegal (Vocales/Ñ/Q)',
        'FORMATO_MOTO_ACTUAL_ILEGAL':'❌ Moto Ilegal',
    };
    DOM.plateFormatSpec.textContent = FORMAT_LABELS[report.formatType] || 'Desconocido / Inválido';
    DOM.plateDvSpec.textContent = report.modulo11?.expectedDv || '--';
    
    const syntaxCrit = report.criteria.find(c => c.id === 'syntax_legality');
    DOM.plateVowelsSpec.textContent = syntaxCrit && syntaxCrit.status === 'PASS' ? 'Conforme (Sin Vocales)' : 'INFRINGE NORMA';
    
    const fontCrit = report.criteria.find(c => c.id === 'font_geometry');
    DOM.plateFontSpec.textContent = fontCrit && fontCrit.status === 'PASS' ? 'Troquelado Oficial' : 'Genérica / Plástica';

    // 4. Viewport Metrics
    DOM.imgResMetric.textContent = report.metrics.resolution;
    DOM.imgAspectMetric.textContent = report.metrics.aspectRatio;
    DOM.imgContrastMetric.textContent = report.metrics.contrastRatio;
    DOM.inferenceTimeMetric.textContent = `${report.metrics.inferenceTimeMs} ms`;

    // 5. Criteria Checklist
    DOM.criteriaList.innerHTML = '';
    report.criteria.forEach(crit => {
        const item = document.createElement('div');
        const isPass = crit.status === 'PASS';
        item.className = `criterion-item ${isPass ? 'pass' : 'fail'}`;
        item.innerHTML = `
            <div class="crit-name-group">
                <span>${isPass ? '✅' : '❌'}</span>
                <div>
                    <strong>${crit.name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${crit.detail}</div>
                </div>
            </div>
            <span class="crit-status-tag ${isPass ? 'tag-pass' : 'tag-fail'}">${isPass ? 'CONFORME' : 'FALLO'}</span>
        `;
        DOM.criteriaList.appendChild(item);
    });

    // 6. Anomalies List
    DOM.anomaliesList.innerHTML = '';
    if (report.anomalies.length === 0) {
        DOM.anomalyCountBadge.textContent = '0 detectadas';
        DOM.anomalyCountBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        DOM.anomalyCountBadge.style.color = '#34d399';
        DOM.anomalyCountBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        DOM.anomaliesList.innerHTML = '<li class="empty-state">No se registraron anomalías ni evidencias de alteración en la placa.</li>';
    } else {
        DOM.anomalyCountBadge.textContent = `${report.anomalies.length} detectada${report.anomalies.length > 1 ? 's' : ''}`;
        DOM.anomalyCountBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        DOM.anomalyCountBadge.style.color = '#f87171';
        DOM.anomalyCountBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';

        report.anomalies.forEach(ano => {
            const li = document.createElement('li');
            li.className = 'anomaly-entry';
            li.innerHTML = `<strong>${ano.title}:</strong> ${ano.desc}`;
            DOM.anomaliesList.appendChild(li);
        });
    }

    stopScanAnimation();
}

// ============================================================================
// Laser Scan Animation
// ============================================================================
function startScanAnimation() {
    DOM.scannerOverlay.classList.add('scanning');
}

function stopScanAnimation() {
    setTimeout(() => {
        DOM.scannerOverlay.classList.remove('scanning');
    }, 600);
}

// ============================================================================
// File Upload & Image Handling
// ============================================================================
function handleFileUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Por favor selecciona un archivo de imagen válido');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
            // Draw uploaded image to canvas
            DOM.forensicCanvas.width = img.width;
            DOM.forensicCanvas.height = img.height;
            canvasCtx.drawImage(img, 0, 0);
            rawBaseImageData = canvasCtx.getImageData(0, 0, img.width, img.height);

            startScanAnimation();

            // Infer or use current detected input text without blocking prompt
            let plateText = DOM.detectedPlateInput.value.trim().toUpperCase() || 'GKTL42';
            const nameMatch = file.name.match(/[A-Za-z]{2,4}\s*\d{2,4}/);
            if (nameMatch) {
                plateText = nameMatch[0].replace(/\s/g, '').toUpperCase();
            }

            DOM.detectedPlateInput.value = plateText;

            const report = await window.ChilePlateForensics.analyzePlate(plateText, DOM.forensicCanvas, null);
            updateUIWithReport(report);
            logInspection(report);
            showToast(`Imagen inspeccionada (${report.formattedDisplay}). Puedes ajustar caracteres en la barra OCR.`);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ============================================================================
// Camera Stream & Live Auto-Scan Handling
// ============================================================================
async function startCamera() {
    try {
        APP_STATE.mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        DOM.videoFeed.srcObject = APP_STATE.mediaStream;
        DOM.cameraViewContainer.style.display = 'block';
        DOM.startCameraBtn.disabled = true;
        DOM.autoScanCameraBtn.disabled = false;
        DOM.captureCameraBtn.disabled = false;
        DOM.stopCameraBtn.disabled = false;
        showToast('Cámara iniciada. Alinea la placa patente en el recuadro.');
    } catch (err) {
        console.error('Error starting camera', err);
        showToast('No se pudo acceder a la cámara: ' + err.message);
    }
}

async function captureCameraFrame() {
    if (!APP_STATE.mediaStream || !DOM.videoFeed.videoWidth) return;

    DOM.forensicCanvas.width = DOM.videoFeed.videoWidth || 640;
    DOM.forensicCanvas.height = DOM.videoFeed.videoHeight || 480;
    canvasCtx.drawImage(DOM.videoFeed, 0, 0, DOM.forensicCanvas.width, DOM.forensicCanvas.height);
    rawBaseImageData = canvasCtx.getImageData(0, 0, DOM.forensicCanvas.width, DOM.forensicCanvas.height);

    startScanAnimation();

    const plateInput = (DOM.detectedPlateInput.value || 'GKTL42').trim().toUpperCase();
    const report = await window.ChilePlateForensics.analyzePlate(plateInput, DOM.forensicCanvas, null);
    updateUIWithReport(report);
    logInspection(report);
    updateCameraHud(report);
    showToast(`Fotograma analizado: ${report.formattedDisplay}`);
}

function toggleAutoScan() {
    if (!APP_STATE.mediaStream) {
        showToast('Inicia la cámara primero');
        return;
    }

    APP_STATE.isAutoScanning = !APP_STATE.isAutoScanning;

    if (APP_STATE.isAutoScanning) {
        DOM.autoScanDot.classList.add('active');
        DOM.autoScanBtnText.textContent = 'Detener Auto-Escaneo';
        DOM.cameraReticle.style.borderColor = '#06b6d4';
        DOM.hudStatusBadge.className = 'hud-status-badge scanning';
        DOM.hudStatusBadge.textContent = 'Escaneando en tiempo real...';

        APP_STATE.autoScanInterval = setInterval(async () => {
            if (!APP_STATE.mediaStream || !DOM.videoFeed.videoWidth) return;

            DOM.forensicCanvas.width = DOM.videoFeed.videoWidth || 640;
            DOM.forensicCanvas.height = DOM.videoFeed.videoHeight || 480;
            canvasCtx.drawImage(DOM.videoFeed, 0, 0, DOM.forensicCanvas.width, DOM.forensicCanvas.height);
            rawBaseImageData = canvasCtx.getImageData(0, 0, DOM.forensicCanvas.width, DOM.forensicCanvas.height);

            const plateInput = (DOM.detectedPlateInput.value || 'GKTL42').trim().toUpperCase();
            const report = await window.ChilePlateForensics.analyzePlate(plateInput, DOM.forensicCanvas, null);
            updateUIWithReport(report);
            updateCameraHud(report);
        }, 1300);

        showToast('Auto-escaneo continuo en vivo activado');
    } else {
        stopAutoScan();
        showToast('Auto-escaneo detenido');
    }
}

function stopAutoScan() {
    APP_STATE.isAutoScanning = false;
    if (APP_STATE.autoScanInterval) {
        clearInterval(APP_STATE.autoScanInterval);
        APP_STATE.autoScanInterval = null;
    }
    if (DOM.autoScanDot) DOM.autoScanDot.classList.remove('active');
    if (DOM.autoScanBtnText) DOM.autoScanBtnText.textContent = 'Auto-Escaneo en Vivo';
    if (DOM.cameraReticle) DOM.cameraReticle.style.borderColor = 'rgba(6, 182, 212, 0.5)';
    if (DOM.hudStatusBadge) {
        DOM.hudStatusBadge.className = 'hud-status-badge';
        DOM.hudStatusBadge.textContent = 'Alinea la patente dentro del marco';
    }
}

function updateCameraHud(report) {
    if (!report || !DOM.cameraReticle || !DOM.hudStatusBadge) return;
    if (report.verdict === 'AUTENTICA') {
        DOM.cameraReticle.style.borderColor = '#10b981';
        DOM.hudStatusBadge.className = 'hud-status-badge success';
        DOM.hudStatusBadge.textContent = `🟢 AUTÉNTICA: ${report.formattedDisplay} (${report.authenticityScore}%)`;
    } else if (report.verdict === 'SOSPECHOSA') {
        DOM.cameraReticle.style.borderColor = '#f59e0b';
        DOM.hudStatusBadge.className = 'hud-status-badge scanning';
        DOM.hudStatusBadge.textContent = `⚠️ SOSPECHOSA: ${report.formattedDisplay} (${report.authenticityScore}%)`;
    } else {
        DOM.cameraReticle.style.borderColor = '#ef4444';
        DOM.hudStatusBadge.className = 'hud-status-badge alert';
        DOM.hudStatusBadge.textContent = `🚨 ALERTA: ADULTERADA / TRUCADA (${report.formattedDisplay})`;
    }
}

function stopCamera() {
    stopAutoScan();
    if (APP_STATE.mediaStream) {
        APP_STATE.mediaStream.getTracks().forEach(track => track.stop());
        APP_STATE.mediaStream = null;
    }
    DOM.cameraViewContainer.style.display = 'none';
    DOM.startCameraBtn.disabled = false;
    DOM.autoScanCameraBtn.disabled = true;
    DOM.captureCameraBtn.disabled = true;
    DOM.stopCameraBtn.disabled = true;
    showToast('Cámara detenida');
}

// ============================================================================
// YOLO / CVAT Dataset Exporter
// ============================================================================
function exportCurrentAsYoloDataset() {
    if (!DOM.forensicCanvas) return;
    const plate = (DOM.detectedPlateInput.value || 'PATENTE').toUpperCase();
    const isAuthentic = APP_STATE.currentReport?.verdict === 'AUTENTICA';
    const isTampered = APP_STATE.currentReport?.verdict === 'ADULTERADA_FALSIFICADA';
    const classId = isAuthentic ? 0 : (isTampered ? 1 : 2); // 0=plate_authentic, 1=plate_tampered_tape, 2=plate_cloned_replica

    // Formato de anotación YOLO: <class_id> <x_center> <y_center> <width> <height>
    const yoloAnnotation = `${classId} 0.500000 0.500000 0.850000 0.380000\n`;

    // 1. Descargar archivo .txt con coordenadas YOLO
    const txtBlob = new Blob([yoloAnnotation], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = `chile_plate_${plate}_${Date.now()}.txt`;
    txtLink.click();
    URL.revokeObjectURL(txtUrl);

    // 2. Descargar imagen .jpg
    const imgUrl = DOM.forensicCanvas.toDataURL('image/jpeg', 0.95);
    const imgLink = document.createElement('a');
    imgLink.href = imgUrl;
    imgLink.download = `chile_plate_${plate}_${Date.now()}.jpg`;
    imgLink.click();

    showToast('Descargado fotograma (.jpg) y anotación YOLO (.txt) listos para CVAT');
}

// ============================================================================
// History & Audit Logging
// ============================================================================
function loadHistory() {
    const saved = localStorage.getItem('chileplate_inspections_history');
    if (saved) {
        try {
            APP_STATE.history = JSON.parse(saved);
        } catch (e) {
            APP_STATE.history = [];
        }
    }
    renderHistoryTable();
}

function saveHistory() {
    localStorage.setItem('chileplate_inspections_history', JSON.stringify(APP_STATE.history));
}

function logInspection(report) {
    // Avoid exact duplicate consecutive logging
    if (APP_STATE.history.length > 0 && APP_STATE.history[0].rawText === report.rawText && APP_STATE.history[0].verdict === report.verdict) {
        return;
    }

    APP_STATE.history.unshift(report);
    if (APP_STATE.history.length > 50) APP_STATE.history.pop(); // Keep last 50
    saveHistory();
    renderHistoryTable();
}

function renderHistoryTable() {
    DOM.historyTableBody.innerHTML = '';
    DOM.totalInspectionsCount.textContent = APP_STATE.history.length;

    if (APP_STATE.history.length === 0) {
        DOM.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No hay inspecciones registradas aún.</td></tr>`;
        return;
    }

    APP_STATE.history.forEach(item => {
        const row = document.createElement('tr');
        const verdictClass = item.verdict === 'AUTENTICA' ? 'authentic' : item.verdict === 'SOSPECHOSA' ? 'warning' : 'alert';
        const verdictLabel = item.verdict === 'AUTENTICA' ? 'AUTÉNTICA' : item.verdict === 'SOSPECHOSA' ? 'SOSPECHOSA' : 'ADULTERADA';
        const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const findingsText = item.anomalies.length > 0 ? item.anomalies[0].title : 'Conforme a la norma';

        row.innerHTML = `
            <td>${dateStr}</td>
            <td><span class="plate-badge-mono">${item.formattedDisplay}</span></td>
            <td>${item.formatType || 'N/A'}</td>
            <td><span class="verdict-tag ${verdictClass}">${verdictLabel}</span></td>
            <td><strong>${item.authenticityScore}%</strong></td>
            <td><span style="font-size:0.75rem; color:${item.anomalies.length > 0 ? '#f87171' : 'var(--text-secondary)'};">${findingsText}</span></td>
            <td>
                <button class="text-btn" style="color:#38bdf8;" title="Ver dictamen">Ver</button>
            </td>
        `;

        row.querySelector('button').addEventListener('click', () => {
            updateUIWithReport(item);
            showToast(`Cargado dictamen de patente ${item.formattedDisplay}`);
        });

        DOM.historyTableBody.appendChild(row);
    });
}

function exportHistoryCSV() {
    if (APP_STATE.history.length === 0) {
        showToast('No hay registros para exportar');
        return;
    }

    let csv = 'ID,Fecha,Patente,Formato,Diagnostico,Score,Confianza,Anomalias\n';
    APP_STATE.history.forEach(item => {
        const anomaliesSummary = item.anomalies.map(a => a.title).join('; ') || 'Ninguna';
        csv += `"${item.id}","${item.timestamp}","${item.normalizedPlate}","${item.formatType}","${item.verdict}",${item.authenticityScore},${item.confidence},"${anomaliesSummary}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_patentes_chile_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Historial exportado a CSV con éxito');
}

function exportCurrentReportJSON() {
    if (!APP_STATE.currentReport) {
        showToast('No hay dictamen activo para exportar');
        return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(APP_STATE.currentReport, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `dictamen_${APP_STATE.currentReport.normalizedPlate}_${Date.now()}.json`;
    a.click();
    showToast('Reporte pericial descargado en JSON');
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function bindEvents() {
    // Tabs switcher
    DOM.sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            APP_STATE.activeSourceTab = targetTab;

            DOM.sourceTabs.forEach(t => t.classList.toggle('active', t === tab));
            DOM.tabContents.forEach(c => {
                c.classList.toggle('active', c.id === 'tab' + targetTab.charAt(0).toUpperCase() + targetTab.slice(1));
            });

            if (targetTab !== 'camera' && APP_STATE.mediaStream) {
                stopCamera();
            }
        });
    });

    // Dropzone events
    DOM.dropzone.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));

    DOM.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.dropzone.classList.add('dragover');
    });

    DOM.dropzone.addEventListener('dragleave', () => {
        DOM.dropzone.classList.remove('dragover');
    });

    DOM.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // Camera buttons
    DOM.startCameraBtn.addEventListener('click', startCamera);
    DOM.autoScanCameraBtn.addEventListener('click', toggleAutoScan);
    DOM.captureCameraBtn.addEventListener('click', captureCameraFrame);
    DOM.stopCameraBtn.addEventListener('click', stopCamera);

    // OCR Bar Manual Verification
    DOM.applyPlateTextBtn.addEventListener('click', async () => {
        const text = DOM.detectedPlateInput.value.trim().toUpperCase();
        if (!text) {
            showToast('Ingresa los caracteres de la patente');
            return;
        }
        startScanAnimation();
        const report = await window.ChilePlateForensics.analyzePlate(text, DOM.forensicCanvas, null);
        updateUIWithReport(report);
        logInspection(report);
        showToast(`Patente verificada: ${report.formattedDisplay}`);
    });

    DOM.detectedPlateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            DOM.applyPlateTextBtn.click();
        }
    });

    // CVAT Modal Controls
    DOM.openCvatModalBtn.addEventListener('click', () => {
        DOM.cvatModal.classList.add('open');
        DOM.cvatModal.setAttribute('aria-hidden', 'false');
    });

    const closeCvatModal = () => {
        DOM.cvatModal.classList.remove('open');
        DOM.cvatModal.setAttribute('aria-hidden', 'true');
    };

    DOM.closeCvatBtn.addEventListener('click', closeCvatModal);
    DOM.closeCvatModalFooterBtn.addEventListener('click', closeCvatModal);

    DOM.cvatModal.addEventListener('click', (e) => {
        if (e.target === DOM.cvatModal) {
            closeCvatModal();
        }
    });

    DOM.exportYoloAnnotationBtn.addEventListener('click', exportCurrentAsYoloDataset);

    // Filter selector
    DOM.forensicFilterSelect.addEventListener('change', (e) => {
        APP_STATE.activeFilter = e.target.value;
        if (rawBaseImageData) {
            // Restore raw image first
            canvasCtx.putImageData(rawBaseImageData, 0, 0);
            if (APP_STATE.activeFilter !== 'original') {
                window.ChilePlateForensics.applyFilter(DOM.forensicCanvas, APP_STATE.activeFilter);
            }
            showToast(`Filtro forense aplicado: ${e.target.options[e.target.selectedIndex].text}`);
        }
    });

    // Re-analyze button
    DOM.reAnalyzeBtn.addEventListener('click', () => {
        if (APP_STATE.activePresetId) {
            loadSamplePreset(APP_STATE.activePresetId);
        } else {
            showToast('Reanalizando fotograma actual...');
        }
    });

    // Export buttons
    DOM.exportReportBtn.addEventListener('click', exportCurrentReportJSON);
    DOM.printReportBtn.addEventListener('click', () => window.print());
    DOM.exportHistoryCsvBtn.addEventListener('click', exportHistoryCSV);

    // Clear history
    DOM.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('¿Deseas vaciar todos los registros de auditoría?')) {
            APP_STATE.history = [];
            saveHistory();
            renderHistoryTable();
            showToast('Historial vaciado');
        }
    });
}

// Toast helper
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🔍</span><span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}
