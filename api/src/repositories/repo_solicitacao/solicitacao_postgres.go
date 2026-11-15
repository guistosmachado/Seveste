package repo_solicitacao

import (
	"database/sql"
	"errors"
	"seveste-api/src/database"
	"seveste-api/src/models"

	"github.com/lib/pq"
)

type RepositorioPostgresSolicitacao struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresSolicitacao {
	return &RepositorioPostgresSolicitacao{db: db}
}

var errSolicitacaoNaoEncontrada = errors.New("solicitacao nao encontrada")

const colunasSolicitacao = `id, status, created_at, donation_id, user_id`

func escanearSolicitacao(s database.Scanner) (models.Solicitacao, error) {
	var sol models.Solicitacao

	err := s.Scan(&sol.ID, &sol.Status, &sol.CriadoEm, &sol.DoacaoID, &sol.UsuarioID)

	return sol, err
}

// os índices únicos parciais do setup.sql impedem solicitação ativa duplicada e duas solicitações aceitas na mesma doação
func traduzirErro(err error) error {
	var erroPg *pq.Error
	if errors.As(err, &erroPg) && erroPg.Code == "23505" {
		return errors.New("ja existe uma solicitacao ativa ou aceita em conflito para esta doacao")
	}

	return err
}

func (r *RepositorioPostgresSolicitacao) listar(coluna string, valor uint64) ([]models.Solicitacao, error) {
	linhas, err := r.db.Query(`SELECT `+colunasSolicitacao+` FROM requests WHERE `+coluna+` = $1 ORDER BY id`, valor)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	solicitacoes := make([]models.Solicitacao, 0)
	for linhas.Next() {
		sol, err := escanearSolicitacao(linhas)
		if err != nil {
			return nil, err
		}
		solicitacoes = append(solicitacoes, sol)
	}

	return solicitacoes, linhas.Err()
}

func (r *RepositorioPostgresSolicitacao) Criar(s *models.Solicitacao) (*models.Solicitacao, error) {
	err := r.db.QueryRow(
		`INSERT INTO requests (user_id, donation_id, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id`,
		s.UsuarioID, s.DoacaoID, s.Status, s.CriadoEm,
	).Scan(&s.ID)
	if err != nil {
		return nil, traduzirErro(err)
	}

	return s, nil
}

func (r *RepositorioPostgresSolicitacao) BuscarPorID(solicitacaoID uint64) (*models.Solicitacao, error) {
	sol, err := escanearSolicitacao(r.db.QueryRow(`SELECT `+colunasSolicitacao+` FROM requests WHERE id = $1`, solicitacaoID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errSolicitacaoNaoEncontrada
	}
	if err != nil {
		return nil, err
	}

	return &sol, nil
}

func (r *RepositorioPostgresSolicitacao) BuscarPorDoacaoID(doacaoID uint64) ([]models.Solicitacao, error) {
	return r.listar("donation_id", doacaoID)
}

func (r *RepositorioPostgresSolicitacao) BuscarPorUsuarioID(usuarioID uint64) ([]models.Solicitacao, error) {
	return r.listar("user_id", usuarioID)
}

func (r *RepositorioPostgresSolicitacao) Salvar(solicitacaoID uint64, nova *models.Solicitacao) (*models.Solicitacao, error) {
	resultado, err := r.db.Exec(`UPDATE requests SET status = $1 WHERE id = $2`, nova.Status, solicitacaoID)
	if err != nil {
		return nil, traduzirErro(err)
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return nil, errSolicitacaoNaoEncontrada
	}

	return nova, nil
}

func (r *RepositorioPostgresSolicitacao) Deletar(solicitacaoID uint64) error {
	resultado, err := r.db.Exec(`DELETE FROM requests WHERE id = $1`, solicitacaoID)
	if err != nil {
		return err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return errSolicitacaoNaoEncontrada
	}

	return nil
}
