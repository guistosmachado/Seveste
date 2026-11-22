package controllers

import (
	"net/http"
	"seveste-api/src/models"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_solicitacao"
	"seveste-api/src/repositories/repo_usuario"

	"github.com/gin-gonic/gin"
)

// GET /usuarios - público, mas minimizado (LGPD): lista só o perfil público dos doadores.
// Acolhidos nunca aparecem aqui: saber que alguém recebe doações já é um dado sensível.
func GetUsuarios(c *gin.Context) {
	usuarios, err := repo_usuario.UsuarioRepo.BuscarTodos()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	lista := make([]models.UsuarioPublico, 0, len(usuarios))
	for _, u := range usuarios {
		if u.Tipo == models.TipoDoador {
			lista = append(lista, u.Publico())
		}
	}

	c.JSON(http.StatusOK, gin.H{"usuarios": lista})
}

// GET /usuarios/:id (rota com AutenticarOpcional)
//   - o próprio usuário vê o perfil completo (sem a senha);
//   - qualquer outra pessoa vê só o perfil público de um doador;
//   - um acolhido é invisível para os demais (404). O doador só conhece o acolhido que
//     solicitou a doação dele, pelo GET /doacoes/:id/solicitacoes.
func GetUsuario(c *gin.Context) {
	intID, ok := lerIDParam(c, "id")
	if !ok {
		return
	}

	usuario, err := repo_usuario.UsuarioRepo.BuscarPorID(intID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "usuario nao encontrado"})
		return
	}

	if usuarioLogadoID(c) == usuario.ID {
		c.JSON(http.StatusOK, gin.H{"usuario": usuario.SemSenha()})
		return
	}

	if usuario.Tipo != models.TipoDoador {
		c.JSON(http.StatusNotFound, gin.H{"erro": "usuario nao encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"usuario": usuario.Publico()})
}

func CriarUsuario(c *gin.Context) {
	var novo models.Usuario

	if err := c.ShouldBindJSON(&novo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	if err := novo.Preparar("cadastro"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	// a coluna email do banco é UNIQUE
	if _, err := repo_usuario.UsuarioRepo.BuscarPorEmail(novo.Email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"erro": "ja existe um usuario cadastrado com este email"})
		return
	}

	criado, err := repo_usuario.UsuarioRepo.Criar(&novo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"criado": criado.SemSenha()})
}

func AtualizarUsuario(c *gin.Context) {
	var targetID uint64 = c.GetUint64("target_usuario_id")

	var input models.AtualizacaoUsuario
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	usuario, err := repo_usuario.UsuarioRepo.BuscarPorID(targetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "usuario nao encontrado"})
		return
	}

	if err = usuario.Mesclar(input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	atualizado, err := repo_usuario.UsuarioRepo.Salvar(targetID, usuario)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"atualizado": atualizado.SemSenha()})
}

// DELETE /usuarios/:id - reproduz o ON DELETE CASCADE do banco: apaga as doações do usuário
// (com tudo que depende delas) e as solicitações que ele fez, liberando doações que estavam reservadas para ele.
func DeletarUsuario(c *gin.Context) {
	var targetID uint64 = c.GetUint64("target_usuario_id")

	mutexSolicitacoes.Lock()
	defer mutexSolicitacoes.Unlock()

	doacoes, err := repo_doacao.DoacaoRepo.BuscarPorUsuarioID(targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	for i := range doacoes {
		if err = excluirDoacaoEmCascata(&doacoes[i]); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
			return
		}
	}

	solicitacoes, err := repo_solicitacao.SolicitacaoRepo.BuscarPorUsuarioID(targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	for _, s := range solicitacoes {
		if err = repo_solicitacao.SolicitacaoRepo.Deletar(s.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
			return
		}
		if s.Status == models.SolicitacaoAceita {
			liberarDoacaoReservada(s.DoacaoID)
		}
	}

	if err = repo_usuario.UsuarioRepo.Deletar(targetID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
