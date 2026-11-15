package seguranca

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secretkey = carregarSegredo()

// lê a chave de assinatura da variável de ambiente JWT_SECRET; sem ela, usa uma chave fixa só para desenvolvimento
func carregarSegredo() []byte {
	if segredo := os.Getenv("JWT_SECRET"); segredo != "" {
		return []byte(segredo)
	}

	log.Println("AVISO: JWT_SECRET nao definido, usando a chave de desenvolvimento. Defina JWT_SECRET em producao.")
	return []byte("Chave super secreta")
}

// dados embutidos dentro do token
type customClaims struct {
	UsuarioID uint64 `json:"usuario_id"`
	Tipo      string `json:"tipo"`
	jwt.RegisteredClaims
}

// cria um token jwt válido por 6 horas
func GerarToken(usuarioID uint64, tipo string) (string, error) {
	claims := customClaims{
		UsuarioID: usuarioID,
		Tipo:      tipo,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(6 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "seveste-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretkey)
}

// decodifica o token e verifica a assinatura e a expiração
func ValidarToken(tokenString string) (*customClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &customClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritmo de token inesperado: %v", token.Header["alg"])
		}

		return secretkey, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*customClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token invalido")
	}

	return claims, nil
}
