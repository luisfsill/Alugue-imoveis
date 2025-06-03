# 🏠 Alugue-imoveis - Plataforma de Anúncios Imobiliários

## 📝 Sobre o Projeto
Alugue-imoveis é uma plataforma moderna e intuitiva para anúncios imobiliários, desenvolvida com React e TypeScript. A plataforma permite que corretores e administradores gerenciem imóveis para venda e aluguel de forma eficiente.

## ✨ Funcionalidades Principais

### 👤 Área do Usuário
- 🔐 Sistema de autenticação seguro com Supabase
- 👥 Diferentes níveis de acesso (Admin e Corretor)
- 🚪 Logout seguro
- 🛡️ Sistema de segurança e rate limiting

### 🏢 Gestão de Imóveis
- ➕ Cadastro de novos imóveis
- ✏️ Edição de imóveis existentes
- 🗑️ Exclusão de imóveis
- 📸 Upload de múltiplas imagens (até 12 fotos)
- 🖼️ Seleção de foto de capa
- ⭐ Marcação de imóveis em destaque
- 🔄 Sistema de carrossel de imagens responsivo

### 📋 Detalhes do Imóvel
- 💰 Preço em Real (R$) para venda ou aluguel
- 🛏️ Número de quartos
- 🚿 Número de banheiros
- 📏 Área em metros quadrados
- 📍 Localização
- 📝 Descrição detalhada

### 🏊‍♂️ Características do Imóvel
- 🏊‍♂️ Piscina
- 🌳 Jardim
- 🚗 Garagem
- 🛡️ Sistema de Segurança
- ❄️ Ar Condicionado Central
- 🏠 Eletrodomésticos de Alto Padrão

### 👨‍💼 Informações do Corretor
- 📞 Telefone de contato
- 📧 Email de contato

## 🛠️ Tecnologias Utilizadas

- ⚛️ React 18
- 📘 TypeScript
- 🎨 Tailwind CSS
- 🔥 Supabase (Backend, Auth e Storage)
- 📱 React Router
- 🎯 React Hot Toast
- 🖼️ React Dropzone
- 🎬 Framer Motion
- ⚡ Vite

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/luisfsill/Alugue-imoveis.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

4. Inicie o projeto:
```bash
npm run dev
```

## 🔧 Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as tabelas necessárias:
   - `properties`
   - `property_features`
   - `property_images`
4. Configure as políticas de segurança RLS
5. Configure o storage para upload de imagens
6. Copie as credenciais para o arquivo `.env`

## 📱 Responsividade
O projeto é totalmente responsivo e funciona em:
- 📱 Smartphones
- 💻 Tablets
- 🖥️ Desktops

## 🚀 Deploy
O projeto está configurado para deploy automático no Netlify.

## 🤝 Contribuindo
Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👥 Autores
- Luis Felipe - [@luisfsill](https://github.com/luisfsill)

## 🙏 Agradecimentos
- [Supabase](https://supabase.com)
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) 
