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

# Expõe a porta 8080 (Railway usa essa porta)
EXPOSE 8080

# Comando padrão do nginx
CMD ["nginx", "-g", "daemon off;"]
