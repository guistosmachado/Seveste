package models

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"
)

// Endereco espelha as tabelas Endereco + Cidade do banco. A cidade é enviada pelo nome e o
// repositório resolve (ou cria) o id_cidade.
type Endereco struct {
	ID          uint64 `json:"id_endereco"`
	Rua         string `json:"rua"`
	Numero      string `json:"numero"`
	UF          string `json:"uf"`
	Complemento string `json:"complemento,omitempty"`
	CidadeID    uint64 `json:"id_cidade"`
	Cidade      string `json:"cidade"`
}

// formata os campos e valida os limites definidos no banco (rua 400, numero 20, uf 2, complemento 100, cidade 200)
func (e *Endereco) Preparar() error {
	e.Rua = strings.TrimSpace(e.Rua)
	e.Numero = strings.TrimSpace(e.Numero)
	e.UF = strings.ToUpper(strings.TrimSpace(e.UF))
	e.Complemento = strings.TrimSpace(e.Complemento)
	e.Cidade = strings.TrimSpace(e.Cidade)

	if e.Rua == "" || e.Numero == "" || e.UF == "" || e.Cidade == "" {
		return errors.New("rua, numero, uf e cidade do endereco sao obrigatorios")
	}

	if utf8.RuneCountInString(e.UF) != 2 {
		return errors.New("o campo 'uf' deve ter exatamente 2 caracteres")
	}

	limites := []struct {
		nome  string
		valor string
		max   int
	}{
		{"rua", e.Rua, 400},
		{"numero", e.Numero, 20},
		{"complemento", e.Complemento, 100},
		{"cidade", e.Cidade, 200},
	}
	for _, l := range limites {
		if utf8.RuneCountInString(l.valor) > l.max {
			return fmt.Errorf("o campo '%s' deve ter no maximo %d caracteres", l.nome, l.max)
		}
	}

	return nil
}

// Publico devolve uma cópia sem os dados que identificam a casa (rua, numero e complemento).
// É o que qualquer pessoa pode ver na listagem; o endereço completo só vai para o dono e para quem teve a solicitação aceita.
func (e Endereco) Publico() Endereco {
	return Endereco{ID: e.ID, UF: e.UF, CidadeID: e.CidadeID, Cidade: e.Cidade}
}
