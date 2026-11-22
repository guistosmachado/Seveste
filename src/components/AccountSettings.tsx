"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Save, ShieldCheck, Trash2, UserCog } from "lucide-react"
import { useAuth } from "./AuthProvider"
import { ErrorMessage } from "./Feedback"
import { api, mensagemDeErro } from "@/lib/api"
import { NECESSIDADES, UFS } from "@/lib/constants"
import { dataCurta } from "@/lib/format"
import type { Usuario } from "@/lib/types"

const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base outline-none transition-colors duration-200 hover:border-seveste-green focus:border-seveste-green focus:ring-1 focus:ring-seveste-green"
const lockedClass = "w-full cursor-not-allowed rounded-lg border border-gray-200 bg-slate-50 px-4 py-2.5 text-base text-seveste-muted"
const labelClass = "mb-1.5 block text-sm font-medium text-seveste-dark"

// Aba "Meus dados": editar o cadastro (PATCH /usuarios/:id) e excluir a conta (DELETE /usuarios/:id)
export default function AccountSettings({ usuario }: { usuario: Usuario }) {
    const { recarregar, sair } = useAuth()
    const router = useRouter()

    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [confirmacao, setConfirmacao] = useState("")
    const [excluindo, setExcluindo] = useState(false)

    const handleSalvar = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const dados = new FormData(event.currentTarget)

        setSalvando(true)
        setErro(null)
        setMensagem(null)
        try {
            await api(`/usuarios/${usuario.id_usuario}`, {
                method: "PATCH",
                body: {
                    nome: dados.get("nome"),
                    telefone: dados.get("telefone"),
                    cidade: dados.get("cidade"),
                    uf: dados.get("uf"),
                },
            })
            await recarregar()
            setMensagem("Dados atualizados com sucesso.")
        } catch (e) {
            setErro(mensagemDeErro(e))
        } finally {
            setSalvando(false)
        }
    }

    const handleExcluir = async () => {
        setExcluindo(true)
        setErro(null)
        try {
            await api(`/usuarios/${usuario.id_usuario}`, { method: "DELETE" })
            sair()
            router.replace("/")
        } catch (e) {
            setErro(mensagemDeErro(e))
            setExcluindo(false)
        }
    }

    const handleSair = () => {
        sair()
        router.replace("/")
    }

    const necessidades = (usuario.roupas_procuradas ?? [])
        .map((valor) => NECESSIDADES.find((n) => n.valor === valor)?.rotulo ?? valor)
        .join(", ")

    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <form onSubmit={handleSalvar} className="flex-1 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <UserCog className="h-5 w-5 text-seveste-green" />
                    Dados da conta
                </h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label htmlFor="nome" className={labelClass}>Nome completo</label>
                        <input id="nome" name="nome" defaultValue={usuario.nome} maxLength={100} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClass}>E-mail</label>
                        <input id="email" value={usuario.email} disabled className={lockedClass} />
                    </div>
                    <div>
                        <label htmlFor="telefone" className={labelClass}>Telefone (opcional)</label>
                        <input id="telefone" name="telefone" type="tel" defaultValue={usuario.telefone} maxLength={20} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="cidade" className={labelClass}>Cidade</label>
                        <input id="cidade" name="cidade" defaultValue={usuario.cidade} maxLength={200} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="uf" className={labelClass}>Estado</label>
                        <select id="uf" name="uf" defaultValue={usuario.uf.toUpperCase()} className={`${inputClass} cursor-pointer`}>
                            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                    </div>

                    {usuario.tipo === "acolhido" && (
                        <div className="rounded-lg bg-slate-50 p-4 text-sm text-seveste-muted md:col-span-2">
                            <p><strong className="text-seveste-dark">Procura:</strong> {necessidades || "não informado"}</p>
                            <p><strong className="text-seveste-dark">Tamanho de roupa:</strong> {usuario.tamanho_roupa || "não informado"} · <strong className="text-seveste-dark">Calçado:</strong> {usuario.tamanho_calcado || "não informado"}</p>
                            <p className="mt-1 text-xs">Esses dados não podem ser alterados por aqui.</p>
                        </div>
                    )}
                </div>

                {erro && <ErrorMessage mensagem={erro} />}
                {mensagem && <p className="rounded-lg border border-seveste-green/30 bg-seveste-green/10 px-4 py-3 text-sm text-seveste-dark" role="status">{mensagem}</p>}

                <button
                    type="submit"
                    disabled={salvando}
                    className="flex items-center justify-center gap-2 rounded-lg bg-seveste-dark px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-seveste-green disabled:cursor-wait disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
            </form>

            <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-96">
                <div className="rounded-2xl bg-seveste-dark p-6 text-seveste-white">
                    <div className="mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-seveste-accent" />
                        <h3 className="font-bold">Privacidade</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-seveste-surface">
                        Seu e-mail e telefone nunca aparecem publicamente. Eles só são mostrados ao doador depois que ele aceita a sua solicitação.
                        Saiba mais na <Link href="/privacy-policy" className="underline hover:text-seveste-accent">política de privacidade</Link>.
                    </p>
                    <p className="mt-3 text-xs text-seveste-surface/80">
                        {usuario.aceite_termos_em && !usuario.aceite_termos_em.startsWith("0001")
                            ? <>Você aceitou os <Link href="/terms-of-use" className="underline hover:text-seveste-accent">Termos de Uso</Link> e a Política de Privacidade em {dataCurta(usuario.aceite_termos_em)} (versão {usuario.versao_termos}).</>
                            : "Não há registro de aceite dos termos para esta conta."}
                    </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-white p-6">
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-red-700">
                        <Trash2 className="h-4 w-4" />
                        Excluir minha conta
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-seveste-muted">
                        Remove definitivamente sua conta, suas doações e suas solicitações. Essa ação não pode ser desfeita.
                    </p>
                    <label htmlFor="confirmar-exclusao" className="mb-1.5 block text-xs font-medium text-seveste-dark">
                        Digite <strong>EXCLUIR</strong> para confirmar
                    </label>
                    <input
                        id="confirmar-exclusao"
                        value={confirmacao}
                        onChange={(e) => setConfirmacao(e.target.value)}
                        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <button
                        type="button"
                        onClick={handleExcluir}
                        disabled={confirmacao !== "EXCLUIR" || excluindo}
                        className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {excluindo ? "Excluindo..." : "Excluir conta permanentemente"}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleSair}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-seveste-dark transition-all hover:bg-slate-50 hover:text-seveste-green"
                >
                    <LogOut className="h-4 w-4" />
                    Sair da conta
                </button>
            </aside>
        </div>
    )
}
