# 📦 Latorre Digital Tech - Vitrine & Painel de Controle

Este é um projeto full-stack de uma **Vitrine Digital** com um **Painel Administrativo** integrado. O objetivo é permitir que lojistas cadastrem produtos, gerenciem estoque e compartilhem um link personalizado para que clientes façam pedidos via WhatsApp.

![Demonstração do Projeto](app-lojista.gif)

## 🚀 Funcionalidades

### 🛒 Para o Cliente (Vitrine)
* **Visualização Responsiva:** Layout adaptável para mobile e desktop usando Bootstrap.
* **Performance:** Carregamento otimizado com sistema de paginação (20 em 20 itens).
* **Integração WhatsApp:** Botão de compra que gera mensagem automática com nome, preço e referência do produto.
* **Detalhes do Produto:** Modal com descrição completa e imagem ampliada.

### ⚙️ Para o Lojista (Painel)
* **Autenticação:** Sistema de login seguro via Supabase Auth.
* **Gestão de Produtos:** CRUD completo (Criar, Ler, Atualizar e Excluir).
* **Controle de Estoque:** Baixa de venda ($) e estorno de produtos (🔄) com um clique.
* **Dashboard:** Resumo em tempo real do valor total em estoque e contagem de SKUs.
* **Customização:** Edição rápida do nome da loja e número de contato.
* **Upload de Imagens:** Integração com Supabase Storage para fotos dos produtos.

## 🛠️ Tecnologias Utilizadas

* **Front-end:** [React.js](https://reactjs.org/)
* **Estilização:** [Bootstrap 5](https://getbootstrap.com/)
* **Backend como Serviço (BaaS):** [Supabase](https://supabase.com/) (Banco de Dados PostgreSQL, Auth e Storage)
* **Ícones:** Emojis e Bootstrap Icons.

## 📦 Como executar o projeto

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
