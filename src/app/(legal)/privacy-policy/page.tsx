import type { Metadata } from "next"
import Link from "next/link"
import { CONTATO_EXIBIDO, CONTROLADOR, DATA_VIGENCIA, VERSAO_TERMOS } from "@/lib/legal"

export const metadata: Metadata = {
    title: "Política de Privacidade | Seveste",
}

type LinhaDados = { dados: string; finalidade: string; base: string; quemVe: string }

// Tudo o que os formulários e a API realmente coletam. Ao mudar um formulário, atualize esta tabela.
const DADOS: LinhaDados[] = [
    {
        dados: "Nome, e-mail e senha",
        finalidade: "Criar a conta, permitir o login e identificar você nas doações e solicitações.",
        base: "Execução do serviço que você solicitou (art. 7º, V)",
        quemVe: "Nome: público no perfil de doadores e visível ao doador quando um acolhido solicita uma peça. E-mail: só você e, no caso de acolhidos, o doador depois de aceitar a solicitação. Senha: ninguém (fica guardada apenas de forma criptografada).",
    },
    {
        dados: "Cidade, estado e tipo de conta (doador ou acolhido)",
        finalidade: "Mostrar a região das doações e definir o que cada conta pode fazer.",
        base: "Execução do serviço (art. 7º, V)",
        quemVe: "Públicos no perfil de doadores. De acolhidos, visíveis apenas ao doador de uma peça que eles solicitaram.",
    },
    {
        dados: "Telefone (opcional)",
        finalidade: "Facilitar o contato para a entrega de uma doação.",
        base: "Consentimento (art. 7º, I), já que você escolhe informar ou não",
        quemVe: "Telefone de acolhidos: visível ao doador depois que ele aceita a solicitação. Telefone de doadores: não é exibido a outras pessoas.",
    },
    {
        dados: "Somente acolhidos: tipos de peça que procura, tamanho de roupa e número de calçado",
        finalidade: "Ajudar o doador a saber se a peça serve para quem está solicitando e sugerir peças compatíveis.",
        base: "Consentimento (art. 7º, I)",
        quemVe: "O doador de uma peça que você solicitou. Acolhidos não têm perfil público.",
    },
    {
        dados: "Anúncios de doação: título, descrição, categoria, tamanho, estado de conservação, forma de entrega e fotos",
        finalidade: "Publicar a doação na vitrine.",
        base: "Execução do serviço (art. 7º, V)",
        quemVe: "Públicos para qualquer visitante. As fotos ficam acessíveis por um link público.",
    },
    {
        dados: "Endereço da doação: rua, número, complemento, cidade e estado",
        finalidade: "Permitir a retirada ou a entrega da peça.",
        base: "Execução do serviço (art. 7º, V)",
        quemVe: "Cidade e estado: públicos. Endereço completo: só o doador e o acolhido cuja solicitação foi aceita.",
    },
    {
        dados: "Solicitações e histórico de status das doações (disponível, reservada, concluída)",
        finalidade: "Fazer funcionar o fluxo de solicitar, aceitar, recusar e concluir doações.",
        base: "Execução do serviço (art. 7º, V)",
        quemVe: "O acolhido que fez a solicitação e o doador da peça.",
    },
    {
        dados: "Registro do aceite: data e versão destes documentos",
        finalidade: "Comprovar que você consentiu, como exige a LGPD.",
        base: "Cumprimento de obrigação legal (art. 7º, II, e art. 8º, § 2º)",
        quemVe: "Só você (em Minha Conta → Meus dados) e a equipe do projeto.",
    },
    {
        dados: "Dados técnicos de acesso (endereço IP, navegador, data e hora), registrados automaticamente pelos provedores de hospedagem",
        finalidade: "Manter a plataforma funcionando e segura.",
        base: "Legítimo interesse (art. 7º, IX)",
        quemVe: "Os provedores de hospedagem e, se necessário, a equipe do projeto.",
    },
]

export default function PrivacyPolicy() {
    return (
        <>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-seveste-green">Versão {VERSAO_TERMOS} · vigente desde {DATA_VIGENCIA}</p>
            <h1 className="mb-6 mt-2 text-4xl font-bold text-seveste-dark">Política de Privacidade</h1>

            <p>
                Esta política explica quais dados pessoais o Seveste coleta, por que coleta, com quem compartilha e como você pode
                exercer os seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).
                Ao criar uma conta você declara que leu e concorda com ela; a data e a versão aceitas ficam registradas.
            </p>

            <h2>1. Quem é o responsável pelos seus dados</h2>
            <p>
                <strong>Controlador:</strong> {CONTROLADOR}. O Seveste é um projeto acadêmico, gratuito e sem fins lucrativos.
                <br />
                <strong>Encarregado e canal de atendimento aos titulares:</strong> {CONTATO_EXIBIDO}.
            </p>

            <h2>2. Quais dados coletamos, para quê e com que base legal</h2>
            <p>Coletamos somente os dados abaixo, que são os pedidos nos formulários da plataforma:</p>
            <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-seveste-dark">
                        <tr>
                            <th className="p-3 font-semibold">Dados</th>
                            <th className="p-3 font-semibold">Para que usamos</th>
                            <th className="p-3 font-semibold">Base legal (LGPD)</th>
                            <th className="p-3 font-semibold">Quem pode ver</th>
                        </tr>
                    </thead>
                    <tbody className="text-seveste-muted">
                        {DADOS.map((linha) => (
                            <tr key={linha.dados} className="border-t border-gray-200 align-top">
                                <td className="p-3 font-medium text-seveste-dark">{linha.dados}</td>
                                <td className="p-3">{linha.finalidade}</td>
                                <td className="p-3">{linha.base}</td>
                                <td className="p-3">{linha.quemVe}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p>
                <strong>Não coletamos</strong> CPF, documentos, dados bancários, localização do seu aparelho nem dados pessoais
                sensíveis (como saúde, religião ou origem racial). Por respeito à sua privacidade, contas de acolhidos não têm
                perfil público.
            </p>

            <h2>3. Se você não quiser fornecer os dados</h2>
            <p>
                Você pode navegar pela vitrine sem criar conta. Para anunciar ou solicitar doações é preciso criar uma conta,
                informar os dados obrigatórios do cadastro e aceitar esta política; sem isso não é possível usar essas funções.
                O telefone é sempre opcional.
            </p>

            <h2>4. Com quem compartilhamos</h2>
            <ul>
                <li><strong>Outros usuários</strong>, apenas na forma descrita na coluna &ldquo;Quem pode ver&rdquo; da tabela acima.</li>
                <li>
                    <strong>Provedores de tecnologia (operadores)</strong> que hospedam o site, a API, o banco de dados PostgreSQL e as
                    fotos (Vercel e o provedor do banco de dados). Eles tratam os dados apenas para manter a plataforma funcionando.
                </li>
                <li><strong>Autoridades públicas</strong>, somente quando houver obrigação legal ou ordem judicial.</li>
            </ul>
            <p>Seus dados não são vendidos, alugados nem usados para publicidade.</p>

            <h2>5. Transferência internacional</h2>
            <p>
                Os provedores de hospedagem podem armazenar ou processar dados em servidores fora do Brasil. Essa transferência é
                necessária para prestar o serviço que você solicitou (art. 33, IX, da LGPD) e ocorre com provedores que adotam
                medidas de segurança para proteger os dados.
            </p>

            <h2>6. Por quanto tempo guardamos</h2>
            <ul>
                <li>Os dados da conta, das doações e das solicitações ficam guardados enquanto a sua conta existir.</li>
                <li>
                    Ao excluir a conta, apagamos imediatamente do banco de dados o seu cadastro, suas doações (com os endereços e o
                    histórico) e suas solicitações. Doações que estavam reservadas para você voltam a ficar disponíveis.
                </li>
                <li>
                    As fotos enviadas ficam no serviço de armazenamento de arquivos e podem não ser apagadas automaticamente junto com
                    a conta. Para removê-las, peça pelo canal de atendimento.
                </li>
                <li>Cópias de segurança e registros técnicos dos provedores podem manter dados por um período limitado, conforme as políticas deles.</li>
            </ul>

            <h2>7. Seus direitos (art. 18 da LGPD)</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul>
                <li>confirmar se tratamos seus dados e <strong>acessá-los</strong>;</li>
                <li><strong>corrigir</strong> dados incompletos, inexatos ou desatualizados;</li>
                <li>pedir a <strong>anonimização, o bloqueio ou a eliminação</strong> de dados desnecessários ou tratados em desacordo com a LGPD;</li>
                <li>pedir a <strong>portabilidade</strong> dos seus dados;</li>
                <li>pedir a <strong>eliminação</strong> dos dados tratados com base no seu consentimento;</li>
                <li>saber com quem seus dados foram <strong>compartilhados</strong>;</li>
                <li>ser informado sobre a possibilidade de não consentir e suas consequências (item 3);</li>
                <li><strong>revogar o consentimento</strong>;</li>
                <li>apresentar reclamação à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>.</li>
            </ul>
            <p><strong>Como exercer:</strong></p>
            <ul>
                <li>
                    Em <Link href="/dashboard?aba=dados" className="font-semibold text-seveste-green underline">Minha Conta → Meus dados</Link> você
                    vê seus dados, corrige nome, telefone, cidade e estado e pode <strong>excluir a conta</strong>, o que também revoga o
                    consentimento.
                </li>
                <li>
                    Para os demais pedidos (acesso completo, portabilidade, correção de outros dados, remoção de fotos), escreva para{" "}
                    <strong>{CONTATO_EXIBIDO}</strong>. Respondemos em até 15 dias.
                </li>
            </ul>

            <h2>8. Segurança</h2>
            <ul>
                <li>As senhas são guardadas apenas de forma criptografada (bcrypt) e nunca são exibidas.</li>
                <li>A comunicação com a plataforma usa conexão segura (HTTPS).</li>
                <li>Cada operação confere se você tem permissão sobre o que está vendo ou alterando.</li>
                <li>E-mail, telefone e endereço completo só são liberados nas situações descritas na tabela acima.</li>
                <li>
                    Depois do login, um código de acesso fica salvo no seu navegador por até 6 horas (veja a{" "}
                    <Link href="/cookie-policy" className="font-semibold text-seveste-green underline">Política de Cookies</Link>).
                    Em computadores compartilhados, sempre saia da conta ao terminar.
                </li>
            </ul>
            <p>
                Se ocorrer um incidente de segurança que possa causar risco ou dano relevante, comunicaremos os titulares afetados e a
                ANPD, como prevê o art. 48 da LGPD.
            </p>

            <h2>9. Crianças e adolescentes</h2>
            <p>
                O cadastro é permitido apenas para maiores de 18 anos. Não tratamos intencionalmente dados de crianças e adolescentes;
                peças para eles devem ser solicitadas pelos pais ou responsáveis, em nome próprio.
            </p>

            <h2>10. Alterações desta política</h2>
            <p>
                Se esta política mudar de forma relevante, a nova versão será publicada nesta página com a data de vigência. Quando a
                mudança exigir, pediremos um novo consentimento.
            </p>

            <p className="text-sm">Veja também os <Link href="/terms-of-use" className="font-semibold text-seveste-green underline">Termos de Uso</Link>.</p>
        </>
    )
}
