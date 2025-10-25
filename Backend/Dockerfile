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

# Comando de entrada principal (ENTRYPOINT) CORRIGIDO:
# Usa --startup-project . para que o dotnet ef encontre o Backend.dll
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj --startup-project . && \
    exec dotnet Backend.dll"]
