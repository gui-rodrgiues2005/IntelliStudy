# Dockerfile para a aplicação Backend (.NET 8)
# Esta versão final resolve o erro de cache do Windows (C:\Program Files...)

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# IGNORAR CACHE DE PACOTES LOCAIS DO WINDOWS
# Este é o fix crucial para o erro MSB4018 'Unable to find fallback package folder C:\...'
# Manter a variável como precaução
ENV NUGET_FALLBACK_PACKAGE_FOLDERS=""

# 1. COPIA O PROJETO
COPY Backend.csproj .
COPY global.json .

# 2. RESTAURA as dependências
# A TÁTICA FINAL: Usar --configfile /dev/null para ignorar qualquer arquivo de configuração poluído
RUN dotnet restore --configfile /dev/null

# 3. Copia o restante do código.
COPY . .

# 4. CONSTRÓI A APLICAÇÃO (Build)
# Usamos o --no-restore agora que o restore anterior está limpo
RUN dotnet build Backend.csproj -c Release --no-restore

# 5. PUBLICA A APLICAÇÃO (Publish)
RUN dotnet publish Backend.csproj -c Release -o /app/publish --no-build

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados e o .csproj para a migração funcionar
COPY --from=build /app/publish .
COPY Backend.csproj .

# Comando de entrada principal (ENTRYPOINT):
# Instala EF > Atualiza PATH > Migração > Início da API
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj && \
    exec dotnet Backend.dll"]
