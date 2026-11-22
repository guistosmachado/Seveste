// Package handler é o ponto de entrada da API na Vercel.
// Na Vercel a API roda como função serverless: em vez do main.go (engine.Run), a Vercel chama Handler a cada
// requisição. O api/vercel.json direciona todas as rotas para esta função, e o Gin cuida do roteamento normalmente.
// Para rodar localmente continue usando "go run ." (main.go).
package handler

import (
	"errors"
	"net/http"
	"os"
	"sync"

	"seveste-api/src/database"
	"seveste-api/src/repositories"
	"seveste-api/src/router"

	"github.com/gin-gonic/gin"
)

var (
	iniciar    sync.Once
	engine     *gin.Engine
	erroInicio error
)

// a API é montada uma única vez por instância da função (no primeiro acesso) e reaproveitada nas próximas requisições
func montarAPI() {
	gin.SetMode(gin.ReleaseMode)

	// em produção a API precisa do PostgreSQL: os repositórios em memória perderiam os dados entre as instâncias
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		erroInicio = errors.New("DATABASE_URL nao definida")
		return
	}

	db, err := database.Conectar(url)
	if err != nil {
		erroInicio = err
		return
	}

	repositories.UsarPostgres(db)
	engine = router.Configurar()
}

func Handler(w http.ResponseWriter, r *http.Request) {
	iniciar.Do(montarAPI)

	if erroInicio != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"erro":"servidor indisponivel"}`))
		return
	}

	engine.ServeHTTP(w, r)
}
