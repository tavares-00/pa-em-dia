# PA em dia

Checklist pessoal para conferir 48 posições de atendimento no fim do dia. Feito para celular, sem instalação de dependências, conta ou servidor de dados.

## Uso

1. Escolha a data e preencha o responsável.
2. Confira os dois monitores, teclado, mouse, mouse pad e headset de cada baia.
3. Toque em **Tudo presente** quando todos os equipamentos estiverem presentes. Isso não registra teste de funcionamento.
4. Se faltar algo, marque os itens presentes e toque em **Concluir PA**.
5. Cada equipamento ausente gera uma ocorrência ao concluir a baia. Em **Headset**, registre também a etiqueta encontrada e a condição. A etiqueta esperada é o próprio PA.
6. Marcar um item como presente encerra automaticamente sua ocorrência de ausência. Em **Ocorrências**, registrar a solução também atualiza o checklist: repõe o item, corrige a etiqueta ou limpa o defeito correspondente. Problemas independentes permanecem abertos.
7. Em **Ver histórico completo**, consulte descrição original, data, status e solução de todas as ocorrências. Uma nova ausência do mesmo item, mesmo no mesmo dia, cria um novo registro. O PDF inclui as ocorrências abertas na data e as resolvidas nesse dia.
7. Use **Relatório / PDF**, depois **Imprimir / salvar PDF**. Selecione PDF na impressão do navegador e envie manualmente ao Drive. No iPhone, use o compartilhamento da prévia de impressão.

## Agilizar a ronda

- Cada baia mostra suas pendências abertas e desde quando existem, com acesso direto a **Ver / resolver**.
- **Copiar de ontem** replica equipamentos, etiqueta, condição do headset e observação do dia anterior e **já registra a conferência da data selecionada**, com o horário do clique. Use depois de conferir a baia na prática.
- A cópia não duplica ocorrências que continuam abertas. A origem da cópia fica indicada no cartão e no relatório.
- O botão fica desativado se aquele PA não tiver uma conferência concluída no dia imediatamente anterior; rascunhos e dias mais antigos não são usados.

## Dados e backup

- Dados ficam no `localStorage` deste navegador e endereço. Não são enviados ao GitHub, Drive nem a outro servidor pela aplicação.
- O site e seu código podem ser públicos, mas cada navegador tem seus próprios registros. Não há sincronização entre aparelhos.
- Limpar os dados do navegador ou usar modo privado pode remover os registros. Baixe backups regularmente.
- Antes de trocar de domínio, aparelho ou navegador, baixe um backup JSON e restaure no novo endereço. O PDF é o relatório; o JSON permite restaurar o histórico.
- Backups da primeira versão são aceitos: prioriza a saída e utiliza a chegada onde a saída não foi preenchida. O original é preservado no backup.
- A etiqueta `PA XX` informa a baia esperada, não uma identificação única do equipamento.
- A reposição de um item encerra automaticamente a ausência; a correção da etiqueta encerra a troca. A presença do headset não encerra um defeito de áudio independente. A resolução manual de um defeito atualiza a condição para "Sem problema observado" e mantém o relato original na ocorrência.
- A atualização reconcilia registros da versão anterior, incluindo defeitos já resolvidos que continuavam aparecendo no checklist. Os dados e o histórico existentes são mantidos.
- Não coloque PDFs nem backups preenchidos neste repositório público.

## Publicar no GitHub Pages

Os arquivos da aplicação ficam na raiz. Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e salve. No GitHub Free, Pages exige repositório público.

Não há etapa de build nem chaves de API. Os caminhos dos arquivos são relativos, compatíveis com `/pa-em-dia/`.

## Publicar na Vercel

Importe este repositório, selecione **Other**, deixe o comando de build vazio e use a raiz como diretório de saída. Consulte a elegibilidade do plano da Vercel para a finalidade do seu uso.

## Desenvolvimento e verificação

Abra com um servidor estático, por exemplo `python -m http.server 8080`. As regras de negócio podem ser verificadas com `node test.cjs`.

`model.js` contém as regras e validações; `app.js`, a interface; `style.css`, os estilos responsivos e de impressão.
