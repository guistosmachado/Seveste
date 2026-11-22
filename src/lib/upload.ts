import { upload } from "@vercel/blob/client"
import { lerToken } from "./api"
import { comprimirImagem } from "./imagem"

// O envio de arquivos só funciona com o Vercel Blob configurado (BLOB_READ_WRITE_TOKEN).
// Sem ele, o formulário de anunciar mostra um campo para colar o link da imagem.
export async function envioDeFotosDisponivel(): Promise<boolean> {
    try {
        const resposta = await fetch("/api/upload", { cache: "no-store" })
        const dados = (await resposta.json()) as { disponivel?: boolean }
        return Boolean(dados.disponivel)
    } catch {
        return false
    }
}

// Reduz a foto no navegador e envia direto para o Vercel Blob. Devolve a URL pública, que é o que a API guarda.
export async function enviarFoto(arquivo: File): Promise<string> {
    const reduzida = await comprimirImagem(arquivo)

    try {
        const blob = await upload(`doacoes/${reduzida.name}`, reduzida, {
            access: "public",
            handleUploadUrl: "/api/upload",
            headers: { Authorization: `Bearer ${lerToken() ?? ""}` },
            contentType: reduzida.type,
        })
        return blob.url
    } catch {
        throw new Error(`Não foi possível enviar a foto "${arquivo.name}". Tente novamente.`)
    }
}
