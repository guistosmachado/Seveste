package middlewares

import (
	"net/http"
	"seveste-api/src/seguranca"
	"slices"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func Autenticar() gin.HandlerFunc {
	return func(c *gin.Context) {
		cabecalho := c.GetHeader("Authorization")
		if cabecalho == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "o token de autenticacao e obrigatorio"})
			c.Abort()
			return
		}

		partes := strings.Split(cabecalho, " ")
		if len(partes) != 2 || partes[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "o token de autenticacao fornecido e invalido"})
			c.Abort()
			return
		}

		claims, err := seguranca.ValidarToken(partes[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": err.Error()})
			c.Abort()
			return
		}

		c.Set("usuario_id", claims.UsuarioID)
		c.Set("usuario_tipo", claims.Tipo)

		c.Next()
	}
}

func Autorizacao() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ID string = c.Param("id")
		var targetID, err = strconv.ParseUint(ID, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
			c.Abort()
			return
		}

		var tokenID, existe = c.Get("usuario_id")
		if !existe {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "sessao nao identificada"})
			c.Abort()
			return
		}

		if targetID != tokenID {
			c.JSON(http.StatusForbidden, gin.H{"erro": "sem permissao para realizar esta operacao"})
			c.Abort()
			return
		}

		c.Set("target_usuario_id", targetID)
		c.Next()
	}
}

// AutenticarOpcional identifica o usuário quando há um token válido, mas não bloqueia quem não enviou token.
// Serve para rotas públicas que mostram mais dados para o dono (ex: endereço completo da doação).
func AutenticarOpcional() gin.HandlerFunc {
	return func(c *gin.Context) {
		partes := strings.Split(c.GetHeader("Authorization"), " ")
		if len(partes) == 2 && partes[0] == "Bearer" {
			if claims, err := seguranca.ValidarToken(partes[1]); err == nil {
				c.Set("usuario_id", claims.UsuarioID)
				c.Set("usuario_tipo", claims.Tipo)
			}
		}

		c.Next()
	}
}

// ApenasTipo libera a rota somente para os tipos de usuário informados ("doador", "acolhido").
// Precisa vir depois de Autenticar().
func ApenasTipo(tipos ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !slices.Contains(tipos, c.GetString("usuario_tipo")) {
			c.JSON(http.StatusForbidden, gin.H{"erro": "o seu tipo de usuario nao tem permissao para esta operacao"})
			c.Abort()
			return
		}

		c.Next()
	}
}
