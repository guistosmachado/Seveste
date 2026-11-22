"use client"

import Image from "next/image"
import Link from "next/link"
import { LogOut, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

const solidButton = "cursor-pointer border border-seveste-surface bg-seveste-surface px-5 py-2.5 font-sans text-lg font-semibold text-seveste-dark shadow-sm transition duration-200 hover:-translate-y-px hover:border-seveste-accent hover:bg-seveste-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seveste-accent"
const outlineButton = "cursor-pointer border border-seveste-surface/70 bg-transparent px-5 py-2.5 font-sans text-lg font-semibold text-seveste-white transition duration-200 hover:-translate-y-px hover:border-seveste-accent hover:bg-seveste-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seveste-accent"
const mobileLink = "px-4 py-3 text-left font-sans font-semibold text-seveste-white hover:bg-seveste-green"

export default function Navbar() {
    const { usuario, carregando, sair } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        sair()
        router.push("/")
    }

    // logado: navegação da conta; deslogado: os botões de cadastro originais + entrar
    const links = usuario
        ? [
            { href: "/products", label: "Vitrine", principal: false },
            ...(usuario.tipo === "doador" ? [{ href: "/announce", label: "Anunciar", principal: false }] : []),
            { href: "/dashboard", label: "Minha conta", principal: true },
        ]
        : [
            { href: "/join?role=donor", label: "Quero doar", principal: true },
            { href: "/join?role=recipient", label: "Quero receber", principal: false },
        ]

    return (
        <>
        {/* a navbar fica sempre fixa no topo; o espaçador abaixo ocupa a mesma altura para ela não cobrir o conteúdo */}
        <nav className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-seveste-dark px-4 py-3 shadow-lg md:px-15">
            <details className="relative md:hidden">
                <summary
                    className="flex size-11 cursor-pointer list-none items-center justify-center text-seveste-white [&::-webkit-details-marker]:hidden"
                    aria-label="Abrir menu"
                >
                    <Menu size={30} />
                </summary>

                <div className="absolute left-0 top-full mt-3 flex w-52 flex-col border border-seveste-sage bg-seveste-dark p-2 shadow-lg">
                    {!carregando && links.map(({ href, label }) => (
                        <Link key={href} href={href} className={mobileLink}>
                            {label}
                        </Link>
                    ))}
                    {!carregando && !usuario && (
                        <Link href="/login" className={mobileLink}>Entrar</Link>
                    )}
                    {usuario && (
                        <button type="button" onClick={handleLogout} className={`${mobileLink} cursor-pointer`}>
                            Sair
                        </button>
                    )}
                </div>
            </details>

            <Link
                href="/"
                className="absolute left-1/2 flex -translate-x-1/2 cursor-pointer items-center md:static md:translate-x-0"
            >
                <Image
                    src="/icons/sevesteHangerIcon.png"
                    alt="Ícone do Seveste"
                    width={56}
                    height={56}
                    className="size-11 bg-seveste-surface object-contain md:size-14"
                    loading="eager"
                />
                <span className="ml-2 font-display text-3xl text-seveste-white md:text-4xl">Seveste</span>
            </Link>

            <div className="hidden items-center gap-3 md:flex">
                {!carregando && !usuario && (
                    <Link href="/login" className="px-3 py-2.5 font-sans text-lg font-semibold text-seveste-white transition hover:text-seveste-accent">
                        Entrar
                    </Link>
                )}

                {!carregando && links.map(({ href, label, principal }) => (
                    <Link key={href} href={href} className={principal ? solidButton : outlineButton}>
                        {label}
                    </Link>
                ))}

                {usuario && (
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex size-11 cursor-pointer items-center justify-center text-seveste-white transition hover:text-seveste-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seveste-accent"
                        aria-label="Sair da conta"
                        title="Sair"
                    >
                        <LogOut size={22} />
                    </button>
                )}
            </div>

            <div className="size-11 md:hidden" aria-hidden="true" />
        </nav>
        <div className="h-17 md:h-20" aria-hidden="true" />
        </>
    )
}
