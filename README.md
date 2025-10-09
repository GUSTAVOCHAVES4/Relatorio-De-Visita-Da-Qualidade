# 📌 Relatório De Visita Da Qualidade

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-blue)

Gerador de atas das visitas do setor da qualidade realizadas no HSPM, verificando conformidade com os pontos do roteiro do CQH.

---

## 📖 Sobre

Este projeto automatiza a criação de atas das visitas do setor da qualidade no HSPM. Ele segue os pontos definidos pelo roteiro do **CQH**, garantindo padronização e agilidade na geração dos relatórios.

---

## 🛠 Tecnologias

- **JavaScript** – Lógica e manipulação de dados.
- **HTML** – Estrutura da aplicação.
- **CSS** – Estilização e layout.
- **JSON** – Armazenamento e troca de dados.

---

## ▶️ Como Funciona

- O usuário filtra pelo **setor responsável** do HSPM.
- São exibidos os **itens de ação correspondentes** com:
  - Descrição
  - Seção
  - Tema
  - Número do item
  - Subitem
  - Descrição do item e subitem
  - Nível de exigência do item
- O usuário preenche:
  - Avaliação: **Sim**, **Não** ou **N/A**
  - **Evidências coletadas** durante a visita
  - **Propostas de melhoria**
  - **Observações**
- É possível **anexar imagens** para a ata gerada.
- Ao clicar em **Gerar Ata**, é exibida uma prévia com:
  - Tabela contendo as informações fixas e preenchidas
  - Imagens anexadas abaixo
- No final, há dois botões:
  - **Gerar PDF**
  - **Gerar DOCX**

---

## 📜 Licença

Este projeto está sob a licença [MIT](LICENSE).