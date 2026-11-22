"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "./Navbar"
import DonationCard from "./DonationCard"
import { EmptyState, ErrorMessage, Loading } from "./Feedback"
import { api, mensagemDeErro } from "@/lib/api"
import type { Doacao, Solicitacao, Usuario } from "@/lib/types"
import {
    ArrowRight,
    Baby,
    Footprints,
    Glasses,
    Inbox,
    MapPin,
    Package,
    PackageSearch,
    PlusCircle,
    Search,
    Shirt,
    Snowflake,
    Sparkles,
    Clock,
    type LucideIcon
} from "lucide-react"

const ATALHOS: { valor: string; rotulo: string; icon: LucideIcon }[] = [
    { valor: "roupas", rotulo: "Roupas", icon: Shirt },
    { valor: "agasalhos", rotulo: "Agasalhos", icon: Snowflake },
    { valor: "calcados", rotulo: "Calçados", icon: Footprints },
    { valor: "acessorios", rotulo: "Acessórios", icon: Glasses },
    { valor: "infantil", rotulo: "Infantil", icon: Baby },
]

const igual = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

const maisRecentes = (lista: Doacao[]) =>
    [...lista].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

// peças que combinam com o que o acolhido informou no cadastro (categorias procuradas ou tamanho de roupa)
function paraVoce(doacoes: Doacao[], usuario: Usuario) {
    const procuradas = usuario.roupas_procuradas ?? []
    return doacoes.filter((d) =>
        procuradas.some((p) => igual(p, d.categoria)) || igual(usuario.tamanho_roupa, d.tamanho),
    )
}

// mesma cidade primeiro; se não houver nenhuma, o mesmo estado
function pertoDeVoce(doacoes: Doacao[], usuario: Usuario) {
    const naCidade = doacoes.filter((d) => igual(d.endereco?.cidade, usuario.cidade) && igual(d.endereco?.uf, usuario.uf))
    if (naCidade.length > 0) return { lista: naCidade, onde: usuario.cidade }
    return { lista: doacoes.filter((d) => igual(d.endereco?.uf, usuario.uf)), onde: usuario.uf.toUpperCase() }
}

function Secao({ titulo, icon: Icon, link, doacoes }: { titulo: string; icon: LucideIcon; link: string; doacoes: Doacao[] }) {
    if (doacoes.length === 0) return null

    return (
        <section className="mb-14">
            <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-seveste-dark md:text-3xl">
                    <Icon className="h-6 w-6 text-seveste-green" />
                    {titulo}
                </h2>
                <Link href={link} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-seveste-green hover:text-seveste-dark">
                    Ver tudo <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {doacoes.map((doacao) => <DonationCard key={doacao.id_doacao} doacao={doacao} />)}
            </div>
        </section>
    )
}

// Home de quem está logado: feed de doações no estilo vitrine/marketplace
export default function HomeFeed({ usuario }: { usuario: Usuario }) {
    const router = useRouter()
    const ehDoador = usuario.tipo === "doador"

    const [busca, setBusca] = useState("")
    const [doacoes, setDoacoes] = useState<Doacao[] | null>(null)
    const [resumo, setResumo] = useState<{ principal: number; secundario: number } | null>(null)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller

        api<{ doacoes: Doacao[] }>("/doacoes?status=disponivel", { signal })
            .then(({ doacoes }) => setDoacoes(doacoes))
            .catch((e) => {
                if (!signal.aborted) setErro(mensagemDeErro(e))
            })

        // resumo da conta: anúncios do doador ou solicitações do acolhido
        if (ehDoador) {
            api<{ doacoes: Doacao[] }>("/doacoes/minhas", { signal })
                .then(({ doacoes }) => setResumo({
                    principal: doacoes.filter((d) => d.status === "disponivel").length,
                    secundario: doacoes.filter((d) => d.status === "reservada").length,
                }))
                .catch(() => undefined)
        } else {
            api<{ solicitacoes: Solicitacao[] }>("/solicitacoes/minhas", { signal })
                .then(({ solicitacoes }) => setResumo({
                    principal: solicitacoes.filter((s) => s.status === "PENDENTE").length,
                    secundario: solicitacoes.filter((s) => s.status === "ACEITA" && s.doacao?.status === "reservada").length,
                }))
                .catch(() => undefined)
        }

        return () => controller.abort()
    }, [ehDoador])

    const handleBuscar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const termo = busca.trim()
        router.push(termo ? `/products?busca=${encodeURIComponent(termo)}` : "/products")
    }

    // o doador não solicita peças, então as dele próprias não aparecem no feed
    const disponiveis = (doacoes ?? []).filter((d) => d.id_usuario !== usuario.id_usuario)
    const recentes = maisRecentes(disponiveis)
    const sugestoes = ehDoador ? [] : maisRecentes(paraVoce(disponiveis, usuario)).slice(0, 4)
    const perto = pertoDeVoce(disponiveis, usuario)

    return (
        <div className="min-h-screen bg-slate-50 text-seveste-text pb-20">
            <header>
                <Navbar />
            </header>

            {/* Busca */}
            <section className="bg-seveste-dark px-6 pb-12 pt-10 text-seveste-white md:px-12">
                <div className="mx-auto max-w-7xl">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-seveste-accent">
                        Olá, {usuario.nome.split(" ")[0]}
                    </p>
                    <h1 className="mb-6 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
                        {ehDoador ? "Que tal dar uma nova vida a uma peça hoje?" : "Encontre peças que fazem falta para você."}
                    </h1>

                    <form onSubmit={handleBuscar} className="flex max-w-2xl gap-2" role="search">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-seveste-muted" />
                            <input
                                type="search"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar casaco, tênis, uniforme..."
                                aria-label="Buscar doações"
                                className="w-full rounded-xl border border-transparent bg-white py-3.5 pl-12 pr-4 text-base text-seveste-text outline-none transition focus:border-seveste-accent focus:ring-2 focus:ring-seveste-accent/40"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-seveste-accent px-6 py-3.5 font-semibold text-seveste-dark transition hover:-translate-y-0.5 hover:bg-seveste-white"
                        >
                            Buscar
                        </button>
                    </form>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-6 md:px-12">

                {/* Atalhos por categoria */}
                <nav className="-mt-6 mb-10 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Categorias">
                    {ATALHOS.map(({ valor, rotulo, icon: Icon }) => (
                        <Link
                            key={valor}
                            href={`/products?cat=${valor}`}
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-4 text-sm font-semibold text-seveste-dark shadow-sm transition-all hover:-translate-y-1 hover:border-seveste-green hover:shadow-md"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-seveste-green/10 text-seveste-green transition-colors group-hover:bg-seveste-green group-hover:text-seveste-white">
                                <Icon className="h-5 w-5" />
                            </span>
                            {rotulo}
                        </Link>
                    ))}
                </nav>

                {/* Resumo da conta */}
                <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-seveste-accent/20 text-seveste-dark">
                            {ehDoador ? <Package className="h-6 w-6" /> : <Inbox className="h-6 w-6" />}
                        </span>
                        <div>
                            <p className="font-bold text-seveste-dark">{ehDoador ? "Seus anúncios" : "Suas solicitações"}</p>
                            <p className="text-sm text-seveste-muted">
                                {!resumo
                                    ? "Carregando..."
                                    : ehDoador
                                        ? `${resumo.principal} disponíveis · ${resumo.secundario} reservados aguardando entrega`
                                        : `${resumo.principal} aguardando resposta · ${resumo.secundario} aceitas`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard" className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-seveste-dark transition-colors hover:bg-slate-50">
                            Minha conta
                        </Link>
                        {ehDoador && (
                            <Link href="/announce" className="flex items-center justify-center gap-2 rounded-lg bg-seveste-dark px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-seveste-green">
                                <PlusCircle className="h-4 w-4" /> Anunciar
                            </Link>
                        )}
                    </div>
                </div>

                {erro && <ErrorMessage mensagem={erro} />}
                {!erro && !doacoes && <Loading texto="Buscando doações..." />}

                {!erro && doacoes && disponiveis.length === 0 && (
                    <EmptyState
                        icon={PackageSearch}
                        titulo="Ainda não há doações disponíveis"
                        descricao={ehDoador ? "Seja a primeira pessoa a anunciar uma peça." : "Volte em breve: novas peças chegam o tempo todo."}
                    >
                        {ehDoador && (
                            <Link href="/announce" className="rounded-lg bg-seveste-dark px-5 py-3 text-sm font-semibold text-white hover:bg-seveste-green">Anunciar doação</Link>
                        )}
                    </EmptyState>
                )}

                {!erro && disponiveis.length > 0 && (
                    <>
                        <Secao titulo="Para você" icon={Sparkles} link="/products" doacoes={sugestoes} />
                        <Secao
                            titulo={`Perto de você${perto.lista.length ? ` · ${perto.onde}` : ""}`}
                            icon={MapPin}
                            link={`/products?uf=${encodeURIComponent(usuario.uf.toUpperCase())}`}
                            doacoes={maisRecentes(perto.lista).slice(0, 4)}
                        />
                        <Secao titulo="Chegaram agora" icon={Clock} link="/products" doacoes={recentes.slice(0, 8)} />
                    </>
                )}
            </main>
        </div>
    )
}
