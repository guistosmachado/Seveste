"use client"

import { useState } from "react"
import { Image as ImageIcon } from "lucide-react"

type DonationPhotoProps = {
    url?: string
    alt: string
    iconClassName?: string
    imageClassName?: string
}

// Mostra a foto da doação (URL guardada pela API) ou, se não houver ou não carregar, o ícone do layout.
// Deve ficar dentro de um container com "relative" e tamanho definido.
export default function DonationPhoto({ url, alt, iconClassName = "h-10 w-10", imageClassName = "" }: DonationPhotoProps) {
    const [falhou, setFalhou] = useState(false)

    if (!url || falhou) {
        return <ImageIcon className={`text-slate-300 ${iconClassName}`} aria-hidden="true" />
    }

    return (
        // as fotos vêm de domínios variados (Vercel Blob ou links colados), então usamos <img> simples
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt={alt}
            loading="lazy"
            onError={() => setFalhou(true)}
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
        />
    )
}

export function capaDa(imagens?: { url: string; capa: boolean }[]) {
    return imagens?.find((i) => i.capa)?.url ?? imagens?.[0]?.url
}
