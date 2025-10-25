# Dockerfile para aplicação Backend (.NET 8) pronta para Railway

# ========================
# ETAPA 1: BUILD
# ========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o projeto principal
COPY Backend.csproj ./
COPY global.json ./

# Restaura as dependências
RUN dotnet restore

# Copia todo o código
COPY . ./

# Publica a aplicação
RUN dotnet publish Backend.csproj -c Release -o /app/publish

# ========================
# ETAPA 2: RUNTIME
# ========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados
COPY --from=build /app/publish ./

# Porta padrão do ASP.NET Core
EXPOSE 80

# Comando de inicialização da aplicação
ENTRYPOINT ["dotnet", "Backend.dll"]
