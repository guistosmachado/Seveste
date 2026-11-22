# Deploy na Vercel

O Seveste é publicado como **dois projetos na Vercel**, a partir deste mesmo repositório:

| Projeto | Root Directory | O que roda |
| :--- | :--- | :--- |
| API | `api` | A API em Go como função serverless (`api/api/index.go`) |
| Front | raiz do repositório | O Next.js |

O banco é PostgreSQL (Prisma Postgres ou Vercel → Storage → Postgres) e as fotos ficam no Vercel Blob.

## Arquivos de deploy da API (já estão no repositório)

- `api/api/index.go`: na Vercel o `main.go` não é usado; ela chama a função `Handler` a cada requisição. A API é montada uma vez por instância com `database.Conectar` + `repositories.UsarPostgres` + `router.Configurar`. Sem `DATABASE_URL` a função responde 503.
- `api/vercel.json`: manda todas as rotas para essa função; o Gin faz o roteamento (`/api/v1/...`).

Localmente nada muda: continue usando `go run .` dentro de `api/`.

## Passo a passo

### 1. Banco de dados

Crie o banco e copie a connection string (`postgres://...`). Depois crie as tabelas rodando o `api/sql/setup.sql` **sem as 4 primeiras linhas**: `DROP DATABASE`, `CREATE DATABASE` e `\c` não funcionam no Prisma Postgres, que tem um único banco já criado.

```powershell
Get-Content api/sql/setup.sql | Select-Object -Skip 4 | psql "<connection string>"
```

### 2. Criar os dois projetos

Crie os projetos da API e do front na Vercel (*Add New → Project*, mesmo repositório, cada um com o seu *Root Directory*) e anote os endereços `.vercel.app` de cada um. Um precisa do endereço do outro nas variáveis abaixo.

### 3. Variáveis de ambiente

**Projeto da API:**

| Variável | Valor |
| :--- | :--- |
| `DATABASE_URL` | Connection string do banco |
| `JWT_SECRET` | Texto longo e aleatório (chave dos tokens de login) |
| `CORS_ORIGIN` | Endereço do front, ex.: `https://seveste.vercel.app` |

**Projeto do front:**

| Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Endereço da API + `/api/v1`, ex.: `https://seveste-api.vercel.app/api/v1` |
| `BLOB_READ_WRITE_TOKEN` | Criada automaticamente ao conectar um Blob store ao projeto (*Storage → Blob*) |

### 4. Publicar e testar

Depois de preencher as variáveis, faça o redeploy dos dois projetos e confira:

- `https://<api>.vercel.app/api/v1/doacoes` deve responder `{"doacoes":[]}`;
- no front, criar uma conta, anunciar uma peça com foto e vê-la na vitrine.

## Cuidados

- Nunca commitar a `DATABASE_URL` nem o `JWT_SECRET`.
- Não definir `SEED_DATA` em produção: ele insere as contas de exemplo no banco.
- As fotos não são apagadas do Blob quando uma doação ou conta é excluída.
- O plano gratuito da Vercel, do Prisma e do Blob tem limites de uso; acompanhe pelo painel de cada um.
