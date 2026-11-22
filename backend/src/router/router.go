package router

import (
	"seveste-api/src/controllers"
	"seveste-api/src/middlewares"
	"seveste-api/src/models"

	"github.com/gin-gonic/gin"
)

func Configurar() *gin.Engine {
	router := gin.Default()
	router.Use(middlewares.CORS())

	v1 := router.Group("/api/v1")
	{
		registrarRotasDeUsuario(v1)
		registrarRotasDeLogin(v1)
		registrarRotasDeDoacao(v1)
		registrarRotasDeSolicitacao(v1)
	}

	return router
}

func registrarRotasDeUsuario(rg *gin.RouterGroup) {
	usuarios := rg.Group("/usuarios")
	{
		usuarios.GET("", controllers.GetUsuarios)
		usuarios.GET("/:id", middlewares.AutenticarOpcional(), controllers.GetUsuario)
		usuarios.POST("", controllers.CriarUsuario)

		// somente o próprio usuário pode alterar ou apagar seus dados
		donoDaConta := usuarios.Group("", middlewares.Autenticar(), middlewares.Autorizacao())
		{
			donoDaConta.PATCH("/:id", controllers.AtualizarUsuario)
			donoDaConta.DELETE("/:id", controllers.DeletarUsuario)
		}
	}
}

func registrarRotasDeLogin(rg *gin.RouterGroup) {
	login := rg.Group("/login")
	{
		login.POST("", controllers.Login)
	}
}

func registrarRotasDeDoacao(rg *gin.RouterGroup) {
	doacoes := rg.Group("/doacoes")
	{
		doacoes.GET("", controllers.BuscarDoacoes)

		autenticadas := doacoes.Group("", middlewares.Autenticar())
		{
			// rotas fixas ("/minhas") ficam antes de "/:id"
			autenticadas.GET("/minhas", middlewares.ApenasTipo(models.TipoDoador), controllers.BuscarMinhasDoacoes)
		}

		// pública: o endereço completo só aparece para o dono e para quem teve a solicitação aceita
		doacoes.GET("/:id", middlewares.AutenticarOpcional(), controllers.BuscarDoacao)

		{
			autenticadas.POST("", middlewares.ApenasTipo(models.TipoDoador), controllers.CriarDoacao)

			// as rotas abaixo conferem dentro do controller se o usuário logado é o dono da doação
			autenticadas.GET("/:id/solicitacoes", controllers.BuscarSolicitacoesPorDoacao)
			autenticadas.GET("/:id/historico", controllers.BuscarHistoricoDaDoacao)
			autenticadas.PATCH("/:id", controllers.AtualizarDoacao)
			autenticadas.PATCH("/:id/concluir", controllers.ConcluirDoacao)
			autenticadas.DELETE("/:id", controllers.DeletarDoacao)
			autenticadas.POST("/:id/imagens", controllers.AdicionarImagem)
			autenticadas.DELETE("/:id/imagens/:imagemId", controllers.RemoverImagem)
		}
	}
}

func registrarRotasDeSolicitacao(rg *gin.RouterGroup) {
	solicitacoes := rg.Group("/solicitacoes", middlewares.Autenticar())
	{
		solicitacoes.GET("/minhas", controllers.BuscarSolicitacoesPorUsuario)
		solicitacoes.GET("/:id", controllers.BuscarSolicitacao)
		solicitacoes.POST("", middlewares.ApenasTipo(models.TipoAcolhido), controllers.CriarSolicitacao)
		solicitacoes.DELETE("/:id", controllers.DeletarSolicitacao)

		// decisão do doador sobre a solicitação
		solicitacoes.PATCH("/:id/aceitar", controllers.AceitarSolicitacao)
		solicitacoes.PATCH("/:id/recusar", controllers.RecusarSolicitacao)
	}
}
