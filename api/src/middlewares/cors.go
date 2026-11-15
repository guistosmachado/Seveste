package middlewares

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// CORS libera o frontend (Next.js) para chamar a API do navegador.
// A origem permitida vem de CORS_ORIGIN; por padrão é o servidor de desenvolvimento do Next.
func CORS() gin.HandlerFunc {
	origem := os.Getenv("CORS_ORIGIN")
	if origem == "" {
		origem = "http://localhost:3000"
	}

	return func(c *gin.Context) {
		cabecalhos := c.Writer.Header()
		cabecalhos.Set("Access-Control-Allow-Origin", origem)
		cabecalhos.Set("Vary", "Origin")
		cabecalhos.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		cabecalhos.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
