"use client"

import { use, useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/components/AuthProvider"
import DonationPhoto from "@/components/DonationPhoto"
import { ErrorMessage, Loading } from "@/components/Feedback"
import { api, mensagemDeErro } from "@/lib/api"
import { CATEGORIAS, CONDICOES, MAXIMO_FOTOS, TAMANHOS, TIPOS_ENTREGA, UFS } from "@/lib/constants"
import { envioDeFotosDisponivel, enviarFoto } from "@/lib/upload"
import type { Doacao, Endereco } from "@/lib/types"
import {
    UploadCloud,
    ImagePlus,
    Info,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Truck,
    Link2,
    X
} from "lucide-react"

type Campos = {
    titulo: string
    categoria: string
    tamanho: string
    estado: string
    tipo_de_entrega: string
    descricao: string
}

type CamposEndereco = { rua: string; numero: string; complemento: string; cidade: string; uf: string }

// fotos já salvas têm id (imagem da API); as novas só têm a URL (Vercel Blob ou link colado)
type Foto = { url: string; id?: number }

const CAMPOS_VAZIOS: Campos = { titulo: "", categoria: "", tamanho: "", estado: "", tipo_de_entrega: "", descricao: "" }

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base outline-none transition-colors duration-200 hover:border-seveste-green focus:border-seveste-green focus:ring-1 focus:ring-seveste-green"
const labelClass = "mb-1.5 block text-sm font-medium text-seveste-dark"
const opcaoClass = "group flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-3 text-sm text-seveste-muted transition-all duration-200 hover:border-seveste-green hover:bg-seveste-green/5 hover:text-seveste-dark has-checked:border-seveste-green has-checked:bg-seveste-green/10 has-checked:text-seveste-dark has-checked:font-semibold has-focus-visible:ring-2 has-focus-visible:ring-seveste-green"

export default function AnnounceDonation({
    searchParams,
}: {
    searchParams: Promise<{ editar?: string | string[] }>
}) {
    const { editar } = use(searchParams)
    const idEdicao = typeof editar === "string" && /^\d+$/.test(editar) ? editar : null

    const { usuario, carregando } = useRequireAuth("doador")
    const router = useRouter()

    const [campos, setCampos] = useState<Campos>(CAMPOS_VAZIOS)
    const [endereco, setEndereco] = useState<CamposEndereco | null>(null)
    const [enderecoSalvo, setEnderecoSalvo] = useState<Endereco | null>(null)
    const [fotos, setFotos] = useState<Foto[]>([])
    const [removidas, setRemovidas] = useState<number[]>([])
    const [linkFoto, setLinkFoto] = useState("")
    const [envioDisponivel, setEnvioDisponivel] = useState<boolean | null>(null)
    const [enviandoFotos, setEnviandoFotos] = useState(false)
    const [carregandoDoacao, setCarregandoDoacao] = useState(!!idEdicao)
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        envioDeFotosDisponivel().then(setEnvioDisponivel)
    }, [])

    // endereço começa com a cidade/UF do cadastro (só na criação; na edição a API não altera o endereço)
    const enderecoAtual: CamposEndereco = endereco ?? { rua: "", numero: "", complemento: "", cidade: usuario?.cidade ?? "", uf: usuario?.uf ?? "" }

    // no modo de edição, carrega os dados atuais do anúncio
    useEffect(() => {
        if (!idEdicao || !usuario) return

        api<{ doacao: Doacao }>(`/doacoes/${idEdicao}`)
            .then(({ doacao }) => {
                if (doacao.id_usuario !== usuario.id_usuario) {
                    router.replace("/dashboard")
                    return
                }
                setCampos({
                    titulo: doacao.titulo,
                    categoria: doacao.categoria,
                    tamanho: doacao.tamanho,
                    estado: doacao.estado,
                    tipo_de_entrega: doacao.tipo_de_entrega,
                    descricao: doacao.descricao,
                })
                setEnderecoSalvo(doacao.endereco ?? null)
                setFotos(
                    [...(doacao.imagens ?? [])]
                        .sort((a, b) => Number(b.capa) - Number(a.capa) || a.posicao - b.posicao)
                        .map((i) => ({ url: i.url, id: i.id_doacao_imagem })),
                )
            })
            .catch((e) => setErro(mensagemDeErro(e)))
            .finally(() => setCarregandoDoacao(false))
    }, [idEdicao, usuario, router])

    const atualizar = (campo: keyof Campos) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setCampos({ ...campos, [campo]: event.target.value })
    }

    const atualizarEndereco = (campo: keyof CamposEndereco) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEndereco({ ...enderecoAtual, [campo]: event.target.value })
    }

    const vagas = MAXIMO_FOTOS - fotos.length

    // envia as fotos escolhidas para o Vercel Blob (reduzidas no navegador) e guarda as URLs
    const handleSelecionarFotos = async (event: ChangeEvent<HTMLInputElement>) => {
        const arquivos = Array.from(event.target.files ?? []).slice(0, Math.max(vagas, 0))
        event.target.value = ""
        setErro(null)

        if ((event.target.files?.length ?? 0) > vagas) {
            setErro(`Você pode adicionar no máximo ${MAXIMO_FOTOS} fotos por anúncio.`)
        }

        setEnviandoFotos(true)
        for (const arquivo of arquivos) {
            if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
                setErro(`"${arquivo.name}" não é uma imagem JPG, PNG ou WEBP.`)
                continue
            }
            try {
                const url = await enviarFoto(arquivo)
                setFotos((atuais) => [...atuais, { url }])
            } catch (e) {
                setErro(mensagemDeErro(e))
            }
        }
        setEnviandoFotos(false)
    }

    const handleAdicionarLink = () => {
        const url = linkFoto.trim()
        if (!/^https?:\/\/\S+$/i.test(url)) {
            setErro("Informe um link de imagem começando com http:// ou https://")
            return
        }
        if (vagas <= 0) {
            setErro(`Você pode adicionar no máximo ${MAXIMO_FOTOS} fotos por anúncio.`)
            return
        }
        setErro(null)
        setFotos([...fotos, { url }])
        setLinkFoto("")
    }

    const removerFoto = (index: number) => {
        const foto = fotos[index]
        if (foto.id) setRemovidas([...removidas, foto.id])
        setFotos(fotos.filter((_, i) => i !== index))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!campos.estado) {
            setErro("Selecione a condição da peça.")
            return
        }
        if (!campos.tipo_de_entrega) {
            setErro("Selecione como a peça será entregue.")
            return
        }

        setEnviando(true)
        setErro(null)

        try {
            let id = idEdicao
            if (id) {
                await api(`/doacoes/${id}`, { method: "PATCH", body: campos })
                for (const imagemId of removidas) {
                    await api(`/doacoes/${id}/imagens/${imagemId}`, { method: "DELETE" })
                }
                for (const foto of fotos.filter((f) => !f.id)) {
                    await api(`/doacoes/${id}/imagens`, { method: "POST", body: { url: foto.url } })
                }
            } else {
                const { criado } = await api<{ criado: Doacao }>("/doacoes", {
                    method: "POST",
                    body: {
                        ...campos,
                        endereco: { ...enderecoAtual, uf: enderecoAtual.uf.toUpperCase() },
                        imagens: fotos.map((f) => f.url),
                    },
                })
                id = String(criado.id_doacao)
            }

            router.push(`/products/${id}`)
        } catch (e) {
            setErro(mensagemDeErro(e))
            setEnviando(false)
        }
    }

    if (carregando || carregandoDoacao) {
        return (
            <div className="min-h-screen bg-slate-50 text-seveste-text">
                <header>
                    <Navbar />
                </header>
                <main className="mx-auto max-w-6xl px-6 py-12 md:px-12">
                    <Loading />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 text-seveste-text">
            <header>
                <Navbar />
            </header>

            <main className="mx-auto max-w-6xl px-6 py-12 md:px-12 lg:py-16">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{idEdicao ? "Editar doação" : "Anunciar doação"}</h1>
                    <p className="mt-2 text-seveste-muted">
                        Preencha os detalhes abaixo para que sua peça encontre quem precisa.
                    </p>
                </div>

                <div className="flex flex-col gap-10 lg:flex-row lg:items-start">

                    {/* Formulário Principal */}
                    <form onSubmit={handleSubmit} className="flex-1 space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

                        {/* Seção de Fotos */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                <ImagePlus className="h-5 w-5 text-seveste-green" />
                                Fotos da peça
                            </h2>

                            {fotos.length > 0 && (
                                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {fotos.map((foto, index) => (
                                        <div key={foto.url + index} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                            <DonationPhoto url={foto.url} alt="Foto do anúncio" iconClassName="h-6 w-6" />
                                            {index === 0 && (
                                                <span className="absolute bottom-2 left-2 rounded-full bg-seveste-dark/80 px-2 py-0.5 text-[10px] font-bold text-white">Capa</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removerFoto(index)}
                                                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-white"
                                                aria-label="Remover foto"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {vagas > 0 && envioDisponivel && (
                                <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-slate-50 py-12 transition-all duration-300 hover:border-seveste-green hover:bg-seveste-green/5">
                                    <div className="mb-4 rounded-full bg-white p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <UploadCloud className="h-8 w-8 text-seveste-muted group-hover:text-seveste-green" />
                                    </div>
                                    <p className="font-medium text-seveste-dark">{enviandoFotos ? "Enviando fotos..." : "Clique ou arraste as fotos aqui"}</p>
                                    <p className="mt-1 text-sm text-seveste-muted">PNG, JPG ou WEBP. Máximo de 4 fotos (elas são reduzidas antes do envio).</p>
                                    <input
                                        type="file"
                                        onChange={handleSelecionarFotos}
                                        disabled={enviandoFotos}
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp"
                                        aria-label="Selecionar fotos"
                                    />
                                </div>
                            )}

                            {/* sem o Vercel Blob configurado (ex.: testes locais), as fotos entram por link */}
                            {vagas > 0 && envioDisponivel === false && (
                                <div>
                                    <label htmlFor="photo-link" className={labelClass}>Link da imagem</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="photo-link"
                                            type="url"
                                            value={linkFoto}
                                            onChange={(e) => setLinkFoto(e.target.value)}
                                            placeholder="https://..."
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAdicionarLink}
                                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-seveste-dark transition-colors hover:bg-slate-100"
                                        >
                                            <Link2 className="h-4 w-4" /> Adicionar
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-seveste-muted">O envio de arquivos fica disponível quando o Vercel Blob está configurado. Máximo de 4 fotos.</p>
                                </div>
                            )}
                        </section>

                        <hr className="border-gray-100" />

                        {/* Seção de Detalhes */}
                        <section>
                            <h2 className="mb-6 text-xl font-semibold">Detalhes do item</h2>

                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="title" className={labelClass}>Título do anúncio *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={campos.titulo}
                                        onChange={atualizar("titulo")}
                                        placeholder="Ex: Casaco de lã azul marinho"
                                        maxLength={150}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="category" className={labelClass}>Categoria *</label>
                                        <select id="category" value={campos.categoria} onChange={atualizar("categoria")} required className={`${inputClass} cursor-pointer`}>
                                            <option value="">Selecione...</option>
                                            {CATEGORIAS.map(({ valor, rotulo }) => <option key={valor} value={valor}>{rotulo}</option>)}
                                            {campos.categoria && !CATEGORIAS.some((c) => c.valor === campos.categoria) && (
                                                <option value={campos.categoria}>{campos.categoria}</option>
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="size" className={labelClass}>Tamanho *</label>
                                        <select id="size" value={campos.tamanho} onChange={atualizar("tamanho")} required className={`${inputClass} cursor-pointer`}>
                                            <option value="">Selecione...</option>
                                            {TAMANHOS.map(({ valor, rotulo }) => <option key={valor} value={valor}>{rotulo}</option>)}
                                            {campos.tamanho && !TAMANHOS.some((t) => t.valor.toLowerCase() === campos.tamanho.toLowerCase()) && (
                                                <option value={campos.tamanho}>{campos.tamanho}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <span className={labelClass}>Condição da peça *</span>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {CONDICOES.map(({ valor, rotulo }) => (
                                            <label key={valor} className={opcaoClass}>
                                                <input
                                                    type="radio"
                                                    name="condition"
                                                    value={valor}
                                                    checked={campos.estado === valor}
                                                    onChange={atualizar("estado")}
                                                    className="sr-only"
                                                />
                                                {rotulo}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="description" className={labelClass}>Descrição *</label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={campos.descricao}
                                        onChange={atualizar("descricao")}
                                        maxLength={400}
                                        required
                                        placeholder="Conte um pouco sobre a peça, detalhes de tecido, modelagem ou motivo da doação..."
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none transition-colors duration-200 hover:border-seveste-green focus:border-seveste-green focus:ring-1 focus:ring-seveste-green"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Seção de Entrega */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                <Truck className="h-5 w-5 text-seveste-accent" />
                                Entrega
                            </h2>
                            <span className={labelClass}>Como a peça vai chegar até a pessoa? *</span>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {TIPOS_ENTREGA.map(({ valor, rotulo }) => (
                                    <label key={valor} className={opcaoClass}>
                                        <input
                                            type="radio"
                                            name="delivery"
                                            value={valor}
                                            checked={campos.tipo_de_entrega === valor}
                                            onChange={atualizar("tipo_de_entrega")}
                                            className="sr-only"
                                        />
                                        {rotulo}
                                    </label>
                                ))}
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Seção de Endereço */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                <MapPin className="h-5 w-5 text-seveste-accent" />
                                Endereço da peça
                            </h2>

                            {idEdicao ? (
                                <p className="rounded-lg bg-slate-50 p-4 text-sm text-seveste-muted">
                                    {enderecoSalvo?.rua
                                        ? <>{enderecoSalvo.rua}, {enderecoSalvo.numero}{enderecoSalvo.complemento ? ` - ${enderecoSalvo.complemento}` : ""}, {enderecoSalvo.cidade} - {enderecoSalvo.uf}</>
                                        : "Endereço não informado."}
                                    <br />
                                    <span className="text-xs">O endereço não pode ser alterado depois de publicado.</span>
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
                                    <div className="md:col-span-4">
                                        <label htmlFor="street" className={labelClass}>Rua *</label>
                                        <input id="street" value={enderecoAtual.rua} onChange={atualizarEndereco("rua")} maxLength={400} required autoComplete="address-line1" className={inputClass} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="number" className={labelClass}>Número *</label>
                                        <input id="number" value={enderecoAtual.numero} onChange={atualizarEndereco("numero")} maxLength={20} required className={inputClass} />
                                    </div>
                                    <div className="md:col-span-6">
                                        <label htmlFor="complement" className={labelClass}>Complemento</label>
                                        <input id="complement" value={enderecoAtual.complemento} onChange={atualizarEndereco("complemento")} maxLength={100} placeholder="Apto, bloco..." autoComplete="address-line2" className={inputClass} />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label htmlFor="city" className={labelClass}>Cidade *</label>
                                        <input id="city" value={enderecoAtual.cidade} onChange={atualizarEndereco("cidade")} maxLength={200} required className={inputClass} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="uf" className={labelClass}>Estado *</label>
                                        <select id="uf" value={enderecoAtual.uf.toUpperCase()} onChange={atualizarEndereco("uf")} required className={`${inputClass} cursor-pointer`}>
                                            <option value="">UF</option>
                                            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-xs text-seveste-muted md:col-span-6">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        No anúncio aparecem só a cidade e o estado. O endereço completo é mostrado apenas para quem tiver a solicitação aceita.
                                    </p>
                                </div>
                            )}
                        </section>

                        {erro && <ErrorMessage mensagem={erro} />}

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={enviando || enviandoFotos}
                                className="w-full rounded-lg border border-seveste-dark bg-seveste-dark px-6 py-4 font-sans text-base font-semibold tracking-wide text-seveste-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-seveste-green hover:bg-seveste-green hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seveste-green disabled:cursor-wait disabled:opacity-60"
                            >
                                {enviando ? "Salvando..." : idEdicao ? "Salvar alterações" : "Publicar doação"}
                            </button>
                            {idEdicao && (
                                <Link href="/dashboard" className="text-center text-sm font-medium text-seveste-muted hover:text-seveste-dark">
                                    Cancelar
                                </Link>
                            )}
                        </div>
                    </form>

                    {/* Sidebar de Dicas (Desktop) */}
                    <aside className="hidden w-80 shrink-0 flex-col gap-6 lg:flex sticky top-24">
                        <div className="rounded-2xl bg-seveste-dark p-6 text-seveste-white">
                            <div className="mb-4 flex items-center gap-2">
                                <Info className="h-5 w-5 text-seveste-accent" />
                                <h3 className="font-bold">Dicas para um bom anúncio</h3>
                            </div>
                            <ul className="space-y-4 text-sm text-seveste-surface">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-seveste-green" />
                                    <span>Tire fotos em locais iluminados, de preferência com luz natural.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-seveste-green" />
                                    <span>Se houver algum defeito (furo, mancha), mostre na foto e descreva no texto.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-seveste-green" />
                                    <span>Lave a peça antes de entregar. Empatia faz parte da doação.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6">
                            <h3 className="font-bold text-seveste-dark mb-2">O que acontece agora?</h3>
                            <p className="text-sm text-seveste-muted leading-relaxed">
                                Seu anúncio ficará visível na vitrine. Pessoas interessadas enviam uma solicitação, que aparece em Minha Conta. Ao aceitar uma delas, a peça fica reservada e você vê o contato da pessoa.
                            </p>
                        </div>
                    </aside>

                </div>
            </main>
        </div>
    )
}
