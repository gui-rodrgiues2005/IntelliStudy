# Dockerfile para a aplicação Backend (.NET 8)

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. COPIA OS ARQUIVOS DE PROJETO
COPY Backend.csproj .
COPY global.json .

# 2. RESTAURAÇÃO das dependências
RUN dotnet restore

# 3. Copia o restante do código.
COPY . .

# 4. PUBLICA A APLICAÇÃO (Publish)
RUN dotnet publish -c Release -o /app/publish

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (Necessário para o EF Core)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados e o .csproj para a migração funcionar
COPY --from=build /app/publish .
COPY Backend.csproj .

# Copia arquivos necessários para EF Core funcionar
COPY --from=build /src/Data ./Data
COPY --from=build /src/Migrations ./Migrations
COPY --from=build /src/Models ./Models
COPY --from=build /src/appsettings.json .
COPY --from=build /src/appsettings.Development.json .

# Comando de entrada principal (ENTRYPOINT) CORRIGIDO:
# Instala EF, roda migrations e inicia a aplicação
ENTRYPOINT ["/bin/bash", "-c", "\
    echo 'Instalando dotnet-ef...' && \
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    echo 'Executando migrations...' && \
    dotnet ef database update --project Backend.csproj && \
    echo 'Iniciando aplicação...' && \
    exec dotnet Backend.dll"]
