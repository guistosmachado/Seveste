package repo_endereco

import "seveste-api/src/models"

// EnderecoRepositorio cuida das tabelas Endereco e Cidade. Criar resolve o id_cidade pelo nome
// (cria a cidade se ela ainda não existir).
type EnderecoRepositorio interface {
	Criar(endereco *models.Endereco) (*models.Endereco, error)
	BuscarPorID(ID uint64) (*models.Endereco, error)
	Deletar(ID uint64) error
}

var EnderecoRepo EnderecoRepositorio
