# 🏠 Alugue-Escarpas - Plataforma de Anúncios Imobiliários

## 📝 Sobre o Projeto
Alugue-Escarpas é uma plataforma moderna e intuitiva para anúncios imobiliários, desenvolvida com React e TypeScript. A plataforma permite que corretores e administradores gerenciem imóveis para venda e aluguel de forma eficiente.

## ✨ Funcionalidades Principais

### 👤 Área do Usuário
- 🔐 Sistema de autenticação seguro
- 👥 Diferentes níveis de acesso (Admin e Corretor)
- 🚪 Logout seguro

### 🏢 Gestão de Imóveis
- ➕ Cadastro de novos imóveis
- ✏️ Edição de imóveis existentes
- 🗑️ Exclusão de imóveis
- 📸 Upload de múltiplas imagens (até 12 fotos)
- 🖼️ Seleção de foto de capa
- ⭐ Marcação de imóveis em destaque

### 📋 Detalhes do Imóvel
- 💰 Preço (venda ou aluguel)
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

- ⚛️ React
- 📘 TypeScript
- 🎨 Tailwind CSS
- 🔥 Supabase (Backend e Autenticação)
- 📱 React Router
- 🎯 React Hot Toast
- 🖼️ React Dropzone

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/Alugue-Escarpas.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_STORAGE_URL=sua_url_do_storage
VITE_STORAGE_KEY=sua_chave_do_storage
VITE_API_URL=sua_url_da_api
VITE_API_KEY=sua_chave_da_api
VITE_APP_NAME=Alugue-Escarpas
VITE_APP_URL=http://localhost:5173
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
   - `users`
4. Configure as políticas de segurança
5. Copie as credenciais para o arquivo `.env`

## 📱 Responsividade
O projeto é totalmente responsivo e funciona em:
- 📱 Smartphones
- 💻 Tablets
- 🖥️ Desktops

## 🤝 Contribuindo
Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores
- Seu Nome - [@seu-usuario](https://github.com/seu-usuario)

## 🙏 Agradecimentos
- [Supabase](https://supabase.com)
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)

## 🔒 Segurança
- Nunca compartilhe suas credenciais do Supabase
- Mantenha o arquivo `.env` seguro e nunca o compartilhe
- Use o arquivo `.env.example` como referência para configurar suas variáveis de ambiente 