document.addEventListener('DOMContentLoaded', () => {
    // Variáveis de Elementos do DOM
    const evaluationForm = document.getElementById('evaluation-form');
    const responsibleSelect = document.getElementById('responsible-select');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const minutesOutput = document.getElementById('minutes-output');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const visitLocalInput = document.getElementById('visit-local');
    const visitDateInput = document.getElementById('visit-date');
    const visitTimeInput = document.getElementById('visit-time');
    const meetingParticipantsInput = document.getElementById('meeting-participants');
    const groupPhotoPreviewContainer = document.getElementById('group-photo-preview');
    const nextVisitDateInput = document.getElementById('next-visit-date');
    const nextVisitTimeInput = document.getElementById('next-visit-time');
    const nextVisitLocalInput = document.getElementById('next-visit-local');
    const actionPlanTableBody = document.querySelector('#action-plan-table tbody');
    
    // Variáveis da Câmera
    const cameraModal = document.getElementById('camera-modal');
    const videoFeed = document.getElementById('camera-feed');
    const snapshotCanvas = document.getElementById('camera-snapshot');
    const captureBtn = document.getElementById('capture-btn');
    const openEvidenceCameraBtn = document.getElementById('open-evidence-camera-btn');
    const openGroupCameraBtn = document.getElementById('open-group-camera-btn');
    const flipCameraBtn = document.getElementById('flip-camera-btn');
    const filmStripContainer = document.getElementById('film-strip-container');
    // Botões do modal
    const useSinglePhotoBtn = document.getElementById('use-single-photo-btn');
    const retakeSinglePhotoBtn = document.getElementById('retake-single-photo-btn');
    const doneMultiShotBtn = document.getElementById('done-multi-shot-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Variáveis de Estado
    let meetingItems = [];
    let currentMinutesData = [];
    let uploadedImages = [];
    let groupPhotoImageData = null; 
    // Variáveis de estado da câmera
    let tempCapturedImages = [];
    let currentStream = null;
    let currentCameraTarget = null;
    let currentFacingMode = 'environment';

    // Função debounce
    function debounce(func, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Funções Principais
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
        // Limpa o select, mantendo a primeira opção "Selecione"
        responsibleSelect.innerHTML = '<option value="">-- Selecione um responsável --</option>';
        responsibles.forEach(responsible => {
            const option = document.createElement('option');
            option.value = responsible;
            option.textContent = responsible; // Mostra o nome
            responsibleSelect.appendChild(option);
        });
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
                <td>${group.responsible || ''}</td>
                <td>${group.section || ''}</td>
                <td>${group.theme || ''}</td>
                <td>${group.item_number || ''}</td>
                <td class="truncate-text">${group.description || ''}</td>
                <td></td>
                <td></td> 
                <td>${group.exigency_level || ''}</td>
                <td>
                    <div class="evaluation-cell">
                        <input type="radio" id="eval-sim-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Sim">
                        <label for="eval-sim-${uniqueIdCounter}" class="radio-label">Sim</label>
                        <input type="radio" id="eval-nao-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Não">
                        <label for="eval-nao-${uniqueIdCounter}" class="radio-label">Não</label>
                        <input type="radio" id="eval-na-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="N/A">
                        <label for="eval-na-${uniqueIdCounter}" class="radio-label">N/A</label>
                    </div>
                </td>
                <td><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                <td><textarea name="proposals" placeholder="Propostas..."></textarea></td>
            `;
            tableBody.appendChild(mainRow);

            group.subitems.forEach(subitem => {
                uniqueIdCounter++;
                const subitemRow = document.createElement('tr');
                subitemRow.dataset.masterId = subitem.master_id;
                subitemRow.dataset.mainDescription = group.description || '';
                subitemRow.innerHTML = `
                    <td>${subitem.responsible || ''}</td>
                    <td>${subitem.section || ''}</td>
                    <td>${subitem.theme || ''}</td>
                    <td>${subitem.item_number || ''}</td>
                    <td class="truncate-text">${group.description || ''}</td> 
                    <td>${subitem.subitem_number || ''}</td>
                    <td class="truncate-text">${subitem.subitem_description || ''}</td> 
                    <td>${subitem.exigency_level || ''}</td>
                    <td>
                        <div class="evaluation-cell">
                            <input type="radio" id="eval-sim-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Sim">
                            <label for="eval-sim-${uniqueIdCounter}" class="radio-label">Sim</label>
                            <input type="radio" id="eval-nao-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="Não">
                            <label for="eval-nao-${uniqueIdCounter}" class="radio-label">Não</label>
                            <input type="radio" id="eval-na-${uniqueIdCounter}" name="evaluation-${uniqueIdCounter}" value="N/A">
                            <label for="eval-na-${uniqueIdCounter}" class="radio-label">N/A</label>
                        </div>
                    </td>
                    <td><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                    <td><textarea name="proposals" placeholder="Propostas..."></textarea></td>
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
            document.getElementById('download-pdf-btn').addEventListener('click', () => generatePdfDocument(fullReportData));

        } catch (error) {
            console.error("ERRO AO GERAR A ATA:", error);
            minutesOutput.innerHTML = `<p style="color: red; font-weight: bold;">Ocorreu um erro ao gerar a ata. Verifique o console (F12).</p>`;
        }
    }

    // gera apenas o HTML (para organizar melhor)
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
        html += `<h4>Plano de Ação</h4><p>${data.actionPlan.length} ações definidas.</p>`;
    }
    
    if (data.evidencePhotos.length > 0) {
        html += `<h4>Fotos de Evidência</h4><p>${data.evidencePhotos.length} fotos anexadas.</p>`;
        // O texto que causava o erro foi removido daqui.
    }
    
    html += `
        <div id="download-buttons" style="margin-top: 20px;">
            <button id="download-pdf-btn">Baixar .pdf</button>
        </div>`;
        
    return html;
}

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = ''; // Limpa as prévias existentes
        uploadedImages.forEach((imageData, index) => { // imageData agora é {url, aspect}
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-preview-wrapper');

            const img = document.createElement('img');
            img.src = imageData.url; // (.url)
            img.alt = `Pré-visualização da imagem ${index + 1}`;

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-image-btn');
            removeBtn.innerHTML = '&times;'; // 'x' character
            removeBtn.title = 'Remover imagem';
            removeBtn.onclick = () => {
                uploadedImages.splice(index, 1); // Remove do array
                renderImagePreviews(); // Re-renderiza as prévias
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            imagePreviewContainer.appendChild(wrapper);
        });
    }
    
    function generatePdfDocument(data) {
        try {
            // 1. VERIFICAÇÃO INICIAL E CONFIGURAÇÃO DO DOCUMENTO
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

            const azulTitulo = [38, 108, 147]; // Azul escuro
            const brancoTexto = [255, 255, 255]; // Texto branco

            // PÁGINA 1: CAPA
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
            doc.setFillColor.apply(null, cinzaSombra); doc.circle(pageWidth / 2 + 2, pageHeight / 2 + 2, 80, 'F');
            doc.setFillColor.apply(null, laranjaPrincipal); doc.circle(pageWidth / 2, pageHeight / 2, 80, 'F');
            doc.setFillColor.apply(null, verdeEscurecido); const retanguloVerdeY = pageHeight / 2 - 8;
            doc.rect(margin + 30, retanguloVerdeY, pageWidth - (margin * 2) - 60, 12, 'F');
            doc.setFontSize(32); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
            doc.text('AUTO AVALIAÇÃO', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
            doc.setFontSize(12); doc.setTextColor(51, 51, 51); doc.setFont('helvetica', 'normal');
            doc.text('ATA DE REGISTRO DA VISITA DE QUALIDADE', pageWidth / 2, pageHeight / 2 - 2, { align: 'center' });
            doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
            doc.text(`LOCAL: ${data.visitLocal || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
            doc.text(`DATA: ${data.visitDate || 'Não informada'}`, pageWidth / 2, pageHeight / 2 + 33, { align: 'center' });
            doc.text(`HORÁRIO: ${data.visitTime || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 41, { align: 'center' });

            // PÁGINA 2: DETALHES
            doc.addPage();
            let y = margin;
            
            const checkAddPage = (currentY, requiredHeight) => {
                if (currentY + requiredHeight > pageBottom) {
                    doc.addPage();
                    return margin; 
                }
                return currentY; 
            };

            const barHeight = 10;
            const textPadding = 7; 
            const blockSpacing = 12; 

            // PARTICIPANTES
            y = checkAddPage(y, barHeight + textPadding + 5 + blockSpacing); 
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 3, 3, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PARTICIPANTES:', margin + 5, y + 6.5); 
            y += barHeight + textPadding; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
            const participantsText = doc.splitTextToSize(data.participants || 'Nenhum participante listado.', pageWidth - (margin * 2) - 10); 
            doc.text(participantsText, margin + 5, y); 
            y += participantsText.length * 5 + blockSpacing; 

            // ASSUNTO DA REUNIÃO
            y = checkAddPage(y, barHeight + textPadding + 7 + blockSpacing);
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 3, 3, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('ASSUNTO DA REUNIÃO:', margin + 5, y + 6.5);
            y += barHeight + textPadding; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
            doc.text('Visita para auditoria de itens Roteiro do CQH', margin + 5, y); 
            y += 7 + blockSpacing; 

            // FOTO DA EQUIPE
            if (data.groupPhoto) {
                const imgExpectedHeight = 90 + 20 + 15; 
                y = checkAddPage(y, imgExpectedHeight);
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
                doc.text('FOTO DA EQUIPE:', pageWidth / 2, y, { align: 'center' });
                y += 8;
                const imgWidth = 120;
            // Calcula a altura correta
            // Se a proporção existir, calcula a altura, senão usa 90 como padrão.
                const imgHeight = data.groupPhoto.aspect ? (imgWidth / data.groupPhoto.aspect) : 90;
                const imgX = (pageWidth - imgWidth) / 2;
                doc.addImage(data.groupPhoto.url, 'PNG', imgX, y, imgWidth, imgHeight);
                y += imgHeight + 15;
            }
            
            // Roteiro, Fotos, Parágrafo (com verificação de página)
            y = checkAddPage(y, 30); 
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
            doc.text('Roteiro:', margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text('Em anexo', margin + 25, y); 
            y += 7;

            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0,0,0);
            doc.text('Fotos:', margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text('Em anexo', margin + 25, y); 
            y += 10;
            
            const paragraph = "A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH. Foram mostradas evidências dos itens, conforme descrito abaixo e anexamos uma proposta para dar um passo adiante para a próxima visita.";
            const paragraphLines = doc.splitTextToSize(paragraph, pageWidth - (margin * 2));
            const paragraphHeight = paragraphLines.length * 6 + blockSpacing;
            y = checkAddPage(y, paragraphHeight); 
            doc.setFont('helvetica', 'bold'); 
            doc.setTextColor(0, 0, 0);
            doc.text(paragraphLines, margin, y);
            y += paragraphHeight; 

            // PRÓXIMA VISITA
            const proximaVisitaHeight = barHeight + textPadding + 7 + blockSpacing;
            y = checkAddPage(y, proximaVisitaHeight);
            
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), barHeight, 3, 3, 'F');
            doc.setFontSize(12); doc.setTextColor.apply(null, brancoTexto); doc.setFont('helvetica', 'bold');
            doc.text('PRÓXIMA VISITA:', margin + 5, y + 6.5);
            y += barHeight + textPadding; 
            doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
            doc.text(data.nextVisit || 'Não definida.', margin + 5, y); 
            y += 15; 
            
            // INÍCIO DA TABELA (sempre em uma nova página)
            doc.addPage(); 
            let finalY = margin; 

            // Tabela Principal
            if (data.tableData.length > 0) {
                doc.autoTable({
                    startY: finalY,
                    head: [['Responsável', 'Seção', 'Tema', 'Item', 'Descrição do Item', 'Subitem', 'Descrição do Subitem', 'Nível de Exigência', 'Avaliação', 'Evidências', 'Propostas']],
                    body: data.tableData.map(item => {
                        const formatAsList = (text) => {
                            if (!text || text.trim() === '') return ''; 
                            return text.split('\n').map(line => line.trim()).filter(line => line !== '').map(line => `• ${line}`).join('\n'); 
                        };
                        return [
                            item.responsible, item.section, item.theme, item.item_number,
                            item.description, item.subitem_number, item.subitem_description,
                            item.exigency_level, item.evaluation,
                            formatAsList(item.evidences), 
                            formatAsList(item.proposals) 
                        ];
                    }),
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [40, 126, 184], fontSize: 9, 
                        halign: 'center', valign: 'middle'
                    },
                    styles: { 
                        fontSize: 8, cellPadding: 2.5, 
                        overflow: 'linebreak', halign: 'center', valign: 'middle'
                    },
                    columnStyles: {
                        9: { halign: 'left' }, 
                        10: { halign: 'left' },
                    },
                    didDrawPage: (hookData) => { 
                        finalY = hookData.cursor.y;
                    }
                });
            }
            
            // Seção "OBSERVAÇÕES DA VISITA"
            if (data.visitObservations && data.visitObservations.trim() !== '') {
                finalY += 10; 
                if (finalY > pageHeight - 40) { doc.addPage(); finalY = margin; }
                doc.setFillColor.apply(null, azulTitulo);
                doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 12, 3, 3, 'F');
                doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
                doc.text('OBSERVAÇÕES DA VISITA :', margin + 5, finalY + 8); finalY += 20;
                doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
                const lines = data.visitObservations.split('\n');
                lines.forEach(line => {
                    if (line.trim() !== '') {
                        if (finalY > pageHeight - margin) { doc.addPage(); finalY = margin; }
                        const textLines = doc.splitTextToSize(`• ${line.trim()}`, pageWidth - (margin * 2) - 5);
                        doc.text(textLines, margin + 5, finalY); finalY += textLines.length * 6;
                    }
                });
            }

        // PÁGINA FINAL: FOTOS E PLANO DE AÇÃO
        doc.addPage();
        y = margin;

        // Fotos de Evidência
        if (data.evidencePhotos.length > 0) {
            doc.setFontSize(18); doc.setFont('helvetica', 'bold');
            doc.text('FOTOS DE EVIDÊNCIA', pageWidth / 2, y, { align: 'center' }); y += 15;
            
            const imagesPerRow = 3;
            const imgWidth = 85; // Largura fixa
            const horizontalGap = 5;
            const verticalGap = 10;
            let photoX = margin;
            let maxHeightInRow = 0; // Para rastrear a foto mais alta na linha

            data.evidencePhotos.forEach((photo, index) => { // 'photo' é {url, aspect}
                // Calcula a altura desta foto
                const imgHeight = imgWidth / photo.aspect;
                // Se for a primeira imagem de uma nova linha
                if (index > 0 && index % imagesPerRow === 0) {
                    photoX = margin;
                    y += maxHeightInRow + verticalGap; // Pula para a próxima linha
                    maxHeightInRow = 0; // Reseta a altura da linha
                }

                // Se a foto (mesmo na linha atual) não couber na página, cria uma nova
                if (y + imgHeight > pageBottom) {
                    doc.addPage();
                    y = margin;
                    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
                    y += 15;
                    photoX = margin;
                    maxHeightInRow = 0;
                }

                doc.addImage(photo.url, 'PNG', photoX, y, imgWidth, imgHeight);
                photoX += imgWidth + horizontalGap;
                maxHeightInRow = Math.max(maxHeightInRow, imgHeight); // Atualiza a foto mais alta
            });
            
            // Adiciona a altura da última linha antes do próximo bloco
            y += maxHeightInRow + 10; 
        }

        // Plano de Ação (sem alteração)
        if (data.actionPlan.length > 0) {
            if (y > pageHeight - 60) { doc.addPage(); y = margin; } else { y += 15; }
            doc.setFontSize(18); doc.setFont('helvetica', 'bold');
            doc.text('PLANO DE AÇÃO', pageWidth / 2, y, { align: 'center' }); y += 10;
            doc.autoTable({
                startY: y,
                head: [['AÇÃO', 'RESPONSÁVEL', 'SETOR', 'PRAZO PARA FINALIZAÇÃO']],
                body: data.actionPlan.map(item => [item.action, item.responsible, item.sector, item.deadline]),
                theme: 'grid',
                headStyles: { fillColor: [0, 69, 133], fontSize: 10, halign: 'center', valign: 'middle' },
                styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle' },
            });
        }
        
        doc.save(`relatorio_visita_${data.visitLocal.replace(/\s+/g, '_') || 'geral'}.pdf`);

        } catch (error) {
            console.error("Erro detalhado ao gerar o PDF:", error);
            alert("Ocorreu um erro inesperado ao gerar o PDF. Verifique o console (F12).");
        }
    }
    
    function highlightEmptyEvaluations() {
        const allRows = Array.from(tableBody.querySelectorAll('tr:not(.section-header):not(.theme-header)'));
        let firstEmptyRow = null;

        allRows.forEach(row => {
            row.classList.remove('avaliacao-pendente');
            const isChecked = row.querySelector('input[name^="evaluation-"]:checked');
            if (!isChecked) {
                row.classList.add('avaliacao-pendente');
                if (!firstEmptyRow) {
                    firstEmptyRow = row;
                }
            }
        });

        if (firstEmptyRow) {
            firstEmptyRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }


    // EVENT LISTENERS
    responsibleSelect.addEventListener('change', (event) => {
        const searchText = event.target.value.toUpperCase();
        if (searchText) {
            const filteredItems = meetingItems.filter(item =>
                item.responsible && item.responsible.toUpperCase() === searchText // Busca exata
            );
            renderTable(filteredItems);
        } else {
            tableBody.innerHTML = '';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        responsibleSelect.value = ''; // Reseta o select
        tableBody.innerHTML = '';
        minutesOutput.innerHTML = '';
        uploadedImages = [];
        renderImagePreviews();
        responsibleSelect.focus();
    });

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
                highlightEmptyEvaluations();
                return;
            }
        }
        generateMinutes(allRows);
    });

    // LÓGICA DA CÂMERA (Virar Câmera e Multi-Shot)

    /**
     * Inicia ou Reinicia o stream da câmera com o modo selecionado
     */
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

    /**
     * Tenta abrir a câmera do dispositivo
     */
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

    /**
     * Para todos os feeds da câmera e fecha o modal
     */
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

    /**
     * Tira a foto: desenha o vídeo no canvas
     */
    function capturePhoto() {
        const context = snapshotCanvas.getContext('2d');
        snapshotCanvas.width = videoFeed.videoWidth;
        snapshotCanvas.height = videoFeed.videoHeight;
        context.drawImage(videoFeed, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
        
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.9);

        // Captura a proporção
        const aspectRatio = snapshotCanvas.width / snapshotCanvas.height;
        const photoData = { url: imageDataUrl, aspect: aspectRatio };
        if (currentCameraTarget === 'evidence') {
            tempCapturedImages.push(photoData); // <-- Salva o objeto
            const img = document.createElement('img');
            img.src = photoData.url; // <-- Usa a URL do objeto
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

    /**
     * Botão "Tirar Novamente" (foto única)
     */
    function retakeSinglePhoto() {
        videoFeed.style.display = 'block';
        snapshotCanvas.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        flipCameraBtn.style.display = 'inline-block'; 
        useSinglePhotoBtn.style.display = 'none';
        retakeSinglePhotoBtn.style.display = 'none';
    }

    /**
     * Botão "Usar esta Foto" (para modo de foto única)
     */
    function useSingleCapturedPhoto() {
        const imageDataUrl = snapshotCanvas.toDataURL('image/jpeg', 0.9);
        const aspectRatio = snapshotCanvas.width / snapshotCanvas.height;
        
        groupPhotoImageData = { url: imageDataUrl, aspect: aspectRatio }; // Salva o objeto
        
        groupPhotoPreviewContainer.innerHTML = `
            <div class="image-preview-wrapper">
                <img src="${groupPhotoImageData.url}" alt="Foto da equipe"> </div>
        `;
        closeModal();
    }
    /**
     * Botão "Concluir" (múltiplas fotos)
     */
    function saveMultiShotPhotos() {
        uploadedImages = [...uploadedImages, ...tempCapturedImages];
        renderImagePreviews(); 
        closeModal();
    }

    // Adiciona os Event Listeners para os botões da câmera
    openEvidenceCameraBtn.addEventListener('click', () => openCamera('evidence'));
    openGroupCameraBtn.addEventListener('click', () => openCamera('group'));
    
    closeModalBtn.addEventListener('click', closeModal);
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