# Giro Experiências

Portal que reúne o GiroQuiz Ao Vivo e o Voto em Valor. Este repositório contém o portal e a aplicação completa do Voto em Valor, com votação por categorias, cadastro de participantes, resultados ao vivo e segunda rodada de opiniões.

## Requisitos

- Node.js 22.13 ou superior
- npm

## Instalação

```bash
npm install
```

## Execução local

```bash
npm run dev
```

Abra o endereço exibido no terminal, normalmente `http://localhost:3000`.

## Build de produção

```bash
npm run build
npm run start
```

## Outros comandos

```bash
npm run test
npm run lint
npm run db:generate
```

## Banco de dados local

O projeto usa Cloudflare D1 por meio do plugin oficial do Cloudflare para Vite. No desenvolvimento, o Wrangler/Miniflare cria e mantém o banco local dentro da pasta ignorada `.wrangler`.

As tabelas e migrações estão em `db/` e `drizzle/`. A configuração do binding fica em `.openai/hosting.json` e usa o nome `DB`.

## Estrutura principal

- `app/`: páginas, estilos e rotas da API
- `db/`: conexão e esquema do banco
- `drizzle/`: migrações SQL
- `public/`: logos e assets públicos
- `worker/`: entrada do Cloudflare Worker
- `build/`: integração do build com Sites
- `tests/`: testes automatizados

## Observação sobre o GiroQuiz

O cartão GiroQuiz do portal aponta para a aplicação pública `https://giroquiz-ao-vivo.elvispieta.chatgpt.site`. O código-fonte incluído neste pacote corresponde ao portal Giro Experiências e ao Voto em Valor.
