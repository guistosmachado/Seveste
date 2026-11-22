import Link from "next/link"
import { ArrowRight, MapPin, Tag } from "lucide-react"
import DonationPhoto, { capaDa } from "./DonationPhoto"
import { rotuloCategoria, rotuloCondicao, rotuloTamanho } from "@/lib/constants"
import { tempoRelativo } from "@/lib/format"
import type { Doacao } from "@/lib/types"

// Cartão de uma doação na vitrine e no feed da home
export default function DonationCard({ doacao }: { doacao: Doacao }) {
    return (
        <Link
            href={`/products/${doacao.id_doacao}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-seveste-green hover:shadow-xl"
        >
            <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-slate-100">
                <DonationPhoto
                    url={capaDa(doacao.imagens)}
                    alt={doacao.titulo}
                    iconClassName="h-10 w-10 transition-transform duration-500 group-hover:scale-125"
                    imageClassName="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-seveste-dark shadow-sm backdrop-blur-sm">
                    {rotuloCategoria(doacao.categoria)}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-seveste-dark transition-colors duration-300 group-hover:text-seveste-green">
                    {doacao.titulo}
                </h3>

                <div className="mb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-seveste-muted">
                        <Tag className="h-4 w-4 shrink-0" />
                        <span>{rotuloTamanho(doacao.tamanho)} / {rotuloCondicao(doacao.estado)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-seveste-muted">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                            {doacao.endereco ? `${doacao.endereco.cidade} - ${doacao.endereco.uf}` : "Localização não informada"}
                        </span>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 font-medium text-seveste-dark transition-colors duration-300 group-hover:text-seveste-green">
                    <span className="text-xs text-seveste-muted">{tempoRelativo(doacao.criado_em)}</span>
                    <span className="flex items-center gap-1 text-sm">
                        Ver detalhes
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                </div>
            </div>
        </Link>
    )
}
