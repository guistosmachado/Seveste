package repo_historico

import "seveste-api/src/models"

type HistoricoRepositorio interface {
	Criar(registro *models.HistoricoDeListagem) (*models.HistoricoDeListagem, error)
	// devolve o histórico em ordem cronológica
	BuscarPorDoacaoID(doacaoID uint64) ([]models.HistoricoDeListagem, error)
	DeletarPorDoacaoID(doacaoID uint64) error
}

var HistoricoRepo HistoricoRepositorio
