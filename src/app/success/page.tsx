"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRequireAuth } from "@/components/AuthProvider"
import { Loading } from "@/components/Feedback"
import { api } from "@/lib/api"
import type { Doacao } from "@/lib/types"
import {
    CheckCircle2,
    Home,
    LayoutDashboard,
    PlusCircle
} from "lucide-react"

// Confirmação depois que o doador conclui uma doação (/success?doacao=ID)
export default function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ doacao?: string | string[] }>
}) {
    const { doacao: doacaoParam } = use(searchParams)
    const doacaoId = typeof doacaoParam === "string" && /^\d+$/.test(doacaoParam) ? doacaoParam : null

    const { usuario, carregando } = useRequireAuth()
    const [doacao, setDoacao] = useState<Doacao | null>(null)

    useEffect(() => {
        if (!usuario || !doacaoId) return
        api<{ doacao: Doacao }>(`/doacoes/${doacaoId}`)
            .then(({ doacao }) => setDoacao(doacao))
            .catch(() => undefined)
    }, [usuario, doacaoId])

    if (carregando) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loading />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">

            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">

                {/* Header Celebrativo */}
                <div className="bg-seveste-green/10 px-8 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-seveste-green text-white shadow-lg">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-seveste-dark md:text-3xl">Doação concluída!</h1>
                    <p className="mt-2 text-seveste-muted">
                        {doacao ? <>&ldquo;{doacao.titulo}&rdquo; chegou a quem precisava.</> : "Você fez a diferença na vida de alguém hoje."}
                    </p>
                </div>

                <div className="flex flex-col gap-4 p-8 md:p-10">
                    <p className="text-center text-seveste-muted">
                        Obrigado por fazer parte da rede Seveste. Que tal anunciar outra peça que está parada no armário?
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/announce"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-seveste-dark px-6 py-3.5 font-semibold text-white transition-all hover:-translate-y-1 hover:bg-seveste-green hover:shadow-lg"
                        >
                            <PlusCircle className="h-5 w-5" />
                            Nova doação
                        </Link>
                        <Link
                            href="/dashboard?aba=historico"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-seveste-dark transition-colors hover:bg-slate-50"
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Minha conta
                        </Link>
                    </div>

                    <Link href="/" className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-seveste-muted underline-offset-4 hover:text-seveste-dark hover:underline">
                        <Home className="h-4 w-4" /> Voltar ao início
                    </Link>
                </div>
            </div>

        </div>
    )
}
