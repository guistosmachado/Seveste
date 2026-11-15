package repo_imagem

import "seveste-api/src/models"

type ImagemRepositorio interface {
	Criar(imagem *models.DoacaoImagem) (*models.DoacaoImagem, error)
	BuscarPorID(ID uint64) (*models.DoacaoImagem, error)
	// devolve as imagens ordenadas por posição
	BuscarPorDoacaoID(doacaoID uint64) ([]models.DoacaoImagem, error)
	Salvar(ID uint64, nova *models.DoacaoImagem) (*models.DoacaoImagem, error)
	Deletar(ID uint64) error
}

var ImagemRepo ImagemRepositorio
