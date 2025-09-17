document.addEventListener('DOMContentLoaded', () => {
    const responsibleInput = document.getElementById('responsible-input');
    const responsibleList = document.getElementById('responsible-list');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const tableBody = document.querySelector('#action-items-table tbody');
    const generateBtn = document.getElementById('generate-minutes-btn');
    const minutesOutput = document.getElementById('minutes-output');

    let meetingItems = [];
    let currentMinutesData = [];

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
    
        items.forEach(item => {
            const isMainItem = !item.subitem_number;
            const descriptionText = item.description || '';
            const subitemDescriptionText = item.subitem_description || '';
            
            if (item.section !== currentSection) {
                const sectionRow = document.createElement('tr');
                sectionRow.classList.add('section-header');
                sectionRow.innerHTML = `<td colspan="11"><strong>${item.section}</strong></td>`;
                tableBody.appendChild(sectionRow);
                currentSection = item.section;
                currentTheme = '';
            }
    
            if (item.theme && item.theme !== currentTheme) {
                const themeRow = document.createElement('tr');
                themeRow.classList.add('theme-header');
                themeRow.innerHTML = `<td colspan="11"><strong>Tema: ${item.theme}</strong></td>`;
                tableBody.appendChild(themeRow);
                currentTheme = item.theme;
            }
    
            const row = document.createElement('tr');
            row.dataset.masterId = item.master_id;

            row.innerHTML = `
                <td>${item.responsible || ''}</td>
                <td>${item.section || ''}</td>
                <td>${item.theme || ''}</td>
                <td>${item.item_number || ''}</td>
                <td>${isMainItem ? descriptionText : ''}</td>
                <td>${subitemDescriptionText}</td>
                <td>${item.exigency_level || ''}</td>
                <td class="evaluation-cell">
                    <label><input type="radio" name="evaluation-${item.master_id}" value="Sim"> Sim</label>
                    <label><input type="radio" name="evaluation-${item.master_id}" value="Não"> Não</label>
                    <label><input type="radio" name="evaluation-${item.master_id}" value="N/A"> N/A</label>
                </td>
                <td><textarea name="evidences" placeholder="Evidências..."></textarea></td>
                <td><textarea name="proposals" placeholder="Propostas..."></textarea></td>
                <td><textarea name="observations" placeholder="Observações..."></textarea></td>
            `;
            tableBody.appendChild(row);
        });
    }

    function generateMinutes() {
        minutesOutput.innerHTML = '';
        
        const filledItems = Array.from(tableBody.querySelectorAll('tr:not(.section-header):not(.theme-header)')).map(row => {
            const cells = row.querySelectorAll('td');
            const evaluation = row.querySelector('input[name^="evaluation-"]:checked');
            
            return {
                responsible: cells[0].textContent,
                section: cells[1].textContent,
                theme: cells[2].textContent,
                item_number: cells[3].textContent,
                item_description: cells[4].textContent,
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
                            <th>Descrição do Item</th>
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
                                <td>${item.item_description}</td>
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
    
    function generateWordDocument(data) {
        const doc = new docx.Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440, // 1 polegada em twips (1440 twips = 1 polegada)
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: [
                    new docx.Paragraph({
                        text: `Ata de Reunião - ${responsibleInput.value || 'Todos'}`,
                        heading: docx.HeadingLevel.TITLE,
                        alignment: docx.AlignmentType.CENTER,
                    }),
                    new docx.Paragraph({
                        text: `Data: ${new Date().toLocaleDateString()}`,
                        alignment: docx.AlignmentType.CENTER,
                    }),
                    new docx.Paragraph({ text: '' }),
                    new docx.Table({
                        rows: [
                            new docx.TableRow({
                                children: [
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Responsável", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Seção", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Tema", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Item", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Descrição do Item", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Descrição do Subitem", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Nível de Exigência", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Avaliação", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Evidências", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Propostas", bold: true })] }),
                                    new docx.TableCell({ children: [new docx.Paragraph({ text: "Observações", bold: true })] }),
                                ]
                            }),
                            ...data.map(item => new docx.TableRow({
                                children: [
                                    new docx.TableCell({ children: [new docx.Paragraph(item.responsible)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.section)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.theme)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.item_number)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.item_description)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.subitem_description)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.exigency_level)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.evaluation)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.evidences)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.proposals)] }),
                                    new docx.TableCell({ children: [new docx.Paragraph(item.observations)] }),
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
        const doc = new jsPDF('p', 'mm', 'a4');

        const minutesContent = document.getElementById('minutes-table-wrapper');

        html2canvas(minutesContent, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; 
            const pageHeight = 295;  
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

    generateBtn.addEventListener('click', generateMinutes);

    loadDataAndInitialize();
});