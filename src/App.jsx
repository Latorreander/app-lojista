import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ==========================================
// FUNÇÕES DE UTILIDADE
// ==========================================
const limparParaBanco = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    if (!apenasNumeros) return "";
    return apenasNumeros.startsWith("55") ? apenasNumeros : `55${apenasNumeros}`;
};

const aplicarMascara = (valor) => {
    if (!valor) return "";
    let v = valor.replace(/\D/g, "");
    if (v.startsWith("55")) v = v.substring(2);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    return v.substring(0, 15);
};

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

function App() {
    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [statusLogin, setStatusLogin] = useState("ocioso");

    const [editandoLoja, setEditandoLoja] = useState(false);
    const [novoNomeLoja, setNovoNomeLoja] = useState("");
    const [novoWhatsapp, setNovoWhatsapp] = useState("");
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);
    const [salvandoProduto, setSalvandoProduto] = useState(false);
    const [dadosLoja, setDadosLoja] = useState({ nome_loja: "", whatsapp: "" });

    const [produtos, setProdutos] = useState([]);
    const [busca, setBusca] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [estoque, setEstoque] = useState("");
    const [arquivoFoto, setArquivoFoto] = useState(null);
    const [idEditando, setIdEditando] = useState(null);

    const [feedback, setFeedback] = useState({ exibir: false, mensagem: "", tipo: "" });
    const [exibirModalExcluir, setExibirModalExcluir] = useState(false);
    const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
    const [exibirModalVenda, setExibirModalVenda] = useState(false);
    const [produtoParaVender, setProdutoParaVender] = useState(null);
    const [exibirModalErro, setExibirModalErro] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");
    const [exibirModalDetalhes, setExibirModalDetalhes] = useState(false);
    const [produtoDetalhado, setProdutoDetalhado] = useState(null);
    const [quantidadeVenda, setQuantidadeVenda] = useState(1);
    const [exibirModalEstorno, setExibirModalEstorno] = useState(false);
    const [produtoParaEstornar, setProdutoParaEstornar] = useState(null);
    const [quantidadeEstorno, setQuantidadeEstorno] = useState(1);

    // ==========================================
    // 2. EFEITOS E LÓGICA
    // ==========================================
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    const carregarDadosPainel = useCallback(async () => {
        if (!session) return;
        const { data: p } = await supabase.from("produtos").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
        const { data: l } = await supabase.from("lojas").select("*").eq("user_id", session.user.id).maybeSingle();
        if (p) setProdutos(p);
        if (l) setDadosLoja(l);
    }, [session]);

    useEffect(() => {
        if (session) carregarDadosPainel();
    }, [session, carregarDadosPainel]);

    // ==========================================
    // 3. HANDLERS
    // ==========================================
    const copiarLinkVitrine = () => {
        if (!session?.user?.id) return;
        const link = `${window.location.origin}/vitrine?id=${session.user.id}`;
        navigator.clipboard.writeText(link);
        alert("Link copiado!");
    };

    async function handleAuth() {
        if (!email || !senha) return;
        setStatusLogin("carregando");
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        setTimeout(() => {
            if (error) { setStatusLogin("ocioso"); setMensagemErro("Erro no login"); setExibirModalErro(true); }
            else { setStatusLogin("sucesso"); }
        }, 800);
    }

    async function subirFoto(arquivo) {
        const nomeArquivo = `${Date.now()}_${arquivo.name}`;
        const { error } = await supabase.storage.from("fotos_produtos").upload(nomeArquivo, arquivo);
        if (error) return null;
        const { data } = supabase.storage.from("fotos_produtos").getPublicUrl(nomeArquivo);
        return data.publicUrl;
    }

    async function salvarProduto(e) {
        e.preventDefault();
        setSalvandoProduto(true);
        let urlImagem = null;
        if (arquivoFoto) urlImagem = await subirFoto(arquivoFoto);

        const dados = { nome, descricao, preco: parseFloat(preco), estoque: parseInt(estoque), user_id: session.user.id };
        if (urlImagem) dados.imagem = urlImagem;

        const { error } = idEditando 
            ? await supabase.from("produtos").update(dados).eq("id", idEditando) 
            : await supabase.from("produtos").insert([dados]);

        setTimeout(() => {
            if (!error) {
                setNome(""); setDescricao(""); setPreco(""); setEstoque(""); setArquivoFoto(null); setIdEditando(null);
                carregarDadosPainel();
                setFeedback({ exibir: true, mensagem: "Sucesso!", tipo: "success" });
                setTimeout(() => setFeedback({ exibir: false }), 3000);
            }
            setSalvandoProduto(false);
        }, 800);
    }

    async function salvarConfiguracoesLoja() {
        const numeroTratado = limparParaBanco(novoWhatsapp);
        setSalvandoPerfil(true);
        const { error } = await supabase.from("lojas").upsert({ 
            user_id: session.user.id, nome_loja: novoNomeLoja, whatsapp: numeroTratado 
        });
        setTimeout(() => {
            if (!error) { carregarDadosPainel(); setEditandoLoja(false); }
            setSalvandoPerfil(false);
        }, 800);
    }

    async function confirmarVenda() {
        const qtd = parseInt(quantidadeVenda);
        const novoEstoque = produtoParaVender.estoque - qtd;
        const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", produtoParaVender.id);
        if (!error) { setExibirModalVenda(false); carregarDadosPainel(); }
    }

    async function confirmarEstorno() {
        const qtd = parseInt(quantidadeEstorno);
        const novoEstoque = (produtoParaEstornar.estoque || 0) + qtd;
        const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", produtoParaEstornar.id);
        if (!error) { setExibirModalEstorno(false); carregarDadosPainel(); }
    }

    async function excluirProduto() {
        const { error } = await supabase.from("produtos").delete().eq("id", produtoParaExcluir.id);
        if (!error) { setExibirModalExcluir(false); carregarDadosPainel(); }
    }

    // ==========================================
    // 4. FILTROS E RENDER (LÓGICA CORRIGIDA AQUI)
    // ==========================================
    const produtosFiltrados = produtos.filter(p => {
        const termo = busca.toLowerCase().trim();
        
        // Se a busca estiver vazia, mostramos todos os produtos normalmente
        if (!termo) return true;

        // Se houver busca, filtramos rigorosamente por Nome ou REF
        const referencia = p.id.toString().slice(-6).toUpperCase();
        return p.nome.toLowerCase().includes(termo) || referencia.includes(termo.toUpperCase());
    });
    
    const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
    const produtosPaginados = produtosFiltrados.slice((paginaAtual-1)*itensPorPagina, paginaAtual*itensPorPagina);

    if (!session) return (
        <div className="container vh-100 d-flex justify-content-center align-items-center">
            <div className="card p-4 shadow text-center" style={{maxWidth: '380px', width:'100%'}}>
                <h4 className="fw-bold text-primary mb-4">Login</h4>
                <input type="email" placeholder="E-mail" autoComplete="off" className="form-control mb-2" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Senha" autoComplete="new-password" className="form-control mb-4" onChange={e => setSenha(e.target.value)} />
                <button className="btn btn-primary w-100 fw-bold" onClick={handleAuth} disabled={statusLogin === "carregando"}>
                    {statusLogin === "carregando" ? <span className="spinner-border spinner-border-sm"></span> : "ENTRAR"}
                </button>
            </div>
        </div>
    );

   return (
        <div className="bg-light min-vh-100 pb-5">
            <nav className="navbar navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <span className="navbar-brand fw-bold">📦 {dadosLoja.nome_loja || "Meu Painel"}</span>
                    <button className="btn btn-sm btn-light fw-bold" onClick={() => supabase.auth.signOut()}>SAIR</button>
                </div>
            </nav>

            {feedback.exibir && <div className="alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow" style={{zIndex: 3000}}>{feedback.mensagem}</div>}

            <div className="container">
                {/* DASHBOARD DE TOTAIS */}
                <div className="row g-3 mb-4 text-center">
                    <div className="col-md-4">
                        <div className="card shadow-sm border-0 p-3">
                            <small className="text-muted fw-bold">VALOR TOTAL DO ESTOQUE</small>
                            <h4 className="text-primary fw-bold mb-0">
                                {formatarMoeda(produtos.reduce((acc, p) => acc + (p.preco * p.estoque), 0))}
                            </h4>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card shadow-sm border-0 p-3">
                            <small className="text-muted fw-bold">TOTAL DE PRODUTOS (SKU)</small>
                            <h4 className="text-dark fw-bold mb-0">{produtos.length}</h4>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card shadow-sm border-0 p-3">
                            <small className="text-muted fw-bold">UNIDADES EM ESTOQUE</small>
                            <h4 className="text-dark fw-bold mb-0">{produtos.reduce((acc, p) => acc + p.estoque, 0)}</h4>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <button className="btn btn-outline-primary rounded-pill fw-bold" onClick={copiarLinkVitrine}>🔗 COPIAR LINK DA VITRINE</button>
                </div>

                <div className="row g-4">
                    {/* FORMULÁRIO */}
                    <div className="col-md-4">
                        <div className="card p-4 shadow-sm border-0 sticky-top" style={{top: '20px'}}>
                            <h6 className="fw-bold">{idEditando ? "✏️ Editar" : "➕ Cadastrar"} Produto</h6>
                            <form onSubmit={salvarProduto}>
                                <input type="text" placeholder="Nome" className="form-control mb-2" value={nome} onChange={e => setNome(e.target.value)} required />
                                <textarea placeholder="Descrição" className="form-control mb-2" value={descricao} onChange={e => setDescricao(e.target.value)} />
                                <div className="row g-2 mb-3">
                                    <div className="col-6"><input type="number" step="0.01" placeholder="Preço" className="form-control" value={preco} onChange={e => setPreco(e.target.value)} required /></div>
                                    <div className="col-6"><input type="number" placeholder="Estoque" className="form-control" value={estoque} onChange={e => setEstoque(e.target.value)} required /></div>
                                </div>
                                <input type="file" className="form-control mb-2" onChange={e => setArquivoFoto(e.target.files[0])} />
                                <button className="btn btn-primary w-100 fw-bold" type="submit" disabled={salvandoProduto}>
                                    {salvandoProduto ? <span className="spinner-border spinner-border-sm"></span> : (idEditando ? "SALVAR ALTERAÇÕES" : "CADASTRAR")}
                                </button>
                                {idEditando && <button className="btn btn-link btn-sm w-100 text-muted" onClick={() => {setIdEditando(null); setNome(""); setPreco(""); setEstoque("");}}>Cancelar Edição</button>}
                            </form>
                        </div>
                    </div>

                    {/* LISTAGEM */}
                    <div className="col-md-8">
                        {/* Configurações de Perfil Rápida */}
                        <div className="card p-3 mb-4 shadow-sm border-0">
                            {editandoLoja ? (
                                <div className="row g-2">
                                    <div className="col-5"><input className="form-control form-control-sm" value={novoNomeLoja} onChange={e => setNovoNomeLoja(e.target.value)} /></div>
                                    <div className="col-5"><input className="form-control form-control-sm" value={aplicarMascara(novoWhatsapp)} onChange={e => setNovoWhatsapp(e.target.value)} /></div>
                                    <div className="col-2 d-flex gap-1">
                                        <button className="btn btn-success btn-sm w-100" onClick={salvarConfiguracoesLoja}>OK</button>
                                        <button className="btn btn-light btn-sm border w-100" onClick={() => setEditandoLoja(false)}>X</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex justify-content-between">
                                    <small><strong>{dadosLoja.nome_loja}</strong> | {aplicarMascara(dadosLoja.whatsapp)}</small>
                                    <button className="btn btn-sm btn-outline-primary py-0" onClick={() => {setNovoNomeLoja(dadosLoja.nome_loja); setNovoWhatsapp(dadosLoja.whatsapp); setEditandoLoja(true);}}>Editar Perfil</button>
                                </div>
                            )}
                        </div>

                        <div className="card p-3 shadow-sm border-0">
                            <input type="text" placeholder="Buscar por Nome ou REF" className="form-control mb-3" onChange={e => setBusca(e.target.value)} />
                            <div className="table-responsive">
                                <table className="table table-hover align-middle text-center">
                                    <thead><tr><th>FOTO</th><th>NOME</th><th>PREÇO</th><th>QTD</th><th>AÇÕES</th></tr></thead>
                                    <tbody>
                                        {produtosPaginados.map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <img src={p.imagem || "https://via.placeholder.com/40"} width="40" height="40" className="rounded shadow-sm" style={{objectFit: 'cover'}} /></td>
                                                    <td className="text-start">
                                                    <div className="fw-bold">{p.nome}</div>
                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        REF: {p.id.toString().slice(-6).toUpperCase()}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        display: 'inline-block',
                                                        padding: '4px 10px',
                                                        fontSize: '0.80rem', 
                                                        fontWeight: '400',
                                                        backgroundColor: '#f8f9fa', 
                                                        borderRadius: '4px', 
                                                        border: `1px solid ${p.estoque <= 0 ? '#dc3545' : p.estoque < 5 ? '#ffc107' : '#198754'}`,
                                                        color: p.estoque <= 0 ? '#dc3545' : '#495057',
                                                        minWidth: '55px'
                                                    }}>
                                                        {p.estoque <= 0 ? 'esgotado' : `${p.estoque} un`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <button className="btn btn-sm btn-info text-white d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', padding: 0}} onClick={() => {setProdutoDetalhado(p); setExibirModalDetalhes(true);}}>ℹ️</button>
                                                        <button className="btn btn-sm btn-success d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', padding: 0}} onClick={() => {setProdutoParaVender(p); setExibirModalVenda(true);}} disabled={p.estoque <= 0}>$</button>
                                                        <button className="btn btn-sm btn-warning d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', padding: 0}} onClick={() => {setProdutoParaEstornar(p); setExibirModalEstorno(true);}}>🔄</button>
                                                        <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', padding: 0}} onClick={() => {
                                                            setIdEditando(p.id); setNome(p.nome); setDescricao(p.descricao);
                                                            setPreco(p.preco); setEstoque(p.estoque); window.scrollTo(0,0);
                                                        }}>✏️</button>
                                                        <button className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', padding: 0}} onClick={() => {setProdutoParaExcluir(p); setExibirModalExcluir(true);}}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPaginas > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <small className="text-muted">Página {paginaAtual} de {totalPaginas}</small>
                                    <div className="btn-group">
                                        <button className="btn btn-sm btn-outline-primary" disabled={paginaAtual === 1} onClick={() => setPaginaAtual(prev => prev - 1)}>Anterior</button>
                                        <button className="btn btn-sm btn-outline-primary" disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(prev => prev + 1)}>Próximo</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAIS */}
            {exibirModalVenda && (
                <div className="modal d-block bg-dark bg-opacity-50" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:2000}}>
                    <div className="modal-dialog modal-sm modal-dialog-centered text-center">
                        <div className="modal-content p-4 shadow-lg border-0">
                            <h6 className="fw-bold">Baixar Estoque</h6>
                            <input type="number" className="form-control text-center mb-3" value={quantidadeVenda} onChange={e => setQuantidadeVenda(e.target.value)} />
                            <div className="d-flex gap-2">
                                <button className="btn btn-light w-100" onClick={() => setExibirModalVenda(false)}>Sair</button>
                                <button className="btn btn-success w-100" onClick={confirmarVenda}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {exibirModalEstorno && (
                <div className="modal d-block bg-dark bg-opacity-50" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:2000}}>
                    <div className="modal-dialog modal-sm modal-dialog-centered text-center">
                        <div className="modal-content p-4 shadow-lg border-0">
                            <h6 className="fw-bold text-warning">Estornar Produto</h6>
                            <input type="number" className="form-control text-center mb-3 border-warning" value={quantidadeEstorno} onChange={e => setQuantidadeEstorno(e.target.value)} />
                            <div className="d-flex gap-2">
                                <button className="btn btn-light w-100" onClick={() => setExibirModalEstorno(false)}>Sair</button>
                                <button className="btn btn-warning w-100" onClick={confirmarEstorno}>Estornar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {exibirModalExcluir && (
                <div className="modal d-block bg-dark bg-opacity-50" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:2000}}>
                    <div className="modal-dialog modal-sm modal-dialog-centered text-center">
                        <div className="modal-content p-4 shadow-lg border-0">
                            <h6 className="fw-bold text-danger">Excluir {produtoParaExcluir?.nome}?</h6>
                            <div className="d-flex gap-2">
                                <button className="btn btn-light w-100" onClick={() => setExibirModalExcluir(false)}>Não</button>
                                <button className="btn btn-danger w-100" onClick={excluirProduto}>Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

           {exibirModalDetalhes && (
                <div className="modal d-block bg-dark bg-opacity-50" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:2000}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 p-3 shadow-lg">
                            <div className="modal-header border-0 d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold mb-0">Detalhes do Produto</h6>
                                <button className="btn-close" onClick={() => setExibirModalDetalhes(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                {produtoDetalhado?.imagem && (
                                    <img src={produtoDetalhado.imagem} className="img-fluid rounded mb-3 shadow-sm" style={{maxHeight: '250px', objectFit: 'contain'}} />
                                )}
                                <h5 className="fw-bold mb-1">{produtoDetalhado?.nome}</h5>
                                <div className="badge bg-light text-dark border mb-3">
                                    REF: {produtoDetalhado?.id.toString().slice(-6).toUpperCase()}
                                </div>
                                <p className="text-muted small text-start border-top pt-2">
                                    {produtoDetalhado?.descricao || "Sem descrição disponível."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;