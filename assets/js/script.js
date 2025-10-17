document.addEventListener('DOMContentLoaded', () => {
    const evaluationForm = document.getElementById('evaluation-form');
    const responsibleInput = document.getElementById('responsible-input');
    const responsibleList = document.getElementById('responsible-list');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const minutesOutput = document.getElementById('minutes-output');
    const imageUploadInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const visitLocalInput = document.getElementById('visit-local');
    const visitDateInput = document.getElementById('visit-date');
    const visitTimeInput = document.getElementById('visit-time');
    const meetingParticipantsInput = document.getElementById('meeting-participants');
    const groupPhotoUploadInput = document.getElementById('group-photo-upload');
    const groupPhotoPreviewContainer = document.getElementById('group-photo-preview');
    const nextVisitDateInput = document.getElementById('next-visit-date');
    const nextVisitTimeInput = document.getElementById('next-visit-time');
    const nextVisitLocalInput = document.getElementById('next-visit-local');
    const actionPlanTableBody = document.querySelector('#action-plan-table tbody');


    let meetingItems = [];
    let currentMinutesData = [];
    let uploadedImages = [];
    let groupPhotoImageData = null; // Variável para a foto da equipe

    // 🔹 ALTERAÇÃO: Função debounce para evitar travamento ao digitar
    function debounce(func, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

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
        responsibleList.innerHTML = '';
        responsibles.forEach(responsible => {
            const option = document.createElement('option');
            option.value = responsible;
            responsibleList.appendChild(option);
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

        // --- Funcionalidade de auto-crescimento nos campos de texto ---
        tableBody.querySelectorAll('textarea').forEach(textarea => {
            // Ajusta a altura inicial com base no placeholder
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';

            // Evento que faz o campo crescer ao digitar
            textarea.addEventListener('input', function () {
                this.style.height = 'auto'; // Reseta a altura para recalcular
                this.style.height = (this.scrollHeight) + 'px'; // Ajusta a altura ao conteúdo
            }, false);
        });
    }

    function generateMinutes(allRows) {
    try {
        minutesOutput.innerHTML = '<p>Processando e gerando a ata, por favor aguarde...</p>';
        
        const visitObservationsTextarea = document.getElementById('visit-observations-textarea');

        const filledItems = allRows.map(row => {
            const cells = row.querySelectorAll('td');
            const evaluation = cells[8].querySelector('input:checked');
            
            // Verifica se os seletores encontram os textareas antes de acessar .value
            // Isso torna o código mais seguro contra erros.
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
                // Agora lemos de forma segura, retornando '' se o textarea não for encontrado
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
            // Lê o valor do input na quarta coluna (índice 3)
            const deadline = cells[3].querySelector('input').value;
            if (responsible.trim() || sector.trim()) {
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
            visitObservations: visitObservationsTextarea.value 
        };

        minutesOutput.innerHTML = generateMinutesHTML(fullReportData);
        document.getElementById('download-pdf-btn').addEventListener('click', () => generatePdfDocument(fullReportData));

    } catch (error) {
        // O console.error agora mostrará o erro original com mais detalhes
        console.error("ERRO AO GERAR A ATA:", error);
        minutesOutput.innerHTML = `<p style="color: red; font-weight: bold;">Ocorreu um erro ao gerar a ata. Verifique o console (F12).</p>`;
    }
}

// Nova função para gerar apenas o HTML (para organizar melhor)
function generateMinutesHTML(data) {
    // Aqui você pode criar um HTML mais simples para a visualização na página,
    // já que o layout complexo será gerado no arquivo PDF.
    
    let html = `<h3>Visualização da Ata Gerada</h3>`;
    html += `<p><strong>Local:</strong> ${data.visitLocal || 'Não informado'}</p>`;
    html += `<p><strong>Data:</strong> ${data.visitDate || 'Não informada'}</p>`;
    html += `<p><strong>Participantes:</strong> ${data.participants || 'Não informados'}</p>`;
    html += `<p><strong>Próxima Visita:</strong> ${data.nextVisit}</p>`;

    if (data.groupPhoto) {
        html += `<h4>Foto da Equipe</h4><img src="${data.groupPhoto}" style="max-width: 300px; border-radius: 8px;">`;
    }

    if (data.tableData.length > 0) {
        html += `<h4>Itens de Ação</h4><p>${data.tableData.length} itens registrados.</p>`;
    }

    if (data.actionPlan.length > 0) {
        html += `<h4>Plano de Ação</h4><p>${data.actionPlan.length} ações definidas.</p>`;
    }
    
    if (data.evidencePhotos.length > 0) {
        html += `<h4>Fotos de Evidência</h4><p>${data.evidencePhotos.length} fotos anexadas.</p>`;
    }
    
    html += `
        <div id="download-buttons" style="margin-top: 20px;">
            <button id="download-pdf-btn">Baixar .pdf</button>
        </div>`;
        
    return html;
}

    // --- FUNÇÕES PARA MANIPULAR IMAGENS ---

    function handleImageUpload(event) {
        const files = event.target.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImages.push(e.target.result);
                renderImagePreviews();
            };
            reader.readAsDataURL(file);
        }
        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        event.target.value = null;
    }

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = ''; // Limpa as prévias existentes
        uploadedImages.forEach((imageData, index) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-preview-wrapper');

            const img = document.createElement('img');
            img.src = imageData;
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
    
/**
 * Gera um documento PDF completo da visita, estruturado em várias páginas.
 * @param {object} data O objeto fullReportData contendo todas as informações da visita.
 */
function generatePdfDocument(data) {
    try {
        if (typeof window.jspdf.jsPDF.API.autoTable !== 'function') {
            alert('Erro Crítico: A biblioteca jsPDF-AutoTable não foi carregada.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;

        // --- PÁGINA 1: CAPA (sem alterações) ---
        const laranjaPrincipal = [245, 127, 23];
        const verdeEscurecido = [180, 230, 140];
        const cinzaSombra = [189, 189, 189];

        const logoHSPM = 'assets/images/logo-hspm.jpg';
        const logoSP = 'assets/images/logo-prefeitura-sp.jpg';

        doc.addImage(logoHSPM, 'JPG', margin, 8, 30, 15);
        doc.addImage(logoSP, 'JPG', pageWidth - margin - 25, 8, 25, 25);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('HOSPITAL DO SERVIDOR PÚBLICO MUNICIPAL', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('ASSESSORIA DE PLANEJAMENTO ESTRATÉGICO E QUALIDADE', pageWidth / 2, 21, { align: 'center' });

        doc.setFillColor.apply(null, cinzaSombra);
        doc.circle(pageWidth / 2 + 2, pageHeight / 2 + 2, 80, 'F');

        doc.setFillColor.apply(null, laranjaPrincipal);
        doc.circle(pageWidth / 2, pageHeight / 2, 80, 'F');

        doc.setFillColor.apply(null, verdeEscurecido);
        const retanguloVerdeY = pageHeight / 2 - 8;
        doc.rect(margin + 30, retanguloVerdeY, pageWidth - (margin * 2) - 60, 12, 'F');

        doc.setFontSize(32);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AUTO AVALIAÇÃO', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'normal');
        doc.text('ATA DE REGISTRO DA VISITA DE QUALIDADE', pageWidth / 2, pageHeight / 2 - 2, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');

        doc.text(`LOCAL: ${data.visitLocal || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
        doc.text(`DATA: ${data.visitDate || 'Não informada'}`, pageWidth / 2, pageHeight / 2 + 33, { align: 'center' });
        doc.text(`HORÁRIO: ${data.visitTime || 'Não informado'}`, pageWidth / 2, pageHeight / 2 + 41, { align: 'center' });


        // --- PÁGINA 2: DETALHES, COM NOVOS TEXTOS FIXOS ---
        doc.addPage();
        let y = margin;

        // Participantes (sem alterações)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PARTICIPANTES:', margin, y);
        doc.setFont('helvetica', 'normal');
        const participantsText = doc.splitTextToSize(data.participants || 'Nenhum participante listado.', pageWidth - (margin * 2));
        doc.text(participantsText, margin, y + 6);
        y += participantsText.length * 5 + 10;

        // Assunto da Reunião
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ASSUNTO DA REUNIÃO:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text('Visita para auditoria de itens Roteiro do CQH', margin, y + 6);
        y += 12;

        // Foto da Equipe (sem alterações)
        if (data.groupPhoto) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FOTO DA EQUIPE:', pageWidth / 2, y, { align: 'center' });
            y += 8;
            const imgWidth = 120;
            const imgHeight = 80;
            const imgX = (pageWidth - imgWidth) / 2;
            doc.addImage(data.groupPhoto, 'PNG', imgX, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        }

        // Roteiro
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Roteiro:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text('Em anexo', margin, y + 6);
        y += 12;

        // Fotos
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Fotos:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text('Em anexo', margin, y + 6);
        y += 12;
        
        // Parágrafo descritivo
        const paragraph = "A reunião teve início com a avaliação dos itens pertinentes ao Roteiro do CQH. Foram mostradas evidências dos itens, conforme descrito abaixo e anexamos uma proposta para dar um passo adiante para a próxima visita.";
        const paragraphLines = doc.splitTextToSize(paragraph, pageWidth - (margin * 2));
        doc.text(paragraphLines, margin, y);
        y += paragraphLines.length * 6 + 10;

        // Próxima Visita (sem alterações)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PRÓXIMA VISITA:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(data.nextVisit || 'Não definida.', margin, y + 6);
        
        let finalY = doc.autoTable.previous.finalY || y + 15;

        // --- TABELA PRINCIPAL COM NOVAS REGRAS DE ESTILO E LISTAS ---
        if (data.tableData.length > 0) {
            doc.autoTable({
                startY: finalY,
                head: [['Responsável', 'Seção', 'Tema', 'Item', 'Descrição do Item', 'Subitem', 'Descrição do Subitem', 'Nível de Exigência', 'Avaliação', 'Evidências', 'Propostas']],
                body: data.tableData.map(item => [
                    item.responsible,
                    item.section,
                    item.theme,
                    item.item_number,
                    item.description,
                    item.subitem_number,
                    item.subitem_description,
                    item.exigency_level,
                    item.evaluation,
                    // --- AQUI É ONDE FORMATAMOS AS LISTAS ---
                    item.evidences.split('\n').filter(line => line.trim() !== '').map(line => `• ${line.trim()}`).join('\n'),
                    item.proposals.split('\n').filter(line => line.trim() !== '').map(line => `• ${line.trim()}`).join('\n')
                ]),
                theme: 'grid',
                headStyles: { 
                    fillColor: [40, 126, 184], 
                    fontSize: 10,
                    halign: 'center', // Centraliza o cabeçalho
                    valign: 'middle'  // Centraliza verticalmente o cabeçalho
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 3, 
                    overflow: 'linebreak',
                    halign: 'center', // --- CENTRALIZA TODO O TEXTO DA TABELA ---
                    valign: 'middle'  // --- CENTRALIZA VERTICALMENTE TODO O TEXTO DA TABELA ---
                },
                columnStyles: {
                    0: { cellWidth: 24 }, 1: { cellWidth: 27 }, 2: { cellWidth: 20 },
                    3: { cellWidth: 10 }, 4: { cellWidth: 30 }, 5: { cellWidth: 12 },
                    6: { cellWidth: 30 }, 7: { cellWidth: 15 }, 8: { cellWidth: 15 },
                    9: { cellWidth: 41, halign: 'left' }, // Alinha Evidências à esquerda para a lista
                    10: { cellWidth: 41, halign: 'left' }, // Alinha Propostas à esquerda para a lista
                },
                didDrawPage: (hookData) => { finalY = hookData.cursor.y; }
            });
        }
        
        // Seção "OBSERVAÇÕES DA VISITA" (sem alterações)
        if (data.visitObservations && data.visitObservations.trim() !== '') {
            finalY += 10; 

            if (finalY > pageHeight - 40) {
                doc.addPage();
                finalY = margin;
            }

            const azulTitulo = [38, 108, 147];
            doc.setFillColor.apply(null, azulTitulo);
            doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 12, 3, 3, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('OBSERVAÇÕES DA VISITA :', margin + 5, finalY + 8);
            finalY += 20;

            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            const lines = data.visitObservations.split('\n');
            lines.forEach(line => {
                if (line.trim() !== '') {
                    if (finalY > pageHeight - margin) {
                        doc.addPage();
                        finalY = margin;
                    }
                    const textLines = doc.splitTextToSize(`• ${line.trim()}`, pageWidth - (margin * 2) - 5);
                    doc.text(textLines, margin + 5, finalY);
                    finalY += textLines.length * 6;
                }
            });
        }


        // --- PÁGINA FINAL: FOTOS E PLANO DE AÇÃO (sem alterações) ---
        doc.addPage();
        y = margin;

        // Fotos de Evidência
        if (data.evidencePhotos.length > 0) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('FOTOS DE EVIDÊNCIA', pageWidth / 2, y, { align: 'center' });
            y += 15;
            const imagesPerRow = 3;
            const imgWidth = 85;
            const imgHeight = 64;
            const horizontalGap = 5;
            const verticalGap = 10;
            let photoX = margin;
            data.evidencePhotos.forEach((imgData, index) => {
                if (index > 0 && index % imagesPerRow === 0) {
                    photoX = margin;
                    y += imgHeight + verticalGap;
                }
                if (y + imgHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.text('FOTOS DE EVIDÊNCIA (continuação)', pageWidth / 2, y, { align: 'center' });
                    y += 15;
                    photoX = margin;
                }
                doc.addImage(imgData, 'PNG', photoX, y, imgWidth, imgHeight);
                photoX += imgWidth + horizontalGap;
            });
            const numRows = Math.ceil(data.evidencePhotos.length / imagesPerRow);
            y = margin + 15 + (numRows * (imgHeight + verticalGap));
        }

        // Plano de Ação
        if (data.actionPlan.length > 0) {
            if (y > pageHeight - 60) {
                doc.addPage();
                y = margin;
            } else {
                y += 15;
            }
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('PLANO DE AÇÃO', pageWidth / 2, y, { align: 'center' });
            y += 10;
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


    // --- EVENT LISTENERS ---
    // Campo de busca com debounce para não travar
    responsibleInput.addEventListener('input', debounce((event) => {
        const searchText = event.target.value.toUpperCase();
        if (searchText) {
            const filteredItems = meetingItems.filter(item =>
                item.responsible && item.responsible.toUpperCase().includes(searchText)
            );
            renderTable(filteredItems);
        } else {
            tableBody.innerHTML = '';
        }
    }, 300));

    clearSearchBtn.addEventListener('click', () => {
        responsibleInput.value = '';
        tableBody.innerHTML = '';
        minutesOutput.innerHTML = '';
        uploadedImages = [];
        renderImagePreviews();
        responsibleInput.focus();
    });

    imageUploadInput.addEventListener('change', handleImageUpload);
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

    groupPhotoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            groupPhotoImageData = null;
            groupPhotoPreviewContainer.innerHTML = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            groupPhotoImageData = e.target.result;
            groupPhotoPreviewContainer.innerHTML = `
            <div class="image-preview-wrapper">
                <img src="${groupPhotoImageData}" alt="Foto da equipe">
            </div>
        `;
        };
        reader.readAsDataURL(file);
    });

    loadDataAndInitialize();
});