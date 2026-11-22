package repo_imagem

import (
	"cmp"
	"errors"
	"seveste-api/src/models"
	"slices"
	"sync"
	"time"
)

type RepositorioDeMemoriaImagem struct {
	mu      sync.RWMutex
	imagens map[uint64]models.DoacaoImagem
	proxID  uint64
}

func NovoRepositorioDeImagem() *RepositorioDeMemoriaImagem {
	return &RepositorioDeMemoriaImagem{
		imagens: make(map[uint64]models.DoacaoImagem),
		proxID:  1,
	}
}

func (r *RepositorioDeMemoriaImagem) Criar(i *models.DoacaoImagem) (*models.DoacaoImagem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	i.ID = r.proxID
	if i.CriadoEm.IsZero() {
		i.CriadoEm = time.Now()
	}
	r.imagens[i.ID] = *i
	r.proxID++

	return i, nil
}

func (r *RepositorioDeMemoriaImagem) BuscarPorID(ID uint64) (*models.DoacaoImagem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	i, existe := r.imagens[ID]
	if !existe {
		return nil, errors.New("imagem nao encontrada")
	}

	return &i, nil
}

func (r *RepositorioDeMemoriaImagem) BuscarPorDoacaoID(doacaoID uint64) ([]models.DoacaoImagem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtradas := make([]models.DoacaoImagem, 0)
	for _, i := range r.imagens {
		if i.DoacaoID == doacaoID {
			filtradas = append(filtradas, i)
		}
	}

	slices.SortFunc(filtradas, func(a, b models.DoacaoImagem) int {
		if c := cmp.Compare(a.Posicao, b.Posicao); c != 0 {
			return c
		}
		return cmp.Compare(a.ID, b.ID)
	})

	return filtradas, nil
}

func (r *RepositorioDeMemoriaImagem) Salvar(ID uint64, nova *models.DoacaoImagem) (*models.DoacaoImagem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, existe := r.imagens[ID]; !existe {
		return nil, errors.New("imagem nao encontrada")
	}
	r.imagens[ID] = *nova

	return nova, nil
}

func (r *RepositorioDeMemoriaImagem) Deletar(ID uint64) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, existe := r.imagens[ID]; !existe {
		return errors.New("imagem nao encontrada")
	}
	delete(r.imagens, ID)

	return nil
}
