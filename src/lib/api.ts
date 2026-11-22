// Cliente da API em Go. O front chama a API direto pelo navegador (a API libera o front via CORS)
// e se autentica com o header "Authorization: Bearer <token>", como a API espera.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

const CHAVE_TOKEN = "seveste_token"

export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

export function lerToken(): string | null {
    try {
        return localStorage.getItem(CHAVE_TOKEN)
    } catch {
        return null
    }
}

export function salvarToken(token: string | null) {
    try {
        if (token) localStorage.setItem(CHAVE_TOKEN, token)
        else localStorage.removeItem(CHAVE_TOKEN)
    } catch {
        // armazenamento indisponível (ex.: navegação privada bloqueada): a sessão dura só até recarregar
    }
}

// Dados que a API coloca dentro do token (id e tipo do usuário). Não é preciso validar aqui:
// quem valida a assinatura é a API a cada requisição.
export type DadosToken = { usuario_id: number; tipo: "doador" | "acolhido"; exp: number }

export function decodificarToken(token: string): DadosToken | null {
    try {
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
        const json = decodeURIComponent(
            atob(payload).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
        )
        const dados = JSON.parse(json) as DadosToken
        return dados.exp * 1000 > Date.now() ? dados : null
    } catch {
        return null
    }
}

type Opcoes = {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: unknown
    signal?: AbortSignal
}

export async function api<T = unknown>(caminho: string, { method = "GET", body, signal }: Opcoes = {}): Promise<T> {
    const headers: Record<string, string> = {}
    const token = lerToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers["Content-Type"] = "application/json"

    let resposta: Response
    try {
        resposta = await fetch(`${API_URL}${caminho}`, {
            method,
            signal,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch (erro) {
        if (erro instanceof DOMException && erro.name === "AbortError") throw erro
        throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique se a API está rodando.")
    }

    if (resposta.status === 204) return undefined as T

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
        const mensagem = typeof dados?.erro === "string"
            ? traduzirErro(dados.erro)
            : resposta.status >= 500
                ? "O servidor está indisponível no momento. Tente novamente em instantes."
                : "Não foi possível concluir a operação."
        throw new ApiError(resposta.status, mensagem)
    }

    return dados as T
}

export function mensagemDeErro(erro: unknown) {
    if (erro instanceof Error) return erro.message
    return "Algo deu errado. Tente novamente."
}

// mensagens da API que aparecem para o usuário com um texto mais claro
const TRADUCOES: [RegExp, string][] = [
    [/credenciais invalidas/i, "E-mail ou senha incorretos."],
    [/ja existe um usuario cadastrado/i, "Já existe uma conta com este e-mail."],
    [/token/i, "Sua sessão expirou. Entre novamente."],
]

function traduzirErro(erro: string) {
    for (const [padrao, texto] of TRADUCOES) {
        if (padrao.test(erro)) return texto
    }
    return erro.charAt(0).toUpperCase() + erro.slice(1)
}
