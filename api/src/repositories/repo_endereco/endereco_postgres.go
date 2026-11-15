package repo_endereco

import (
	"database/sql"
	"errors"
	"seveste-api/src/database"
	"seveste-api/src/models"
)

type RepositorioPostgresEndereco struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresEndereco {
	return &RepositorioPostgresEndereco{db: db}
}

var errEnderecoNaoEncontrado = errors.New("endereco nao encontrado")

// Criar resolve a cidade (cria se não existir) e grava o endereço na mesma transação
func (r *RepositorioPostgresEndereco) Criar(e *models.Endereco) (*models.Endereco, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	cidadeID, err := database.BuscarOuCriarCidade(tx, e.Cidade)
	if err != nil {
		return nil, err
	}

	err = tx.QueryRow(
		`INSERT INTO addresses (address_line1, number, state, complement, city_id)
		 VALUES ($1, $2, $3, NULLIF($4, ''), $5)
		 RETURNING id`,
		e.Rua, e.Numero, e.UF, e.Complemento, cidadeID,
	).Scan(&e.ID)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	e.CidadeID = cidadeID

	return e, nil
}

func (r *RepositorioPostgresEndereco) BuscarPorID(ID uint64) (*models.Endereco, error) {
	var e models.Endereco

	err := r.db.QueryRow(
		`SELECT a.id, a.address_line1, COALESCE(a.number, ''), a.state, COALESCE(a.complement, ''), a.city_id, c.name
		 FROM addresses a
		 JOIN cities c ON c.id = a.city_id
		 WHERE a.id = $1`, ID,
	).Scan(&e.ID, &e.Rua, &e.Numero, &e.UF, &e.Complemento, &e.CidadeID, &e.Cidade)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errEnderecoNaoEncontrado
	}
	if err != nil {
		return nil, err
	}

	return &e, nil
}

func (r *RepositorioPostgresEndereco) Deletar(ID uint64) error {
	resultado, err := r.db.Exec(`DELETE FROM addresses WHERE id = $1`, ID)
	if err != nil {
		return err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return errEnderecoNaoEncontrado
	}

	return nil
}
