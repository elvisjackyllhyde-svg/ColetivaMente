# ColetivaMente

SaaS de engajamento corporativo com três dinâmicas ao vivo, todas integradas neste mesmo app:

- **GiroQuiz** — quiz ao vivo com ranking em tempo real, importação de perguntas por PDF e trilha sonora.
- **Voto em Valor** — pesquisa/votação por categorias com dashboard de resultados e segunda rodada de opiniões.
- **Sorteio** — sorteio de prêmios com inscrição pelo celular (gratuito, não exige conta).

GiroQuiz e Voto em Valor exigem assinatura (R$120 = 30 dias de acesso, via Mercado Pago). O Sorteio é gratuito e serve como porta de entrada para os outros dois.

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

- `app/`: páginas, estilos e rotas da API dos três produtos, autenticação, billing e painel admin
- `db/`: conexão, esquema e helpers de autenticação/CSRF
- `drizzle/`: migrações SQL
- `lib/`: integrações (Mercado Pago, e-mail, quiz em tempo real, rate limiting, audit log)
- `public/`: logos, músicas e assets públicos
- `worker/`: entrada do Cloudflare Worker, incluindo o Durable Object do GiroQuiz em tempo real
- `build/`: integração do build com Cloudflare Sites
- `tests/`: testes automatizados

## Deploy

O worker (`coletivamente`) roda no Cloudflare Workers, com domínio customizado `coletivamente.app`. O deploy é feito pela integração Git do Cloudflare: um push para `main` no GitHub dispara o build e a publicação automaticamente.
