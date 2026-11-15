// Package database concentra a conexão com o PostgreSQL e o que é comum aos repositórios.
// Usa somente o pacote padrão database/sql; o driver github.com/lib/pq entra apenas pelo import em branco abaixo.
package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq" // registra o driver "postgres" no database/sql
)

// Conectar abre o pool de conexões e confirma que o banco responde.
// A url tem o formato postgres://usuario:senha@host:5432/seveste_db?sslmode=disable
func Conectar(url string) (*sql.DB, error) {
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err = db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("nao foi possivel conectar ao banco de dados: %w", err)
	}

	return db, nil
}

// Executor é o que *sql.DB e *sql.Tx têm em comum: o mesmo código roda dentro ou fora de uma transação.
type Executor interface {
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
}

// Scanner é o que *sql.Row e *sql.Rows têm em comum.
type Scanner interface {
	Scan(dest ...any) error
}

// BuscarOuCriarCidade devolve o id da cidade pelo nome (sem diferenciar maiúsculas), criando-a se não existir.
// Depende do índice único uq_cities_name do setup.sql.
func BuscarOuCriarCidade(q Executor, nome string) (uint64, error) {
	var id uint64

	err := q.QueryRow(
		`INSERT INTO cities (name) VALUES ($1)
		 ON CONFLICT (lower(name)) DO UPDATE SET name = cities.name
		 RETURNING id`, nome,
	).Scan(&id)

	return id, err
}
