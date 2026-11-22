"use client"

import { useAuth } from "@/components/AuthProvider"
import { Loading } from "@/components/Feedback"
import HomeFeed from "@/components/HomeFeed"
import LandingPage from "@/components/LandingPage"

// Com sessão (token salvo e válido), a home é o feed de doações; sem sessão, é a landing page.
export default function Home() {
    const { usuario, carregando } = useAuth()

    if (carregando) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loading />
            </main>
        )
    }

    return usuario ? <HomeFeed usuario={usuario} /> : <LandingPage />
}
