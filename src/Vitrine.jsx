import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function Vitrine() {
    const [exibirModalDetalhes, setExibirModalDetalhes] = useState(false);
    const [produtoDetalhado, setProdutoDetalhado] = useState(null);
    const [produtos, setProdutos] = useState([]);
    const [dadosLoja, setDadosLoja] = useState(null);
    const [carregando, setCarregando] = useState(true);
    
    // NOVOS ESTADOS PARA PERFORMANCE
    const [pagina, setPagina] = useState(0);
    const [temMais, setTemMais] = useState(true);
    const ITENS_POR_PAGINA = 20;

    const params = new URLSearchParams(window.location.search);
    const userIdLoja = params.get("id");

    // Função de busca separada para podermos chamar no "Carregar Mais"
    async function carregarDados(novaPagina = 0) {
        if (!userIdLoja) return;
        
        const de = novaPagina * ITENS_POR_PAGINA;
        const ate = de + ITENS_POR_PAGINA - 1;

        // 1. Busca dados da loja apenas na primeira carga
        if (novaPagina === 0) {
            const { data: loja } = await supabase
                .from("lojas")
                .select("*")
                .eq("user_id", userIdLoja.trim())
                .maybeSingle();
            if (loja) setDadosLoja(loja);
        }

        // 2. Busca produtos com Range (Paginação)
        const { data: lista, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("user_id", userIdLoja.trim())
            .order('created_at', { ascending: false })
            .range(de, ate);

        if (error) {
            console.error("Erro ao buscar produtos:", error);
        } else {
            if (novaPagina === 0) {
                setProdutos(lista || []);
            } else {
                setProdutos(prev => [...prev, ...lista]);
            }

            // Se vier menos que o limite, esgotaram os produtos no banco
            if (lista.length < ITENS_POR_PAGINA) {
                setTemMais(false);
            }
        }
        setCarregando(false);
    }

    useEffect(() => {
        carregarDados(0);
    }, [userIdLoja]);

    const carregarMais = () => {
        const proximaPagina = pagina + 1;
        setPagina(proximaPagina);
        carregarDados(proximaPagina);
    };

    const enviarWhatsApp = (produto) => {
        const idRef = produto.id.toString().toUpperCase();
        const preco = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const textoMensagem = 
            `Olá! Tenho interesse neste produto:\n\n` +
            `📦 *PRODUTO:* ${produto.nome}\n` +
            `🆔 *REF:* ${idRef}\n` +
            `💰 *VALOR:* ${preco}\n\n` +
            `Pode me passar mais informações?`;

        const mensagemCodificada = encodeURIComponent(textoMensagem);
        const numero = dadosLoja?.whatsapp?.toString().replace(/\D/g, "");
        window.open(`https://wa.me/${numero}?text=${mensagemCodificada}`, "_blank");
    };

    if (carregando && produtos.length === 0) return <p className="text-center mt-5">Carregando vitrine...</p>;

    return (
        <div className="bg-light min-vh-100 py-5">
            <div className="container">
                <header className="text-center mb-5">
                    <h1 className="fw-bold display-5 text-dark">{dadosLoja?.nome_loja || "Minha Loja"}</h1>
                    <div className="bg-primary mx-auto mb-3" style={{width: '60px', height: '4px'}}></div>
                    <p className="text-muted">Explore nossas ofertas exclusivas</p>
                </header>

                <div className="row g-4">
                    {produtos.map((p) => (
                        <div key={p.id} className="col-6 col-md-4 col-lg-3">
                            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                <div style={{height: '200px', backgroundColor: '#f0f0f0'}}>
                                    <img src={p.imagem || "https://via.placeholder.com/300x300?text=Sem+Foto"} className="w-100 h-100" style={{objectFit: 'cover'}} alt={p.nome} />
                                </div>
                                <div className="card-body p-3 text-center">
                                    <span className="badge bg-light text-secondary border mb-2" style={{fontSize: '0.6rem'}}>REF: {p.id}</span>
                                    <h6 className="card-title fw-bold text-dark mb-2 text-truncate">{p.nome}</h6>
                                    <h5 className="text-primary fw-bold mb-3">
                                        {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </h5>
                                    <button className="btn btn-sm btn-outline-secondary w-100 mb-2 fw-bold" onClick={() => { setProdutoDetalhado(p); setExibirModalDetalhes(true); }}>DETALHES</button>
                                    <button onClick={() => enviarWhatsApp(p)} className="btn btn-success w-100 rounded-pill btn-sm fw-bold">📲 COMPRAR</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* BOTÃO CARREGAR MAIS */}
                {temMais && (
                    <div className="text-center mt-5 mb-5">
                        <button 
                            className="btn btn-primary px-5 py-2 fw-bold shadow-sm rounded-pill"
                            onClick={carregarMais}
                            disabled={carregando}
                        >
                            {carregando ? "CARREGANDO..." : "VER MAIS PRODUTOS"}
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL DE DETALHES */}
            {exibirModalDetalhes && (
                <div className="modal d-block bg-dark bg-opacity-50" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-light border-0">
                                <h6 className="modal-title fw-bold">Detalhes do Produto</h6>
                                <button type="button" className="btn-close" onClick={() => setExibirModalDetalhes(false)}></button>
                            </div>
                            <div className="modal-body text-center p-4">
                                <img src={produtoDetalhado?.imagem} className="img-fluid rounded mb-3" style={{maxHeight: '200px'}} />
                                <h4 className="fw-bold text-primary">{produtoDetalhado?.nome}</h4>
                                <p className="small text-muted mb-4">{produtoDetalhado?.descricao}</p>
                                <button className="btn btn-success w-100 fw-bold py-2" onClick={() => { enviarWhatsApp(produtoDetalhado); setExibirModalDetalhes(false); }}>
                                    QUERO COMPRAR ESTE ITEM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Vitrine;