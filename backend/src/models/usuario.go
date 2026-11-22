package models

import (
	"errors"
	"fmt"
	"seveste-api/src/seguranca"
	"slices"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	TipoDoador   string = "doador"
	TipoAcolhido string = "acolhido"
)

// versão atual dos Termos de Uso e da Política de Privacidade (atualizar junto com as páginas /terms-of-use e /privacy-policy do front)
const VersaoTermosAtual string = "2026-11"

type Usuario struct {
	ID       uint64 `json:"id_usuario"`
	Nome     string `json:"nome" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Senha    string `json:"senha,omitempty" binding:"required"`
	Telefone string `json:"telefone"`
	UF       string `json:"uf" binding:"required"`
	Cidade   string `json:"cidade" binding:"required"`
	Tipo     string `json:"tipo" binding:"required"`

	RoupasProcuradas []string `json:"roupas_procuradas"`
	TamanhoRoupa     string   `json:"tamanho_roupa"`
	TamanhoCalcado   uint8    `json:"tamanho_calcado"`

	// LGPD: o cadastro só é aceito com o aceite dos Termos de Uso e da Política de Privacidade.
	// AceiteTermos vem do formulário de cadastro; a data e a versão aceitas ficam gravadas no banco.
	AceiteTermos   bool      `json:"aceite_termos,omitempty"`
	AceiteTermosEm time.Time `json:"aceite_termos_em"`
	VersaoTermos   string    `json:"versao_termos"`
}

type AtualizacaoUsuario struct {
	Nome     *string `json:"nome"`
	Telefone *string `json:"telefone"`
	UF       *string `json:"uf"`
	Cidade   *string `json:"cidade"`
}

// formata os campos e valida se eles estão corretos
func (u *Usuario) Preparar(etapa string) error {
	if err := u.formatar(etapa); err != nil {
		return err
	}

	if err := u.validar(etapa); err != nil {
		return err
	}

	return nil
}

// Tira todos os espaços em volta dos campos, necessário porque mesmo com a binding required, ele ainda
// considera " " como preenchido
func (u *Usuario) formatar(etapa string) error {
	u.Nome = strings.TrimSpace(u.Nome)
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	u.Senha = strings.TrimSpace(u.Senha)
	u.Telefone = strings.TrimSpace(u.Telefone)
	u.UF = strings.TrimSpace(u.UF)
	u.Cidade = strings.TrimSpace(u.Cidade)
	u.Tipo = strings.TrimSpace(u.Tipo)
	u.Tipo = strings.ToLower(u.Tipo)

	for index, s := range u.RoupasProcuradas {
		s = strings.TrimSpace(s)
		u.RoupasProcuradas[index] = s
	}

	if etapa == "cadastro" {
		hash, err := seguranca.Hash(u.Senha)
		if err != nil {
			return err
		}

		u.Senha = string(hash)
	}

	return nil
}

// Valida se os campos obrigatórios estão preenchidos e se o tipo de usuário é um dos tipos aceitados
func (u *Usuario) validar(etapa string) error {
	if (u.Nome == "") || (u.UF == "") || (u.Cidade == "") || (u.Tipo == "") {
		return errors.New("todos os campos obrigatorios devem ser preenchidos")
	}

	if len(u.UF) != 2 {
		return errors.New("o campo 'uf' deve ter exatamente 2 caracteres")
	}

	if etapa == "cadastro" && u.Senha == "" {
		return errors.New("a senha e obrigatoria e deve ser preenchida")
	}

	if etapa == "cadastro" {
		if !u.AceiteTermos {
			return errors.New("e necessario aceitar os termos de uso e a politica de privacidade")
		}

		// registra o momento do aceite e a versão aceita (o que vier do cliente nesses campos é ignorado)
		u.AceiteTermosEm = time.Now()
		u.VersaoTermos = VersaoTermosAtual
	}

	if u.Tipo != TipoDoador && u.Tipo != TipoAcolhido {
		return errors.New("tipo de usuario invalido. por favor selecione um tipo valido")
	}

	if u.Tipo == TipoAcolhido {
		if u.TamanhoRoupa == "" {
			return errors.New("o tamanho da roupa e obrigatorio e deve ser preenchido")
		}
		if u.TamanhoCalcado == 0 {
			return errors.New("o tamanho do calcado e obrigatorio e deve ser preenchido")
		}

		roupasSemVazias := slices.DeleteFunc(u.RoupasProcuradas, func(s string) bool {
			return s == ""
		})
		if len(roupasSemVazias) <= 0 {
			return errors.New("pelo menos uma roupa deve ser selecionada")
		}

		u.RoupasProcuradas = roupasSemVazias
	}

	return u.validarTamanhos()
}

// respeita o tamanho das colunas da tabela users (e cities / recipient_profiles) para o banco nunca recusar o dado
func (u *Usuario) validarTamanhos() error {
	limites := []struct {
		nome  string
		valor string
		max   int
	}{
		{"nome", u.Nome, 100},
		{"email", u.Email, 150},
		{"telefone", u.Telefone, 20},
		{"cidade", u.Cidade, 200},
		{"tamanho_roupa", u.TamanhoRoupa, 10},
	}
	for _, l := range limites {
		if utf8.RuneCountInString(l.valor) > l.max {
			return fmt.Errorf("o campo '%s' deve ter no maximo %d caracteres", l.nome, l.max)
		}
	}

	return nil
}

// altera dos dados do usuário se eles forem válidos
func (u *Usuario) Mesclar(dados AtualizacaoUsuario) error {
	alteracaoFeita := false

	if dados.Nome != nil {
		nome := strings.TrimSpace(*dados.Nome)
		if nome == "" {
			return errors.New("o campo 'nome' nao pode estar vazio")
		}
		u.Nome = nome
		alteracaoFeita = true
	}

	if dados.Telefone != nil {
		u.Telefone = strings.TrimSpace(*dados.Telefone)
		alteracaoFeita = true
	}

	if dados.UF != nil {
		uf := strings.ToUpper(strings.TrimSpace(*dados.UF))
		if len(uf) != 2 {
			return errors.New("o campo 'uf' deve conter exatamente 2 caracteres")
		}
		u.UF = uf
		alteracaoFeita = true
	}

	if dados.Cidade != nil {
		cidade := strings.TrimSpace(*dados.Cidade)
		if cidade == "" {
			return errors.New("o campo 'cidade' nao pode estar vazio")
		}
		u.Cidade = cidade
		alteracaoFeita = true
	}

	if !alteracaoFeita {
		return errors.New("nenhum dado fornecido para atualizacao")
	}

	return u.validarTamanhos()
}

// SemSenha devolve uma cópia do usuário sem o hash da senha, para uso em qualquer resposta da API
func (u Usuario) SemSenha() Usuario {
	u.Senha = ""

	return u
}

// UsuarioPublico é o que qualquer pessoa pode ver de um usuário: nada de contato, senha ou preferências pessoais
type UsuarioPublico struct {
	ID     uint64 `json:"id_usuario"`
	Nome   string `json:"nome"`
	Tipo   string `json:"tipo"`
	UF     string `json:"uf"`
	Cidade string `json:"cidade"`
}

func (u Usuario) Publico() UsuarioPublico {
	return UsuarioPublico{ID: u.ID, Nome: u.Nome, Tipo: u.Tipo, UF: u.UF, Cidade: u.Cidade}
}
