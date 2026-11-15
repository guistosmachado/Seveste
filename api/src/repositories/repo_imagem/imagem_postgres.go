package repo_imagem

import (
	"database/sql"
	"errors"
	"seveste-api/src/database"
	"seveste-api/src/models"
)

type RepositorioPostgresImagem struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresImagem {
	return &RepositorioPostgresImagem{db: db}
}

var errImagemNaoEncontrada = errors.New("imagem nao encontrada")

const colunasImagem = `id, donation_id, position, is_cover, url, created_at`

func escanearImagem(s database.Scanner) (models.DoacaoImagem, error) {
	var i models.DoacaoImagem

	err := s.Scan(&i.ID, &i.DoacaoID, &i.Posicao, &i.Capa, &i.URL, &i.CriadoEm)

	return i, err
}

func (r *RepositorioPostgresImagem) Criar(i *models.DoacaoImagem) (*models.DoacaoImagem, error) {
	err := r.db.QueryRow(
		`INSERT INTO donation_images (donation_id, position, is_cover, url)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, created_at`,
		i.DoacaoID, i.Posicao, i.Capa, i.URL,
	).Scan(&i.ID, &i.CriadoEm)
	if err != nil {
		return nil, err
	}

	return i, nil
}

func (r *RepositorioPostgresImagem) BuscarPorID(ID uint64) (*models.DoacaoImagem, error) {
	imagem, err := escanearImagem(r.db.QueryRow(`SELECT `+colunasImagem+` FROM donation_images WHERE id = $1`, ID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errImagemNaoEncontrada
	}
	if err != nil {
		return nil, err
	}

	return &imagem, nil
}

func (r *RepositorioPostgresImagem) BuscarPorDoacaoID(doacaoID uint64) ([]models.DoacaoImagem, error) {
	linhas, err := r.db.Query(
		`SELECT `+colunasImagem+` FROM donation_images WHERE donation_id = $1 ORDER BY position, id`, doacaoID,
	)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	imagens := make([]models.DoacaoImagem, 0)
	for linhas.Next() {
		imagem, err := escanearImagem(linhas)
		if err != nil {
			return nil, err
		}
		imagens = append(imagens, imagem)
	}

	return imagens, linhas.Err()
}

func (r *RepositorioPostgresImagem) Salvar(ID uint64, nova *models.DoacaoImagem) (*models.DoacaoImagem, error) {
	resultado, err := r.db.Exec(
		`UPDATE donation_images SET position = $1, is_cover = $2, url = $3 WHERE id = $4`,
		nova.Posicao, nova.Capa, nova.URL, ID,
	)
	if err != nil {
		return nil, err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return nil, errImagemNaoEncontrada
	}

	return nova, nil
}

func (r *RepositorioPostgresImagem) Deletar(ID uint64) error {
	resultado, err := r.db.Exec(`DELETE FROM donation_images WHERE id = $1`, ID)
	if err != nil {
		return err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return errImagemNaoEncontrada
	}

	return nil
}
