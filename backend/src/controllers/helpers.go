package controllers

import (
	"log"
	"net/http"
	"seveste-api/src/models"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_endereco"
	"seveste-api/src/repositories/repo_historico"
	"seveste-api/src/repositories/repo_imagem"
	"seveste-api/src/repositories/repo_solicitacao"
	"strconv"

	"github.com/gin-gonic/gin"
)

// lê um parâmetro numérico da rota; se for inválido, já responde 400
func lerIDParam(c *gin.Context, nome string) (uint64, bool) {
	id, err := strconv.ParseUint(c.Param(nome), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "o parametro '" + nome + "' deve ser um numero valido"})
		return 0, false
	}

	return id, true
}

// id do usuário vindo do token (0 quando a rota é pública e não há token)
func usuarioLogadoID(c *gin.Context) uint64 {
	return c.GetUint64("usuario_id")
}

// busca a doação do parâmetro :id e confere se o usuário logado é o dono; se não for, já responde o erro
func carregarDoacaoDoDono(c *gin.Context) (*models.Doacao, bool) {
	doacaoID, ok := lerIDParam(c, "id")
	if !ok {
		return nil, false
	}

	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(doacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return nil, false
	}

	if doacao.UsuarioID != usuarioLogadoID(c) {
		c.JSON(http.StatusForbidden, gin.H{"erro": "voce nao tem permissao para acessar esta doacao"})
		return nil, false
	}

	return doacao, true
}

// junta a doação com o endereço e as imagens (tabelas Endereco e DoacaoImagem).
// Sem revelarEndereco, o endereço sai só com cidade e UF.
func montarDoacao(d models.Doacao, revelarEndereco bool) models.Doacao {
	if endereco, err := repo_endereco.EnderecoRepo.BuscarPorID(d.EnderecoID); err == nil {
		if !revelarEndereco {
			publico := endereco.Publico()
			endereco = &publico
		}
		d.Endereco = endereco
	}

	if imagens, err := repo_imagem.ImagemRepo.BuscarPorDoacaoID(d.ID); err == nil {
		d.Imagens = imagens
	}

	return d
}

// o endereço completo é visível para o dono da doação e para quem teve a solicitação aceita
func podeVerEnderecoCompleto(d *models.Doacao, usuarioID uint64) bool {
	if usuarioID == 0 {
		return false
	}

	if d.UsuarioID == usuarioID {
		return true
	}

	solicitacoes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorDoacaoID(d.ID)
	if err != nil {
		return false
	}

	for _, s := range solicitacoes {
		if s.UsuarioID == usuarioID && s.Status == models.SolicitacaoAceita {
			return true
		}
	}

	return false
}

// grava a mudança de status na tabela HistoricoDeListagem
func registrarHistorico(doacaoID uint64, status string) {
	registro := models.HistoricoDeListagem{DoacaoID: doacaoID, Status: status}
	if _, err := repo_historico.HistoricoRepo.Criar(&registro); err != nil {
		log.Printf("erro ao registrar historico da doacao %d: %v", doacaoID, err)
	}
}

// se a doação estava reservada para alguém que desistiu, ela volta a ficar disponível
func liberarDoacaoReservada(doacaoID uint64) {
	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(doacaoID)
	if err != nil || doacao.Status != models.DoacaoReservada {
		return
	}

	doacao.Status = models.DoacaoDisponivel
	if _, err = repo_doacao.DoacaoRepo.Salvar(doacao.ID, doacao); err != nil {
		log.Printf("erro ao liberar a doacao %d: %v", doacaoID, err)
		return
	}

	registrarHistorico(doacaoID, models.DoacaoDisponivel)
}

// reproduz o ON DELETE CASCADE do banco: apaga solicitações, imagens, histórico, a doação e o endereço dela
func excluirDoacaoEmCascata(d *models.Doacao) error {
	solicitacoes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorDoacaoID(d.ID)
	if err != nil {
		return err
	}
	for _, s := range solicitacoes {
		if err = repo_solicitacao.SolicitacaoRepo.Deletar(s.ID); err != nil {
			return err
		}
	}

	imagens, err := repo_imagem.ImagemRepo.BuscarPorDoacaoID(d.ID)
	if err != nil {
		return err
	}
	for _, imagem := range imagens {
		if err = repo_imagem.ImagemRepo.Deletar(imagem.ID); err != nil {
			return err
		}
	}

	if err = repo_historico.HistoricoRepo.DeletarPorDoacaoID(d.ID); err != nil {
		return err
	}

	if err = repo_doacao.DoacaoRepo.Deletar(d.ID); err != nil {
		return err
	}

	// o endereço pertence só a essa doação; se já não existir, não há o que fazer
	_ = repo_endereco.EnderecoRepo.Deletar(d.EnderecoID)

	return nil
}
