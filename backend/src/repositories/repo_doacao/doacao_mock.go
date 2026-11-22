package repo_doacao

import (
	"cmp"
	"errors"
	"seveste-api/src/models"
	"slices"
	"sync"
	"time"
)

type RepositorioDeMemoriaDoacao struct {
	mu      sync.RWMutex
	doacoes map[uint64]models.Doacao
	proxID  uint64
}

func NovoRepositorioDeDoacao() *RepositorioDeMemoriaDoacao {
	return &RepositorioDeMemoriaDoacao{
		doacoes: make(map[uint64]models.Doacao),
		proxID:  1,
	}
}

func ordenarPorID(doacoes []models.Doacao) {
	slices.SortFunc(doacoes, func(a, b models.Doacao) int {
		return cmp.Compare(a.ID, b.ID)
	})
}

func (r *RepositorioDeMemoriaDoacao) Criar(d *models.Doacao) (*models.Doacao, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	agora := time.Now()
	d.ID = r.proxID
	if d.CriadoEm.IsZero() {
		d.CriadoEm = agora
	}
	d.AtualizadoEm = agora
	r.doacoes[r.proxID] = *d
	r.proxID++

	return d, nil
}

func (r *RepositorioDeMemoriaDoacao) BuscarTodas() ([]models.Doacao, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var doacoes = make([]models.Doacao, 0, len(r.doacoes))
	for _, d := range r.doacoes {
		doacoes = append(doacoes, d)
	}
	ordenarPorID(doacoes)

	return doacoes, nil
}

func (r *RepositorioDeMemoriaDoacao) BuscarPorID(ID uint64) (*models.Doacao, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var d, existe = r.doacoes[ID]
	if !existe {
		return nil, errors.New("doação não encontrada")
	}

	return &d, nil
}

func (r *RepositorioDeMemoriaDoacao) BuscarPorUsuarioID(usuarioID uint64) ([]models.Doacao, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtradas := make([]models.Doacao, 0)
	for _, d := range r.doacoes {
		if d.UsuarioID == usuarioID {
			filtradas = append(filtradas, d)
		}
	}
	ordenarPorID(filtradas)

	return filtradas, nil
}

func (r *RepositorioDeMemoriaDoacao) Salvar(ID uint64, nova *models.Doacao) (*models.Doacao, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var _, existe = r.doacoes[ID]
	if !existe {
		return nil, errors.New("doação não encontrada")
	}
	nova.AtualizadoEm = time.Now()
	r.doacoes[ID] = *nova

	return nova, nil
}

func (r *RepositorioDeMemoriaDoacao) Deletar(ID uint64) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var _, existe = r.doacoes[ID]
	if !existe {
		return errors.New("doacao nao encontrada")
	}

	delete(r.doacoes, ID)
	return nil
}
