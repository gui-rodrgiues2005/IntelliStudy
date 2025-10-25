# Estágio 1: Build da aplicação
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build # Este comando gera a pasta 'dist'

# Estágio 2: Servir a aplicação estática com NGINX ou serve
FROM node:20-alpine # Podemos usar o 'serve' novamente ou NGINX
WORKDIR /usr/share/webapps/html
# Copia o resultado da build
COPY --from=build /app/dist . 
# Instala o servidor HTTP estático
RUN npm install -g serve
# Expõe a porta que o serve irá usar
EXPOSE 8080 
# Comando de execução (PROBLEMA AQUI)
CMD serve -s . -l $PORT