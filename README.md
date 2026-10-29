# PA em dia

Checklist pessoal para conferir 48 posições de atendimento no fim do dia. Feito para celular, sem instalação de dependências, conta ou servidor de dados.

## Uso

1. Escolha a data e preencha o responsável.
2. Confira os dois monitores, teclado, mouse, mouse pad e headset de cada baia.
3. Toque em **Tudo presente** quando todos os equipamentos estiverem presentes. Isso não registra teste de funcionamento.
4. Se faltar algo, marque os itens presentes e toque em **Concluir PA**.
5. Em **Headset**, registre a etiqueta encontrada e a condição. A etiqueta esperada é o próprio PA. Troca, ausência e defeito geram pendências ao concluir a baia.
6. Em **Pendências**, registre o que foi feito para resolver. O registro original do checklist é preservado.
7. Use **Relatório / PDF**, depois **Imprimir / salvar PDF**. Selecione PDF na impressão do navegador e envie manualmente ao Drive. No iPhone, use o compartilhamento da prévia de impressão.

## Dados e backup

- Dados ficam no `localStorage` deste navegador e endereço. Não são enviados ao GitHub, Drive nem a outro servidor pela aplicação.
- O site e seu código podem ser públicos, mas cada navegador tem seus próprios registros. Não há sincronização entre aparelhos.
- Limpar os dados do navegador ou usar modo privado pode remover os registros. Baixe backups regularmente.
- Antes de trocar de domínio, aparelho ou navegador, baixe um backup JSON e restaure no novo endereço. O PDF é o relatório; o JSON permite restaurar o histórico.
- Backups da primeira versão são aceitos: prioriza a saída e utiliza a chegada onde a saída não foi preenchida. O original é preservado no backup.
- A etiqueta `PA XX` informa a baia esperada, não uma identificação única do equipamento.
- Pendências permanecem abertas até registrar uma solução. Corrigir o checklist não encerra automaticamente uma ocorrência.
- Não coloque PDFs nem backups preenchidos neste repositório público.

## Publicar no GitHub Pages

Os arquivos da aplicação ficam na raiz. Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e salve. No GitHub Free, Pages exige repositório público.

Não há etapa de build nem chaves de API. Os caminhos dos arquivos são relativos, compatíveis com `/pa-em-dia/`.

## Publicar na Vercel

Importe este repositório, selecione **Other**, deixe o comando de build vazio e use a raiz como diretório de saída. Consulte a elegibilidade do plano da Vercel para a finalidade do seu uso.

## Desenvolvimento e verificação

Abra com um servidor estático, por exemplo `python -m http.server 8080`. As regras de negócio podem ser verificadas com `node test.cjs`.

`model.js` contém as regras e validações; `app.js`, a interface; `style.css`, os estilos responsivos e de impressão.
