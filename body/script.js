document.addEventListener('DOMContentLoaded', () => {
    // ✨ ALTERAÇÃO: Adicionada referência ao formulário
    const evaluationForm = document.getElementById('evaluation-form');
    const responsibleInput = document.getElementById('responsible-input');
    const responsibleList = document.getElementById('responsible-list');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const minutesOutput = document.getElementById('minutes-output');

    let meetingItems = [];
    let currentMinutesData = [];

    // --- FUNÇÕES DE LÓGICA ---

    async function loadDataAndInitialize() {
        try {
            const response = await fetch('data.json');
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

        const groupedItems = {};
        items.forEach(item => {
            const groupKey = `${item.section}-${item.theme}-${item.item_number}-${item.description}`;
            if (!groupedItems[groupKey]) {
                groupedItems[groupKey] = { ...item, subitems: [] };
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

            const mainRow = document.createElement('tr');
            mainRow.dataset.masterId = group.master_id;
            // ✨ ALTERAÇÃO: Adicionado 'required' no primeiro input para torná-lo obrigatório
            mainRow.innerHTML = `
                <td>${group.responsible || ''}</td>
                <td>${group.section || ''}</td>
                <td>${group.theme || ''}</td>
                <td>${group.item_number || ''}</td>
                <td></td>
                <td class="truncate-text">${group.description || ''}</td>
                <td>${group.exigency_level || ''}</td>
                <td class="evaluation-cell">
                    <input type="radio" id="eval-sim-${group.master_id}" name="evaluation-${group.master_id}" value="Sim" required>
                    <label for="eval-sim-${group.master_id}" class="radio-label">Sim</label>
                    <input type="radio" id="eval-nao-${group.master_id}" name="evaluation-${group.master_id}" value="Não">
                    <label for="eval-nao-${group.master_id}" class="radio-label">Não</label>
                    <input type="radio" id="eval-na-${group.master_id}" name="evaluation-${group.master_id}" value="N/A">
                    <label for="eval-na-${group.master_id}" class="radio-label">N/A</label>
                </td>
                <td><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                <td><textarea name="proposals" placeholder="Propostas..."></textarea></td>
                <td><textarea name="observations" placeholder="Observações..."></textarea></td>
            `;
            tableBody.appendChild(mainRow);
            
            group.subitems.forEach(subitem => {
                const subitemRow = document.createElement('tr');
                subitemRow.dataset.masterId = subitem.master_id;
                // ✨ ALTERAÇÃO: Adicionado 'required' no primeiro input para torná-lo obrigatório
                subitemRow.innerHTML = `
                    <td>${subitem.responsible || ''}</td>
                    <td>${subitem.section || ''}</td>
                    <td>${subitem.theme || ''}</td>
                    <td>${subitem.item_number || ''}</td>
                    <td>${subitem.subitem_number || ''}</td>
                    <td class="truncate-text">${subitem.subitem_description || ''}</td>
                    <td>${subitem.exigency_level || ''}</td>
                    <td class="evaluation-cell">
                        <input type="radio" id="eval-sim-${subitem.master_id}" name="evaluation-${subitem.master_id}" value="Sim" required>
                        <label for="eval-sim-${subitem.master_id}" class="radio-label">Sim</label>
                        <input type="radio" id="eval-nao-${subitem.master_id}" name="evaluation-${subitem.master_id}" value="Não">
                        <label for="eval-nao-${subitem.master_id}" class="radio-label">Não</label>
                        <input type="radio" id="eval-na-${subitem.master_id}" name="evaluation-${subitem.master_id}" value="N/A">
                        <label for="eval-na-${subitem.master_id}" class="radio-label">N/A</label>
                    </td>
                    <td><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                    <td><textarea name="proposals" placeholder="Propostas..."></textarea></td>
                    <td><textarea name="observations" placeholder="Observações..."></textarea></td>
                `;
                tableBody.appendChild(subitemRow);
            });
        }
    }

    function generateMinutes() {
        // ... (o conteúdo desta função permanece exatamente o mesmo)
        minutesOutput.innerHTML = '';
        
        const filledItems = Array.from(tableBody.querySelectorAll('tr:not(.section-header):not(.theme-header)')).map(row => {
            const cells = row.querySelectorAll('td');
            const evaluation = row.querySelector('input[name^="evaluation-"]:checked');
            
            return {
                responsible: cells[0].textContent,
                section: cells[1].textContent,
                theme: cells[2].textContent,
                item_number: cells[3].textContent,
                subitem_number: cells[4].textContent,
                subitem_description: cells[5].textContent,
                exigency_level: cells[6].textContent,
                evaluation: evaluation ? evaluation.value : 'Não avaliado',
                evidences: row.querySelector('textarea[name="evidences"]').value,
                proposals: row.querySelector('textarea[name="proposals"]').value,
                observations: row.querySelector('textarea[name="observations"]').value,
            };
        });

        currentMinutesData = filledItems.filter(item => 
            item.evaluation !== 'Não avaliado' ||
            item.evidences.trim() !== '' ||
            item.proposals.trim() !== '' ||
            item.observations.trim() !== ''
        );

        if (currentMinutesData.length === 0) {
            minutesOutput.textContent = 'Nenhum item preenchido para gerar a ata.';
            return;
        }

        const minutesTableHTML = `
            <h3>Ata de Reunião - ${responsibleInput.value || 'Todos'}</h3>
            <div id="minutes-table-wrapper">
                <table class="minutes-table">
                    <thead>
                        <tr>
                            <th>Responsável</th>
                            <th>Seção</th>
                            <th>Tema</th>
                            <th>Item</th>
                            <th>Subitem</th>
                            <th>Descrição do Subitem</th>
                            <th>Nível de Exigência</th>
                            <th>Avaliação</th>
                            <th>Evidências</th>
                            <th>Propostas</th>
                            <th>Observações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentMinutesData.map(item => `
                            <tr>
                                <td>${item.responsible}</td>
                                <td>${item.section}</td>
                                <td>${item.theme}</td>
                                <td>${item.item_number}</td>
                                <td>${item.subitem_number}</td>
                                <td>${item.subitem_description}</td>
                                <td>${item.exigency_level}</td>
                                <td>${item.evaluation}</td>
                                <td>${item.evidences}</td>
                                <td>${item.proposals}</td>
                                <td>${item.observations}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="download-buttons" style="margin-top: 20px;">
                <button id="download-word-btn">Baixar .docx</button>
                <button id="download-pdf-btn">Baixar .pdf</button>
            </div>
        `;
        minutesOutput.innerHTML = minutesTableHTML;

        document.getElementById('download-word-btn').addEventListener('click', () => generateWordDocument(currentMinutesData));
        document.getElementById('download-pdf-btn').addEventListener('click', () => generatePdfDocument());
    }

    // --- FUNÇÕES DE DOWNLOAD ---
    // ... (suas funções de download generateWordDocument e generatePdfDocument permanecem as mesmas)

    const createSizedText = (text, size = 22, bold = false) => {
        return new docx.Paragraph({
            children: [new docx.TextRun({ text, size, bold })]
        });
    };
    
    function generateWordDocument(data) {
        const FONT_SIZE_TITLE = 32;
        const FONT_SIZE_BODY = 22;

        const doc = new docx.Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                    },
                },
                children: [
                    new docx.Paragraph({
                        children: [new docx.TextRun({ text: `Ata de Reunião - ${responsibleInput.value || 'Todos'}`, size: FONT_SIZE_TITLE, bold: true })],
                        alignment: docx.AlignmentType.CENTER,
                    }),
                    new docx.Paragraph({
                         children: [new docx.TextRun({ text: `Data: ${new Date().toLocaleDateString()}`, size: FONT_SIZE_BODY })],
                        alignment: docx.AlignmentType.CENTER,
                    }),
                    new docx.Paragraph({ text: '' }),
                    new docx.Table({
                        rows: [
                            new docx.TableRow({
                                children: [
                                    new docx.TableCell({ children: [createSizedText("Responsável", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Seção", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Tema", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Item", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Subitem", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Descrição do Subitem", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Nível de Exigência", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Avaliação", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Evidências", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Propostas", FONT_SIZE_BODY, true)] }),
                                    new docx.TableCell({ children: [createSizedText("Observações", FONT_SIZE_BODY, true)] }),
                                ]
                            }),
                            ...data.map(item => new docx.TableRow({
                                children: [
                                    new docx.TableCell({ children: [createSizedText(item.responsible, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.section, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.theme, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.item_number, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.subitem_number, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.subitem_description, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.exigency_level, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.evaluation, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.evidences, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.proposals, FONT_SIZE_BODY)] }),
                                    new docx.TableCell({ children: [createSizedText(item.observations, FONT_SIZE_BODY)] }),
                                ]
                            }))
                        ],
                    }),
                ],
            }]
        });

        docx.Packer.toBlob(doc).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ata_reuniao_${responsibleInput.value || 'todos'}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    function generatePdfDocument() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        const minutesContent = document.getElementById('minutes-table-wrapper');

        minutesContent.classList.add('pdf-export-style');

        html2canvas(minutesContent, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 297;
            const pageHeight = 210; 
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            doc.save(`ata_reuniao_${responsibleInput.value || 'todos'}.pdf`);
            
            minutesContent.classList.remove('pdf-export-style');
        });
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
        responsibleInput.focus();
    });

    // ✨ ALTERAÇÃO: Trocamos o listener de 'click' do botão por 'submit' do formulário
    evaluationForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede que a página recarregue ao enviar o formulário
        generateMinutes();      // Chama sua função original para gerar a ata
    });

    loadDataAndInitialize();
});