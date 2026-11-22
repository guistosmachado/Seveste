"use client"

import { use, useCallback, useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/components/AuthProvider"
import AccountSettings from "@/components/AccountSettings"
import DonationPhoto, { capaDa } from "@/components/DonationPhoto"
import { EmptyState, ErrorMessage, Loading } from "@/components/Feedback"
import { api, mensagemDeErro } from "@/lib/api"
import { rotuloStatus } from "@/lib/constants"
import { tempoRelativo } from "@/lib/format"
import type { Doacao, Solicitacao, StatusDoacao, StatusSolicitacao } from "@/lib/types"
import {
    Package,
    History,
    Edit3,
    Trash2,
    CheckCircle2,
    Inbox,
    UserCog,
    PlusCircle,
    Mail,
    Phone,
    ChevronDown,
    type LucideIcon
} from "lucide-react"

type Aba = "anuncios" | "historico" | "solicitacoes" | "dados"

const STATUS_SOLICITACAO: Record<StatusSolicitacao, { rotulo: string; classe: string }> = {
    PENDENTE: { rotulo: "Aguardando", classe: "border-orange-200 bg-orange-50 text-orange-700" },
    ACEITA: { rotulo: "Aceita", classe: "border-seveste-green/30 bg-seveste-green/10 text-seveste-green" },
    RECUSADA: { rotulo: "Não aceita", classe: "border-gray-200 bg-slate-50 text-seveste-muted" },
}

const STATUS_DOACAO: Record<StatusDoacao, string> = {
    disponivel: "bg-seveste-green text-white",
    reservada: "bg-orange-100 text-orange-700",
    concluida: "bg-slate-100 text-seveste-muted",
}

const botaoSecundario = "flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-seveste-dark transition-colors hover:bg-slate-50"
const botaoPerigo = "flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"

export default function Dashboard({
    searchParams,
}: {
    searchParams: Promise<{ aba?: string | string[] }>
}) {
    const { aba } = use(searchParams)
    const { usuario, carregando } = useRequireAuth()
    const router = useRouter()
    const ehDoador = usuario?.tipo === "doador"

    const [activeTab, setActiveTab] = useState<Aba | null>(null)
    const [doacoes, setDoacoes] = useState<Doacao[]>([])
    // doador: solicitações recebidas, por doação; acolhido: as próprias solicitações
    const [recebidas, setRecebidas] = useState<Record<number, Solicitacao[]>>({})
    const [minhas, setMinhas] = useState<Solicitacao[]>([])
    const [aberta, setAberta] = useState<number | null>(null)
    const [excluindo, setExcluindo] = useState<number | null>(null)
    const [carregandoDados, setCarregandoDados] = useState(true)
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const abas: { id: Aba; rotulo: string; icon: LucideIcon }[] = ehDoador
        ? [
            { id: "anuncios", rotulo: `Meus anúncios (${doacoes.filter((d) => d.status !== "concluida").length})`, icon: Package },
            { id: "historico", rotulo: "Histórico", icon: History },
            { id: "dados", rotulo: "Meus dados", icon: UserCog },
        ]
        : [
            { id: "solicitacoes", rotulo: `Minhas solicitações (${minhas.length})`, icon: Inbox },
            { id: "dados", rotulo: "Meus dados", icon: UserCog },
        ]

    // a aba pode vir pela URL (?aba=dados); se não for válida para o tipo de usuário, usa a primeira
    const abaAtual: Aba = activeTab ?? (abas.some(({ id }) => id === aba) ? (aba as Aba) : abas[0].id)

    const carregar = useCallback(async () => {
        if (!usuario) return
        try {
            if (usuario.tipo === "doador") {
                const { doacoes } = await api<{ doacoes: Doacao[] }>("/doacoes/minhas")
                setDoacoes(doacoes)

                // a API lista as solicitações por doação; buscamos as das doações ainda não concluídas
                const ativas = doacoes.filter((d) => d.status !== "concluida")
                const listas = await Promise.all(ativas.map((d) =>
                    api<{ solicitacoes: Solicitacao[] }>(`/doacoes/${d.id_doacao}/solicitacoes`)
                        .then(({ solicitacoes }) => [d.id_doacao, solicitacoes] as const)
                        .catch(() => [d.id_doacao, [] as Solicitacao[]] as const),
                ))
                setRecebidas(Object.fromEntries(listas))
            } else {
                const { solicitacoes } = await api<{ solicitacoes: Solicitacao[] }>("/solicitacoes/minhas")
                setMinhas([...solicitacoes].reverse())
            }
        } catch (e) {
            setErro(mensagemDeErro(e))
        } finally {
            setCarregandoDados(false)
        }
    }, [usuario])

    useEffect(() => {
        const timer = setTimeout(carregar, 0)
        return () => clearTimeout(timer)
    }, [carregar])

    const executar = async (acao: () => Promise<void>) => {
        setProcessando(true)
        setErro(null)
        try {
            await acao()
        } catch (e) {
            setErro(mensagemDeErro(e))
        } finally {
            setProcessando(false)
        }
    }

    const responder = (solicitacao: Solicitacao, acao: "aceitar" | "recusar") => executar(async () => {
        await api(`/solicitacoes/${solicitacao.id_solicitacao}/${acao}`, { method: "PATCH" })
        await carregar()
    })

    const concluir = (doacao: Doacao) => executar(async () => {
        await api(`/doacoes/${doacao.id_doacao}/concluir`, { method: "PATCH" })
        router.push(`/success?doacao=${doacao.id_doacao}`)
    })

    const excluirDoacao = (id: number) => executar(async () => {
        await api(`/doacoes/${id}`, { method: "DELETE" })
        setExcluindo(null)
        await carregar()
    })

    const cancelar = (solicitacao: Solicitacao) => executar(async () => {
        await api(`/solicitacoes/${solicitacao.id_solicitacao}`, { method: "DELETE" })
        await carregar()
    })

    if (carregando || !usuario) {
        return (
            <div className="min-h-screen bg-slate-50 text-seveste-text pb-20">
                <header>
                    <Navbar />
                </header>
                <main className="mx-auto max-w-6xl px-6 py-8 md:px-12 lg:py-12">
                    <Loading />
                </main>
            </div>
        )
    }

    const anuncios = doacoes.filter((d) => d.status !== "concluida")
    const concluidas = doacoes.filter((d) => d.status === "concluida")

    return (
        <div className="min-h-screen bg-slate-50 text-seveste-text pb-20">
            <header>
                <Navbar />
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8 md:px-12 lg:py-12">

                <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Minha Conta</h1>
                        <p className="mt-2 text-seveste-muted">
                            Olá, {usuario.nome.split(" ")[0]}! {ehDoador
                                ? "Gerencie seus anúncios, solicitações e histórico de doações."
                                : "Acompanhe as peças que você solicitou."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {ehDoador ? (
                            <>
                                <Link href={`/profile/${usuario.id_usuario}`} className={botaoSecundario}>
                                    Ver meu perfil
                                </Link>
                                <Link href="/announce" className="flex items-center gap-2 rounded-lg bg-seveste-dark px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-seveste-green">
                                    <PlusCircle className="h-4 w-4" /> Nova doação
                                </Link>
                            </>
                        ) : (
                            <Link href="/products" className="flex items-center gap-2 rounded-lg bg-seveste-dark px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-seveste-green">
                                Ver vitrine
                            </Link>
                        )}
                    </div>
                </div>

                {/* Navegação de Abas */}
                <div className="mb-8 flex overflow-x-auto border-b border-gray-200 hide-scrollbar" role="tablist">
                    {abas.map(({ id, rotulo, icon: Icon }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={abaAtual === id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${abaAtual === id
                                ? "border-seveste-green text-seveste-green"
                                : "border-transparent text-seveste-muted hover:text-seveste-dark"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {rotulo}
                        </button>
                    ))}
                </div>

                {erro && <div className="mb-6"><ErrorMessage mensagem={erro} /></div>}

                {/* Conteúdo das Abas */}
                <div className="min-h-[40vh]">

                    {carregandoDados && abaAtual !== "dados" && <Loading />}

                    {/* ABA: ANÚNCIOS (doador) */}
                    {!carregandoDados && abaAtual === "anuncios" && (
                        anuncios.length === 0 ? (
                            <EmptyState icon={Package} titulo="Nenhum anúncio ativo" descricao="Publique uma peça para que ela apareça na vitrine.">
                                <Link href="/announce" className="rounded-lg bg-seveste-dark px-5 py-3 text-sm font-semibold text-white hover:bg-seveste-green">Anunciar doação</Link>
                            </EmptyState>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {anuncios.map((item) => {
                                    const solicitacoes = recebidas[item.id_doacao] ?? []
                                    const pendentes = solicitacoes.filter((s) => s.status === "PENDENTE")
                                    const aceita = solicitacoes.find((s) => s.status === "ACEITA")

                                    return (
                                        <div key={item.id_doacao} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                                <Link href={`/products/${item.id_doacao}`} className="relative flex h-24 w-24 shrink-0 items-center justify-center self-center overflow-hidden rounded-xl bg-slate-100">
                                                    <DonationPhoto url={capaDa(item.imagens)} alt={item.titulo} iconClassName="h-8 w-8" />
                                                </Link>
                                                <div className="flex-1 text-center sm:text-left">
                                                    <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                                        <h3 className="font-bold text-seveste-dark">{item.titulo}</h3>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_DOACAO[item.status]}`}>{rotuloStatus(item.status)}</span>
                                                    </div>
                                                    <p className="text-sm text-seveste-muted">Publicado {tempoRelativo(item.criado_em)}</p>
                                                    {pendentes.length > 0 && (
                                                        <p className="mt-1 text-sm font-semibold text-orange-600">
                                                            {pendentes.length} {pendentes.length === 1 ? "pessoa interessada" : "pessoas interessadas"}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setAberta(aberta === item.id_doacao ? null : item.id_doacao)}
                                                        aria-expanded={aberta === item.id_doacao}
                                                        className={botaoSecundario}
                                                    >
                                                        Solicitações ({solicitacoes.length})
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${aberta === item.id_doacao ? "rotate-180" : ""}`} />
                                                    </button>
                                                    <Link href={`/announce?editar=${item.id_doacao}`} className={botaoSecundario}>
                                                        <Edit3 className="h-3.5 w-3.5" /> Editar
                                                    </Link>
                                                    {excluindo === item.id_doacao ? (
                                                        <>
                                                            <button disabled={processando} onClick={() => excluirDoacao(item.id_doacao)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">Confirmar exclusão</button>
                                                            <button onClick={() => setExcluindo(null)} className={botaoSecundario}>Não</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => setExcluindo(item.id_doacao)} aria-label="Excluir anúncio" className={botaoPerigo}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* doação reservada: contato de quem vai receber e botão de concluir */}
                                            {item.status === "reservada" && aceita && (
                                                <div className="flex flex-col gap-3 border-t border-seveste-green/20 bg-seveste-green/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="text-sm">
                                                        <p className="font-semibold text-seveste-dark">Reservada para {aceita.solicitante?.nome ?? "o solicitante"}</p>
                                                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-seveste-muted">
                                                            {aceita.solicitante?.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {aceita.solicitante.email}</span>}
                                                            {aceita.solicitante?.telefone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {aceita.solicitante.telefone}</span>}
                                                        </p>
                                                    </div>
                                                    <button
                                                        disabled={processando}
                                                        onClick={() => concluir(item)}
                                                        className="flex items-center justify-center gap-2 rounded-lg bg-seveste-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" /> Concluir doação
                                                    </button>
                                                </div>
                                            )}

                                            {aberta === item.id_doacao && (
                                                <div className="border-t border-gray-100 bg-slate-50 p-5">
                                                    {solicitacoes.length === 0 ? (
                                                        <p className="text-sm text-seveste-muted">Ainda não há solicitações para esta peça.</p>
                                                    ) : (
                                                        <ul className="flex flex-col gap-3">
                                                            {solicitacoes.map((s) => {
                                                                const status = STATUS_SOLICITACAO[s.status]
                                                                return (
                                                                    <li key={s.id_solicitacao} className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center">
                                                                        <div className="flex-1 text-sm">
                                                                            <p className="font-semibold text-seveste-dark">{s.solicitante?.nome ?? "Usuário"}</p>
                                                                            <p className="text-seveste-muted">
                                                                                {s.solicitante ? `${s.solicitante.cidade} - ${s.solicitante.uf}` : ""}
                                                                                {s.solicitante?.tamanho_roupa ? ` · Roupa ${s.solicitante.tamanho_roupa}` : ""}
                                                                                {s.solicitante?.tamanho_calcado ? ` · Calçado ${s.solicitante.tamanho_calcado}` : ""}
                                                                                {" "}· {tempoRelativo(s.criado_em)}
                                                                            </p>
                                                                        </div>
                                                                        <span className={`self-start rounded-full border px-3 py-1 text-xs font-medium sm:self-center ${status.classe}`}>{status.rotulo}</span>
                                                                        {s.status === "PENDENTE" && item.status === "disponivel" && (
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    disabled={processando}
                                                                                    onClick={() => responder(s, "aceitar")}
                                                                                    className="rounded-lg bg-seveste-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                                                                                >
                                                                                    Aceitar
                                                                                </button>
                                                                                <button disabled={processando} onClick={() => responder(s, "recusar")} className={botaoPerigo}>
                                                                                    Recusar
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                )
                                                            })}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    )}

                    {/* ABA: HISTÓRICO (doador) */}
                    {!carregandoDados && abaAtual === "historico" && (
                        concluidas.length === 0 ? (
                            <EmptyState icon={History} titulo="Nenhuma doação concluída ainda" descricao="Suas doações finalizadas aparecerão aqui." />
                        ) : (
                            <div className="flex flex-col gap-4">
                                {concluidas.map((item) => (
                                    <div key={item.id_doacao} className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                            <DonationPhoto url={capaDa(item.imagens)} alt={item.titulo} iconClassName="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h4 className="font-bold text-seveste-dark">{item.titulo}</h4>
                                            <p className="text-sm text-seveste-muted">Concluída {tempoRelativo(item.atualizado_em)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-seveste-dark border border-gray-200">
                                            Finalizado
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* ABA: MINHAS SOLICITAÇÕES (acolhido) */}
                    {!carregandoDados && abaAtual === "solicitacoes" && (
                        minhas.length === 0 ? (
                            <EmptyState icon={Inbox} titulo="Você ainda não solicitou nenhuma peça" descricao="Explore a vitrine e solicite o que você precisa.">
                                <Link href="/products" className="rounded-lg bg-seveste-dark px-5 py-3 text-sm font-semibold text-white hover:bg-seveste-green">Ver vitrine</Link>
                            </EmptyState>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {minhas.map((s) => {
                                    const status = STATUS_SOLICITACAO[s.status]
                                    const concluida = s.doacao?.status === "concluida"
                                    return (
                                        <div key={s.id_solicitacao} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                                            <div className="flex-1 text-center sm:text-left">
                                                <Link href={`/products/${s.id_doacao}`} className="font-bold text-seveste-dark hover:text-seveste-green">
                                                    {s.doacao?.titulo ?? "Doação removida"}
                                                </Link>
                                                <p className="text-sm text-seveste-muted">
                                                    Solicitada {tempoRelativo(s.criado_em)}
                                                    {s.status === "ACEITA" && (concluida ? " · Doação concluída" : " · Veja o endereço e a forma de entrega no anúncio")}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <span className={`rounded-full border px-3 py-1 text-sm font-medium ${status.classe}`}>{status.rotulo}</span>
                                                {s.status === "ACEITA" && !concluida && (
                                                    <Link href={`/products/${s.id_doacao}`} className={botaoSecundario}>Ver endereço</Link>
                                                )}
                                                {s.status !== "RECUSADA" && !concluida && (
                                                    <button disabled={processando} onClick={() => cancelar(s)} className={botaoPerigo}>
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    )}

                    {/* ABA: MEUS DADOS */}
                    {abaAtual === "dados" && <AccountSettings usuario={usuario} />}

                </div>
            </main>
        </div>
    )
}
