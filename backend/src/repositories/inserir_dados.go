package repositories

import (
	"log"
	"seveste-api/src/models"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_endereco"
	"seveste-api/src/repositories/repo_historico"
	"seveste-api/src/repositories/repo_imagem"
	"seveste-api/src/repositories/repo_solicitacao"
	"seveste-api/src/repositories/repo_usuario"
	"time"
)

var usuarios = []models.Usuario{
	{
		Nome:   "teste",
		Email:  "teste@gmail.com",
		Senha:  "teste",
		UF:     "SP",
		Cidade: "Botucatu",
		Tipo:   "Doador",
	},
	{
		Nome:             "Pedro",
		Email:            "pedrinho@gmail.com",
		Senha:            "pedrinho",
		Telefone:         "(11) 1111-1111",
		UF:               "BH",
		Cidade:           "Xique-Xique",
		Tipo:             "Acolhido",
		RoupasProcuradas: []string{"calca", "sapato", "camiseta"},
		TamanhoRoupa:     "GG",
		TamanhoCalcado:   37,
	},
	{
		Nome:             "Márcia",
		Email:            "marcinha123@gmail.com",
		Senha:            "dasd1233",
		Telefone:         "(22) 2222-2222",
		UF:               "MG",
		Cidade:           "Xaque-Xaque",
		Tipo:             "Acolhido",
		RoupasProcuradas: []string{"sapato", "blusa"},
		TamanhoRoupa:     "P",
		TamanhoCalcado:   34,
	},
	{
		Nome:   "Túlio",
		Email:  "talmeida32@gmail.com",
		Senha:  "tulinho",
		UF:     "BH",
		Cidade: "Canchas",
		Tipo:   "Doador",
	},
}

var enderecos = []models.Endereco{
	{
		Rua:    "Rua Amando de Barros",
		Numero: "100",
		UF:     "SP",
		Cidade: "Botucatu",
	},
	{
		Rua:         "Rua das Flores",
		Numero:      "45",
		Complemento: "Apto 2",
		UF:          "MG",
		Cidade:      "Belo Horizonte",
	},
}

// a doação 1 já está reservada (solicitação ACEITA); a doação 2 tem solicitações PENDENTES para testar aceitar/recusar
var doacoes = []models.Doacao{
	{
		Titulo:        "Camiseta azul",
		Descricao:     "Camiseta azul tamanho G levemente usada",
		Categoria:     "camiseta",
		Tamanho:       "G",
		Estado:        "usada",
		TipoDeEntrega: "retirada",
		Status:        models.DoacaoReservada,

		UsuarioID: 1,
	},
	{
		Titulo:        "Calça jeans preta",
		Descricao:     "Eu comprei essa calça faz um tempo mas não coube em mim",
		Categoria:     "calca",
		Tamanho:       "M",
		Estado:        "nova",
		TipoDeEntrega: "a_combinar",
		Status:        models.DoacaoDisponivel,

		UsuarioID: 4,
	},
}

var imagens = []models.DoacaoImagem{
	{DoacaoID: 1, Posicao: 1, Capa: true, URL: "https://placehold.co/600x800?text=Camiseta+azul"},
	{DoacaoID: 2, Posicao: 1, Capa: true, URL: "https://placehold.co/600x800?text=Calca+jeans"},
}

var solicitacoes = []models.Solicitacao{
	{
		Status:    models.SolicitacaoAceita,
		CriadoEm:  time.Now(),
		DoacaoID:  1,
		UsuarioID: 3,
	},
	{
		Status:    models.SolicitacaoRecusada,
		CriadoEm:  time.Now(),
		DoacaoID:  1,
		UsuarioID: 2,
	},
	{
		Status:    models.SolicitacaoPendente,
		CriadoEm:  time.Now(),
		DoacaoID:  2,
		UsuarioID: 3,
	},
	{
		Status:    models.SolicitacaoPendente,
		CriadoEm:  time.Now(),
		DoacaoID:  2,
		UsuarioID: 2,
	},
}

// InserirDadosSeVazio só carrega os dados de exemplo quando o banco ainda não tem nenhum usuário
func InserirDadosSeVazio() {
	existentes, err := repo_usuario.UsuarioRepo.BuscarTodos()
	if err != nil {
		log.Fatal(err)
	}

	if len(existentes) > 0 {
		log.Println("o banco ja possui dados, os dados de exemplo foram ignorados")
		return
	}

	InserirDados()
}

// Nos dados acima, UsuarioID e DoacaoID são a POSIÇÃO (1, 2, ...) do registro na lista. Aqui eles são trocados pelos
// ids reais devolvidos pelo repositório, porque no banco o id vem da sequência e não é necessariamente 1, 2, ...
func InserirDados() {
	idsUsuarios := make([]uint64, 0, len(usuarios))
	for _, usuario := range usuarios {
		// as contas de exemplo também registram o aceite dos termos (obrigatório no cadastro)
		usuario.AceiteTermos = true

		err := usuario.Preparar("cadastro")
		if err != nil {
			log.Fatal(err)
		}

		criado, err := repo_usuario.UsuarioRepo.Criar(&usuario)
		if err != nil {
			log.Fatal(err)
		}
		idsUsuarios = append(idsUsuarios, criado.ID)
	}

	idsDoacoes := make([]uint64, 0, len(doacoes))
	for i := range doacoes {
		endereco, err := repo_endereco.EnderecoRepo.Criar(&enderecos[i])
		if err != nil {
			log.Fatal(err)
		}
		doacoes[i].EnderecoID = endereco.ID
		doacoes[i].UsuarioID = idsUsuarios[doacoes[i].UsuarioID-1]

		doacao, err := repo_doacao.DoacaoRepo.Criar(&doacoes[i])
		if err != nil {
			log.Fatal(err)
		}
		idsDoacoes = append(idsDoacoes, doacao.ID)

		// todo anúncio nasce "disponivel"; se o seed já está em outro status, registra a mudança também
		historico := []string{models.DoacaoDisponivel}
		if doacao.Status != models.DoacaoDisponivel {
			historico = append(historico, doacao.Status)
		}
		for _, status := range historico {
			registro := models.HistoricoDeListagem{DoacaoID: doacao.ID, Status: status}
			if _, err = repo_historico.HistoricoRepo.Criar(&registro); err != nil {
				log.Fatal(err)
			}
		}
	}

	for i := range imagens {
		imagens[i].DoacaoID = idsDoacoes[imagens[i].DoacaoID-1]
		if _, err := repo_imagem.ImagemRepo.Criar(&imagens[i]); err != nil {
			log.Fatal(err)
		}
	}

	for i := range solicitacoes {
		solicitacoes[i].DoacaoID = idsDoacoes[solicitacoes[i].DoacaoID-1]
		solicitacoes[i].UsuarioID = idsUsuarios[solicitacoes[i].UsuarioID-1]
		if _, err := repo_solicitacao.SolicitacaoRepo.Criar(&solicitacoes[i]); err != nil {
			log.Fatal(err)
		}
	}
}
