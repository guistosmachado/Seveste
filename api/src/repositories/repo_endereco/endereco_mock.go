package repo_endereco

import (
	"errors"
	"seveste-api/src/models"
	"strings"
	"sync"
)

type RepositorioDeMemoriaEndereco struct {
	mu           sync.RWMutex
	enderecos    map[uint64]models.Endereco
	cidades      map[string]uint64 // nome da cidade em minúsculo -> id_cidade
	proxID       uint64
	proxCidadeID uint64
}

func NovoRepositorioDeEndereco() *RepositorioDeMemoriaEndereco {
	return &RepositorioDeMemoriaEndereco{
		enderecos:    make(map[uint64]models.Endereco),
		cidades:      make(map[string]uint64),
		proxID:       1,
		proxCidadeID: 1,
	}
}

func (r *RepositorioDeMemoriaEndereco) Criar(e *models.Endereco) (*models.Endereco, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	chave := strings.ToLower(e.Cidade)
	cidadeID, existe := r.cidades[chave]
	if !existe {
		cidadeID = r.proxCidadeID
		r.cidades[chave] = cidadeID
		r.proxCidadeID++
	}

	e.CidadeID = cidadeID
	e.ID = r.proxID
	r.enderecos[e.ID] = *e
	r.proxID++

	return e, nil
}

func (r *RepositorioDeMemoriaEndereco) BuscarPorID(ID uint64) (*models.Endereco, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	e, existe := r.enderecos[ID]
	if !existe {
		return nil, errors.New("endereco nao encontrado")
	}

	return &e, nil
}

func (r *RepositorioDeMemoriaEndereco) Deletar(ID uint64) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, existe := r.enderecos[ID]; !existe {
		return errors.New("endereco nao encontrado")
	}
	delete(r.enderecos, ID)

	return nil
}
