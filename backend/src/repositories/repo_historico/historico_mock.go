package repo_historico

import (
	"cmp"
	"seveste-api/src/models"
	"slices"
	"sync"
	"time"
)

type RepositorioDeMemoriaHistorico struct {
	mu        sync.RWMutex
	registros map[uint64]models.HistoricoDeListagem
	proxID    uint64
}

func NovoRepositorioDeHistorico() *RepositorioDeMemoriaHistorico {
	return &RepositorioDeMemoriaHistorico{
		registros: make(map[uint64]models.HistoricoDeListagem),
		proxID:    1,
	}
}

func (r *RepositorioDeMemoriaHistorico) Criar(h *models.HistoricoDeListagem) (*models.HistoricoDeListagem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	h.ID = r.proxID
	if h.CriadoEm.IsZero() {
		h.CriadoEm = time.Now()
	}
	r.registros[h.ID] = *h
	r.proxID++

	return h, nil
}

func (r *RepositorioDeMemoriaHistorico) BuscarPorDoacaoID(doacaoID uint64) ([]models.HistoricoDeListagem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtrados := make([]models.HistoricoDeListagem, 0)
	for _, h := range r.registros {
		if h.DoacaoID == doacaoID {
			filtrados = append(filtrados, h)
		}
	}

	slices.SortFunc(filtrados, func(a, b models.HistoricoDeListagem) int {
		return cmp.Compare(a.ID, b.ID)
	})

	return filtrados, nil
}

func (r *RepositorioDeMemoriaHistorico) DeletarPorDoacaoID(doacaoID uint64) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, h := range r.registros {
		if h.DoacaoID == doacaoID {
			delete(r.registros, id)
		}
	}

	return nil
}
