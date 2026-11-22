"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { api, mensagemDeErro } from "./api"
import type { TipoUsuario } from "./types"

type CamposExtras = (dados: FormData) => Record<string, unknown> | string

// Cadastra o usuário (POST /usuarios) e já entra na conta.
// "camposExtras" pode devolver uma mensagem (string) para barrar o envio.
export function useSignup(tipo: TipoUsuario, camposExtras?: CamposExtras) {
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const { entrar } = useAuth()
    const router = useRouter()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const dados = new FormData(event.currentTarget)

        const extras = camposExtras?.(dados) ?? {}
        if (typeof extras === "string") {
            setErro(extras)
            return
        }

        const email = String(dados.get("email") ?? "")
        const senha = String(dados.get("password") ?? "")

        setEnviando(true)
        setErro(null)

        try {
            await api("/usuarios", {
                method: "POST",
                body: {
                    nome: dados.get("name"),
                    email,
                    senha,
                    telefone: dados.get("phone") ?? "",
                    cidade: dados.get("city"),
                    uf: String(dados.get("state") ?? "").toUpperCase(),
                    tipo,
                    // LGPD: a API exige o aceite e grava a data e a versão dos termos aceitos
                    aceite_termos: dados.get("privacy") === "on",
                    ...extras,
                },
            })

            await entrar(email, senha)
            router.push(tipo === "doador" ? "/announce" : "/products")
        } catch (e) {
            setErro(mensagemDeErro(e))
            setEnviando(false)
        }
    }

    return { handleSubmit, enviando, erro }
}
