"use client"

import { use, useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import DonationPhoto, { capaDa } from "@/components/DonationPhoto"
import { EmptyState, ErrorMessage, Loading } from "@/components/Feedback"
import { api, ApiError, mensagemDeErro } from "@/lib/api"
import { rotuloCondicao, rotuloTamanho } from "@/lib/constants"
import type { Doacao, UsuarioPublico } from "@/lib/types"
import {
    MapPin,
    User,
    Package,
    UserCog,
    SearchX,
    HandHeart
} from "lucide-react"

// Perfil público de um doador. A API não expõe perfis de acolhidos (responde 404).
export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { usuario: logado } = useAuth()

    const [perfil, setPerfil] = useState<UsuarioPublico | null>(null)
    const [disponiveis, setDisponiveis] = useState<Doacao[]>([])
    const [totalConcluidas, setTotalConcluidas] = useState(0)
    const [naoEncontrado, setNaoEncontrado] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        const doUsuario = (lista: Doacao[]) => lista.filter((d) => d.id_usuario === Number(id))

        Promise.all([
            api<{ usuario: UsuarioPublico }>(`/usuarios/${id}`, { signal }),
            api<{ doacoes: Doacao[] }>("/doacoes?status=disponivel", { signal }),
            api<{ doacoes: Doacao[] }>("/doacoes?status=concluida", { signal }),
        ])
            .then(([{ usuario }, ativas, concluidas]) => {
                setPerfil(usuario)
                setDisponiveis(doUsuario(ativas.doacoes))
                setTotalConcluidas(doUsuario(concluidas.doacoes).length)
            })
            .catch((e) => {
                if (signal.aborted) return
                if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setNaoEncontrado(true)
                else setErro(mensagemDeErro(e))
            })

        return () => controller.abort()
    }, [id])

    if (naoEncontrado || erro || !perfil) {
        return (
            <div className="min-h-screen bg-slate-50 text-seveste-text pb-24">
                <header>
                    <Navbar />
                </header>
                <main className="mx-auto max-w-6xl px-6 pt-12 md:px-12">
                    {naoEncontrado ? (
                        <EmptyState icon={SearchX} titulo="Perfil não encontrado" descricao="Somente os perfis de doadores são públicos.">
                            <Link href="/products" className="rounded-lg bg-seveste-dark px-5 py-3 text-sm font-semibold text-white hover:bg-seveste-green">Ver vitrine</Link>
                        </EmptyState>
                    ) : erro ? <ErrorMessage mensagem={erro} /> : <Loading />}
                </main>
            </div>
        )
    }

    const ehMeuPerfil = logado?.id_usuario === perfil.id_usuario

    return (
        <div className="min-h-screen bg-slate-50 text-seveste-text pb-24">
            <header>
                <Navbar />
            </header>

            <main className="mx-auto max-w-6xl px-6 pt-6 md:px-12 md:pt-10 lg:pt-12">

                {/* Header do Perfil (Capa e Info Principal) */}
                <section className="mb-10 overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-200">
                    {/* Capa */}
                    <div className="h-32 w-full bg-linear-to-r from-seveste-dark to-slate-700 md:h-48 relative">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    </div>

                    {/* Informações do Usuário */}
                    <div className="relative px-6 pb-8 md:px-10">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between">

                            {/* Avatar e Nome */}
                            <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12 md:-mt-16 relative z-10">
                                <div className="flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full border-4 border-white bg-slate-200 text-seveste-muted shadow-md overflow-hidden">
                                    <User className="h-12 w-12 md:h-16 md:w-16" />
                                </div>
                                <div className="mb-2">
                                    <h1 className="flex items-center gap-2 text-3xl font-bold text-seveste-dark md:text-4xl bg-seveste-white/80 rounded">
                                        {perfil.nome}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-seveste-muted">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" /> {perfil.cidade}, {perfil.uf}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <HandHeart className="h-4 w-4" /> Doador
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            {ehMeuPerfil && (
                                <div className="mt-6 flex gap-3 md:mt-0 md:mb-2">
                                    <Link
                                        href="/dashboard?aba=dados"
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-seveste-dark px-6 py-3 font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-seveste-green hover:shadow-md md:flex-none"
                                    >
                                        <UserCog className="h-5 w-5" />
                                        Editar perfil
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Estatísticas */}
                        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-6 border border-gray-100 sm:max-w-md">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-seveste-dark">{totalConcluidas}</span>
                                <span className="text-xs font-medium uppercase tracking-wider text-seveste-muted">Doações concluídas</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-seveste-dark">{disponiveis.length}</span>
                                <span className="text-xs font-medium uppercase tracking-wider text-seveste-muted">Disponíveis agora</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Anúncios disponíveis */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-seveste-dark">
                        <Package className="h-6 w-6 text-seveste-green" />
                        Doações ativas ({disponiveis.length})
                    </h2>
                </div>

                {disponiveis.length === 0 ? (
                    <EmptyState icon={Package} titulo="Nenhuma doação disponível no momento" />
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {disponiveis.map((doacao) => (
                            <Link
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-seveste-green hover:shadow-xl"
                                href={`/products/${doacao.id_doacao}`}
                                key={doacao.id_doacao}
                            >
                                <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-slate-100">
                                    <DonationPhoto
                                        url={capaDa(doacao.imagens)}
                                        alt={doacao.titulo}
                                        iconClassName="h-10 w-10 transition-transform duration-500 group-hover:scale-125"
                                    />
                                    <div className="absolute left-3 top-3 rounded-full bg-seveste-green px-3 py-1 text-xs font-bold text-white shadow-sm">
                                        Disponível
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-1 text-lg font-bold text-seveste-dark transition-colors duration-300 group-hover:text-seveste-green truncate">
                                        {doacao.titulo}
                                    </h3>
                                    <p className="mb-4 text-sm text-seveste-muted">Tamanho {rotuloTamanho(doacao.tamanho)} • {rotuloCondicao(doacao.estado)}</p>
                                    <div className="font-medium text-seveste-dark transition-colors duration-300 group-hover:text-seveste-green text-sm">
                                        Ver detalhes &rarr;
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
