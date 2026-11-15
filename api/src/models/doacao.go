package models

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	DoacaoDisponivel = "disponivel"
	DoacaoReservada  = "reservada"
	DoacaoConcluida  = "concluida"
)

var tiposDeEntrega = []string{"retirada", "entrega", "a_combinar"}
var statusDeDoacao = []string{DoacaoDisponivel, DoacaoReservada, DoacaoConcluida}

type Doacao struct {
	ID            uint64    `json:"id_doacao"`
	Titulo        string    `json:"titulo"`
	Descricao     string    `json:"descricao"`
	Categoria     string    `json:"categoria"`
	Tamanho       string    `json:"tamanho"`
	Estado        string    `json:"estado"` // coluna "condicao" no banco
	TipoDeEntrega string    `json:"tipo_de_entrega"`
	Status        string    `json:"status"`
	CriadoEm      time.Time `json:"criado_em"`
	AtualizadoEm  time.Time `json:"atualizado_em"`

	UsuarioID  uint64 `json:"id_usuario"`
	EnderecoID uint64 `json:"id_endereco"`

	// preenchidos na resposta, não ficam na tabela Doacao
	Endereco *Endereco      `json:"endereco,omitempty"`
	Imagens  []DoacaoImagem `json:"imagens,omitempty"`
}

type AtualizacaoDoacao struct {
	Titulo        *string `json:"titulo"`
	Descricao     *string `json:"descricao"`
	Categoria     *string `json:"categoria"`
	Tamanho       *string `json:"tamanho"`
	Estado        *string `json:"estado"`
	TipoDeEntrega *string `json:"tipo_de_entrega"`
}

func (d *Doacao) Preparar() error {
	d.formatar()

	return d.validar()
}

// remove todos os espaços vazios no começo e final de strings
func (d *Doacao) formatar() {
	d.Titulo = strings.TrimSpace(d.Titulo)
	d.Descricao = strings.TrimSpace(d.Descricao)
	d.Categoria = strings.TrimSpace(d.Categoria)
	d.Tamanho = strings.TrimSpace(d.Tamanho)
	d.Estado = strings.TrimSpace(d.Estado)
	d.TipoDeEntrega = strings.ToLower(strings.TrimSpace(d.TipoDeEntrega))
	d.Status = strings.ToLower(strings.TrimSpace(d.Status))
}

// valida campos obrigatórios, valores permitidos e os limites de tamanho do banco
func (d *Doacao) validar() error {
	if d.Titulo == "" || d.Descricao == "" || d.Categoria == "" || d.Tamanho == "" || d.Estado == "" || d.TipoDeEntrega == "" || d.Status == "" {
		return errors.New("todos os campos sao obrigatorios e devem ser preenchidos")
	}

	if !slices.Contains(tiposDeEntrega, d.TipoDeEntrega) {
		return fmt.Errorf("tipo_de_entrega invalido, permitidos: %s", strings.Join(tiposDeEntrega, ", "))
	}

	if !slices.Contains(statusDeDoacao, d.Status) {
		return fmt.Errorf("status invalido para a doacao, permitidos: %s", strings.Join(statusDeDoacao, ", "))
	}

	limites := []struct {
		nome  string
		valor string
		max   int
	}{
		{"titulo", d.Titulo, 150},
		{"descricao", d.Descricao, 400},
		{"categoria", d.Categoria, 50},
		{"tamanho", d.Tamanho, 20},
		{"estado", d.Estado, 40},
	}
	for _, l := range limites {
		if utf8.RuneCountInString(l.valor) > l.max {
			return fmt.Errorf("o campo '%s' deve ter no maximo %d caracteres", l.nome, l.max)
		}
	}

	return nil
}

// altera os dados da doação se eles forem válidos
func (d *Doacao) Mesclar(dados AtualizacaoDoacao) error {
	campos := []struct {
		destino *string
		novo    *string
		rotulo  string
	}{
		{&d.Titulo, dados.Titulo, "titulo"},
		{&d.Descricao, dados.Descricao, "descricao"},
		{&d.Categoria, dados.Categoria, "categoria"},
		{&d.Tamanho, dados.Tamanho, "tamanho"},
		{&d.Estado, dados.Estado, "estado"},
		{&d.TipoDeEntrega, dados.TipoDeEntrega, "tipo_de_entrega"},
	}

	alteracaoFeita := false
	for _, campo := range campos {
		if campo.novo == nil {
			continue
		}

		valor := strings.TrimSpace(*campo.novo)
		if valor == "" {
			return fmt.Errorf("o campo '%s' nao pode estar vazio", campo.rotulo)
		}

		*campo.destino = valor
		alteracaoFeita = true
	}

	if !alteracaoFeita {
		return errors.New("nenhum dado fornecido para atualizacao")
	}

	d.formatar()

	return d.validar()
}
