"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api, decodificarToken, lerToken, salvarToken } from "@/lib/api"
import type { TipoUsuario, Usuario } from "@/lib/types"

type AuthContextValue = {
    usuario: Usuario | null
    carregando: boolean
    entrar: (email: string, senha: string) => Promise<Usuario>
    sair: () => void
    recarregar: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// o id do usuário vem de dentro do token; com ele, GET /usuarios/:id devolve o perfil completo (só para o dono)
async function buscarUsuarioDoToken(token: string): Promise<Usuario | null> {
    const dados = decodificarToken(token)
    if (!dados) return null

    const { usuario } = await api<{ usuario: Usuario }>(`/usuarios/${dados.usuario_id}`)
    return usuario
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [carregando, setCarregando] = useState(true)

    const recarregar = useCallback(async () => {
        const token = lerToken()
        try {
            const atual = token ? await buscarUsuarioDoToken(token) : null
            if (!atual) salvarToken(null)
            setUsuario(atual)
        } catch {
            // token expirado ou conta excluída
            salvarToken(null)
            setUsuario(null)
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(recarregar, 0)
        return () => clearTimeout(timer)
    }, [recarregar])

    const entrar = useCallback(async (email: string, senha: string) => {
        const { token } = await api<{ token: string }>("/login", { method: "POST", body: { email, senha } })
        salvarToken(token)

        const logado = await buscarUsuarioDoToken(token)
        if (!logado) {
            salvarToken(null)
            throw new Error("Não foi possível iniciar a sessão.")
        }

        setUsuario(logado)
        return logado
    }, [])

    const sair = useCallback(() => {
        salvarToken(null)
        setUsuario(null)
    }, [])

    return (
        <AuthContext.Provider value={{ usuario, carregando, entrar, sair, recarregar }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const contexto = useContext(AuthContext)
    if (!contexto) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
    return contexto
}

// Redireciona para o login quando não há sessão (e para a conta, se o tipo de usuário não for o esperado)
export function useRequireAuth(tipo?: TipoUsuario) {
    const { usuario, carregando } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (carregando) return

        if (!usuario) {
            const destino = window.location.pathname + window.location.search
            router.replace(`/login?next=${encodeURIComponent(destino)}`)
        } else if (tipo && usuario.tipo !== tipo) {
            router.replace("/dashboard")
        }
    }, [carregando, usuario, tipo, router])

    const autorizado = !carregando && !!usuario && (!tipo || usuario.tipo === tipo)
    return { usuario: autorizado ? usuario : null, carregando: !autorizado }
}
