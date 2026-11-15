package repo_doacao

import (
	"database/sql"
	"errors"
	"seveste-api/src/database"
	"seveste-api/src/models"
)

type RepositorioPostgresDoacao struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresDoacao {
	return &RepositorioPostgresDoacao{db: db}
}

var errDoacaoNaoEncontrada = errors.New("doacao nao encontrada")

const colunasDoacao = `id, user_id, address_id, title, description, category, size, condition, delivery_type, status, created_at, updated_at`

func escanearDoacao(s database.Scanner) (models.Doacao, error) {
	var d models.Doacao

	err := s.Scan(&d.ID, &d.UsuarioID, &d.EnderecoID, &d.Titulo, &d.Descricao, &d.Categoria, &d.Tamanho,
		&d.Estado, &d.TipoDeEntrega, &d.Status, &d.CriadoEm, &d.AtualizadoEm)

	return d, err
}

func (r *RepositorioPostgresDoacao) listar(filtro string, args ...any) ([]models.Doacao, error) {
	linhas, err := r.db.Query(`SELECT `+colunasDoacao+` FROM donations`+filtro+` ORDER BY id`, args...)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	doacoes := make([]models.Doacao, 0)
	for linhas.Next() {
		doacao, err := escanearDoacao(linhas)
		if err != nil {
			return nil, err
		}
		doacoes = append(doacoes, doacao)
	}

	return doacoes, linhas.Err()
}

func (r *RepositorioPostgresDoacao) Criar(d *models.Doacao) (*models.Doacao, error) {
	err := r.db.QueryRow(
		`INSERT INTO donations (user_id, address_id, title, description, category, size, condition, delivery_type, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, created_at, updated_at`,
		d.UsuarioID, d.EnderecoID, d.Titulo, d.Descricao, d.Categoria, d.Tamanho, d.Estado, d.TipoDeEntrega, d.Status,
	).Scan(&d.ID, &d.CriadoEm, &d.AtualizadoEm)
	if err != nil {
		return nil, err
	}

	return d, nil
}

func (r *RepositorioPostgresDoacao) BuscarTodas() ([]models.Doacao, error) {
	return r.listar("")
}

func (r *RepositorioPostgresDoacao) BuscarPorUsuarioID(usuarioID uint64) ([]models.Doacao, error) {
	return r.listar(" WHERE user_id = $1", usuarioID)
}

func (r *RepositorioPostgresDoacao) BuscarPorID(ID uint64) (*models.Doacao, error) {
	doacao, err := escanearDoacao(r.db.QueryRow(`SELECT `+colunasDoacao+` FROM donations WHERE id = $1`, ID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errDoacaoNaoEncontrada
	}
	if err != nil {
		return nil, err
	}

	return &doacao, nil
}

func (r *RepositorioPostgresDoacao) Salvar(ID uint64, nova *models.Doacao) (*models.Doacao, error) {
	err := r.db.QueryRow(
		`UPDATE donations
		 SET address_id = $1, title = $2, description = $3, category = $4, size = $5,
		     condition = $6, delivery_type = $7, status = $8, updated_at = now()
		 WHERE id = $9
		 RETURNING updated_at`,
		nova.EnderecoID, nova.Titulo, nova.Descricao, nova.Categoria, nova.Tamanho,
		nova.Estado, nova.TipoDeEntrega, nova.Status, ID,
	).Scan(&nova.AtualizadoEm)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errDoacaoNaoEncontrada
	}
	if err != nil {
		return nil, err
	}

	return nova, nil
}

// o ON DELETE CASCADE do banco apaga também imagens, solicitações e histórico da doação
func (r *RepositorioPostgresDoacao) Deletar(ID uint64) error {
	resultado, err := r.db.Exec(`DELETE FROM donations WHERE id = $1`, ID)
	if err != nil {
		return err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return errDoacaoNaoEncontrada
	}

	return nil
}
