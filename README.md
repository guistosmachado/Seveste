# Seveste

O **Seveste** é um projeto educacional desenvolvido como trabalho acadêmico na **FATEC Botucatu**. A proposta é criar uma plataforma voltada à doação e ao recebimento de roupas, aproximando pessoas que desejam contribuir de pessoas que precisam ser acolhidas.

O projeto busca aplicar a tecnologia em um contexto de impacto social, tornando o processo de doação mais simples, organizado e acessível. Além de atender aos objetivos acadêmicos, o Seveste representa uma oportunidade de desenvolver uma solução com potencial para ajudar a comunidade e incentivar o reaproveitamento consciente de roupas.

## Tecnologias

O frontend é desenvolvido com **Next.js**, **React**, **TypeScript** e **Tailwind CSS**. O backend utiliza **Go**, responsável pela API, regras de negócio e integração com os dados da aplicação.

O desenvolvimento também considera boas práticas de organização, responsividade, acessibilidade, segurança e proteção de dados pessoais conforme a LGPD.

## Contexto acadêmico

Este repositório faz parte de um trabalho da **FATEC Botucatu** e possui finalidade principalmente educacional. Seu desenvolvimento permite colocar em prática conhecimentos de frontend, backend, integração entre sistemas e trabalho colaborativo, utilizando tecnologias atuais em uma proposta direcionada ao bem social.

## Como rodar localmente

São dois processos: a API em Go e o front-end em Next.js. Para testar não é preciso banco de dados: sem a variável `DATABASE_URL`, a API usa repositórios em memória já com dados de exemplo (os dados somem quando ela reinicia).

1. **API** — porta `8080`:

   ```bash
   cd api
   go run .
   ```

   Contas de exemplo: doador `teste@gmail.com` / `teste` e acolhido `pedrinho@gmail.com` / `pedrinho`. As demais variáveis da API estão em [API.md](API.md).

2. **Front-end** — porta `3000`, em outro terminal:

   ```bash
   npm install
   npm run dev
   ```

   Abra http://localhost:3000.

### Variáveis do front-end

| Variável | Padrão | Para quê |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Endereço da API |
| `BLOB_READ_WRITE_TOKEN` | — | Envio de fotos pelo Vercel Blob. Sem ele, o formulário de anunciar aceita links de imagem |
