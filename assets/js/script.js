document.addEventListener('DOMContentLoaded', () => {
    // ✨ ALTERAÇÃO: Adicionada referência ao formulário e aos novos elementos de imagem
    const evaluationForm = document.getElementById('evaluation-form');
    const responsibleInput = document.getElementById('responsible-input');
    const responsibleList = document.getElementById('responsible-list');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const minutesOutput = document.getElementById('minutes-output');

    // ✨ NOVO: Referências para o upload de imagens
    const imageUploadInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    let meetingItems = [];
    let currentMinutesData = [];
    let uploadedImages = []; // ✨ NOVO: Array para armazenar os dados das imagens

    // --- FUNÇÕES DE LÓGICA ---

    async function loadDataAndInitialize() {
        try {
            const response = await fetch('assets/data/data.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            }
            meetingItems = await response.json();
            
            populateResponsibleDatalist();
            tableBody.innerHTML = '';
        } catch (error) {
            console.error('Erro ao carregar os dados:', error);
            minutesOutput.textContent = 'Não foi possível carregar os dados. Verifique se o arquivo data.json existe e o servidor local está rodando.';
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
                sectionRow.innerHTML = `<td colspan="12"><strong>${group.section}</strong></td>`;
                tableBody.appendChild(sectionRow);
                currentSection = group.section;
                currentTheme = '';
            }

            if (group.theme && group.theme !== currentTheme) {
                const themeRow = document.createElement('tr');
                themeRow.classList.add('theme-header');
                themeRow.innerHTML = `<td colspan="12"><strong>Tema: ${group.theme}</strong></td>`;
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
                <td></td> <td>${group.exigency_level || ''}</td>
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
                <td><textarea name="observations" placeholder="Observações..."></textarea></td>
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
                    <td class="truncate-text">${group.description || ''}</td> <td>${subitem.subitem_number || ''}</td>
                    <td class="truncate-text">${subitem.subitem_description || ''}</td> <td>${subitem.exigency_level || ''}</td>
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
                    <td><textarea name="observations" placeholder="Observações..."></textarea></td>
                `;
                tableBody.appendChild(subitemRow);
            });
        }

        // ✨ CÓDIGO CORRIGIDO E ADICIONADO NO LUGAR CERTO ✨
        // --- Adiciona a funcionalidade de auto-crescimento aos campos de texto ---
        tableBody.querySelectorAll('textarea').forEach(textarea => {
            // Ajusta a altura inicial com base no placeholder
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';

            // Adiciona o evento que faz o campo crescer ao digitar
            textarea.addEventListener('input', function() {
                this.style.height = 'auto'; // Reseta a altura para recalcular
                this.style.height = (this.scrollHeight) + 'px'; // Ajusta a altura ao conteúdo
            }, false);
        });
    }


   function generateMinutes(allRows) {
        try {
            minutesOutput.innerHTML = '<p>Processando e gerando a ata, por favor aguarde...</p>';

            const filledItems = allRows.map(row => {
                const cells = row.querySelectorAll('td');
                const evaluation = cells[8].querySelector('input:checked');
                
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
                    evidences: cells[9].querySelector('textarea').value,
                    proposals: cells[10].querySelector('textarea').value,
                    observations: cells[11].querySelector('textarea').value,
                };
            });

            currentMinutesData = filledItems.filter(item => 
                item.evaluation !== 'Não avaliado' ||
                item.evidences.trim() !== '' ||
                item.proposals.trim() !== '' ||
                item.observations.trim() !== ''
            );

            if (currentMinutesData.length === 0 && uploadedImages.length === 0) { // ✨ ALTERAÇÃO: Verifica também se há imagens
                minutesOutput.textContent = 'Nenhum item preenchido ou imagem anexada para gerar a ata.';
                return;
            }

            let minutesTableHTML = `
                <h3>Ata de Reunião - ${responsibleInput.value || 'Todos'}</h3>
                <div id="minutes-content-wrapper"> <div id="minutes-table-wrapper">
                        <table class="minutes-table">
                            <thead>
                                <tr>
                                    <th>Responsável</th> <th>Seção</th> <th>Tema</th>
                                    <th>Item</th> <th>Descrição do Item</th> <th>Subitem</th>
                                    <th>Descrição do Subitem</th> <th>Nível de Exigência</th> <th>Avaliação</th>
                                    <th>Evidências</th> <th>Propostas</th> <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${currentMinutesData.map(item => `
                                    <tr>
                                        <td>${item.responsible}</td> <td>${item.section}</td> <td>${item.theme}</td>
                                        <td>${item.item_number}</td> <td>${item.description}</td> <td>${item.subitem_number}</td>
                                        <td>${item.subitem_description}</td> <td>${item.exigency_level}</td> <td>${item.evaluation}</td>
                                        <td>${item.evidences}</td> <td>${item.proposals}</td> <td>${item.observations}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

            // ✨ NOVO: Adiciona a seção de fotos se houver imagens
            if (uploadedImages.length > 0) {
                minutesTableHTML += `
                    <div class="minutes-photos-section">
                        <div style="text-align: center;"><h3>FOTOS</h3></div>
                        <div class="minutes-photo-grid">
                            ${uploadedImages.map(imgData => `<img src="${imgData}" alt="Evidência fotográfica">`).join('')}
                        </div>
                    </div>
                `;
            }

            minutesTableHTML += `</div>`; // Fecha o minutes-content-wrapper

            minutesTableHTML += `
                <div id="download-buttons" style="margin-top: 20px;">
                    <button id="download-word-btn">Baixar .docx</button>
                    <button id="download-pdf-btn">Baixar .pdf</button>
                </div>
            `;

            minutesOutput.innerHTML = minutesTableHTML;

            document.getElementById('download-word-btn').addEventListener('click', () => generateWordDocument(currentMinutesData, uploadedImages));
            document.getElementById('download-pdf-btn').addEventListener('click', () => generatePdfDocument());

        } catch (error) {
            console.error("ERRO AO GERAR A ATA:", error);
            minutesOutput.innerHTML = `<p style="color: red; font-weight: bold;">Ocorreu um erro ao gerar a ata. Verifique o console (F12).</p>`;
        }
    }
    
    // --- ✨ NOVAS FUNÇÕES PARA MANIPULAR IMAGENS ---

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

   // --- GARANTE QUE A BIBLIOTECA DOCX FOI CARREGADA ---
const docx = window.docx || undefined;

if (!docx) {
    console.error("❌ A biblioteca docx não foi carregada. Verifique a tag <script> no index.html.");
}

// --- FUNÇÕES DE DOWNLOAD ---
const createSizedText = (text, size = 22, bold = false) => {
    return new docx.Paragraph({
        children: [new docx.TextRun({ text, size, bold })]
    });
};

async function generateWordDocument() {
    // Verifica se a biblioteca foi carregada
    if (typeof window.docx === 'undefined') {
        alert('Erro Crítico: A biblioteca docx não foi carregada.');
        return;
    }

    const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, PageBreak, HeadingLevel, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } = window.docx;
    const unidade = responsibleInput.value || 'Todas as Unidades';

    try {
        const docChildren = [];

        // --- 1. TÍTULO ---
        docChildren.push(
            new Paragraph({ text: 'Relatório de Visita da Qualidade', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Unidade: ${unidade}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Data: ${new Date().toLocaleDateString()}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } })
        );

        // --- 2. TABELA DE DADOS ---
        if (currentMinutesData.length > 0) {
            const createCellParagraphs = (text) => {
                const textValue = text || '';
                return String(textValue).split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 16 })] }));
            };
            const columnWidthsPct = [9.5, 13, 7.5, 4, 11, 4.5, 11, 5.5, 5.5, 9.5, 9.5, 9.5];
            const headers = ["Responsável", "Seção", "Tema", "Item", "Descrição do Item", "Subitem", "Descrição do Subitem", "Nível de Exigência", "Avaliação", "Evidências", "Propostas", "Observações"];
            const headerRow = new TableRow({
                children: headers.map((text, index) => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 16, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
                    shading: { fill: "287EB8" }, verticalAlign: VerticalAlign.CENTER,
                    width: { size: columnWidthsPct[index], type: WidthType.PERCENTAGE },
                })),
            });
            const dataRows = currentMinutesData.map(item => {
                const itemData = [item.responsible, item.section, item.theme, item.item_number, item.description, item.subitem_number, item.subitem_description, item.exigency_level, item.evaluation, item.evidences, item.proposals, item.observations];
                return new TableRow({
                    children: itemData.map((text, index) => new TableCell({
                        children: createCellParagraphs(text), verticalAlign: VerticalAlign.CENTER,
                        width: { size: columnWidthsPct[index], type: WidthType.PERCENTAGE },
                    })),
                });
            });
            const table = new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
            docChildren.push(table);
        }

        // --- 3. FOTOS (LÓGICA FINAL E CORRIGIDA) ---
        if (uploadedImages.length > 0) {
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: "FOTOS", bold: true, size: 32, color: "287eb8" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }));
            
            const imageBuffers = await Promise.all(
                uploadedImages.map(async (imgDataUrl) => {
                    const response = await fetch(imgDataUrl);
                    return await response.arrayBuffer();
                })
            );

            // Configurações da Grade de Fotos em Paisagem
            const imagesPerRow = 3;
            const imageSize = { width: 220, height: 165 }; // Imagens grandes para a página larga

            const photoRows = [];
            for (let i = 0; i < imageBuffers.length; i += imagesPerRow) {
                const rowChunk = imageBuffers.slice(i, i + imagesPerRow);
                
                const tableCells = rowChunk.map(buffer => new TableCell({
                    children: [new Paragraph({
                        children: [new ImageRun({ data: buffer, transformation: imageSize })],
                        alignment: AlignmentType.CENTER,
                    })],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                }));

                while (tableCells.length < imagesPerRow) {
                    tableCells.push(new TableCell({ children: [new Paragraph('')], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }));
                }

                photoRows.push(new TableRow({ children: tableCells }));
            }

            const photoTable = new Table({
                rows: photoRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                // Margens para criar espaçamento vertical e horizontal
                cellMargin: { top: 200, bottom: 200, left: 100, right: 100 },
                borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
            });

            docChildren.push(photoTable);
        }

        // --- 4. GERA O DOCUMENTO EM MODO PAISAGEM ---
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                        orientation: PageOrientation.LANDSCAPE,
                    }
                },
                children: docChildren,
            }]
        });
        
        Packer.toBlob(doc).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `relatorio_visita_${unidade.replace(/\s+/g, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }).catch(err => {
            console.error("Erro ao empacotar o DOCX:", err);
            alert("Erro ao criar o arquivo DOCX. Verifique o console.");
        });

    } catch (error) {
        console.error("Erro ao gerar o documento .docx:", error);
        alert("Erro ao gerar o arquivo Word. Veja o console (F12).");
    }
}

 function generatePdfDocument() {
    try {
        if (typeof window.jspdf.jsPDF.API.autoTable !== 'function') {
            alert('Erro Crítico: A biblioteca jsPDF-AutoTable não foi carregada.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        const table = document.querySelector('#minutes-output .minutes-table');
        const tableHasRows = table ? table.querySelectorAll('tbody tr').length > 0 : false;
        const images = uploadedImages;

        if (!tableHasRows && images.length === 0) {
            alert("Nada para gerar no PDF. Por favor, preencha a tabela ou adicione imagens.");
            return;
        }

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 15;

        // --- TÍTULO ---
        doc.setFontSize(18);
        doc.text('Relatório de Visita da Qualidade', pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(14);
        const unidade = responsibleInput.value || 'Todas as Unidades';
        doc.text(`Unidade: ${unidade}`, pageWidth / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(10);
        doc.text(`Data: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
        y += 10;

        // --- TABELA ---
        if (tableHasRows) {
            doc.autoTable({
                html: table,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [40, 126, 184], textColor: 255, fontSize: 8, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 25 }, 1: { cellWidth: 35 }, 2: { cellWidth: 20 },
                    3: { cellWidth: 10 }, 4: { cellWidth: 30 }, 5: { cellWidth: 12 },
                    6: { cellWidth: 30 }, 7: { cellWidth: 15 }, 8: { cellWidth: 15 },
                    9: { cellWidth: 25 }, 10: { cellWidth: 25 }, 11: { cellWidth: 25 },
                }
            });
        }

        // --- 3. ADICIONA AS IMAGENS EM FORMATO DE GRADE ---
        if (images.length > 0) {
            doc.addPage();
            let photoY = margin;

            doc.setTextColor(40, 126, 184);
            doc.setFontSize(16);
            doc.text('FOTOS', pageWidth / 2, photoY, { align: 'center' });
            doc.setTextColor(0, 0, 0); 
            photoY += 15;

            // ✨ CONFIGURAÇÕES DA GRADE DE FOTOS (você pode alterar aqui) ✨
            const imagesPerRow = 3; // Quantas imagens você quer por linha
            const imgWidth = 85;   // Largura de cada imagem em mm
            const imgHeight = 64;  // Altura de cada imagem em mm (mantendo proporção 4:3)
            const horizontalGap = 5; // Espaço horizontal entre as imagens
            const verticalGap = 10;   // Espaço vertical entre as linhas de imagens

            let photoX = margin;

            images.forEach((imgData, index) => {
                // Se for a primeira imagem de uma nova linha, verifica se a linha cabe na página
                if (index % imagesPerRow === 0 && index > 0) {
                    photoX = margin; // Volta para a margem esquerda
                    photoY += imgHeight + verticalGap; // Move para a linha de baixo
                }
                
                // Se a nova linha de fotos for passar do fim da página, cria uma nova página
                if (photoY + imgHeight > pageHeight - margin) {
                    doc.addPage();
                    photoY = margin;
                }
                
                // Adiciona a imagem na posição calculada
                doc.addImage(imgData, 'PNG', photoX, photoY, imgWidth, imgHeight);
                
                // Move a posição X para a próxima imagem na mesma linha
                photoX += imgWidth + horizontalGap;
            });
        }

        doc.save(`ata_reuniao_${responsibleInput.value || 'todos'}.pdf`);

    } catch (error) {
        console.error("Erro detalhado ao gerar o PDF:", error);
        alert("Ocorreu um erro inesperado ao gerar o PDF. Verifique o console (F12).");
    }
}
    // ... (Sua função highlightEmptyEvaluations permanece a mesma)
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

    responsibleInput.addEventListener('input', (event) => {
        const searchText = event.target.value.toUpperCase();
        
        if (searchText) {
            const filteredItems = meetingItems.filter(item => 
                item.responsible && item.responsible.toUpperCase().includes(searchText)
            );
            renderTable(filteredItems);
        } else {
            tableBody.innerHTML = '';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        responsibleInput.value = '';
        tableBody.innerHTML = '';
        minutesOutput.innerHTML = '';
        // ✨ NOVO: Limpa também as imagens
        uploadedImages = [];
        renderImagePreviews();
        responsibleInput.focus();
    });

    // ✨ NOVO: Event listener para o input de imagens
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
                highlightEmptyEvaluations(); // Destaca os itens vazios
                return;
            }
        }

        generateMinutes(allRows);      
    });

    loadDataAndInitialize();
});