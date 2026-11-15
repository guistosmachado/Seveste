# Documentação da API - Seveste

[🇧🇷 Português](#português) | [🇺🇸 English](#english)

---

## Português

Esta documentação descreve os endpoints da API do projeto Seveste: método HTTP, rota, necessidade de autenticação e uma breve descrição. Todas as rotas ficam sob `/api/v1`. A autenticação é feita com o header `Authorization: Bearer <token>` (token obtido em `POST /login`, válido por 6 horas).

**Perfis:** `doador` publica doações; `acolhido` solicita doações. "Dono" é quem criou o recurso.

**Variáveis de ambiente:** `DATABASE_URL` (conexão com o PostgreSQL; sem ela a API usa repositórios em memória), `SEED_DATA=true` (carrega dados de exemplo se o banco estiver vazio), `JWT_SECRET` (chave de assinatura do token — obrigatória em produção), `CORS_ORIGIN` (origem do frontend; padrão `http://localhost:3000`) e `PORT` (padrão `8080`). Veja `api/.env.example`.

### 1. Usuários e Autenticação

| Método   | Endpoint        | Autenticação | Descrição                                                          |
| -------- | --------------- | ------------ | ------------------------------------------------------------------ |
| `POST`   | `/usuarios`     | Não          | Cadastra um novo usuário (e-mail único). Retorna `409` se já existir. |
| `POST`   | `/login`        | Não          | Realiza o login e retorna o token JWT.                             |
| `GET`    | `/usuarios`     | Não          | Lista o perfil público dos doadores (id, nome, tipo, UF, cidade). Acolhidos nunca aparecem. |
| `GET`    | `/usuarios/:id` | Opcional     | Dono (com token): perfil completo, sem senha. Outros: perfil público de um doador; acolhido retorna `404`. |
| `PATCH`  | `/usuarios/:id` | Sim          | Atualiza os dados de um usuário (apenas o dono).                   |
| `DELETE` | `/usuarios/:id` | Sim          | Deleta o usuário, suas doações e solicitações (apenas o dono).     |

### 2. Doações

| Método   | Endpoint                          | Autenticação | Descrição                                                                                      |
| -------- | --------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `POST`   | `/doacoes`                        | Sim (doador) | Cria uma doação com endereço e imagens (opcional).                                             |
| `GET`    | `/doacoes`                        | Não          | Lista as doações. Filtros opcionais: `?status=`, `?categoria=`, `?cidade=`.                    |
| `GET`    | `/doacoes/minhas`                 | Sim (doador) | Lista as doações do doador logado.                                                             |
| `GET`    | `/doacoes/:id`                    | Não          | Exibe uma doação. Endereço completo só para o dono e para quem teve a solicitação aceita.      |
| `GET`    | `/doacoes/:id/solicitacoes`       | Sim          | Lista as solicitações da doação, com dados do solicitante (apenas o dono).                     |
| `GET`    | `/doacoes/:id/historico`          | Sim          | Exibe o histórico de status da doação (apenas o dono).                                         |
| `PATCH`  | `/doacoes/:id`                    | Sim          | Atualiza os dados de uma doação (apenas o dono).                                               |
| `PATCH`  | `/doacoes/:id/concluir`           | Sim          | Marca como `concluida` uma doação `reservada` (apenas o dono).                                 |
| `DELETE` | `/doacoes/:id`                    | Sim          | Deleta a doação, solicitações, imagens e histórico (apenas o dono).                            |
| `POST`   | `/doacoes/:id/imagens`            | Sim          | Adiciona uma imagem por URL (máximo de 4; apenas o dono).                                      |
| `DELETE` | `/doacoes/:id/imagens/:imagemId`  | Sim          | Remove uma imagem (apenas o dono).                                                             |

Status da doação: `disponivel` → `reservada` (ao aceitar uma solicitação) → `concluida`. Tipos de entrega: `retirada`, `entrega`, `a_combinar`.

Exemplo de `POST /doacoes`:

```json
{
  "titulo": "Camiseta azul",
  "descricao": "Camiseta azul tamanho G levemente usada",
  "categoria": "roupas",
  "tamanho": "g",
  "estado": "usada",
  "tipo_de_entrega": "retirada",
  "endereco": { "rua": "Rua Amando de Barros", "numero": "100", "uf": "SP", "cidade": "Botucatu", "complemento": "" },
  "imagens": ["https://exemplo.com/foto1.jpg"]
}
```

### 3. Solicitações

| Método   | Endpoint                       | Autenticação   | Descrição                                                                                              |
| -------- | ------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| `POST`   | `/solicitacoes`                | Sim (acolhido) | Cria uma solicitação (`{"id_doacao": 1}`). Só para doações `disponivel` e sem solicitação ativa sua.   |
| `GET`    | `/solicitacoes/minhas`         | Sim            | Exibe o histórico de solicitações do usuário logado.                                                   |
| `GET`    | `/solicitacoes/:id`            | Sim            | Exibe uma solicitação (quem a fez ou o dono da doação).                                                |
| `PATCH`  | `/solicitacoes/:id/aceitar`    | Sim            | Aceita a solicitação: reserva a doação e recusa as demais pendentes (apenas o dono da doação).         |
| `PATCH`  | `/solicitacoes/:id/recusar`    | Sim            | Recusa uma solicitação pendente (apenas o dono da doação).                                             |
| `DELETE` | `/solicitacoes/:id`            | Sim            | Cancela uma solicitação; se estava aceita, a doação volta a `disponivel` (apenas quem a fez).          |

E-mail e telefone do acolhido só aparecem para o doador depois que a solicitação é aceita.

---

## English

This document describes the Seveste API endpoints: HTTP method, route, authentication requirement and a short description. All routes live under `/api/v1`. Authentication uses the `Authorization: Bearer <token>` header (token from `POST /login`, valid for 6 hours).

**Roles:** `doador` (donor) publishes donations; `acolhido` (recipient) requests them. "Owner" is whoever created the resource.

**Environment variables:** `DATABASE_URL` (PostgreSQL connection; without it the API uses in-memory repositories), `SEED_DATA=true` (loads sample data if the database is empty), `JWT_SECRET` (token signing key — required in production), `CORS_ORIGIN` (frontend origin; defaults to `http://localhost:3000`) and `PORT` (defaults to `8080`). See `api/.env.example`.

### 1. Users and Authentication

| Method   | Endpoint        | Authentication | Description                                                  |
| -------- | --------------- | -------------- | ------------------------------------------------------------ |
| `POST`   | `/usuarios`     | No             | Creates a user (unique e-mail). Returns `409` if it exists.  |
| `POST`   | `/login`        | No             | Logs in and returns the JWT token.                           |
| `GET`    | `/usuarios`     | No             | Lists donors' public profile (id, name, type, state, city). Recipients never appear. |
| `GET`    | `/usuarios/:id` | Optional       | Owner (with token): full profile, no password. Others: a donor's public profile; a recipient returns `404`. |
| `PATCH`  | `/usuarios/:id` | Yes            | Updates a user's data (owner only).                          |
| `DELETE` | `/usuarios/:id` | Yes            | Deletes the user, their donations and requests (owner only). |

### 2. Donations

| Method   | Endpoint                          | Authentication | Description                                                                          |
| -------- | --------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `POST`   | `/doacoes`                        | Yes (donor)    | Creates a donation with address and optional images.                                 |
| `GET`    | `/doacoes`                        | No             | Lists donations. Optional filters: `?status=`, `?categoria=`, `?cidade=`.            |
| `GET`    | `/doacoes/minhas`                 | Yes (donor)    | Lists the logged-in donor's donations.                                               |
| `GET`    | `/doacoes/:id`                    | No             | Displays a donation. Full address only for the owner and the accepted requester.     |
| `GET`    | `/doacoes/:id/solicitacoes`       | Yes            | Lists the donation's requests with requester info (owner only).                      |
| `GET`    | `/doacoes/:id/historico`          | Yes            | Displays the donation's status history (owner only).                                 |
| `PATCH`  | `/doacoes/:id`                    | Yes            | Updates a donation (owner only).                                                     |
| `PATCH`  | `/doacoes/:id/concluir`           | Yes            | Marks a `reservada` donation as `concluida` (owner only).                            |
| `DELETE` | `/doacoes/:id`                    | Yes            | Deletes the donation, requests, images and history (owner only).                     |
| `POST`   | `/doacoes/:id/imagens`            | Yes            | Adds an image by URL (max 4; owner only).                                            |
| `DELETE` | `/doacoes/:id/imagens/:imagemId`  | Yes            | Removes an image (owner only).                                                       |

Donation status: `disponivel` → `reservada` (when a request is accepted) → `concluida`. Delivery types: `retirada`, `entrega`, `a_combinar`.

### 3. Requests

| Method   | Endpoint                       | Authentication  | Description                                                                                      |
| -------- | ------------------------------ | --------------- | ------------------------------------------------------------------------------------------------ |
| `POST`   | `/solicitacoes`                | Yes (recipient) | Creates a request (`{"id_doacao": 1}`). Only for `disponivel` donations without your active request. |
| `GET`    | `/solicitacoes/minhas`         | Yes             | Displays the logged-in user's request history.                                                   |
| `GET`    | `/solicitacoes/:id`            | Yes             | Displays a request (its author or the donation owner).                                           |
| `PATCH`  | `/solicitacoes/:id/aceitar`    | Yes             | Accepts the request: reserves the donation and declines the other pending ones (donation owner only). |
| `PATCH`  | `/solicitacoes/:id/recusar`    | Yes             | Declines a pending request (donation owner only).                                                |
| `DELETE` | `/solicitacoes/:id`            | Yes             | Cancels a request; if it was accepted, the donation goes back to `disponivel` (author only).    |

The recipient's e-mail and phone are only shown to the donor after the request is accepted.
