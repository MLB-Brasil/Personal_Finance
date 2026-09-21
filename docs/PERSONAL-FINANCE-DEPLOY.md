# Publicação segura do Personal Finance

## 1. Criar e proteger o banco

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, cole e execute personal-finance-supabase.sql.
3. Em **Authentication > Providers**, habilite Google e GitHub.
4. Copie a URL do projeto e a chave **anon/publishable** para personal-finance.config.js.

## 2. Configurar Google

No Google Cloud, crie um cliente OAuth do tipo **Web application**. Cadastre:

- Origem JavaScript autorizada: a origem HTTPS do site, por exemplo https://seuusuario.github.io.
- Redirect URI autorizada: https://SEU-PROJETO.supabase.co/auth/v1/callback.

No Supabase, informe o Client ID e Client Secret do Google. Em **Authentication > URL Configuration**, cadastre a URL final do app como Site URL e Redirect URL permitida.

## 3. Configurar GitHub

No GitHub, crie uma OAuth App. Use:

- Homepage URL: URL HTTPS do aplicativo.
- Authorization callback URL: https://SEU-PROJETO.supabase.co/auth/v1/callback.

No Supabase, informe o Client ID e Client Secret da OAuth App e acrescente a URL final do aplicativo à lista de Redirect URLs.

## 4. Hospedar

Publique juntos PersonalFinance.html, personal-finance.config.js, manifest.webmanifest, icon.svg e sw.js em um host HTTPS. GitHub Pages, Netlify e Vercel funcionam.

Se usar GitHub Pages, renomeie PersonalFinance.html para index.html. Mantenha o repositório privado até conferir que não há dados reais, chaves secretas ou backups no histórico.

## Verificação de segurança

- Teste duas contas diferentes: uma não pode ver os lançamentos da outra.
- No navegador, confirme que só aparece a chave anon/publishable; uma chave service_role nunca pode ir para o cliente.
- Teste logout, novo login em outro dispositivo e importação/exportação.
- Configure aviso de privacidade, contato para solicitações dos titulares e uma rotina de exclusão de conta/dados antes de abrir ao público.
