package repositories

import (
	"database/sql"
	"seveste-api/src/repositories/repo_doacao"
	"seveste-api/src/repositories/repo_endereco"
	"seveste-api/src/repositories/repo_historico"
	"seveste-api/src/repositories/repo_imagem"
	"seveste-api/src/repositories/repo_solicitacao"
	"seveste-api/src/repositories/repo_usuario"
)

// UsarMemoria liga os repositórios em memória (os dados somem quando a API reinicia). Serve para desenvolvimento rápido.
func UsarMemoria() {
	repo_usuario.UsuarioRepo = repo_usuario.NovoRepositorioDeUsuario()
	repo_endereco.EnderecoRepo = repo_endereco.NovoRepositorioDeEndereco()
	repo_doacao.DoacaoRepo = repo_doacao.NovoRepositorioDeDoacao()
	repo_imagem.ImagemRepo = repo_imagem.NovoRepositorioDeImagem()
	repo_historico.HistoricoRepo = repo_historico.NovoRepositorioDeHistorico()
	repo_solicitacao.SolicitacaoRepo = repo_solicitacao.NovoRepositorioDeSolicitacao()
}

// UsarPostgres liga os repositórios que gravam no PostgreSQL
func UsarPostgres(db *sql.DB) {
	repo_usuario.UsuarioRepo = repo_usuario.NovoRepositorioPostgres(db)
	repo_endereco.EnderecoRepo = repo_endereco.NovoRepositorioPostgres(db)
	repo_doacao.DoacaoRepo = repo_doacao.NovoRepositorioPostgres(db)
	repo_imagem.ImagemRepo = repo_imagem.NovoRepositorioPostgres(db)
	repo_historico.HistoricoRepo = repo_historico.NovoRepositorioPostgres(db)
	repo_solicitacao.SolicitacaoRepo = repo_solicitacao.NovoRepositorioPostgres(db)
}
