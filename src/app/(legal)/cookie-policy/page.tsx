import type { Metadata } from "next"
import Link from "next/link"
import { CONTATO_EXIBIDO, DATA_VIGENCIA, VERSAO_TERMOS } from "@/lib/legal"

export const metadata: Metadata = {
    title: "Política de Cookies | Seveste",
}

export default function CookiePolicy() {
    return (
        <>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-seveste-green">Versão {VERSAO_TERMOS} · vigente desde {DATA_VIGENCIA}</p>
            <h1 className="mb-6 mt-2 text-4xl font-bold text-seveste-dark">Política de Cookies</h1>

            <p>
                O Seveste <strong>não usa cookies</strong> e não utiliza ferramentas de publicidade, rastreamento ou análise de
                terceiros. Usamos apenas o armazenamento do seu navegador, e somente para o que é necessário ao funcionamento do site.
            </p>

            <h2>O que fica salvo no seu navegador</h2>
            <ul>
                <li>
                    <strong>Sessão de login (seveste_token):</strong> um código de acesso salvo no armazenamento local do navegador
                    quando você entra na conta, para que você não precise entrar de novo a cada página. Ele identifica a sua conta,
                    vale por até 6 horas e é apagado quando você clica em &ldquo;Sair&rdquo; ou exclui a conta.
                </li>
                <li>
                    <strong>Ferramenta de desenvolvimento:</strong> se a ferramenta interna de testes da equipe for ativada, uma
                    preferência sem dados pessoais fica salva até a aba ser fechada.
                </li>
            </ul>

            <h2>Por que não pedimos consentimento separado</h2>
            <p>
                Esse armazenamento é estritamente necessário para o login funcionar e não é usado para nenhuma outra finalidade.
                Os dados pessoais da sua conta são tratados conforme a{" "}
                <Link href="/privacy-policy" className="font-semibold text-seveste-green underline">Política de Privacidade</Link>.
            </p>

            <h2>Como apagar</h2>
            <p>
                Clique em &ldquo;Sair&rdquo; ou limpe os dados deste site nas configurações do seu navegador. Isso encerra a sua sessão,
                e você precisará entrar novamente. Dúvidas: <strong>{CONTATO_EXIBIDO}</strong>.
            </p>
        </>
    )
}
