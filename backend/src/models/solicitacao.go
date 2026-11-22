package models

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"
)

const (
	SolicitacaoPendente = "PENDENTE"
	SolicitacaoAceita   = "ACEITA"
	SolicitacaoRecusada = "RECUSADA"
)

type Solicitacao struct {
	ID        uint64    `json:"id_solicitacao"`
	Status    string    `json:"status" binding:"required"`
	CriadoEm  time.Time `json:"criado_em" binding:"required"`
	DoacaoID  uint64    `json:"id_doacao" binding:"required"`
	UsuarioID uint64    `json:"id_usuario" binding:"required"`
}

func (s *Solicitacao) Preparar() error {
	s.formatar()

	if err := s.validar(); err != nil {
		return err
	}

	return nil
}

func (s *Solicitacao) formatar() {
	s.Status = strings.ToUpper(strings.TrimSpace(s.Status))
}

func (s *Solicitacao) validar() error {
	if s.DoacaoID == 0 {
		return errors.New("o id_doacao e obrigatorio e deve ser valido")
	}

	if s.UsuarioID == 0 {
		return errors.New("o id_usuario e obrigatorio e deve ser valido")
	}

	statusPermitidos := []string{SolicitacaoPendente, SolicitacaoAceita, SolicitacaoRecusada}
	if !slices.Contains(statusPermitidos, s.Status) {
		return errors.New(`status invalido para a solicitacao, permitidos: ["PENDENTE", "ACEITA", "RECUSADA"]`)
	}

	return nil
}

// Responder é a decisão do doador: só uma solicitação PENDENTE pode virar ACEITA ou RECUSADA
func (s *Solicitacao) Responder(novoStatus string) error {
	if novoStatus != SolicitacaoAceita && novoStatus != SolicitacaoRecusada {
		return errors.New("a resposta deve ser ACEITA ou RECUSADA")
	}

	if s.Status != SolicitacaoPendente {
		return fmt.Errorf("somente solicitacoes pendentes podem ser respondidas (status atual: %s)", s.Status)
	}

	s.Status = novoStatus

	return nil
}

// uma solicitação ativa ainda "ocupa" a doação para aquele usuário (impede pedir duas vezes)
func (s *Solicitacao) EstaAtiva() bool {
	return s.Status == SolicitacaoPendente || s.Status == SolicitacaoAceita
}
