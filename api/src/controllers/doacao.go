package controllers

import (
	"net/http"
	"seveste-api/src/models"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_endereco"
	"seveste-api/src/repositories/repo_historico"
	"seveste-api/src/repositories/repo_imagem"
	"strings"

	"github.com/gin-gonic/gin"
)

type enderecoInput struct {
	Rua         string `json:"rua" binding:"required"`
	Numero      string `json:"numero" binding:"required"`
	UF          string `json:"uf" binding:"required"`
	Complemento string `json:"complemento"`
	Cidade      string `json:"cidade" binding:"required"`
}

type doacaoInput struct {
	Titulo        string         `json:"titulo" binding:"required"`
	Descricao     string         `json:"descricao" binding:"required"`
	Categoria     string         `json:"categoria" binding:"required"`
	Tamanho       string         `json:"tamanho" binding:"required"`
	Estado        string         `json:"estado" binding:"required"`
	TipoDeEntrega string         `json:"tipo_de_entrega" binding:"required"`
	Endereco      *enderecoInput `json:"endereco" binding:"required"`
	Imagens       []string       `json:"imagens"` // urls; a primeira vira a capa
}

type imagemInput struct {
	URL  string `json:"url" binding:"required"`
	Capa bool   `json:"capa"`
}

// GET /doacoes - público. Filtros opcionais: ?status=disponivel&categoria=roupas&cidade=Botucatu
func BuscarDoacoes(c *gin.Context) {
	doacoes, err := repo_doacao.DoacaoRepo.BuscarTodas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	status := strings.ToLower(strings.TrimSpace(c.Query("status")))
	categoria := strings.TrimSpace(c.Query("categoria"))
	cidade := strings.TrimSpace(c.Query("cidade"))

	resultado := make([]models.Doacao, 0, len(doacoes))
	for _, d := range doacoes {
		if status != "" && d.Status != status {
			continue
		}
		if categoria != "" && !strings.EqualFold(d.Categoria, categoria) {
			continue
		}

		completa := montarDoacao(d, false)
		if cidade != "" && (completa.Endereco == nil || !strings.EqualFold(completa.Endereco.Cidade, cidade)) {
			continue
		}

		resultado = append(resultado, completa)
	}

	c.JSON(http.StatusOK, gin.H{"doacoes": resultado})
}

// GET /doacoes/minhas - doador logado vê todas as próprias doações, com endereço completo
func BuscarMinhasDoacoes(c *gin.Context) {
	doacoes, err := repo_doacao.DoacaoRepo.BuscarPorUsuarioID(usuarioLogadoID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	resultado := make([]models.Doacao, 0, len(doacoes))
	for _, d := range doacoes {
		resultado = append(resultado, montarDoacao(d, true))
	}

	c.JSON(http.StatusOK, gin.H{"doacoes": resultado})
}

// GET /doacoes/:id - público (rota com AutenticarOpcional)
func BuscarDoacao(c *gin.Context) {
	doacaoID, ok := lerIDParam(c, "id")
	if !ok {
		return
	}

	doacao, err := repo_doacao.DoacaoRepo.BuscarPorID(doacaoID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": err.Error()})
		return
	}

	revelar := podeVerEnderecoCompleto(doacao, usuarioLogadoID(c))
	c.JSON(http.StatusOK, gin.H{"doacao": montarDoacao(*doacao, revelar)})
}

// POST /doacoes - somente doadores (middleware ApenasTipo). Cria endereço, doação, imagens e o primeiro registro do histórico.
func CriarDoacao(c *gin.Context) {
	var input doacaoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	endereco := models.Endereco{
		Rua:         input.Endereco.Rua,
		Numero:      input.Endereco.Numero,
		UF:          input.Endereco.UF,
		Complemento: input.Endereco.Complemento,
		Cidade:      input.Endereco.Cidade,
	}
	if err := endereco.Preparar(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	if len(input.Imagens) > models.MaxImagensPorDoacao {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "uma doacao pode ter no maximo 4 imagens"})
		return
	}
	imagens := make([]models.DoacaoImagem, 0, len(input.Imagens))
	for i, link := range input.Imagens {
		imagem := models.DoacaoImagem{URL: link, Posicao: i + 1, Capa: i == 0}
		if err := imagem.Preparar(); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
			return
		}
		imagens = append(imagens, imagem)
	}

	nova := models.Doacao{
		Titulo:        input.Titulo,
		Descricao:     input.Descricao,
		Categoria:     input.Categoria,
		Tamanho:       input.Tamanho,
		Estado:        input.Estado,
		TipoDeEntrega: input.TipoDeEntrega,
		Status:        models.DoacaoDisponivel,
		UsuarioID:     usuarioLogadoID(c),
	}
	if err := nova.Preparar(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	enderecoCriado, err := repo_endereco.EnderecoRepo.Criar(&endereco)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	nova.EnderecoID = enderecoCriado.ID

	criada, err := repo_doacao.DoacaoRepo.Criar(&nova)
	if err != nil {
		_ = repo_endereco.EnderecoRepo.Deletar(enderecoCriado.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	for i := range imagens {
		imagens[i].DoacaoID = criada.ID
		if _, err = repo_imagem.ImagemRepo.Criar(&imagens[i]); err != nil {
			_ = excluirDoacaoEmCascata(criada)
			c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
			return
		}
	}

	registrarHistorico(criada.ID, criada.Status)

	c.JSON(http.StatusCreated, gin.H{"criado": montarDoacao(*criada, true)})
}

// PATCH /doacoes/:id - somente o dono
func AtualizarDoacao(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	if doacao.Status == models.DoacaoConcluida {
		c.JSON(http.StatusConflict, gin.H{"erro": "uma doacao concluida nao pode ser alterada"})
		return
	}

	var input models.AtualizacaoDoacao
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	if err := doacao.Mesclar(input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	atualizada, err := repo_doacao.DoacaoRepo.Salvar(doacao.ID, doacao)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"doacao": montarDoacao(*atualizada, true)})
}

// PATCH /doacoes/:id/concluir - o dono confirma que a entrega aconteceu (a doação precisa estar reservada)
func ConcluirDoacao(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	if doacao.Status != models.DoacaoReservada {
		c.JSON(http.StatusConflict, gin.H{"erro": "somente uma doacao reservada (com solicitacao aceita) pode ser concluida"})
		return
	}

	doacao.Status = models.DoacaoConcluida
	concluida, err := repo_doacao.DoacaoRepo.Salvar(doacao.ID, doacao)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	registrarHistorico(concluida.ID, concluida.Status)

	c.JSON(http.StatusOK, gin.H{"doacao": montarDoacao(*concluida, true)})
}

// DELETE /doacoes/:id - somente o dono; apaga também solicitações, imagens, histórico e endereço
func DeletarDoacao(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	mutexSolicitacoes.Lock()
	defer mutexSolicitacoes.Unlock()

	if err := excluirDoacaoEmCascata(doacao); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GET /doacoes/:id/historico - somente o dono
func BuscarHistoricoDaDoacao(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	historico, err := repo_historico.HistoricoRepo.BuscarPorDoacaoID(doacao.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"historico": historico})
}

// POST /doacoes/:id/imagens - somente o dono; máximo de 4 imagens por doação
func AdicionarImagem(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	var input imagemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	existentes, err := repo_imagem.ImagemRepo.BuscarPorDoacaoID(doacao.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	if len(existentes) >= models.MaxImagensPorDoacao {
		c.JSON(http.StatusConflict, gin.H{"erro": "uma doacao pode ter no maximo 4 imagens"})
		return
	}

	proximaPosicao := 1
	for _, existente := range existentes {
		if existente.Posicao >= proximaPosicao {
			proximaPosicao = existente.Posicao + 1
		}
	}

	nova := models.DoacaoImagem{
		DoacaoID: doacao.ID,
		URL:      input.URL,
		Posicao:  proximaPosicao,
		Capa:     input.Capa || len(existentes) == 0,
	}
	if err = nova.Preparar(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	// só pode existir uma capa por doação
	if nova.Capa {
		for i := range existentes {
			if existentes[i].Capa {
				existentes[i].Capa = false
				if _, err = repo_imagem.ImagemRepo.Salvar(existentes[i].ID, &existentes[i]); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
					return
				}
			}
		}
	}

	criada, err := repo_imagem.ImagemRepo.Criar(&nova)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"criado": criada})
}

// DELETE /doacoes/:id/imagens/:imagemId - somente o dono; se apagar a capa, a próxima imagem vira capa
func RemoverImagem(c *gin.Context) {
	doacao, ok := carregarDoacaoDoDono(c)
	if !ok {
		return
	}

	imagemID, ok := lerIDParam(c, "imagemId")
	if !ok {
		return
	}

	imagem, err := repo_imagem.ImagemRepo.BuscarPorID(imagemID)
	if err != nil || imagem.DoacaoID != doacao.ID {
		c.JSON(http.StatusNotFound, gin.H{"erro": "imagem nao encontrada nesta doacao"})
		return
	}

	if err = repo_imagem.ImagemRepo.Deletar(imagem.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	if imagem.Capa {
		restantes, err := repo_imagem.ImagemRepo.BuscarPorDoacaoID(doacao.ID)
		if err == nil && len(restantes) > 0 {
			restantes[0].Capa = true
			_, _ = repo_imagem.ImagemRepo.Salvar(restantes[0].ID, &restantes[0])
		}
	}

	c.Status(http.StatusNoContent)
}
