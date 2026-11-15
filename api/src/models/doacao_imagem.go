package models

import (
	"errors"
	"net/url"
	"time"
	"unicode/utf8"
	"strings"
)

// o formulário de anúncio aceita no máximo 4 fotos
const MaxImagensPorDoacao = 4

type DoacaoImagem struct {
	ID       uint64    `json:"id_doacao_imagem"`
	DoacaoID uint64    `json:"id_doacao"`
	Posicao  int       `json:"posicao"`
	Capa     bool      `json:"capa"`
	URL      string    `json:"url"`
	CriadoEm time.Time `json:"criado_em"`
}

func (i *DoacaoImagem) Preparar() error {
	i.URL = strings.TrimSpace(i.URL)

	if i.URL == "" {
		return errors.New("a url da imagem e obrigatoria")
	}

	if utf8.RuneCountInString(i.URL) > 300 {
		return errors.New("a url da imagem deve ter no maximo 300 caracteres")
	}

	endereco, err := url.ParseRequestURI(i.URL)
	if err != nil || endereco.Host == "" || (endereco.Scheme != "http" && endereco.Scheme != "https") {
		return errors.New("a url da imagem deve ser um endereco http ou https valido")
	}

	return nil
}
