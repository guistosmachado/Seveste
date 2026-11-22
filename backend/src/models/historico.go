package models

import "time"

// HistoricoDeListagem guarda cada mudança de status de uma doação (disponivel, reservada, concluida...)
type HistoricoDeListagem struct {
	ID       uint64    `json:"id_historico_de_listagem"`
	DoacaoID uint64    `json:"id_doacao"`
	Status   string    `json:"status"`
	CriadoEm time.Time `json:"criado_em"`
}
