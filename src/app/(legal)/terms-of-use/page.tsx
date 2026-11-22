import type { Metadata } from "next"
import Link from "next/link"
import { CONTATO_EXIBIDO, CONTROLADOR, DATA_VIGENCIA, VERSAO_TERMOS } from "@/lib/legal"

export const metadata: Metadata = {
    title: "Termos de Uso | Seveste",
}

export default function UseTerm() {
    return (
        <>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-seveste-green">Versão {VERSAO_TERMOS} · vigente desde {DATA_VIGENCIA}</p>
            <h1 className="mb-6 mt-2 text-4xl font-bold text-seveste-dark">Termos de Uso</h1>

            <h2>1. Aceitação</h2>
            <p>
                Estes termos regulam o uso do Seveste, mantido por: {CONTROLADOR}. Ao marcar a caixa de aceite e criar uma conta,
                você declara que leu e concorda com estes Termos de Uso e com a{" "}
                <Link href="/privacy-policy" className="font-semibold text-seveste-green underline">Política de Privacidade</Link>.
                A data e a versão aceitas ficam registradas na sua conta. Se não concordar, não crie uma conta.
            </p>

            <h2>2. O que é o Seveste</h2>
            <p>
                O Seveste é uma plataforma acadêmica, gratuita e sem fins lucrativos, que aproxima pessoas que querem doar roupas,
                calçados e acessórios (<strong>doadores</strong>) de pessoas que precisam recebê-los (<strong>acolhidos</strong>).
                A plataforma apenas conecta as pessoas: ela não compra, vende, armazena nem transporta peças.
            </p>

            <h2>3. Cadastro e conta</h2>
            <ul>
                <li>Somente maiores de 18 anos podem criar uma conta.</li>
                <li>Os dados informados no cadastro devem ser verdadeiros, e você deve mantê-los atualizados em Minha Conta.</li>
                <li>Cada conta é pessoal. Você é responsável por manter sua senha em segredo e por tudo o que for feito com a sua conta.</li>
                <li>Contas de <strong>doador</strong> podem publicar doações. Contas de <strong>acolhido</strong> podem solicitar doações.</li>
                <li>Só usuários cadastrados podem publicar ou solicitar doações; qualquer pessoa pode navegar pela vitrine.</li>
            </ul>

            <h2>4. Publicação de doações</h2>
            <ul>
                <li>Toda doação deve informar título, descrição, categoria, tamanho, estado de conservação, forma de entrega e o endereço onde a peça está.</li>
                <li>Anuncie somente peças suas, limpas e em condições de uso. Descreva defeitos com honestidade e use fotos reais da peça.</li>
                <li>Somente quem publicou a doação pode editá-la ou excluí-la, ressalvado o disposto no item 7 (moderação).</li>
                <li>No anúncio aparecem apenas a cidade e o estado. O endereço completo só é mostrado ao acolhido cuja solicitação for aceita.</li>
            </ul>

            <h2>5. Solicitações, reserva e entrega</h2>
            <ul>
                <li>Uma doação pode ser solicitada somente enquanto estiver <strong>disponível</strong>, e cada acolhido pode ter apenas uma solicitação ativa por doação.</li>
                <li>Quando o doador <strong>aceita</strong> uma solicitação, a doação passa a ficar <strong>reservada</strong> para aquela pessoa e as demais solicitações pendentes são recusadas.</li>
                <li>Depois da entrega, o doador marca a doação como <strong>concluída</strong>, e ela deixa de aparecer como disponível.</li>
                <li>O acolhido pode cancelar a solicitação a qualquer momento antes da conclusão; se ela estava aceita, a doação volta a ficar disponível.</li>
                <li>A entrega é combinada diretamente entre as pessoas, conforme a forma indicada no anúncio (retirada no local, entrega pelo doador ou a combinar). Prefira locais públicos e movimentados.</li>
                <li>O e-mail, o telefone e o endereço liberados após o aceite só podem ser usados para combinar aquela doação.</li>
            </ul>

            <h2>6. Condutas proibidas</h2>
            <ul>
                <li><strong>Comercializar peças</strong>: é proibido vender, trocar ou cobrar qualquer valor, taxa ou frete pela doação por meio da plataforma.</li>
                <li>Informar dados falsos ou se passar por outra pessoa.</li>
                <li>Publicar conteúdo ofensivo, discriminatório, ilegal, enganoso ou que exponha dados pessoais de terceiros.</li>
                <li>Usar os dados de contato ou o endereço de outra pessoa para qualquer finalidade que não seja a doação combinada.</li>
                <li>Tentar acessar contas ou dados de outras pessoas, ou prejudicar o funcionamento da plataforma.</li>
            </ul>

            <h2>7. Moderação</h2>
            <p>
                A equipe do projeto pode remover publicações inadequadas ou suspeitas e suspender ou excluir contas que descumprirem
                estes termos, sem aviso prévio quando houver risco a outros usuários.
            </p>

            <h2>8. Conteúdo que você envia</h2>
            <p>
                Os textos e fotos dos anúncios continuam sendo seus. Ao publicá-los, você autoriza o Seveste a exibi-los na plataforma
                enquanto o anúncio existir e declara que tem o direito de usá-los.
            </p>

            <h2>9. Responsabilidades</h2>
            <p>
                O Seveste é oferecido como está, por um projeto acadêmico, sem garantia de disponibilidade contínua. A plataforma não
                participa das entregas e não se responsabiliza pelo estado das peças, pelo cumprimento do que for combinado entre os
                usuários nem por danos decorrentes desses encontros. Cada usuário responde pelas informações que publica e pelas suas
                condutas.
            </p>

            <h2>10. Encerramento da conta</h2>
            <p>
                Você pode excluir sua conta a qualquer momento em Minha Conta → Meus dados. A exclusão apaga seu cadastro, suas doações e
                suas solicitações, como descrito na Política de Privacidade, e não pode ser desfeita.
            </p>

            <h2>11. Alterações destes termos</h2>
            <p>
                Estes termos podem ser atualizados. A versão vigente e a data de vigência aparecem no topo desta página. Em mudanças
                relevantes, você será avisado e poderá ser solicitado um novo aceite.
            </p>

            <h2>12. Lei aplicável e contato</h2>
            <p>
                Estes termos seguem as leis brasileiras, incluindo o Marco Civil da Internet (Lei nº 12.965/2014), a LGPD (Lei nº
                13.709/2018) e o Código de Defesa do Consumidor, quando aplicável. Dúvidas, denúncias de conteúdo inadequado e
                pedidos sobre seus dados: <strong>{CONTATO_EXIBIDO}</strong>.
            </p>
        </>
    )
}
