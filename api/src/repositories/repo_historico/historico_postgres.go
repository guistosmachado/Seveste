package repo_historico

import (
	"database/sql"
	"seveste-api/src/models"
)

type RepositorioPostgresHistorico struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresHistorico {
	return &RepositorioPostgresHistorico{db: db}
}

func (r *RepositorioPostgresHistorico) Criar(h *models.HistoricoDeListagem) (*models.HistoricoDeListagem, error) {
	err := r.db.QueryRow(
		`INSERT INTO listing_histories (donation_id, status) VALUES ($1, $2) RETURNING id, created_at`,
		h.DoacaoID, h.Status,
	).Scan(&h.ID, &h.CriadoEm)
	if err != nil {
		return nil, err
	}

	return h, nil
}

func (r *RepositorioPostgresHistorico) BuscarPorDoacaoID(doacaoID uint64) ([]models.HistoricoDeListagem, error) {
	linhas, err := r.db.Query(
		`SELECT id, donation_id, status, created_at FROM listing_histories WHERE donation_id = $1 ORDER BY id`, doacaoID,
	)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	historico := make([]models.HistoricoDeListagem, 0)
	for linhas.Next() {
		var h models.HistoricoDeListagem
		if err = linhas.Scan(&h.ID, &h.DoacaoID, &h.Status, &h.CriadoEm); err != nil {
			return nil, err
		}
		historico = append(historico, h)
	}

	return historico, linhas.Err()
}

func (r *RepositorioPostgresHistorico) DeletarPorDoacaoID(doacaoID uint64) error {
	_, err := r.db.Exec(`DELETE FROM listing_histories WHERE donation_id = $1`, doacaoID)

	return err
}
