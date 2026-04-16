# PRISGA - Proposta de Implementação de Sistema de Gestão Agrícola

O PRISGA é uma solução inovadora para monitoramento e gestão agrícola, utilizando tecnologias de IoT para coletar dados em tempo real e fornecer insights valiosos para a saúde do campo. Este projeto foi desenvolvido para facilitar a tomada de decisões preventivas e melhorar a eficiência na gestão de recursos agrícolas.

---

### Funcionalidades Principais

- **Monitoramento em Tempo Real**: Acompanhe a umidade do solo, temperatura, nível de água, qualidade do ar e outros parâmetros críticos.
- **Alertas Inteligentes**: Receba notificações sobre condições críticas, como incêndios ou níveis de fumaça elevados.
- **Histórico de Dados**: Visualize e exporte dados históricos em formatos como PDF e CSV.
- **Gestão de Irrigação**: Controle automático ou manual com base em limites configuráveis.
- **Interface Intuitiva**: Painéis interativos e gráficos para visualização clara dos dados.

---

### Estrutura do Projeto

- **Frontend**: Desenvolvido com React e TypeScript, utilizando bibliotecas como TailwindCSS para estilização e Recharts para gráficos.
- **Backend**: Integração com Supabase para autenticação e armazenamento de dados.
- **Testes**: Configuração com Playwright e Vitest para garantir a qualidade do código.
- **Configuração**: Arquivos de configuração para Vite, ESLint, e Tailwind.

---

### Como Executar o Projeto

1. **Pré-requisitos**:
   - Node.js (versão 16 ou superior)
   - Gerenciador de pacotes (npm ou yarn)

2. **Instalação**:
   ```bash
   npm install
   ```

3. **Execução**:
   ```bash
   npm run dev
   ```

4. **Testes**:
   ```bash
   npm run test
   ```

---

### Estrutura de Pastas

- **src/**: Contém os arquivos principais do frontend.
  - **components/**: Componentes reutilizáveis da interface.
  - **pages/**: Páginas principais da aplicação.
  - **hooks/**: Hooks personalizados para lógica reutilizável.
  - **lib/**: Funções utilitárias e dados mockados.
- **supabase/**: Configurações e migrações do banco de dados.

---

### Contribuição

Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

1. Faça um fork do repositório.
2. Crie uma branch para sua feature ou correção:
   ```bash
   git checkout -b minha-feature
   ```
3. Envie um pull request.

---

### Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

### Contato

Desenvolvido por **Ludovina Quinguaia**. Para dúvidas ou sugestões, entre em contato pelo e-mail: [seuemail@exemplo.com](mailto:seuemail@exemplo.com).
