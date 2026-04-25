## 2024-05-19 - Adicionado ARIA labels em botões de navegação do calendário
**Learning:** O componente de filtro na sidebar utiliza botões contendo apenas ícones (`<ChevronLeft>` e `<ChevronRight>`) para navegar entre os meses no calendário. Eles não continham descrição acessível (ex: `aria-label`).
**Action:** Adicionados `aria-label="Mês anterior"` e `aria-label="Próximo mês"` nos botões, melhorando o suporte a leitores de tela sem adicionar texto visível ou alterar o design.
