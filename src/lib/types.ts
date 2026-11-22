// Tipos que espelham as respostas da API em Go (campos em snake_case, como no back-end)

export type TipoUsuario = "doador" | "acolhido"

// perfil público (GET /usuarios e GET /usuarios/:id sem ser o dono)
export type UsuarioPublico = {
    id_usuario: number
    nome: string
    tipo: TipoUsuario
    uf: string
    cidade: string
}

// perfil completo, só para o próprio usuário (GET /usuarios/:id com o token dele)
export type Usuario = UsuarioPublico & {
    email: string
    telefone: string
    roupas_procuradas: string[] | null
    tamanho_roupa: string
    tamanho_calcado: number
    // quando a pessoa aceitou os Termos de Uso e a Política de Privacidade, e qual versão
    aceite_termos_em: string
    versao_termos: string
}

export type Endereco = {
    id_endereco: number
    rua: string
    numero: string
    uf: string
    complemento?: string
    id_cidade: number
    cidade: string
}

export type DoacaoImagem = {
    id_doacao_imagem: number
    id_doacao: number
    posicao: number
    capa: boolean
    url: string
    criado_em: string
}

export type StatusDoacao = "disponivel" | "reservada" | "concluida"
export type TipoEntrega = "retirada" | "entrega" | "a_combinar"

export type Doacao = {
    id_doacao: number
    titulo: string
    descricao: string
    categoria: string
    tamanho: string
    estado: string
    tipo_de_entrega: TipoEntrega
    status: StatusDoacao
    criado_em: string
    atualizado_em: string
    id_usuario: number
    id_endereco: number
    // sem permissão, a API devolve o endereço só com cidade e UF (rua e número vazios)
    endereco?: Endereco
    imagens?: DoacaoImagem[]
}

export type StatusSolicitacao = "PENDENTE" | "ACEITA" | "RECUSADA"

export type Solicitante = {
    id_usuario: number
    nome: string
    uf: string
    cidade: string
    roupas_procuradas?: string[]
    tamanho_roupa?: string
    tamanho_calcado?: number
    // e-mail e telefone só vêm depois que a solicitação é aceita
    email?: string
    telefone?: string
}

export type Solicitacao = {
    id_solicitacao: number
    status: StatusSolicitacao
    criado_em: string
    id_doacao: number
    id_usuario: number
    solicitante?: Solicitante
    doacao?: { id_doacao: number; titulo: string; status: StatusDoacao }
}
