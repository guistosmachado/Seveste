package main

import (
	"log"
	"os"
	"seveste-api/src/database"
	"seveste-api/src/repositories"
	"seveste-api/src/router"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("./.env"); err != nil {
		log.Println("arquivo .env não encontrado usando apenas varíaveis de ambiente")
	}

	// Com DATABASE_URL a API usa o PostgreSQL; sem ela, usa repositórios em memória com dados de exemplo.
	if url := os.Getenv("DATABASE_URL"); url != "" {
		db, err := database.Conectar(url)
		if err != nil {
			log.Fatal(err)
		}
		defer db.Close()

		repositories.UsarPostgres(db)

		// SEED_DATA=true carrega os dados de exemplo, mas só se o banco estiver vazio
		if os.Getenv("SEED_DATA") == "true" {
			repositories.InserirDadosSeVazio()
		}
	} else {
		log.Println("AVISO: DATABASE_URL nao definido, usando repositorios em memoria com dados de exemplo")

		repositories.UsarMemoria()
		repositories.InserirDados()
	}

	engine := router.Configurar()
	if err := engine.Run(); err != nil {
		log.Fatal(err)
	}
}
