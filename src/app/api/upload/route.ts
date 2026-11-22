import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

// Autoriza o navegador a enviar fotos de doações direto para o Vercel Blob.
// A API em Go só guarda a URL da foto; o arquivo em si fica no Blob.
//
// Precisa da variável BLOB_READ_WRITE_TOKEN (criada ao conectar um Blob store ao projeto na Vercel).
// Sem ela, a rota responde 503 e o formulário de anunciar continua aceitando links de imagem.

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

const TAMANHO_MAXIMO = 1024 * 1024 // 1 MB: as fotos já são reduzidas no navegador antes do envio

// só doadores logados podem enviar fotos: a própria API confere o token
async function ehDoadorLogado(autorizacao: string | null) {
    if (!autorizacao?.startsWith("Bearer ")) return false

    try {
        const resposta = await fetch(`${API_URL}/doacoes/minhas`, {
            headers: { Authorization: autorizacao },
            cache: "no-store",
        })
        return resposta.ok
    } catch {
        return false
    }
}

// informa ao formulário se o envio de arquivos está disponível (sem o token do Blob, ele mostra o campo de link)
export async function GET() {
    return Response.json({ disponivel: Boolean(process.env.BLOB_READ_WRITE_TOKEN) })
}

export async function POST(request: Request) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return Response.json({ erro: "envio de fotos nao configurado neste ambiente" }, { status: 503 })
    }

    const body = (await request.json()) as HandleUploadBody

    if (body.type === "blob.generate-client-token" && !(await ehDoadorLogado(request.headers.get("authorization")))) {
        return Response.json({ erro: "somente doadores logados podem enviar fotos" }, { status: 401 })
    }

    try {
        const resposta = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
                maximumSizeInBytes: TAMANHO_MAXIMO,
                addRandomSuffix: true,
            }),
        })

        return Response.json(resposta)
    } catch (erro) {
        return Response.json({ erro: erro instanceof Error ? erro.message : "erro ao enviar a foto" }, { status: 400 })
    }
}
