// --- Função Global para Limpar Seleção ---
window.limparSelecao = function(groupName) {
    const radios = document.querySelectorAll(`input[name="${groupName}"]`);
    radios.forEach(radio => {
        radio.checked = false;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis de Elementos do DOM ---
    const evaluationForm = document.getElementById('evaluation-form');
    const responsibleSelect = document.getElementById('responsible-select');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const minutesOutput = document.getElementById('minutes-output');
    const visitLocalInput = document.getElementById('visit-local');
    const visitDateInput = document.getElementById('visit-date');
    const visitTimeInput = document.getElementById('visit-time');
    const meetingParticipantsInput = document.getElementById('meeting-participants');
    const groupPhotoPreviewContainer = document.getElementById('group-photo-preview');
    const nextVisitDateInput = document.getElementById('next-visit-date');
    const nextVisitTimeInput = document.getElementById('next-visit-time');
    const nextVisitLocalInput = document.getElementById('next-visit-local');
    const actionPlanTableBody = document.querySelector('#action-plan-table tbody');
    const visitObservationsTextarea = document.getElementById('visit-observations-textarea');
    
    // --- Variáveis da Câmera ---
    const cameraModal = document.getElementById('camera-modal');
    const videoFeed = document.getElementById('camera-feed');
    const snapshotCanvas = document.getElementById('camera-snapshot');
    const captureBtn = document.getElementById('capture-btn');
    const openEvidenceCameraBtn = document.getElementById('open-evidence-camera-btn');
    const openGroupCameraBtn = document.getElementById('open-group-camera-btn');
    const flipCameraBtn = document.getElementById('flip-camera-btn');
    const filmStripContainer = document.getElementById('film-strip-container');
    const useSinglePhotoBtn = document.getElementById('use-single-photo-btn');
    const retakeSinglePhotoBtn = document.getElementById('retake-single-photo-btn');
    const doneMultiShotBtn = document.getElementById('done-multi-shot-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // --- VARIÁVEIS (UPLOAD/GALERIA) ---
    const openEvidenceFileBtn = document.getElementById('open-evidence-file-btn');
    const evidenceFileInput = document.getElementById('evidence-file-input');
    const openGroupFileBtn = document.getElementById('open-group-file-btn');
    const groupFileInput = document.getElementById('group-file-input');
    const imagePreviewContainer = document.getElementById('image-preview-container'); 
    const openReadyFileBtn = document.getElementById('open-ready-file-btn');
    const readyFileInput = document.getElementById('ready-file-input');
    const downloadEditedFileBtn = document.getElementById('download-edited-file-btn');
    const clearReadyFileBtn = document.getElementById('clear-ready-file-btn');
    const readyFileStatus = document.getElementById('ready-file-status');

    // --- Variáveis de Estado ---
    let meetingItems = [];
    let currentMinutesData = [];
    let uploadedImages = []; 
    let draggedImageIndex = null;
    let importedWordDocument = null;
    let importedEvidenceTable = null;
    let importedReadyFileName = '';
    let groupPhotoImageData = null; 
    
    let tempCapturedImages = []; 
    let currentStream = null;
    let currentCameraTarget = null; 
    let currentFacingMode = 'environment'; 

    // --- Estilo Inline do Botão Girar (Garante que vai aparecer) ---
    const rotateBtnStyle = "position: absolute; top: 5px; right: 35px; background-color: rgba(40, 126, 184, 0.95); color: white; border: 1px solid #1f6797; border-radius: 50%; width: 25px; height: 25px; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; padding-bottom: 2px; z-index: 10; box-shadow: 0px 2px 4px rgba(0,0,0,0.3);";

    // --- Funções Principais ---
    async function loadDataAndInitialize() {
        try {
            const response = await fetch('assets/data/data.json');
            if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
            meetingItems = await response.json();
            populateResponsibleDatalist();
            tableBody.innerHTML = ''; 
        } catch (error) {
            console.error('Erro ao carregar os dados:', error);
            minutesOutput.textContent = 'Não foi possível carregar os dados.';
        }
    }

    function populateResponsibleDatalist() {
        const responsibles = [...new Set(meetingItems.map(item => item.responsible))].filter(Boolean).sort();
        if(responsibleSelect) {
             responsibleSelect.innerHTML = '<option value="">-- Selecione um responsável --</option>';
            responsibles.forEach(responsible => {
                const option = document.createElement('option');
                option.value = responsible;
                option.textContent = responsible; 
                responsibleSelect.appendChild(option);
            });
        }
    }

    function renderTable(items) {
        tableBody.innerHTML = '';
        let currentSection = '';
        let currentTheme = '';
        let uniqueIdCounter = 0;

        const groupedItems = {};
        items.forEach(item => {
            const groupKey = `${item.section}-${item.theme}-${item.item_number}`;
            if (!groupedItems[groupKey]) {
                groupedItems[groupKey] = { ...item, subitems: [] };
            }
            if (!item.subitem_number && item.description) {
                groupedItems[groupKey].description = item.description;
            }
            if (item.subitem_number) {
                groupedItems[groupKey].subitems.push(item);
            }
        });

        for (const key in groupedItems) {
            const group = groupedItems[key];
            if (group.section !== currentSection) {
                const sectionRow = document.createElement('tr');
                sectionRow.classList.add('section-header');
                sectionRow.innerHTML = `<td colspan="11"><strong>${group.section}</strong></td>`;
                tableBody.appendChild(sectionRow);
                currentSection = group.section;
                currentTheme = '';
            }

            if (group.theme && group.theme !== currentTheme) {
                const themeRow = document.createElement('tr');
                themeRow.classList.add('theme-header');
                themeRow.innerHTML = `<td colspan="11"><strong>Tema: ${group.theme}</strong></td>`;
                tableBody.appendChild(themeRow);
                currentTheme = group.theme;
            }

            uniqueIdCounter++;
            const mainRow = document.createElement('tr');
            mainRow.dataset.masterId = group.master_id;
            mainRow.dataset.mainDescription = group.description || '';
            
            mainRow.innerHTML = `
                <td data-label="Responsável">${group.responsible || ''}</td>
                <td data-label="Seção">${group.section || ''}</td>
                <td data-label="Tema">${group.theme || ''}</td>
                <td data-label="Item">${group.item_number || ''}</td>
                <td data-label="Descrição do Item" class="truncate-text">${group.description || ''}</td>
                <td data-label="Subitem"></td>
                <td data-label="Descrição do Subitem"></td> 
                <td data-label="Nível de Exigência">${group.exigency_level || ''}</td>
                <td data-label="Avaliação">
                    <div class="evaluation-cell">
                        <input type="radio" id="eval-sim-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Sim">
                        <label for="eval-sim-${uniqueIdCounter}" class="radio-label">Sim</label>
                        <input type="radio" id="eval-nao-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Não">
                        <label for="eval-nao-${uniqueIdCounter}" class="radio-label">Não</label>
                        <input type="radio" id="eval-na-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="N/A">
                        <label for="eval-na-${uniqueIdCounter}" class="radio-label">N/A</label>
                        <button type="button" class="btn-limpar" onclick="limparSelecao('evaluation-${uniqueIdCounter}')" title="Limpar">✕</button>
                    </div>
                </td>
                <td data-label="Evidências"><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                <td data-label="Propostas"><textarea name="proposals" placeholder="Propostas..."></textarea></td>
            `;
            tableBody.appendChild(mainRow);

            group.subitems.forEach(subitem => {
                uniqueIdCounter++;
                const subitemRow = document.createElement('tr');
                subitemRow.dataset.masterId = subitem.master_id;
                subitemRow.dataset.mainDescription = group.description || '';
                
                subitemRow.innerHTML = `
                    <td data-label="Responsável">${subitem.responsible || ''}</td>
                    <td data-label="Seção">${subitem.section || ''}</td>
                    <td data-label="Tema">${subitem.theme || ''}</td>
                    <td data-label="Item">${subitem.item_number || ''}</td>
                    <td data-label="Descrição do Item" class="truncate-text">${group.description || ''}</td> 
                    <td data-label="Subitem">${subitem.subitem_number || ''}</td>
                    <td data-label="Descrição do Subitem" class="truncate-text">${subitem.subitem_description || ''}</td> 
                    <td data-label="Nível de Exigência">${subitem.exigency_level || ''}</td>
                    <td data-label="Avaliação">
                        <div class="evaluation-cell">
                            <input type="radio" id="eval-sim-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Sim">
                            <label for="eval-sim-${uniqueIdCounter}" class="radio-label">Sim</label>
                            <input type="radio" id="eval-nao-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Não">
                            <label for="eval-nao-${uniqueIdCounter}" class="radio-label">Não</label>
                            <input type="radio" id="eval-na-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="N/A">
                            <label for="eval-na-${uniqueIdCounter}" class="radio-label">N/A</label>
                            <button type="button" class="btn-limpar" onclick="limparSelecao('evaluation-${uniqueIdCounter}')" title="Limpar">✕</button>
                        </div>
                    </td>
                    <td data-label="Evidências"><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                    <td data-label="Propostas"><textarea name="proposals" placeholder="Propostas..."></textarea></td>
                `;
                tableBody.appendChild(subitemRow);
            });
        }

        tableBody.querySelectorAll('textarea').forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
            textarea.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            }, false);
        });
    }

    function generateMinutes(allRows) {
        try {
            minutesOutput.innerHTML = '<p>Processando e gerando a ata, por favor aguarde...</p>';
            
            const observationsValue = visitObservationsTextarea ? visitObservationsTextarea.value : '';

            const filledItems = allRows.map(row => {
                const cells = row.querySelectorAll('td');
                const evaluation = cells[8].querySelector('input:checked');
                const evidencesTextarea = cells[9] ? cells[9].querySelector('textarea') : null;
                const proposalsTextarea = cells[10] ? cells[10].querySelector('textarea') : null;

                return {
                    description: row.dataset.mainDescription,
                    responsible: cells[0].textContent,
                    section: cells[1].textContent,
                    theme: cells[2].textContent,
                    item_number: cells[3].textContent,
                    subitem_number: cells[5].textContent,
                    subitem_description: cells[6].textContent,
                    exigency_level: cells[7].textContent,
                    evaluation: evaluation ? evaluation.value : 'Não avaliado',
                    evidences: evidencesTextarea ? evidencesTextarea.value : '',
                    proposals: proposalsTextarea ? proposalsTextarea.value : '',
                };
            });
            
            currentMinutesData = filledItems.filter(item => 
                 item.evaluation !== 'Não avaliado' ||
                 item.evidences.trim() !== '' ||
                 item.proposals.trim() !== ''
            );

            const actionPlanItems = [];
            const actionPlanRows = actionPlanTableBody.querySelectorAll('tr');
            actionPlanRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const responsible = cells[1].querySelector('input').value;
                const sector = cells[2].querySelector('input').value;
                const deadline = cells[3].querySelector('input').value;
                
                if (responsible.trim() || sector.trim() || deadline.trim()) {
                    actionPlanItems.push({
                        action: cells[0].textContent,
                        responsible: responsible,
                        sector: sector,
                        deadline: deadline
                    });
                }
            });

            const fullReportData = {
                visitLocal: visitLocalInput.value,
                visitDate: visitDateInput.value ? new Date(visitDateInput.value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
                visitTime: visitTimeInput.value,
                participants: meetingParticipantsInput.value,
                nextVisit: `Dia ${nextVisitDateInput.value ? new Date(nextVisitDateInput.value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '__/__/____'} com ${nextVisitLocalInput.value || '(setor não definido)'} às ${nextVisitTimeInput.value || '__:__'} horas`,
                tableData: currentMinutesData,
                actionPlan: actionPlanItems,
                groupPhoto: groupPhotoImageData,
                evidencePhotos: uploadedImages,
                visitObservations: observationsValue
            };

            minutesOutput.innerHTML = generateMinutesHTML(fullReportData);
            
            const downloadPdfBtn = document.getElementById('download-pdf-btn');
            if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => generatePdfDocument(fullReportData));
            
            const downloadWordBtn = document.getElementById('download-word-btn');
            if (downloadWordBtn) downloadWordBtn.addEventListener('click', () => generateWordDocument(fullReportData));

        } catch (error) {
            console.error("ERRO AO GERAR A ATA:", error);
            minutesOutput.innerHTML = `<p style="color: red; font-weight: bold;">Ocorreu um erro ao gerar a ata.</p>`;
        }
    }

    function generateMinutesHTML(data) {
        let html = `<h3>Visualização da Ata Gerada</h3>`;
        html += `<p><strong>Local:</strong> ${data.visitLocal || 'Não informado'}</p>`;
        html += `<p><strong>Data:</strong> ${data.visitDate || 'Não informada'}</p>`;
        html += `<p><strong>Participantes:</strong> ${data.participants || 'Não informados'}</p>`;
        html += `<p><strong>Próxima Visita:</strong> ${data.nextVisit}</p>`;

        if (data.groupPhoto) {
            html += `<h4>Foto da Equipe</h4><img src="${data.groupPhoto.url}" style="max-width: 300px; border-radius: 8px;">`;
        }
        if (data.tableData.length > 0) {
            html += `<h4>Itens de Ação</h4><p>${data.tableData.length} itens registrados.</p>`;
        }
        if (data.actionPlan.length > 0) {
            html += `<h4>Dando um Passo Adiante...</h4><p>${data.actionPlan.length} ações definidas.</p>`;
        }
        if (data.evidencePhotos.length > 0) {
            html += `<h4>Fotos</h4><p id="minutes-photo-count">${data.evidencePhotos.length} fotos anexadas. A ordem usada no PDF/Word acompanha a galeria acima.</p>`;
        }
        html += `
            <div id="download-buttons" style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="download-pdf-btn">Baixar .pdf</button>
                <button id="download-word-btn">Baixar .doc</button>
            </div>`;
        return html;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function imageToDataUrl(path) {
        return fetch(path)
            .then(response => response.ok ? response.blob() : Promise.reject())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .catch(() => null);
    }

    function sanitizeFileName(text) {
        return (text || 'geral').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    function formatBulletListHtml(text) {
        if (!text || text.trim() === '') return '';
        const items = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (!items.length) return '';
        return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function buildEvidencePhotosRowsHtml(evidencePhotos) {
        const evidencePhotosRowsHtml = [];
        for (let i = 0; i < evidencePhotos.length; i += 3) {
            const rowPhotos = [evidencePhotos[i], evidencePhotos[i + 1], evidencePhotos[i + 2]];
            evidencePhotosRowsHtml.push(`
                <tr style="page-break-inside: avoid;">
                    ${rowPhotos.map(photo => `
                        <td style="width: 33.33%; border: 1pt solid #ddd; padding: 8pt; text-align: center; vertical-align: middle; height: 330pt;">
                            ${photo ? `<img src='${photo.url}' style='max-width: 230pt; max-height: 300pt; width: auto; height: auto;'>` : '&nbsp;'}
                        </td>
                    `).join('')}
                </tr>
            `);
        }
        return evidencePhotosRowsHtml.join('');
    }

    function buildEvidencePhotosSectionHtml(evidencePhotos) {
        if (!evidencePhotos.length) return '<p>Sem fotos.</p>';
        const photoPages = [];
        for (let i = 0; i < evidencePhotos.length; i += 3) {
            const pagePhotos = evidencePhotos.slice(i, i + 3);
            photoPages.push(`
                <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid; ${i > 0 ? 'page-break-before: always;' : ''}">
                    ${buildEvidencePhotosRowsHtml(pagePhotos)}
                </table>
            `);
        }
        return photoPages.join('');
    }

    function createEditablePhotosDocument(title = 'FOTOS') {
        const parser = new DOMParser();
        return parser.parseFromString(`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <style>
                        @page { size: 29.7cm 21cm; margin: 1.0cm; }
                        body { font-family: Arial, sans-serif; }
                        table { border-collapse: collapse; width: 100%; }
                    </style>
                </head>
                <body>
                    <div style="font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10pt;">${escapeHtml(title)}</div>
                    <table id="editable-photos-table" style="width: 100%; border-collapse: collapse;"></table>
                </body>
            </html>
        `, 'text/html');
    }

    function getImageAspectFromElement(img) {
        const width = Number(img.getAttribute('width')) || img.naturalWidth || 320;
        const height = Number(img.getAttribute('height')) || img.naturalHeight || 240;
        return width && height ? width / height : 4 / 3;
    }

    function getImageAspectFromDataUrl(dataUrl, fallbackAspect) {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image.width && image.height ? image.width / image.height : fallbackAspect);
            image.onerror = () => resolve(fallbackAspect);
            image.src = dataUrl;
        });
    }

    function findEvidencePhotosTable(doc) {
        const headings = Array.from(doc.querySelectorAll('div, h1, h2, h3, h4, p, b, strong'));
        const photosHeading = headings.find(element => element.textContent.trim().toUpperCase() === 'FOTOS');
        if (!photosHeading) return null;

        let cursor = photosHeading.nextElementSibling;
        while (cursor && cursor.tagName !== 'TABLE') {
            cursor = cursor.nextElementSibling;
        }
        return cursor && cursor.querySelector('img') ? cursor : null;
    }

    function setReadyFileStatus(message, isError = false) {
        if (!readyFileStatus) return;
        readyFileStatus.textContent = message;
        readyFileStatus.classList.toggle('error', isError);
    }

    function syncReadyFileButtons() {
        const hasImportedFile = Boolean(importedWordDocument && importedEvidenceTable);
        if (downloadEditedFileBtn) downloadEditedFileBtn.style.display = hasImportedFile ? 'inline-block' : 'none';
        if (clearReadyFileBtn) clearReadyFileBtn.style.display = hasImportedFile ? 'inline-block' : 'none';
    }

    function clearReadyFileEdit() {
        importedWordDocument = null;
        importedEvidenceTable = null;
        importedReadyFileName = '';
        uploadedImages = [];
        renderImagePreviews();
        syncReadyFileButtons();
        setReadyFileStatus('Nenhum arquivo pronto carregado.');
    }

    function bytesToDataUrl(bytes, mimeType) {
        return new Promise(resolve => {
            const blob = new Blob([bytes], { type: mimeType });
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    function getMimeTypeFromPath(path) {
        const extension = path.split('.').pop().toLowerCase();
        if (extension === 'png') return 'image/png';
        if (extension === 'gif') return 'image/gif';
        if (extension === 'webp') return 'image/webp';
        if (extension === 'bmp') return 'image/bmp';
        return 'image/jpeg';
    }

    async function inflateZipData(compressedBytes, method) {
        if (method === 0) return compressedBytes;
        if (method !== 8) throw new Error('Método de compactação não suportado.');
        if (!('DecompressionStream' in window)) throw new Error('Este navegador não consegue abrir .docx compactado. Use Chrome/Edge atualizado ou envie .doc/.pdf.');
        const stream = new Blob([compressedBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    async function readZipEntries(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        const view = new DataView(arrayBuffer);
        let eocdOffset = -1;
        for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
            if (view.getUint32(i, true) === 0x06054b50) {
                eocdOffset = i;
                break;
            }
        }
        if (eocdOffset === -1) throw new Error('Arquivo .docx inválido.');

        const totalEntries = view.getUint16(eocdOffset + 10, true);
        let centralDirOffset = view.getUint32(eocdOffset + 16, true);
        const entries = new Map();
        const decoder = new TextDecoder();

        for (let entryIndex = 0; entryIndex < totalEntries; entryIndex++) {
            if (view.getUint32(centralDirOffset, true) !== 0x02014b50) break;
            const method = view.getUint16(centralDirOffset + 10, true);
            const compressedSize = view.getUint32(centralDirOffset + 20, true);
            const fileNameLength = view.getUint16(centralDirOffset + 28, true);
            const extraLength = view.getUint16(centralDirOffset + 30, true);
            const commentLength = view.getUint16(centralDirOffset + 32, true);
            const localHeaderOffset = view.getUint32(centralDirOffset + 42, true);
            const fileName = decoder.decode(bytes.slice(centralDirOffset + 46, centralDirOffset + 46 + fileNameLength));

            const localNameLength = view.getUint16(localHeaderOffset + 26, true);
            const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
            const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
            const compressedBytes = bytes.slice(dataStart, dataStart + compressedSize);
            entries.set(fileName, await inflateZipData(compressedBytes, method));
            centralDirOffset += 46 + fileNameLength + extraLength + commentLength;
        }
        return entries;
    }

    function getOrderedDocxImagePaths(entries) {
        const decoder = new TextDecoder();
        const documentXml = entries.get('word/document.xml');
        const relationshipsXml = entries.get('word/_rels/document.xml.rels');
        if (!documentXml || !relationshipsXml) return Array.from(entries.keys()).filter(path => path.startsWith('word/media/'));

        const relationshipsText = decoder.decode(relationshipsXml);
        const relationshipMap = new Map();
        relationshipsText.replace(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g, (_, id, target) => {
            const normalizedTarget = target.startsWith('/') ? target.slice(1) : `word/${target}`.replace(/\/\.\//g, '/');
            relationshipMap.set(id, normalizedTarget);
            return '';
        });

        const orderedPaths = [];
        const documentText = decoder.decode(documentXml);
        documentText.replace(/r:embed="([^"]+)"/g, (_, relationshipId) => {
            const mediaPath = relationshipMap.get(relationshipId);
            if (mediaPath && entries.has(mediaPath) && !orderedPaths.includes(mediaPath)) orderedPaths.push(mediaPath);
            return '';
        });

        return orderedPaths.length ? orderedPaths : Array.from(entries.keys()).filter(path => path.startsWith('word/media/'));
    }

    async function extractImagesFromDocx(file) {
        const entries = await readZipEntries(await file.arrayBuffer());
        const imagePaths = getOrderedDocxImagePaths(entries).filter(path => /^word\/media\//.test(path));
        const extractedImages = [];
        for (const imagePath of imagePaths) {
            const dataUrl = await bytesToDataUrl(entries.get(imagePath), getMimeTypeFromPath(imagePath));
            extractedImages.push({ url: dataUrl, aspect: await getImageAspectFromDataUrl(dataUrl, 4 / 3) });
        }
        return extractedImages;
    }

    async function renderPdfPagesAsImages(file) {
        if (!window.pdfjsLib) throw new Error('Leitor de PDF indisponível. Verifique a conexão e tente novamente, ou envie o arquivo convertido para Word (.docx).');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const renderedPages = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            renderedPages.push({ url: dataUrl, aspect: canvas.width / canvas.height });
        }
        return renderedPages;
    }

    function loadImagesIntoReadyEditMode(fileName, images, sourceLabel) {
        if (!images.length) {
            setReadyFileStatus(`Não encontrei imagens editáveis em ${sourceLabel}.`, true);
            syncReadyFileButtons();
            return;
        }
        importedWordDocument = createEditablePhotosDocument('FOTOS');
        importedEvidenceTable = importedWordDocument.getElementById('editable-photos-table');
        importedReadyFileName = fileName;
        uploadedImages = images;
        renderImagePreviews();
        syncReadyFileButtons();
        setReadyFileStatus(`${fileName} carregado com ${uploadedImages.length} imagem(ns). Reorganize, adicione ou exclua fotos e clique em Baixar arquivo alterado.`);
    }

    async function importHtmlDocFile(file) {
        const fileContent = await file.text();
        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(fileContent, 'text/html');
        const evidenceTable = findEvidencePhotosTable(parsedDocument);

        if (!evidenceTable) throw new Error('Não encontrei a seção FOTOS no arquivo. Use o .doc baixado por este sistema ou envie .docx/.pdf.');

        const editableImages = Array.from(evidenceTable.querySelectorAll('img'))
            .map(img => ({ url: img.getAttribute('src'), fallbackAspect: getImageAspectFromElement(img) }))
            .filter(image => image.url && image.url.startsWith('data:image'));
        const extractedImages = await Promise.all(editableImages.map(async image => ({
            url: image.url,
            aspect: await getImageAspectFromDataUrl(image.url, image.fallbackAspect)
        })));

        if (!extractedImages.length) throw new Error('A seção FOTOS foi encontrada, mas não há imagens editáveis nela.');

        importedWordDocument = parsedDocument;
        importedEvidenceTable = evidenceTable;
        importedReadyFileName = file.name;
        uploadedImages = extractedImages;
        renderImagePreviews();
        syncReadyFileButtons();
        setReadyFileStatus(`${file.name} carregado com ${uploadedImages.length} foto(s). Reorganize, adicione ou exclua fotos e clique em Baixar arquivo alterado.`);
    }

    async function handleReadyFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setReadyFileStatus(`Carregando ${file.name}...`);
            const lowerName = file.name.toLowerCase();
            if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
                const pdfImages = await renderPdfPagesAsImages(file);
                loadImagesIntoReadyEditMode(file.name, pdfImages, 'PDF');
                setReadyFileStatus(`${file.name} carregado como ${uploadedImages.length} página(s) de PDF. Para editar fotos individualmente, prefira enviar o Word convertido (.docx).`);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) {
                const docxImages = await extractImagesFromDocx(file);
                loadImagesIntoReadyEditMode(file.name, docxImages, 'Documento do Microsoft Word');
            } else {
                await importHtmlDocFile(file);
            }
        } catch (error) {
            console.error('Erro ao importar arquivo pronto:', error);
            setReadyFileStatus(error.message || 'Não foi possível ler o arquivo selecionado.', true);
            syncReadyFileButtons();
        } finally {
            event.target.value = '';
        }
    }

    function downloadEditedReadyFile() {
        if (!importedWordDocument || !importedEvidenceTable) {
            setReadyFileStatus('Anexe primeiro um arquivo .doc, .docx ou .pdf.', true);
            return;
        }

        importedEvidenceTable.innerHTML = buildEvidencePhotosRowsHtml(uploadedImages);
        const serializedHtml = importedWordDocument.documentElement.outerHTML;
        const blob = new Blob(['\ufeff', serializedHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const baseName = sanitizeFileName(importedReadyFileName.replace(/\.[^.]+$/, '') || 'relatorio_editado');
        link.href = url;
        link.download = `${baseName}_editado.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setReadyFileStatus(`Arquivo alterado baixado com ${uploadedImages.length} foto(s), organizado em até 3 imagens por página.`);
    }

    // --- GERAÇÃO DE WORD ---
    async function generateWordDocument(data) {
        try {
            const [mapImageDataUrl, logoHspmDataUrl, logoSpDataUrl] = await Promise.all([
                imageToDataUrl('assets/images/exemplo_mapeamento.png'),
                imageToDataUrl('assets/images/logo-hspm.jpg'),
                imageToDataUrl('assets/images/logo-prefeitura-sp.jpg')
            ]);

            const tableRowsHtml = data.tableData.map(item => `
                <tr>
                    <td>${escapeHtml(item.section || '')}</td>
                    <td>${escapeHtml(item.theme || '')}</td>
                    <td>${escapeHtml(item.item_number || '')}</td>
                    <td>${escapeHtml(item.description || '')}</td>
                    <td>${escapeHtml(item.subitem_number || '')}</td>
                    <td>${escapeHtml(item.subitem_description || '')}</td>
                    <td>${escapeHtml(item.exigency_level || '')}</td>
                    <td bgcolor="#f2fbf5">${escapeHtml(item.evaluation || '')}</td>
                    <td bgcolor="#f2fbf5">${formatBulletListHtml(item.evidences) || '&nbsp;'}</td>
                    <td bgcolor="#f2fbf5">${formatBulletListHtml(item.proposals) || '&nbsp;'}</td>
                </tr>
            `).join('');

            const actionRowsHtml = data.actionPlan.map(item => `
                <tr>
                    <td>${escapeHtml(item.action || '')}</td>
                    <td>${escapeHtml(item.responsible || '')}</td>
                    <td>${escapeHtml(item.sector || '')}</td>
                    <td>${escapeHtml(item.deadline || '')}</td>
                </tr>
            `).join('');

            const observationsHtml = (data.visitObservations || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => `<p>• ${escapeHtml(line)}</p>`).join('');

            const evidencePhotos = data.evidencePhotos || [];
            const evidencePhotosHtml = buildEvidencePhotosSectionHtml(evidencePhotos);

            const wordHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <style>
                        @page { size: 29.7cm 21cm; margin: 1.0cm; }
                        body { font-family: Arial, sans-serif; }
                        .page-break { page-break-before: always; }
                        table.main-table { border-collapse: collapse; width: 100%; }
                        table.main-table th, table.main-table td { border: 1pt solid #aaa; padding: 4pt; font-size: 12pt; vertical-align: top; line-height: 1.35; word-break: break-word; }
                        table.main-table th { background-color: #287eb8; color: white; font-weight: bold; text-align: center; }
                        ul { margin: 0; padding-left: 15pt; }
                    </style>
                </head>
                <body>
                    <table width="100%" style="border: none;">
                        <tr>
                            <td width="30%" align="left">${logoHspmDataUrl ? `<img src='${logoHspmDataUrl}' height='60'>` : ''}</td>
                            <td width="40%" align="center">
                                <div style="font-size: 12pt; font-weight: bold;">HOSPITAL DO SERVIDOR PÚBLICO MUNICIPAL</div>
                                <div style="font-size: 9pt;">ASSESSORIA DE PLANEJAMENTO ESTRATÉGICO E QUALIDADE</div>
                            </td>
                            <td width="30%" align="right">${logoSpDataUrl ? `<img src='${logoSpDataUrl}' height='70'>` : ''}</td>
                        </tr>
                    </table><br><br>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border: none;">
                        <tr>
                            <td align="center" bgcolor="#f57f17" style="padding: 40pt 0;">
                                <table width="60%" cellpadding="15"><tr><td bgcolor="#266c93" align="center"><div style="font-size: 28pt; font-weight: bold; color: white;">AUTO AVALIAÇÃO</div></td></tr></table>
                                <table width="100%" cellpadding="8"><tr><td bgcolor="#b4e68c"></td></tr></table><br>
                                <div style="font-size: 16pt; font-weight: bold; color: #333;">ATA DE REGISTRO DA VISITA DE QUALIDADE</div>
                            </td>
                        </tr>
                    </table><br><br>

                    <div style="text-align: center;">
                        <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5pt;">LOCAL: ${escapeHtml(data.visitLocal || 'Não informado')}</div>
                        <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5pt;">DATA: ${escapeHtml(data.visitDate || 'Não informada')}</div>
                        <div style="font-size: 14pt; font-weight: bold;">HORÁRIO: ${escapeHtml(data.visitTime || 'Não informado')}</div>
                    </div><br clear="all" class="page-break" />

                    <table width="100%" bgcolor="#266c93" cellpadding="5" style="margin-bottom: 5pt;"><tr><td><b style="color: white;">PARTICIPANTES:</b></td></tr></table>
                    <p style="font-size: 12pt; line-height: 1.4;">${escapeHtml(data.participants || 'Nenhum participante listado.')}</p>

                    <table width="100%" bgcolor="#266c93" cellpadding="5" style="margin-bottom: 5pt;"><tr><td><b style="color: white;">ASSUNTO DA REUNIÃO:</b></td></tr></table>
                    <p style="font-size: 12pt; line-height: 1.4;"><b>Visita para auditoria de itens Roteiro do CQH</b></p>

                    ${data.groupPhoto?.url ? `<div align="center"><img src="${data.groupPhoto.url}" width="400"></div>` : ''}

                    <p style="font-size: 12pt; line-height: 1.4;"><b>Roteiro:</b> Em anexo / <b>Fotos:</b> Em anexo</p><hr>
                    <p style="font-size: 12pt; line-height: 1.4;"><i>A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH...</i></p>

                    <table width="100%" bgcolor="#266c93" cellpadding="5"><tr><td><b style="color: white;">PRÓXIMA VISITA:</b></td></tr></table>
                    <p style="font-size: 12pt; line-height: 1.4;"><b>${escapeHtml(data.nextVisit || 'Não definida.')}</b></p><br clear="all" class="page-break" />

                    <table class="main-table" style="table-layout: fixed; width: 100%;">
                        <thead>
                            <tr>
                                <th>Seção</th><th>Tema</th><th>Item</th><th>Descrição</th><th>Sub</th><th>Descrição Sub</th><th>Nível</th>
                                <th bgcolor="#8fcf9b" style="color: #1f4d2e;">Avaliação</th>
                                <th bgcolor="#8fcf9b" style="color: #1f4d2e;">Evidências</th>
                                <th bgcolor="#8fcf9b" style="color: #1f4d2e;">Propostas</th>
                            </tr>
                        </thead>
                        <tbody>${tableRowsHtml || `<tr><td colspan='10'>Sem itens.</td></tr>`}</tbody>
                    </table>

                    ${observationsHtml ? `<br clear="all" class="page-break" /><table width="100%" bgcolor="#266c93" cellpadding="5"><tr><td><b style="color: white;">OBSERVAÇÕES DA VISITA:</b></td></tr></table>${observationsHtml}` : ''}

                    ${evidencePhotos.length ? `<br clear="all" class="page-break" /><div style="font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10pt;">FOTOS</div>${evidencePhotosHtml}` : ''}

                    <br clear="all" class="page-break" />
                    <div style="font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 10pt;">DANDO UM PASSO ADIANTE...</div>
                    <table class="main-table" style="table-layout: fixed; width: 100%;">
                        <thead>
                            <tr>
                                <th bgcolor="#004585">AÇÃO</th><th bgcolor="#004585">RESPONSÁVEL</th><th bgcolor="#004585">SETOR</th><th bgcolor="#004585">PRAZO PARA FINALIZAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>${actionRowsHtml || `<tr><td colspan='4'>Sem ações.</td></tr>`}</tbody>
                    </table>
                    <p style='margin-top: 15pt; font-weight:bold;'>VIDE EXEMPLOS 2 E 3 NA PÁGINA SEGUINTE.</p>

                    <br clear="all" class="page-break" />
                    <div style="font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10pt;">ANEXO - MAPEAMENTO DE PROCESSOS</div>
                    ${mapImageDataUrl ? `<div align="center"><img src='${mapImageDataUrl}' width='800'></div>` : '<p>Imagem não disponível.</p>'}
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_visita_${sanitizeFileName(data.visitLocal)}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro no Word:', error);
            alert('Não foi possível gerar o arquivo Word.');
        }
    }

    // --- COMPRESSÃO DE IMAGENS EXTREMA (Deixa os arquivos muito leves) ---
    function resizeAndCompressImage(dataUrl, maxWidth, callback) {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            // Reduzimos o máximo para 600px
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Qualidade reduzida para 0.6 (60%) -> Fica minúsculo em megabytes
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            const aspectRatio = width / height;
            callback(compressedDataUrl, aspectRatio);
        };
        img.src = dataUrl;
    }

    // --- GIRAR IMAGEM (Mantém a compressão) ---
    function rotateImageBase64(dataUrl, degrees, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (degrees === 90 || degrees === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(degrees * Math.PI / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            // Mantém a qualidade em 0.6 para não inchar ao girar
            const newUrl = canvas.toDataURL('image/jpeg', 0.6);
            const newAspect = canvas.width / canvas.height;
            callback(newUrl, newAspect);
        };
        img.src = dataUrl;
    }

    // --- UPLOAD DE ARQUIVOS ---
    function handleEvidenceFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Comprime para no máximo 600px
                resizeAndCompressImage(e.target.result, 600, function(compressedUrl, aspect) {
                    uploadedImages.push({ url: compressedUrl, aspect: aspect });
                    renderImagePreviews(); 
                });
            };
            reader.readAsDataURL(file);
        });
        event.target.value = ''; 
    }

    function handleGroupFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            // Comprime para no máximo 600px
            resizeAndCompressImage(e.target.result, 600, function(compressedUrl, aspect) {
                groupPhotoImageData = { url: compressedUrl, aspect: aspect };

                groupPhotoPreviewContainer.innerHTML = `
                    <div class="image-preview-wrapper" style="position:relative; width: 150px;">
                        <img src="${groupPhotoImageData.url}" alt="Foto da equipe" style="width: 100%; border-radius: 8px;">
                        <button type="button" class="remove-image-btn" style="position: absolute; top: 5px; right: 5px; background-color: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;" onclick="removeGroupPhoto()" title="Remover">&times;</button>
                        <button type="button" class="rotate-image-btn" style="${rotateBtnStyle}" onclick="rotateGroupPhoto()" title="Girar Foto">↻</button>
                    </div>
                `;
            });
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    window.removeGroupPhoto = function() {
        groupPhotoImageData = null;
        groupPhotoPreviewContainer.innerHTML = '';
    };

    window.rotateGroupPhoto = function() {
        if (!groupPhotoImageData) return;
        rotateImageBase64(groupPhotoImageData.url, 90, function(newUrl, newAspect) {
            groupPhotoImageData = { url: newUrl, aspect: newAspect };
            groupPhotoPreviewContainer.querySelector('img').src = newUrl;
        });
    };

    function refreshGeneratedPhotoCount() {
        const photoCount = document.getElementById('minutes-photo-count');
        if (photoCount) {
            photoCount.textContent = `${uploadedImages.length} fotos anexadas. A ordem usada no PDF/Word acompanha a galeria acima.`;
        }
    }

    function moveUploadedImage(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= uploadedImages.length || toIndex >= uploadedImages.length) return;
        const [movedImage] = uploadedImages.splice(fromIndex, 1);
        uploadedImages.splice(toIndex, 0, movedImage);
        renderImagePreviews();
    }

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        refreshGeneratedPhotoCount();
        if (importedWordDocument && importedReadyFileName) {
            setReadyFileStatus(`${importedReadyFileName} carregado com ${uploadedImages.length} foto(s). Reorganize, adicione ou exclua fotos e clique em Baixar arquivo alterado.`);
        }

        uploadedImages.forEach((imageData, index) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-preview-wrapper');
            wrapper.draggable = true;
            wrapper.dataset.index = index;
            wrapper.setAttribute('aria-label', `Foto ${index + 1} de ${uploadedImages.length}. Arraste para reorganizar.`);

            wrapper.addEventListener('dragstart', (event) => {
                draggedImageIndex = index;
                wrapper.classList.add('is-dragging');
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
            });

            wrapper.addEventListener('dragover', (event) => {
                event.preventDefault();
                wrapper.classList.add('is-drag-over');
                event.dataTransfer.dropEffect = 'move';
            });

            wrapper.addEventListener('dragleave', () => wrapper.classList.remove('is-drag-over'));

            wrapper.addEventListener('drop', (event) => {
                event.preventDefault();
                wrapper.classList.remove('is-drag-over');
                const fromIndex = draggedImageIndex ?? Number(event.dataTransfer.getData('text/plain'));
                moveUploadedImage(fromIndex, index);
                draggedImageIndex = null;
            });

            wrapper.addEventListener('dragend', () => {
                draggedImageIndex = null;
                wrapper.classList.remove('is-dragging', 'is-drag-over');
            });

            const orderBadge = document.createElement('span');
            orderBadge.classList.add('image-order-badge');
            orderBadge.textContent = index + 1;

            const img = document.createElement('img');
            img.src = imageData.url;
            img.alt = `Foto de evidência ${index + 1}`;

            const controls = document.createElement('div');
            controls.classList.add('image-reorder-controls');

            const moveUpBtn = document.createElement('button');
            moveUpBtn.type = 'button';
            moveUpBtn.classList.add('image-control-btn');
            moveUpBtn.innerHTML = '↑';
            moveUpBtn.title = 'Subir foto na ordem';
            moveUpBtn.disabled = index === 0;
            moveUpBtn.onclick = () => moveUploadedImage(index, index - 1);

            const moveDownBtn = document.createElement('button');
            moveDownBtn.type = 'button';
            moveDownBtn.classList.add('image-control-btn');
            moveDownBtn.innerHTML = '↓';
            moveDownBtn.title = 'Descer foto na ordem';
            moveDownBtn.disabled = index === uploadedImages.length - 1;
            moveDownBtn.onclick = () => moveUploadedImage(index, index + 1);

            controls.appendChild(moveUpBtn);
            controls.appendChild(moveDownBtn);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '&times;';
            removeBtn.classList.add('remove-image-btn');
            removeBtn.title = 'Remover foto';
            removeBtn.onclick = () => {
                uploadedImages.splice(index, 1);
                renderImagePreviews();
            };

            const rotateBtn = document.createElement('button');
            rotateBtn.type = 'button';
            rotateBtn.innerHTML = '↻';
            rotateBtn.classList.add('rotate-image-btn');
            rotateBtn.title = 'Girar foto';
            rotateBtn.onclick = () => {
                rotateImageBase64(imageData.url, 90, function(newUrl, newAspect) {
                    uploadedImages[index] = { url: newUrl, aspect: newAspect };
                    renderImagePreviews();
                });
            };

            wrapper.appendChild(img);
            wrapper.appendChild(orderBadge);
            wrapper.appendChild(controls);
            wrapper.appendChild(removeBtn);
            wrapper.appendChild(rotateBtn);
            imagePreviewContainer.appendChild(wrapper);
        });
    }

    // --- CÂMERA ---
    async function startStream() {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        try {
            currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentFacingMode } }});
        } catch (err) {
            currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentFacingMode } }});
            } catch (err2) {
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (err3) {
                    alert("Nenhuma câmera encontrada.");
                    closeModal(); 
                    return;
                }
            }
        }
        videoFeed.srcObject = currentStream;
    }

    async function openCamera(target) {
        videoFeed.style.display = 'block';
        snapshotCanvas.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        closeModalBtn.style.display = 'inline-block';
        flipCameraBtn.style.display = 'inline-block'; 
        
        tempCapturedImages = [];
        filmStripContainer.innerHTML = '';
        currentCameraTarget = target;

        if (target === 'evidence') {
            currentFacingMode = 'environment'; 
            filmStripContainer.style.display = 'block';
            doneMultiShotBtn.style.display = 'inline-block';
            useSinglePhotoBtn.style.display = 'none';
            retakeSinglePhotoBtn.style.display = 'none';
        } else {
            currentFacingMode = 'user'; 
            filmStripContainer.style.display = 'none';
            doneMultiShotBtn.style.display = 'none';
            useSinglePhotoBtn.style.display = 'none';
            retakeSinglePhotoBtn.style.display = 'none';
        }

        await startStream(); 
        cameraModal.style.display = 'flex'; 
    }

    function closeModal() {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        cameraModal.style.display = 'none';
        flipCameraBtn.style.display = 'none'; 
        currentCameraTarget = null;
        tempCapturedImages = [];
        filmStripContainer.innerHTML = '';
    }

    function capturePhoto() {
        const context = snapshotCanvas.getContext('2d');
        let width = videoFeed.videoWidth;
        let height = videoFeed.videoHeight;
        // Comprime direto da câmera
        const maxWidth = 600;
        if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
        }

        snapshotCanvas.width = width;
        snapshotCanvas.height = height;
        context.drawImage(videoFeed, 0, 0, width, height);
        
        // Qualidade 0.6 (leve)
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.6);
        const aspectRatio = width / height;
        const photoData = { url: imageDataUrl, aspect: aspectRatio };

        if (currentCameraTarget === 'evidence') {
            tempCapturedImages.push(photoData);
            const img = document.createElement('img');
            img.src = photoData.url;
            filmStripContainer.appendChild(img);
        } else {
            videoFeed.style.display = 'none';
            snapshotCanvas.style.display = 'block';
            captureBtn.style.display = 'none';
            flipCameraBtn.style.display = 'none'; 
            useSinglePhotoBtn.style.display = 'inline-block';
            retakeSinglePhotoBtn.style.display = 'inline-block';
        }
    }

    function retakeSinglePhoto() {
        videoFeed.style.display = 'block';
        snapshotCanvas.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        flipCameraBtn.style.display = 'inline-block'; 
        useSinglePhotoBtn.style.display = 'none';
        retakeSinglePhotoBtn.style.display = 'none';
    }

    function useSingleCapturedPhoto() {
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.6);
        const aspectRatio = snapshotCanvas.width / snapshotCanvas.height;
        
        groupPhotoImageData = { url: imageDataUrl, aspect: aspectRatio };
        groupPhotoPreviewContainer.innerHTML = `
            <div class="image-preview-wrapper" style="position:relative; width: 150px;">
                <img src="${groupPhotoImageData.url}" alt="Foto da equipe" style="width: 100%; border-radius: 8px;">
                <button type="button" class="remove-image-btn" style="position: absolute; top: 5px; right: 5px; background-color: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;" onclick="removeGroupPhoto()" title="Remover">&times;</button>
                <button type="button" class="rotate-image-btn" style="${rotateBtnStyle}" onclick="rotateGroupPhoto()" title="Girar Foto">↻</button>
            </div>
        `;
        closeModal();
    }

    function saveMultiShotPhotos() {
        uploadedImages.push(...tempCapturedImages);
        renderImagePreviews(); 
        closeModal();
    }
    
    // --- GERADOR DE PDF ---
    function generatePdfDocument(data) {
        try {
            if (typeof window.jspdf.jsPDF.API.autoTable !== 'function') {
                alert('Erro: jsPDF-AutoTable não carregado.'); return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const pageBottom = pageHeight - margin;

            const azulTitulo = [38, 108, 147]; const brancoTexto = [255, 255, 255]; 
            const laranjaPrincipal = [245, 127, 23]; const verdeEscurecido = [180, 230, 140]; const cinzaSombra = [189, 189, 189];
            
            const logoHSPM = 'assets/images/logo-hspm.jpg';
            const logoSP = 'assets/images/logo-prefeitura-sp.jpg';
            
            doc.addImage(logoHSPM, 'JPG', margin, 8, 35, 12);
            doc.addImage(logoSP, 'JPG', pageWidth - margin - 40, 8, 40, 12);
            
            doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
            doc.text('HOSPITAL DO SERVIDOR PÚBLICO MUNICIPAL', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('ASSESSORIA DE PLANEJAMENTO ESTRATÉGICO E QUALIDADE', pageWidth / 2, 21, { align: 'center' });
            
            doc.setFillColor.apply(null, cinzaSombra); doc.circle(pageWidth / 2 + 2, pageHeight / 2 + 2, 80, 'F');
            doc.setFillColor.apply(null, laranjaPrincipal); doc.circle(pageWidth / 2, pageHeight / 2, 80, 'F');
            doc.setFillColor.apply(null, verdeEscurecido); 
            doc.rect(margin + 30, pageHeight / 2 - 8, pageWidth - (margin * 2) - 60, 12, 'F');

            doc.setFillColor.apply(null, azulTitulo);
            const rectWidth = 140; const rectY = (pageHeight / 2) - 28; 
            doc.roundedRect((pageWidth - rectWidth) / 2, rectY, rectWidth, 18, 2, 2, 'F'); 

            doc.setFontSize(32); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
            doc.text('AUTO AVALIAÇÃO', pageWidth / 2, rectY + 13, { align: 'center' }); 

            doc.setFontSize(16); doc.setTextColor(51, 51, 51); doc.setFont('helvetica', 'bold'); 
            doc.text('ATA DE REGISTRO DA VISITA DE QUALIDADE', pageWidth / 2, pageHeight / 2 + 1, { align: 'center' });

            doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
            doc.text(`LOCAL: ${data.visitLocal || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
            doc.text(`DATA: ${data.visitDate || 'Não informada'}`, pageWidth / 2, pageHeight / 2 + 34, { align: 'center' });
            doc.text(`HORÁRIO: ${data.visitTime || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 43, { align: 'center' });

            doc.addPage();
            let y = margin;
            const barHeight = 7; 

            doc.setFillColor.apply(null, azulTitulo); doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PARTICIPANTES:', margin + 3, y + 5); 
            y += barHeight + 5; 
            
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(12);
            const participantsText = doc.splitTextToSize(data.participants || 'Nenhum participante listado.', pageWidth - (margin * 2) - 5); 
            doc.text(participantsText, margin + 2, y); 
            y += participantsText.length * 6.5 + 10;

            doc.setFillColor.apply(null, azulTitulo); doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('ASSUNTO DA REUNIÃO:', margin + 3, y + 5);
            y += barHeight + 5; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(12);
            doc.text('Visita para auditoria de itens Roteiro do CQH', margin + 2, y); 
            y += 12; 

            if (data.groupPhoto && data.groupPhoto.url) { 
                let renderWidth = 110;
                let renderHeight = data.groupPhoto.aspect ? (renderWidth / data.groupPhoto.aspect) : 70;
                if (renderHeight > 75) { renderHeight = 75; renderWidth = renderHeight * data.groupPhoto.aspect; }
                doc.addImage(data.groupPhoto.url, 'PNG', (pageWidth - renderWidth) / 2, y, renderWidth, renderHeight);
                y += renderHeight + 10; 
            } else { y += 10; }
            
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Roteiro:', margin, y); doc.setFont('helvetica', 'normal'); doc.text('Em anexo', margin + 20, y); y += 7;
            doc.setFont('helvetica', 'bold'); doc.text('Fotos:', margin, y); doc.setFont('helvetica', 'normal'); doc.text('Em anexo', margin + 20, y); y += 11;  
            
            doc.setDrawColor(0); doc.setLineWidth(0.5); doc.line(margin, y, pageWidth - margin, y); y += 8;

            const paragraph = "A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH. Foram mostradas evidências dos itens, conforme descrito abaixo e anexamos uma proposta \npara dar um passo adiante para a próxima visita.";
            const paragraphLines = doc.splitTextToSize(paragraph, pageWidth - (margin * 2));
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(paragraphLines, margin, y);
            y += (paragraphLines.length * 6.5) + 14; 

            if (y + barHeight + 10 > pageBottom) { doc.addPage(); y = margin; }

            doc.setFillColor.apply(null, azulTitulo); doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PRÓXIMA VISITA:', margin + 3, y + 5);
            y += barHeight + 6; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(12);
            doc.text(data.nextVisit || 'Não definida.', margin + 2, y); 
            
            doc.addPage(); let finalY = margin; 

            if (data.tableData.length > 0) {
                doc.autoTable({
                    startY: finalY, rowPageBreak: 'avoid', tableWidth: pageWidth - (margin * 2),  
                    head: [['Seção', 'Tema', 'Item', 'Descrição do Item', 'Subitem', 'Descrição do Subitem', 'Nível de\nExigência', 'Avaliação', 'Evidências', 'Propostas']],
                    body: data.tableData.map(item => {
                        const formatAsList = (text) => text ? text.split('\n').map(l => l.trim()).filter(l => l !== '').map(l => `• ${l}`).join('\n') : '';
                        return [item.section, item.theme, item.item_number, item.description, item.subitem_number, item.subitem_description, item.exigency_level, item.evaluation, formatAsList(item.evidences), formatAsList(item.proposals)];
                    }),
                    theme: 'grid',
                    headStyles: { fillColor: [40, 126, 184], fontSize: 10.5, cellPadding: 2.4, halign: 'center', valign: 'middle', font: 'helvetica', overflow: 'linebreak' },
                    styles: { font: 'helvetica', fontSize: 12, cellPadding: 2, halign: 'center', valign: 'middle', overflow: 'linebreak', textDirection: 'ltr' },
                    columnStyles: { 0:{cellWidth:36}, 1:{cellWidth:26}, 2:{cellWidth:13, halign:'center'}, 3:{cellWidth:33}, 4:{cellWidth:14, halign:'center'}, 5:{cellWidth:33}, 6:{cellWidth:17, halign:'center'}, 7:{cellWidth:22, halign:'center', fillColor:[234, 248, 238]}, 8:{cellWidth:40, halign:'center', fillColor:[242, 251, 245]}, 9:{cellWidth:33, halign:'center', fillColor:[242, 251, 245]} },
                    didParseCell: (hookData) => { if (hookData.section === 'head' && [7, 8, 9].includes(hookData.column.index)) { hookData.cell.styles.fillColor = [143, 207, 155]; hookData.cell.styles.textColor = [31, 77, 46]; } },
                    didDrawPage: (hookData) => { finalY = hookData.cursor.y; }
                });
            }
            
            if (data.visitObservations && data.visitObservations.trim() !== '') {
                doc.addPage(); finalY = margin; 
                doc.setFillColor.apply(null, azulTitulo); doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 10, 3, 3, 'F');
                doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.text('OBSERVAÇÕES DA VISITA :', margin + 5, finalY + 6.5); 
                finalY += 18; doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
                data.visitObservations.split('\n').forEach(line => {
                    if (line.trim() !== '') {
                        if (finalY > pageHeight - margin) { doc.addPage(); finalY = margin; }
                        const textLines = doc.splitTextToSize(`• ${line.trim()}`, pageWidth - (margin * 2) - 5); doc.text(textLines, margin + 5, finalY); finalY += textLines.length * 6;
                    }
                });
            }

            if (data.evidencePhotos && data.evidencePhotos.length > 0) {
                const photosPerPage = 3;
                const cellGap = 8;
                const availableWidth = pageWidth - (margin * 2) - (cellGap * (photosPerPage - 1));
                const cellWidth = availableWidth / photosPerPage;
                const maxPhotoHeight = pageHeight - (margin * 2) - 25;

                data.evidencePhotos.forEach((photo, index) => {
                    if (index % photosPerPage === 0) {
                        doc.addPage();
                        y = margin;
                        doc.setFontSize(16);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(0,0,0);
                        doc.text('FOTOS', pageWidth / 2, y, { align: 'center' });
                        y += 15;
                    }

                    const slotIndex = index % photosPerPage;
                    let renderWidth = cellWidth;
                    let renderHeight = renderWidth / (photo.aspect || 1);
                    if (renderHeight > maxPhotoHeight) {
                        renderHeight = maxPhotoHeight;
                        renderWidth = renderHeight * (photo.aspect || 1);
                    }
                    const cellX = margin + slotIndex * (cellWidth + cellGap);
                    const photoX = cellX + ((cellWidth - renderWidth) / 2);
                    doc.addImage(photo.url, 'JPEG', photoX, y, renderWidth, renderHeight);
                });
            }

            if (data.actionPlan.length > 0) {
                doc.addPage(); y = margin; doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0); doc.text('DANDO UM PASSO ADIANTE...', pageWidth / 2, y, { align: 'center' }); y += 12;
                doc.autoTable({ startY: y, rowPageBreak: 'avoid', head: [['AÇÃO', 'RESPONSÁVEL', 'SETOR', 'PRAZO PARA FINALIZAÇÃO']], body: data.actionPlan.map(item => [item.action, item.responsible, item.sector, item.deadline]), theme: 'grid', headStyles: { fillColor: [0, 69, 133], font: 'helvetica', fontSize: 12, cellPadding: 2, halign: 'center', valign: 'middle' }, styles: { font: 'helvetica', fontSize: 12, cellPadding: 2.5, halign: 'left', valign: 'top', overflow: 'linebreak' }, columnStyles: {0:{cellWidth:90},1:{cellWidth:60},2:{cellWidth:55},3:{cellWidth:62}} });
                let noteY = (doc.lastAutoTable?.finalY || y) + 10; if (noteY > pageBottom) { doc.addPage(); noteY = margin; }
                doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(40, 40, 40); doc.text('VIDE EXEMPLOS 2 E 3 NA PÁGINA SEGUINTE.', margin, noteY);
            }

            doc.addPage(); doc.addImage('assets/images/exemplo_mapeamento.png', 'PNG', margin, margin, pageWidth - (2 * margin), pageHeight - (2 * margin));
            doc.save(`relatorio_visita_${data.visitLocal.replace(/\s+/g, '_') || 'geral'}.pdf`);
        } catch (error) { console.error("Erro:", error); alert("Erro ao gerar PDF."); }
    }

    // --- LISTENERS EXTRAS ---
    if (responsibleSelect) {
        responsibleSelect.addEventListener('change', (e) => {
            const val = e.target.value.toUpperCase();
            if (val) { renderTable(meetingItems.filter(i => i.responsible && i.responsible.toUpperCase() === val)); } 
            else { tableBody.innerHTML = ''; }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if(responsibleSelect) responsibleSelect.value = ''; 
            tableBody.innerHTML = ''; minutesOutput.innerHTML = ''; clearReadyFileEdit();
        });
    }

    if(openReadyFileBtn) openReadyFileBtn.addEventListener('click', () => readyFileInput.click());
    if(readyFileInput) readyFileInput.addEventListener('change', handleReadyFileUpload);
    if(downloadEditedFileBtn) downloadEditedFileBtn.addEventListener('click', downloadEditedReadyFile);
    if(clearReadyFileBtn) clearReadyFileBtn.addEventListener('click', clearReadyFileEdit);
    if(openEvidenceFileBtn) openEvidenceFileBtn.addEventListener('click', () => evidenceFileInput.click());
    if(evidenceFileInput) evidenceFileInput.addEventListener('change', handleEvidenceFileUpload);
    if(openGroupFileBtn) openGroupFileBtn.addEventListener('click', () => groupFileInput.click());
    if(groupFileInput) groupFileInput.addEventListener('change', handleGroupFileUpload);

    evaluationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const allRows = Array.from(tableBody.querySelectorAll('tr:not(.section-header):not(.theme-header)'));
        if (allRows.length === 0) { alert('Filtre por um responsável.'); return; }
        generateMinutes(allRows);
    });

    openEvidenceCameraBtn.addEventListener('click', () => openCamera('evidence'));
    openGroupCameraBtn.addEventListener('click', () => openCamera('group'));
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    captureBtn.addEventListener('click', capturePhoto);
    flipCameraBtn.addEventListener('click', () => { currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user'; startStream(); });
    useSinglePhotoBtn.addEventListener('click', useSingleCapturedPhoto);
    retakeSinglePhotoBtn.addEventListener('click', retakeSinglePhoto);
    doneMultiShotBtn.addEventListener('click', saveMultiShotPhotos);

    loadDataAndInitialize();
});