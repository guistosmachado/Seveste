package repo_usuario

import (
	"database/sql"
	"errors"
	"seveste-api/src/database"
	"seveste-api/src/models"
	"strings"

	"github.com/lib/pq"
)

type RepositorioPostgresUsuario struct {
	db *sql.DB
}

func NovoRepositorioPostgres(db *sql.DB) *RepositorioPostgresUsuario {
	return &RepositorioPostgresUsuario{db: db}
}

var errUsuarioNaoEncontrado = errors.New("usuario nao encontrado")

// monta o usuário completo juntando users, cities, user_types e (só para acolhidos) recipient_profiles
const consultaUsuario = `
SELECT u.id, u.name, u.email, u.password_hash, COALESCE(u.phone, ''), u.state, c.name, t.type,
       COALESCE(rp.clothing_size, ''), COALESCE(rp.shoe_size, 0), rp.wanted_items,
       u.terms_accepted_at, u.terms_version
FROM users u
JOIN cities c ON c.id = u.city_id
JOIN user_types t ON t.id = u.user_type_id
LEFT JOIN recipient_profiles rp ON rp.user_id = u.id`

func escanearUsuario(s database.Scanner) (*models.Usuario, error) {
	var u models.Usuario

	err := s.Scan(&u.ID, &u.Nome, &u.Email, &u.Senha, &u.Telefone, &u.UF, &u.Cidade, &u.Tipo,
		&u.TamanhoRoupa, &u.TamanhoCalcado, pq.Array(&u.RoupasProcuradas),
		&u.AceiteTermosEm, &u.VersaoTermos)
	if err != nil {
		return nil, err
	}

	return &u, nil
}

func (r *RepositorioPostgresUsuario) buscarUm(filtro string, args ...any) (*models.Usuario, error) {
	usuario, err := escanearUsuario(r.db.QueryRow(consultaUsuario+filtro, args...))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errUsuarioNaoEncontrado
	}

	return usuario, err
}

func (r *RepositorioPostgresUsuario) listar(filtro string, args ...any) ([]models.Usuario, error) {
	linhas, err := r.db.Query(consultaUsuario+filtro+" ORDER BY u.id", args...)
	if err != nil {
		return nil, err
	}
	defer linhas.Close()

	lista := make([]models.Usuario, 0)
	for linhas.Next() {
		usuario, err := escanearUsuario(linhas)
		if err != nil {
			return nil, err
		}
		lista = append(lista, *usuario)
	}

	return lista, linhas.Err()
}

// a única restrição UNIQUE da tabela users é o e-mail
func traduzirErro(err error) error {
	var erroPg *pq.Error
	if errors.As(err, &erroPg) && erroPg.Code == "23505" {
		return errors.New("ja existe um usuario cadastrado com este email")
	}

	return err
}

func salvarPerfil(q database.Executor, u *models.Usuario) error {
	itens := u.RoupasProcuradas
	if itens == nil {
		itens = []string{}
	}

	_, err := q.Exec(
		`INSERT INTO recipient_profiles (user_id, clothing_size, shoe_size, wanted_items)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (user_id) DO UPDATE
		 SET clothing_size = EXCLUDED.clothing_size, shoe_size = EXCLUDED.shoe_size, wanted_items = EXCLUDED.wanted_items`,
		u.ID, u.TamanhoRoupa, u.TamanhoCalcado, pq.Array(itens),
	)

	return err
}

func (r *RepositorioPostgresUsuario) Criar(u *models.Usuario) (*models.Usuario, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	cidadeID, err := database.BuscarOuCriarCidade(tx, u.Cidade)
	if err != nil {
		return nil, err
	}

	var tipoID int
	if err = tx.QueryRow(`SELECT id FROM user_types WHERE type = $1`, u.Tipo).Scan(&tipoID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("tipo de usuario invalido")
		}
		return nil, err
	}

	err = tx.QueryRow(
		`INSERT INTO users (name, email, password_hash, phone, state, city_id, user_type_id, terms_accepted_at, terms_version)
		 VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9)
		 RETURNING id`,
		u.Nome, u.Email, u.Senha, u.Telefone, u.UF, cidadeID, tipoID, u.AceiteTermosEm, u.VersaoTermos,
	).Scan(&u.ID)
	if err != nil {
		return nil, traduzirErro(err)
	}

	if u.Tipo == models.TipoAcolhido {
		if err = salvarPerfil(tx, u); err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return u, nil
}

func (r *RepositorioPostgresUsuario) BuscarTodos() ([]models.Usuario, error) {
	return r.listar("")
}

func (r *RepositorioPostgresUsuario) BuscarPorID(ID uint64) (*models.Usuario, error) {
	return r.buscarUm(" WHERE u.id = $1", ID)
}

func (r *RepositorioPostgresUsuario) BuscarPorTipo(tipo string) ([]models.Usuario, error) {
	return r.listar(" WHERE t.type = $1", tipo)
}

func (r *RepositorioPostgresUsuario) BuscarPorEmail(email string) (*models.Usuario, error) {
	return r.buscarUm(" WHERE u.email = $1", strings.ToLower(strings.TrimSpace(email)))
}

func (r *RepositorioPostgresUsuario) Salvar(ID uint64, novo *models.Usuario) (*models.Usuario, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	cidadeID, err := database.BuscarOuCriarCidade(tx, novo.Cidade)
	if err != nil {
		return nil, err
	}

	resultado, err := tx.Exec(
		`UPDATE users
		 SET name = $1, email = $2, password_hash = $3, phone = NULLIF($4, ''), state = $5, city_id = $6, updated_at = now()
		 WHERE id = $7`,
		novo.Nome, novo.Email, novo.Senha, novo.Telefone, novo.UF, cidadeID, ID,
	)
	if err != nil {
		return nil, traduzirErro(err)
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return nil, errUsuarioNaoEncontrado
	}

	novo.ID = ID
	if novo.Tipo == models.TipoAcolhido {
		if err = salvarPerfil(tx, novo); err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return novo, nil
}

// o ON DELETE CASCADE do banco apaga também perfil, doações e solicitações do usuário
func (r *RepositorioPostgresUsuario) Deletar(ID uint64) error {
	resultado, err := r.db.Exec(`DELETE FROM users WHERE id = $1`, ID)
	if err != nil {
		return err
	}

	if afetadas, _ := resultado.RowsAffected(); afetadas == 0 {
		return errUsuarioNaoEncontrado
	}

	return nil
}
