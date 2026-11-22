// Valores usados nos formulários e seus rótulos de exibição.
// A API aceita categoria, tamanho e estado (conservação) como texto livre; tipo de entrega e status são fixos.

type Opcao = { valor: string; rotulo: string }

export const CATEGORIAS: Opcao[] = [
    { valor: "roupas", rotulo: "Roupas" },
    { valor: "agasalhos", rotulo: "Agasalhos" },
    { valor: "calcados", rotulo: "Calçados" },
    { valor: "acessorios", rotulo: "Acessórios" },
    { valor: "infantil", rotulo: "Infantil" },
]

export const CONDICOES: Opcao[] = [
    { valor: "novo", rotulo: "Novo (com etiqueta)" },
    { valor: "usado_excelente", rotulo: "Usado (excelente)" },
    { valor: "usado_marcas", rotulo: "Usado (com marcas)" },
]

export const TAMANHOS: Opcao[] = [
    { valor: "PP", rotulo: "PP" },
    { valor: "P", rotulo: "P" },
    { valor: "M", rotulo: "M" },
    { valor: "G", rotulo: "G" },
    { valor: "GG", rotulo: "GG" },
    { valor: "UNICO", rotulo: "Tamanho Único" },
]

export const TIPOS_ENTREGA: Opcao[] = [
    { valor: "retirada", rotulo: "Retirada no local" },
    { valor: "entrega", rotulo: "Eu entrego" },
    { valor: "a_combinar", rotulo: "A combinar" },
]

export const STATUS_DOACAO: Opcao[] = [
    { valor: "disponivel", rotulo: "Disponível" },
    { valor: "reservada", rotulo: "Reservada" },
    { valor: "concluida", rotulo: "Concluída" },
]

export const NECESSIDADES: Opcao[] = [
    { valor: "roupas", rotulo: "Roupas" },
    { valor: "calcados", rotulo: "Calçados" },
    { valor: "agasalhos", rotulo: "Agasalhos" },
    { valor: "acessorios", rotulo: "Acessórios" },
]

export const UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export const MAXIMO_FOTOS = 4

// mostra o rótulo conhecido ou, para valores livres vindos da API (ex.: "camiseta"), o próprio valor
function rotuloDe(lista: Opcao[], valor: string) {
    const encontrado = lista.find((o) => o.valor.toLowerCase() === valor.toLowerCase())
    if (encontrado) return encontrado.rotulo
    const texto = valor.replace(/_/g, " ")
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const rotuloCategoria = (valor: string) => rotuloDe(CATEGORIAS, valor)
export const rotuloCondicao = (valor: string) => rotuloDe(CONDICOES, valor)
export const rotuloTamanho = (valor: string) => rotuloDe(TAMANHOS, valor)
export const rotuloEntrega = (valor: string) => rotuloDe(TIPOS_ENTREGA, valor)
export const rotuloStatus = (valor: string) => rotuloDe(STATUS_DOACAO, valor)
