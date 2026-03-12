// --- Função Global para Limpar Seleção (Fora do DOMContentLoaded para acesso global) ---
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

    // --- NOVAS VARIÁVEIS (UPLOAD/GALERIA) ---
    const openEvidenceFileBtn = document.getElementById('open-evidence-file-btn');
    const evidenceFileInput = document.getElementById('evidence-file-input');
    const openGroupFileBtn = document.getElementById('open-group-file-btn');
    const groupFileInput = document.getElementById('group-file-input');
    const imagePreviewContainer = document.getElementById('image-preview-container'); 

    // --- Variáveis de Estado ---
    let meetingItems = [];
    let currentMinutesData = [];
    
    // Armazenamos objetos { url: string, aspect: number }
    let uploadedImages = []; // Para fotos
    let groupPhotoImageData = null; // Para foto da equipe
    
    // Variáveis de estado da câmera
    let tempCapturedImages = []; 
    let currentStream = null;
    let currentCameraTarget = null; 
    let currentFacingMode = 'environment'; 

    // --- Funções Principais da Aplicação ---

    async function loadDataAndInitialize() {
        try {
            const response = await fetch('assets/data/data.json');
            if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            meetingItems = await response.json();
            populateResponsibleDatalist();
            tableBody.innerHTML = ''; 
        } catch (error) {
            console.error('Erro ao carregar os dados:', error);
            minutesOutput.textContent = 'Não foi possível carregar os dados. Verifique se o arquivo data.json existe.';
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

    // --- FUNÇÃO RENDER TABLE ATUALIZADA COM O BOTÃO LIMPAR ---
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
            
            // --- CRIAÇÃO DA LINHA PRINCIPAL (Com botão limpar) ---
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

                        <button type="button" class="btn-limpar" onclick="limparSelecao('evaluation-${uniqueIdCounter}')" title="Limpar seleção">✕</button>
                    </div>
                </td>
                <td data-label="Evidências"><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                <td data-label="Propostas"><textarea name="proposals" placeholder="Propostas..."></textarea></td>
            `;
            tableBody.appendChild(mainRow);

            // --- CRIAÇÃO DOS SUBITENS (Com botão limpar) ---
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

                            <button type="button" class="btn-limpar" onclick="limparSelecao('evaluation-${uniqueIdCounter}')" title="Limpar seleção">✕</button>
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
            
            const visitObservationsTextarea = document.getElementById('visit-observations-textarea');
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
            if (downloadPdfBtn) {
                downloadPdfBtn.addEventListener('click', () => generatePdfDocument(fullReportData));
            }

            const downloadWordBtn = document.getElementById('download-word-btn');
            if (downloadWordBtn) {
                downloadWordBtn.addEventListener('click', () => generateWordDocument(fullReportData));
            }

        } catch (error) {
            console.error("ERRO AO GERAR A ATA:", error);
            minutesOutput.innerHTML = `<p style="color: red; font-weight: bold;">Ocorreu um erro ao gerar a ata. Verifique o console (F12).</p>`;
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
            html += `<h4>Fotos</h4><p>${data.evidencePhotos.length} fotos anexadas.</p>`;
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
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatWordList(text) {
        if (!text || text.trim() === '') return '';
        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length === 0) return '';
        return `<ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
    }

    function imageToDataUrl(path) {
        return fetch(path)
            .then(response => {
                if (!response.ok) throw new Error('Falha ao carregar imagem');
                return response.blob();
            })
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .catch(() => null);
    }

    function sanitizeFileName(text) {
        return (text || 'geral')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    function formatBulletListHtml(text) {
        if (!text || text.trim() === '') return '';
        const items = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (!items.length) return '';
        return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

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
                    <td class='highlight-cell'>${escapeHtml(item.evaluation || '')}</td>
                    <td class='highlight-cell'>${formatBulletListHtml(item.evidences) || '&nbsp;'}</td>
                    <td class='highlight-cell'>${formatBulletListHtml(item.proposals) || '&nbsp;'}</td>
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

            const observationsHtml = (data.visitObservations || '')
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => `<p>• ${escapeHtml(line)}</p>`)
                .join('');

            const evidencePhotos = data.evidencePhotos || [];
            const evidencePhotosRowsHtml = [];
            for (let i = 0; i < evidencePhotos.length; i += 2) {
                const left = evidencePhotos[i];
                const right = evidencePhotos[i + 1];
                evidencePhotosRowsHtml.push(`
                    <tr>
                        <td class='photo-cell'>${left ? `<img src='${left.url}' alt='Foto'>` : '&nbsp;'}</td>
                        <td class='photo-cell'>${right ? `<img src='${right.url}' alt='Foto'>` : '&nbsp;'}</td>
                    </tr>
                `);
            }
            const evidencePhotosHtml = evidencePhotosRowsHtml.join('');

            const groupPhotoHtml = data.groupPhoto?.url
                ? `<img src='${data.groupPhoto.url}' alt='Foto da equipe' class='group-photo'>`
                : `<p>Sem foto da equipe.</p>`;

            const wordHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office'
                      xmlns:w='urn:schemas-microsoft-com:office:word'
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>Relatório de Visita</title>
                    <style>
                        @page { size: A4 landscape; margin: 12mm; }
                        body { font-family: Arial, sans-serif; font-size: 10pt; color: #222; }
                        .page { page-break-after: always; }
                        .page:last-child { page-break-after: auto; }
                        .cover { text-align: center; position: relative; min-height: 180mm; }
                        .cover-logos { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; }
                        .cover-logos img { height: 18mm; object-fit: contain; }
                        .cover-title { margin-top: 20mm; font-size: 26pt; font-weight: 700; color: #ffffff; background: #266c93; padding: 5mm; display: inline-block; }
                        .cover-subtitle { margin-top: 8mm; font-size: 14pt; font-weight: 700; }
                        .cover-meta { margin-top: 10mm; font-size: 12pt; font-weight: 700; }
                        .bar-title { background: #266c93; color: #fff; font-weight: 700; padding: 2.5mm; border-radius: 2mm; margin: 0 0 2mm 0; }
                        .block { margin-bottom: 4mm; }
                        .section-title { margin: 0 0 2mm 0; font-size: 14pt; font-weight: 700; text-align: center; }
                        .separator { border-top: 1px solid #000; margin: 3mm 0; }
                        table { border-collapse: collapse; width: 100%; margin-top: 2mm; }
                        th, td { border: 1px solid #aaa; padding: 2mm; vertical-align: top; font-size: 8.5pt; }
                        th { background: #287eb8; color: #fff; text-align: center; }
                        .highlight-head { background: #8fcf9b; color: #1f4d2e; }
                        .highlight-cell { background: #f2fbf5; }
                        ul { margin: 0; padding-left: 4mm; }
                        .photo-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
                        .photo-cell { width: 50%; border: 1px solid #ddd; padding: 2mm; text-align: center; vertical-align: middle; }
                        .photo-cell img { width: 100%; height: auto; display: block; margin: 0 auto; }
                        .group-photo { width: 70%; height: auto; display: block; margin: 0 auto 4mm auto; }
                        .annex-img { width: 100%; height: auto; display: block; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class='page cover'>
                        <div class='cover-logos'>
                            ${logoHspmDataUrl ? `<img src='${logoHspmDataUrl}' alt='Logo HSPM'>` : '<span></span>'}
                            ${logoSpDataUrl ? `<img src='${logoSpDataUrl}' alt='Logo SP'>` : '<span></span>'}
                        </div>
                        <p style='font-size:12pt; font-weight:700; margin:0;'>HOSPITAL DO SERVIDOR PÚBLICO MUNICIPAL</p>
                        <p style='font-size:10pt; margin:1mm 0 0 0;'>ASSESSORIA DE PLANEJAMENTO ESTRATÉGICO E QUALIDADE</p>
                        <div class='cover-title'>AUTO AVALIAÇÃO</div>
                        <div class='cover-subtitle'>ATA DE REGISTRO DA VISITA DE QUALIDADE</div>
                        <div class='cover-meta'>LOCAL: ${escapeHtml(data.visitLocal || 'Não informado')}</div>
                        <div class='cover-meta'>DATA: ${escapeHtml(data.visitDate || 'Não informada')}</div>
                        <div class='cover-meta'>HORÁRIO: ${escapeHtml(data.visitTime || 'Não informado')}</div>
                    </div>

                    <div class='page'>
                        <div class='block'>
                            <div class='bar-title'>PARTICIPANTES:</div>
                            <p>${escapeHtml(data.participants || 'Nenhum participante listado.')}</p>
                        </div>
                        <div class='block'>
                            <div class='bar-title'>ASSUNTO DA REUNIÃO:</div>
                            <p><strong>Visita para auditoria de itens Roteiro do CQH</strong></p>
                        </div>
                        <div class='block'>
                            ${groupPhotoHtml}
                            <p><strong>Roteiro:</strong> Em anexo</p>
                            <p><strong>Fotos:</strong> Em anexo</p>
                            <div class='separator'></div>
                            <p><strong>A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH. Foram mostradas evidências dos itens, conforme descrito abaixo e anexamos uma proposta para dar um passo adiante para a próxima visita.</strong></p>
                        </div>
                        <div class='block'>
                            <div class='bar-title'>PRÓXIMA VISITA:</div>
                            <p><strong>${escapeHtml(data.nextVisit || 'Não definida.')}</strong></p>
                        </div>
                    </div>

                    <div class='page'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Seção</th>
                                    <th>Tema</th>
                                    <th>Item</th>
                                    <th>Descrição do Item</th>
                                    <th>Subitem</th>
                                    <th>Descrição do Subitem</th>
                                    <th>Nível de Exigência</th>
                                    <th class='highlight-head'>Avaliação</th>
                                    <th class='highlight-head'>Evidências</th>
                                    <th class='highlight-head'>Propostas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml || `<tr><td colspan='10'>Sem itens preenchidos.</td></tr>`}
                            </tbody>
                        </table>
                    </div>

                    ${observationsHtml ? `
                    <div class='page'>
                        <div class='bar-title'>OBSERVAÇÕES DA VISITA:</div>
                        ${observationsHtml}
                    </div>` : ''}

                    ${(data.evidencePhotos || []).length ? `
                    <div class='page'>
                        <table class='photo-table'>${evidencePhotosHtml}</table>
                    </div>` : ''}

                    <div class='page'>
                        <h3 class='section-title'>DANDO UM PASSO ADIANTE...</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>AÇÃO</th>
                                    <th>RESPONSÁVEL</th>
                                    <th>SETOR</th>
                                    <th>PRAZO PARA FINALIZAÇÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${actionRowsHtml || `<tr><td colspan='4'>Sem ações definidas.</td></tr>`}
                            </tbody>
                        </table>
                        <p style='margin-top: 5mm; font-weight:700;'>Vide exemplos na página seguinte.</p>
                    </div>

                    <div class='page'>
                        <h3 class='section-title'>ANEXO - MAPEAMENTO DE PROCESSOS</h3>
                        ${mapImageDataUrl ? `<img src='${mapImageDataUrl}' class='annex-img' alt='Mapeamento de processos'>` : '<p>Imagem do mapeamento não disponível.</p>'}
                    </div>
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
            console.error('Erro ao gerar documento Word:', error);
            alert('Não foi possível gerar o arquivo Word. Verifique o console (F12).');
        }
    }

    // --- FUNÇÕES DE PROCESSAMENTO DE ARQUIVO (GALERIA) ---

    function handleEvidenceFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Carrega a imagem para pegar largura/altura (aspect ratio)
                const img = new Image();
                img.onload = function() {
                    const aspectRatio = img.width / img.height;
                    const photoData = { 
                        url: e.target.result, 
                        aspect: aspectRatio 
                    };
                    
                    // Adiciona ao array global
                    uploadedImages.push(photoData);
                    // Atualiza a visualização
                    renderImagePreviews(); 
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        });
        
        event.target.value = ''; // Limpa o input
    }

    function handleGroupFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.width / img.height;
                
                groupPhotoImageData = { 
                    url: e.target.result, 
                    aspect: aspectRatio 
                };

                // Atualiza o HTML da preview
                groupPhotoPreviewContainer.innerHTML = `
                    <div class="image-preview-wrapper">
                        <img src="${groupPhotoImageData.url}" alt="Foto da equipe" style="max-width: 100%; border-radius: 8px;">
                        <button type="button" class="remove-image-btn" onclick="removeGroupPhoto()">&times;</button>
                    </div>
                `;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    // Função global para ser acessada pelo onclick no HTML gerado dinamicamente
    window.removeGroupPhoto = function() {
        groupPhotoImageData = null;
        groupPhotoPreviewContainer.innerHTML = '';
    };

    // --- LÓGICA DA CÂMERA ---
    
    async function startStream() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        try {
            currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: { exact: currentFacingMode } }
            });
        } catch (err) {
            console.warn(`Modo ${currentFacingMode} falhou, tentando o oposto.`);
            currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: { exact: currentFacingMode } }
                });
            } catch (err2) {
                console.warn(`Modo oposto falhou, tentando qualquer câmera.`);
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (err3) {
                      console.error("Nenhuma câmera encontrada: ", err3);
                      alert("Nenhuma câmera foi encontrada no dispositivo. Verifique as permissões do navegador.");
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
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        cameraModal.style.display = 'none';
        flipCameraBtn.style.display = 'none'; 
        currentCameraTarget = null;
        tempCapturedImages = [];
        filmStripContainer.innerHTML = '';
    }

    function capturePhoto() {
        const context = snapshotCanvas.getContext('2d');
        snapshotCanvas.width = videoFeed.videoWidth;
        snapshotCanvas.height = videoFeed.videoHeight;
        context.drawImage(videoFeed, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
        
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.9);
        const aspectRatio = snapshotCanvas.width / snapshotCanvas.height;
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
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.9);
        const aspectRatio = snapshotCanvas.width / snapshotCanvas.height;
        
        groupPhotoImageData = { url: imageDataUrl, aspect: aspectRatio };
        
        groupPhotoPreviewContainer.innerHTML = `
            <div class="image-preview-wrapper">
                <img src="${groupPhotoImageData.url}" alt="Foto da equipe">
            </div>
        `;
        closeModal();
    }

    function saveMultiShotPhotos() {
        uploadedImages = [...uploadedImages, ...tempCapturedImages];
        renderImagePreviews(); 
        closeModal();
    }
    
    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = ''; 
        uploadedImages.forEach((imageData, index) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-preview-wrapper');

            const img = document.createElement('img');
            img.src = imageData.url; 
            img.alt = `Pré-visualização da imagem ${index + 1}`;

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-image-btn');
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remover imagem';
            removeBtn.onclick = () => {
                uploadedImages.splice(index, 1); 
                renderImagePreviews(); 
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            imagePreviewContainer.appendChild(wrapper);
        });
    }

    // --- GERADOR DE PDF ---
    
    function generatePdfDocument(data) {
        try {
            // --- 1. VERIFICAÇÃO INICIAL E CONFIGURAÇÃO DO DOCUMENTO ---
            if (typeof window.jspdf.jsPDF.API.autoTable !== 'function') {
                alert('Erro Crítico: A biblioteca jsPDF-AutoTable não foi carregada.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');

            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const pageBottom = pageHeight - margin;

            // Cores padrão para títulos destacados
            const azulTitulo = [38, 108, 147]; // Azul escuro
            const brancoTexto = [255, 255, 255]; // Texto branco

            // --- PÁGINA 1: CAPA ---
            const laranjaPrincipal = [245, 127, 23];
            const verdeEscurecido = [180, 230, 140];
            const cinzaSombra = [189, 189, 189];
            const logoHSPM = 'assets/images/logo-hspm.jpg';
            const logoSP = 'assets/images/logo-prefeitura-sp.jpg';
            
            doc.addImage(logoHSPM, 'JPG', margin, 8, 30, 15);
            doc.addImage(logoSP, 'JPG', pageWidth - margin - 25, 8, 25, 25);
            
            doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
            doc.text('HOSPITAL DO SERVIDOR PÚBLICO MUNICIPAL', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('ASSESSORIA DE PLANEJAMENTO ESTRATÉGICO E QUALIDADE', pageWidth / 2, 21, { align: 'center' });
            
            // Elementos gráficos de fundo
            doc.setFillColor.apply(null, cinzaSombra); doc.circle(pageWidth / 2 + 2, pageHeight / 2 + 2, 80, 'F');
            doc.setFillColor.apply(null, laranjaPrincipal); doc.circle(pageWidth / 2, pageHeight / 2, 80, 'F');
            doc.setFillColor.apply(null, verdeEscurecido); 
            const retanguloVerdeY = pageHeight / 2 - 8;
            doc.rect(margin + 30, retanguloVerdeY, pageWidth - (margin * 2) - 60, 12, 'F');

            // Quadro Azul em "AUTO AVALIAÇÃO"
            doc.setFillColor.apply(null, azulTitulo);
            const rectWidth = 140;
            const rectHeight = 18;
            const rectX = (pageWidth - rectWidth) / 2;
            const rectY = (pageHeight / 2) - 28; 
            doc.roundedRect(rectX, rectY, rectWidth, rectHeight, 2, 2, 'F'); 

            doc.setFontSize(32); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
            doc.text('AUTO AVALIAÇÃO', pageWidth / 2, rectY + 13, { align: 'center' }); 

            // "ATA DE REGISTRO..." em Negrito
            doc.setFontSize(12); doc.setTextColor(51, 51, 51); doc.setFont('helvetica', 'bold'); 
            doc.text('ATA DE REGISTRO DA VISITA DE QUALIDADE', pageWidth / 2, pageHeight / 2 + 1, { align: 'center' });

            doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
            doc.text(`LOCAL: ${data.visitLocal || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
            doc.text(`DATA: ${data.visitDate || 'Não informada'}`, pageWidth / 2, pageHeight / 2 + 33, { align: 'center' });
            doc.text(`HORÁRIO: ${data.visitTime || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 41, { align: 'center' });


            // --- PÁGINA 2: DETALHES (Compactada para caber em uma página) ---
            doc.addPage();
            let y = margin;

            const barHeight = 7; // Barra colorida mais fina
            const blockSpacing = 4; // Espaço menor entre blocos

            // 1. PARTICIPANTES
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(10); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PARTICIPANTES:', margin + 3, y + 5); 
            
            y += barHeight + 3; // Pequeno espaço
            
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(9);
            // Ajuste para caber em uma linha se possível, ou quebra controlada
            const participantsText = doc.splitTextToSize(data.participants || 'Nenhum participante listado.', pageWidth - (margin * 2) - 5); 
            doc.text(participantsText, margin + 2, y); 
            y += participantsText.length * 4 + blockSpacing; 

            // 2. ASSUNTO DA REUNIÃO
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(10); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('ASSUNTO DA REUNIÃO:', margin + 3, y + 5);
            
            y += barHeight + 3; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(9);
            doc.text('Visita para auditoria de itens Roteiro do CQH', margin + 2, y); 
            y += 5 + blockSpacing; 

            // 3. FOTO DA EQUIPE (Controlada para não estourar a página)
            if (data.groupPhoto && data.groupPhoto.url) { 
                // Define limites máximos
                const maxPhotoHeight = 75; // Máximo 7,5cm de altura
                const maxPhotoWidth = 110; // Largura desejada
                
                let renderWidth = maxPhotoWidth;
                let renderHeight = data.groupPhoto.aspect ? (renderWidth / data.groupPhoto.aspect) : 70;

                // Se a altura calculada for maior que o permitido, reduz a largura para ajustar a altura
                if (renderHeight > maxPhotoHeight) {
                    renderHeight = maxPhotoHeight;
                    renderWidth = renderHeight * data.groupPhoto.aspect;
                }
                
                // Centraliza
                const imgX = (pageWidth - renderWidth) / 2;
                doc.addImage(data.groupPhoto.url, 'PNG', imgX, y, renderWidth, renderHeight);
                y += renderHeight + 5; // Espaço após a foto
            } else {
                y += 10; // Espaço se não tiver foto
            }
            
            // 4. Roteiro e Fotos (Texto lateral)
            doc.setFontSize(9); 
            doc.setFont('helvetica', 'bold'); doc.text('Roteiro:', margin, y);
            doc.setFont('helvetica', 'normal'); doc.text('Em anexo', margin + 15, y); 
            y += 5;

            doc.setFont('helvetica', 'bold'); doc.text('Fotos:', margin, y);
            doc.setFont('helvetica', 'normal'); doc.text('Em anexo', margin + 15, y); 
            y += 8; // Espaço antes do parágrafo
            
            // 5. PARÁGRAFO DESCRITIVO (Linha preta separadora opcional ou apenas espaço)
            doc.setDrawColor(0); doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y); // Linha separadora
            y += 5;

            const paragraph = "A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH. Foram mostradas evidências dos itens, conforme descrito abaixo e anexamos uma proposta \npara dar um passo adiante para a próxima visita.";
            const paragraphLines = doc.splitTextToSize(paragraph, pageWidth - (margin * 2));
            
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
            doc.text(paragraphLines, margin, y);
            y += (paragraphLines.length * 4) + 8; // Espaço para o próximo bloco

            // 6. PRÓXIMA VISITA
            // Verifica se cabe, senão adiciona página (mas com o ajuste acima deve caber)
            if (y + barHeight + 10 > pageBottom) { doc.addPage(); y = margin; }

            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 2, 2, 'F');
            doc.setFontSize(10); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PRÓXIMA VISITA:', margin + 3, y + 5);
            y += barHeight + 4; 
            
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(9);
            doc.text(data.nextVisit || 'Não definida.', margin + 2, y); 
            y += 10;
            
            
            // --- INÍCIO DA TABELA ---
            doc.addPage(); 
            let finalY = margin; 

            // Tabela Principal
            if (data.tableData.length > 0) {
                doc.autoTable({
                    startY: finalY,
                    rowPageBreak: 'avoid', 
                
                      head: [[
                        'Seção',
                        'Tema',
                        'Item',
                        'Descrição\ndo Item',
                        'Subitem',
                        'Descrição do\nSubitem',
                        'Nível de Exigência',
                        'Avaliação',
                        'Evidências',
                        'Propostas'
                    ]],
                     body: data.tableData.map(item => {
                        const formatAsList = (text) => {
                            if (!text || text.trim() === '') return ''; 
                            return text.split('\n').map(line => line.trim()).filter(line => line !== '').map(line => `• ${line}`).join('\n'); 
                        };
                        return [
                            item.section, 
                            item.theme, 
                            item.item_number,
                            item.description, 
                            item.subitem_number, 
                            item.subitem_description,
                            item.exigency_level, 
                            item.evaluation,
                            formatAsList(item.evidences), 
                            formatAsList(item.proposals) 
                        ];
                    }),
                    theme: 'grid',
                    headStyles: { 
                       fillColor: [40, 126, 184],
                        fontSize: 6.8,
                        cellPadding: 1.2,
                        overflow: 'linebreak',
                        halign: 'center',
                        valign: 'middle'
                    },
                    styles: { 
                        fontSize: 8, cellPadding: 2.5, 
                        overflow: 'linebreak', halign: 'center', valign: 'middle'
                    },
                    columnStyles: {
                        0: { cellWidth: 25 }, 
                        1: { cellWidth: 18 }, 
                        2: { cellWidth: 12 },  
                        3: { cellWidth: 40 }, 
                        4: { cellWidth: 15 }, 
                        5: { cellWidth: 31 }, 
                        6: { cellWidth: 18 }, 
                        7: { cellWidth: 16, fillColor: [234, 248, 238] }, 
                        8: { cellWidth: 46, halign: 'left', fillColor: [242, 251, 245] }, 
                        9: { cellWidth: 46, halign: 'left', fillColor: [242, 251, 245] }, 
                    },
                    didParseCell: (hookData) => {
                        if (hookData.section === 'head' && [7, 8, 9].includes(hookData.column.index)) {
                            hookData.cell.styles.fillColor = [143, 207, 155];
                            hookData.cell.styles.textColor = [31, 77, 46];
                        }
                    },

                    didDrawPage: (hookData) => { 
                        finalY = hookData.cursor.y;
                    }
                });
            }
            
            // Seção OBSERVAÇÕES DA VISITA (Página Exclusiva)
            if (data.visitObservations && data.visitObservations.trim() !== '') {
                // Força nova página para as observações
                doc.addPage(); 
                finalY = margin; 
                
                doc.setFillColor.apply(null, azulTitulo);
                doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 10, 3, 3, 'F');
                
                doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
                doc.text('OBSERVAÇÕES DA VISITA :', margin + 5, finalY + 6.5); 
                
                finalY += 18; // Espaço após o título
                
                doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
                
                const lines = data.visitObservations.split('\n');
                lines.forEach(line => {
                    if (line.trim() !== '') {
                        // Verifica se precisa de mais uma página para o texto longo
                        if (finalY > pageHeight - margin) { 
                            doc.addPage(); 
                            finalY = margin; 
                        }
                        
                        const textLines = doc.splitTextToSize(`• ${line.trim()}`, pageWidth - (margin * 2) - 5);
                        doc.text(textLines, margin + 5, finalY); 
                        finalY += textLines.length * 5;
                    }
                });
            }

            // --- PÁGINA FOTOS ---
            if (data.evidencePhotos && data.evidencePhotos.length > 0) {
                doc.addPage(); 
                y = margin;
                // Título apenas na primeira página de fotos
                doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
                doc.text('FOTOS', pageWidth / 2, y, { align: 'center' }); y += 15;
                
                const imagesPerRow = 3; const imgWidth = 85; 
                const horizontalGap = 5; const verticalGap = 10; let photoX = margin;
                let maxHeightInRow = 0;

                data.evidencePhotos.forEach((photo, index) => {
                    const imgHeight = imgWidth / photo.aspect;

                    // Lógica de quebra de linha (Grid)
                    if (index > 0 && index % imagesPerRow === 0) {
                        photoX = margin;
                        y += maxHeightInRow + verticalGap;
                        maxHeightInRow = 0;
                    }

                    // Lógica de quebra de página (MODIFICADA)
                    if (y + imgHeight > pageBottom) {
                        doc.addPage(); 
                        y = margin;          // Volta para o topo da margem
                        photoX = margin;     // Volta para a esquerda
                        maxHeightInRow = 0;  // Reseta altura da linha
                        // Texto removido aqui conforme solicitado
                    }

                    doc.addImage(photo.url, 'JPEG', photoX, y, imgWidth, imgHeight);
                    photoX += imgWidth + horizontalGap;
                    maxHeightInRow = Math.max(maxHeightInRow, imgHeight);
                });
                y += maxHeightInRow + 15; 
            }

            // --- DANDO UM PASSO ADIANTE (Página Exclusiva) ---
            if (data.actionPlan.length > 0) {
                // Força SEMPRE uma nova página antes de começar o Dando um Passo Adiante, para garantir que fique separado do conteúdo anterior
                doc.addPage(); 
                y = margin; 
                
                doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
                doc.text('DANDO UM PASSO ADIANTE...', pageWidth / 2, y, { align: 'center' }); y += 10;
                
                doc.autoTable({
                    startY: y,
                    rowPageBreak: 'avoid', // Evita quebra de linhas no meio da célula
                    head: [['AÇÃO', 'RESPONSÁVEL', 'SETOR', 'PRAZO PARA FINALIZAÇÃO']],
                    body: data.actionPlan.map(item => [item.action, item.responsible, item.sector, item.deadline]),
                    theme: 'grid',
                     headStyles: {
                        fillColor: [0, 69, 133],
                        fontSize: 8,
                        cellPadding: 1.5,
                        overflow: 'linebreak',
                        halign: 'center',
                        valign: 'middle'
                    },
                    styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle' },
                });

                  let noteY = (doc.lastAutoTable?.finalY || y) + 14;
                if (noteY > pageBottom) {
                    doc.addPage();
                    noteY = margin;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(40, 40, 40);
                doc.text('VIDE EXEMPLOS NA PÁGINA SEGUINTE.', margin, noteY);
            }

            // --- PÁGINA FINAL: ANEXO ---
            doc.addPage();
            
            const imgExemplo = 'assets/images/exemplo_mapeamento.png';
            doc.addImage(imgExemplo, 'PNG', margin, margin, pageWidth - (2 * margin), pageHeight - (2 * margin));
            
            doc.save(`relatorio_visita_${data.visitLocal.replace(/\s+/g, '_') || 'geral'}.pdf`);

        } catch (error) {
            console.error("Erro detalhado ao gerar o PDF:", error);
            alert("Ocorreu um erro inesperado ao gerar o PDF. Verifique o console (F12).");
        }
    }

    // Event Listeners
    if (responsibleSelect) {
        responsibleSelect.addEventListener('change', (event) => {
            const searchText = event.target.value.toUpperCase();
            if (searchText) {
                const filteredItems = meetingItems.filter(item =>
                    item.responsible && item.responsible.toUpperCase() === searchText
                );
                renderTable(filteredItems);
            } else {
                tableBody.innerHTML = '';
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if(responsibleSelect) responsibleSelect.value = ''; 
            tableBody.innerHTML = '';
            minutesOutput.innerHTML = '';
            uploadedImages = [];
            renderImagePreviews();
            if(responsibleSelect) responsibleSelect.focus();
        });
    }

    // --- NOVOS LISTENERS PARA UPLOAD DE ARQUIVOS ---
    
    // Botão Galeria Evidências -> Clica no input invisível
    if(openEvidenceFileBtn) {
        openEvidenceFileBtn.addEventListener('click', () => evidenceFileInput.click());
    }
    // Quando o usuário seleciona o arquivo (Evidências)
    if(evidenceFileInput) {
        evidenceFileInput.addEventListener('change', handleEvidenceFileUpload);
    }

    // Botão Galeria Equipe -> Clica no input invisível
    if(openGroupFileBtn) {
        openGroupFileBtn.addEventListener('click', () => groupFileInput.click());
    }
    // Quando o usuário seleciona o arquivo (Equipe)
    if(groupFileInput) {
        groupFileInput.addEventListener('change', handleGroupFileUpload);
    }

    // --- FIM DOS NOVOS LISTENERS ---

    evaluationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const allRows = Array.from(tableBody.querySelectorAll('tr:not(.section-header):not(.theme-header)'));
        if (allRows.length === 0) {
            alert('Filtre por um responsável para exibir os itens antes de gerar a ata.');
            return;
        }
        const allEvaluationsAreFilled = allRows.every(row => {
            return row.querySelector('input[name^="evaluation-"]:checked') !== null;
        });
        if (!allEvaluationsAreFilled) {
            const confirmContinue = confirm('Atenção: Nem todos os itens foram avaliados. Deseja gerar a ata mesmo assim com os itens preenchidos?');
            if (!confirmContinue) {
                return;
            }
        }
        generateMinutes(allRows);
    });

    openEvidenceCameraBtn.addEventListener('click', () => openCamera('evidence'));
    openGroupCameraBtn.addEventListener('click', () => openCamera('group'));
    
    // Correção: usando closeModalBtn em vez de cancelCameraBtn
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    captureBtn.addEventListener('click', capturePhoto);
    
    flipCameraBtn.addEventListener('click', () => {
        currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
        startStream();
    });
    
    useSinglePhotoBtn.addEventListener('click', useSingleCapturedPhoto);
    retakeSinglePhotoBtn.addEventListener('click', retakeSinglePhoto);
    doneMultiShotBtn.addEventListener('click', saveMultiShotPhotos);

    loadDataAndInitialize();
});