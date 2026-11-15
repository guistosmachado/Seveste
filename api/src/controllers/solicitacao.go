package controllers

import (
	"log"
	"net/http"
	"seveste-api/src/models"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_solicitacao"
	"seveste-api/src/repositories/repo_usuario"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// os repositórios em memória não têm transação: este lock evita que duas decisões/pedidos
// simultâneos aceitem a mesma doação duas vezes. Com banco de dados, troque por uma transação (SELECT ... FOR UPDATE).
var mutexSolicitacoes sync.Mutex

type solicitacaoInput struct {
	DoacaoID uint64 `json:"id_doacao" binding:"required"`
}

// dados do acolhido que o doador precisa para decidir; contato (email/telefone) só aparece depois de ACEITA
type solicitanteResumo struct {
	ID               uint64   `json:"id_usuario"`
	Nome             string   `json:"nome"`
	UF               string   `json:"uf"`
	Cidade           string   `json:"cidade"`
	RoupasProcuradas []string `json:"roupas_procuradas,omitempty"`
	TamanhoRoupa     string   `json:"tamanho_roupa,omitempty"`
	TamanhoCalcado   uint8    `json:"tamanho_calcado,omitempty"`
	Email            string   `json:"email,omitempty"`
	Telefone         string   `json:"telefone,omitempty"`
}

type doacaoResumo struct {
	ID     uint64 `json:"id_doacao"`
	Titulo string `json:"titulo"`
	Status string `json:"status"`
}

type solicitacaoDetalhada struct {
	models.Solicitacao
	Solicitante *solicitanteResumo `json:"solicitante,omitempty"`
	Doacao      *doacaoResumo      `json:"doacao,omitempty"`
}

func comSolicitante(s models.Solicitacao) solicitacaoDetalhada {
	detalhada := solicitacaoDetalhada{Solicitacao: s}

	usuario, err := repo_usuario.UsuarioRepo.BuscarPorID(s.UsuarioID)
	if err != nil {
		return detalhada
	}

	resumo := &solicitanteResumo{
		ID:               usuario.ID,
		Nome:             usuario.Nome,
		UF:               usuario.UF,
		Cidade:           usuario.Cidade,
		RoupasProcuradas: usuario.RoupasProcuradas,
		TamanhoRoupa:     usuario.TamanhoRoupa,
		TamanhoCalcado:   usuario.TamanhoCalcado,
	}
	if s.Status == models.SolicitacaoAceita {
		resumo.Email = usuario.Email
		resumo.Telefone = usuario.Telefone
	}
	detalhada.Solicitante = resumo

	return detalhada
}

func comDoacao(s models.Solicitacao) solicitacaoDetalhada {
	detalhada := solicitacaoDetalhada{Solicitacao: s}

	if doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(s.DoacaoID); err == nil {
		detalhada.Doacao = &doacaoResumo{ID: doacao.ID, Titulo: doacao.Titulo, Status: doacao.Status}
	}

	return detalhada
}

// GET /solicitacoes/:id - quem fez a solicitação ou o dono da doação
func BuscarSolicitacao(c *gin.Context) {
	solicitacaoID, ok := lerIDParam(c, "id")
	if !ok {
		return
	}

	solicitacao, err := repo_solicitacao.SolicitacaoRepo.BuscarPorID(solicitacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(solicitacao.DoacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	usuarioID := usuarioLogadoID(c)
	if solicitacao.UsuarioID != usuarioID && doacao.UsuarioID != usuarioID {
		c.JSON(http.StatusForbidden, gin.H{"erro": "voce nao tem permissao para ver esta solicitacao"})
		return
	}

	detalhada := comSolicitante(*solicitacao)
	detalhada.Doacao = &doacaoResumo{ID: doacao.ID, Titulo: doacao.Titulo, Status: doacao.Status}

	c.JSON(http.StatusOK, gin.H{"solicitacao": detalhada})
}

// GET /solicitacoes/minhas - histórico de solicitações do usuário logado
func BuscarSolicitacoesPorUsuario(c *gin.Context) {
	solicitacoes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorUsuarioID(usuarioLogadoID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "erro ao buscar solicitacoes"})
		return
	}

	resultado := make([]solicitacaoDetalhada, 0, len(solicitacoes))
	for _, s := range solicitacoes {
		resultado = append(resultado, comDoacao(s))
	}

	c.JSON(http.StatusOK, gin.H{"solicitacoes": resultado})
}

// GET /doacoes/:id/solicitacoes - somente o dono da doação
func BuscarSolicitacoesPorDoacao(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	solicitacoes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorDoacaoID(doacao.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "erro ao buscar solicitacoes"})
		return
	}

	resultado := make([]solicitacaoDetalhada, 0, len(solicitacoes))
	for _, s := range solicitacoes {
		resultado = append(resultado, comSolicitante(s))
	}

	c.JSON(http.StatusOK, gin.H{"solicitacoes": resultado})
}

// POST /solicitacoes - somente acolhidos (middleware ApenasTipo)
func CriarSolicitacao(c *gin.Context) {
	var input solicitacaoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	mutexSolicitacoes.Lock()
	defer mutexSolicitacoes.Unlock()

	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(input.DoacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "a doacao selecionada para essa solicitacao nao existe"})
		return
	}

	if doacao.Status != models.DoacaoDisponivel {
		c.JSON(http.StatusConflict, gin.H{"erro": "esta doacao nao esta mais disponivel"})
		return
	}

	usuarioID := usuarioLogadoID(c)
	existentes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorUsuarioID(usuarioID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	for _, existente := range existentes {
		if existente.DoacaoID == doacao.ID && existente.EstaAtiva() {
			c.JSON(http.StatusConflict, gin.H{"erro": "voce ja possui uma solicitacao ativa para esta doacao"})
			return
		}
	}

	novo := models.Solicitacao{
		Status:    models.SolicitacaoPendente,
		CriadoEm:  time.Now(),
		DoacaoID:  doacao.ID,
		UsuarioID: usuarioID,
	}
	if err = novo.Preparar(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	criada, err := repo_solicitacao.SolicitacaoRepo.Criar(&novo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"criado": criada})
}

// PATCH /solicitacoes/:id/aceitar - somente o dono da doação.
// Aceitar reserva a doação, recusa as demais solicitações pendentes e registra no histórico.
func AceitarSolicitacao(c *gin.Context) {
	responderSolicitacao(c, models.SolicitacaoAceita)
}

// PATCH /solicitacoes/:id/recusar - somente o dono da doação
func RecusarSolicitacao(c *gin.Context) {
	responderSolicitacao(c, models.SolicitacaoRecusada)
}

func responderSolicitacao(c *gin.Context, novoStatus string) {
	solicitacaoID, ok := lerIDParam(c, "id")
	if !ok {
		return
	}

	mutexSolicitacoes.Lock()
	defer mutexSolicitacoes.Unlock()

	solicitacao, err := repo_solicitacao.SolicitacaoRepo.BuscarPorID(solicitacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(solicitacao.DoacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	if doacao.UsuarioID != usuarioLogadoID(c) {
		c.JSON(http.StatusForbidden, gin.H{"erro": "somente o dono da doacao pode responder a solicitacao"})
		return
	}

	if err = solicitacao.Responder(novoStatus); err != nil {
		c.JSON(http.StatusConflict, gin.H{"erro": err.Error()})
		return
	}

	if novoStatus == models.SolicitacaoAceita && doacao.Status != models.DoacaoDisponivel {
		c.JSON(http.StatusConflict, gin.H{"erro": "a doacao nao esta disponivel para ser reservada"})
		return
	}

	salva, err := repo_solicitacao.SolicitacaoRepo.Salvar(solicitacao.ID, solicitacao)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	resposta := gin.H{"solicitacao": comSolicitante(*salva)}

	if novoStatus == models.SolicitacaoAceita {
		doacao.Status = models.DoacaoReservada
		reservada, err := repo_doacao.DoacaoRepo.Salvar(doacao.ID, doacao)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
			return
		}
		registrarHistorico(reservada.ID, reservada.Status)

		// as outras solicitações pendentes dessa doação são recusadas automaticamente
		outras, err := repo_solicitacao.SolicitacaoRepo.BuscarPorDoacaoID(reservada.ID)
		if err != nil {
			log.Printf("erro ao buscar solicitacoes da doacao %d: %v", reservada.ID, err)
		}
		for _, outra := range outras {
			if outra.ID == salva.ID || outra.Status != models.SolicitacaoPendente {
				continue
			}
			outra.Status = models.SolicitacaoRecusada
			if _, err = repo_solicitacao.SolicitacaoRepo.Salvar(outra.ID, &outra); err != nil {
				log.Printf("erro ao recusar a solicitacao %d: %v", outra.ID, err)
			}
		}

		resposta["doacao"] = montarDoacao(*reservada, true)
	}

	c.JSON(http.StatusOK, resposta)
}

// DELETE /solicitacoes/:id - cancela a solicitação; somente quem a fez.
// Se ela já tinha sido aceita, a doação volta a ficar disponível.
func DeletarSolicitacao(c *gin.Context) {
	solicitacaoID, ok := lerIDParam(c, "id")
	if !ok {
		return
	}

	mutexSolicitacoes.Lock()
	defer mutexSolicitacoes.Unlock()

	solicitacao, err := repo_solicitacao.SolicitacaoRepo.BuscarPorID(solicitacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	if solicitacao.UsuarioID != usuarioLogadoID(c) {
		c.JSON(http.StatusForbidden, gin.H{"erro": "voce nao tem permissao para cancelar essa solicitacao"})
		return
	}

	if err = repo_solicitacao.SolicitacaoRepo.Deletar(solicitacao.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	if solicitacao.Status == models.SolicitacaoAceita {
		liberarDoacaoReservada(solicitacao.DoacaoID)
	}

	c.Status(http.StatusNoContent)
}
