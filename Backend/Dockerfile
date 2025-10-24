# Dockerfile para a aplicação Backend (.NET 8)
# Esta versão final resolve todos os erros de build e runtime.

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# IGNORAR CACHE DE PACOTES LOCAIS DO WINDOWS (Solução Nuclear)
# Força o NuGet a ignorar qualquer arquivo de configuração poluído.
ENV NUGET_FALLBACK_PACKAGE_FOLDERS=""

# 1. COPIA O PROJETO (Sem prefixos de pasta, pois está no mesmo diretório)
COPY Backend.csproj .
COPY global.json .

# 2. RESTAURA as dependências
# A TÁTICA FINAL: Usar --configfile /dev/null para ignorar qualquer arquivo de configuração poluído
RUN dotnet restore --configfile /dev/null

# 3. Copia o restante do código.
COPY . .

# 4. CONSTRÓI A APLICAÇÃO (Build)
# Constrói o projeto limpo
RUN dotnet build -c Release --no-restore

# 5. PUBLICA A APLICAÇÃO (Publish)
# Publica usando os binários já construídos
RUN dotnet publish -c Release -o /app/publish --no-build

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (Necessário para o EF Core)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados e o .csproj para a migração funcionar
COPY --from=build /app/publish .
COPY Backend.csproj .

# Comando de entrada principal (ENTRYPOINT):
# 1. Instala EF
# 2. Atualiza PATH
# 3. Migra o Banco de Dados (usando a variável ConnectionStrings__DefaultConnection)
# 4. Inicia a API
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj && \
    exec dotnet Backend.dll"]
