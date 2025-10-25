# Estágio 1: Build da aplicação
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build # Este comando gera a pasta 'dist'

# Estágio 2: Servir a aplicação estática com NGINX
FROM nginx:alpine

# Copia o resultado da build para o diretório padrão do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do nginx para SPA
COPY nginx.conf /etc/nginx/nginx.conf

# Substitui as variáveis de ambiente no nginx.conf
RUN export PORT=${PORT:-8080} && envsubst '${PORT}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp && mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

# Comando padrão do nginx (não será usado no Railway devido ao railway.toml)
CMD ["nginx", "-g", "daemon off;"]
