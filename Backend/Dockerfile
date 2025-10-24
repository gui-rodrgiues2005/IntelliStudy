# Dockerfile para a aplicação Backend (.NET 8)
# Esta versão resolve o erro de 'C:\Program Files...' e garante a migração.

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# IGNORAR CACHE DE PACOTES LOCAIS DO WINDOWS
# Este é o fix crucial para o erro MSB4018 'Unable to find fallback package folder C:\...'
ENV NUGET_FALLBACK_PACKAGE_FOLDERS=""

# 1. COPIA O PROJETO para garantir o cache do restore
COPY Backend.csproj .
COPY global.json .

# 2. RESTAURA as dependências
RUN dotnet restore

# 3. Copia o restante do código.
COPY . .

# 4. CONSTRÓI A APLICAÇÃO (Build)
# Isso é mais limpo que o publish para evitar o erro de cache
RUN dotnet build -c Release --no-restore

# 5. PUBLICA A APLICAÇÃO (Publish)
# Agora só copiamos os binários do resultado do build, o que é mais seguro
RUN dotnet publish Backend.csproj -c Release -o /app/publish --no-build

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK
# Usamos o SDK na fase final para que o 'dotnet ef' funcione.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados da etapa de build
COPY --from=build /app/publish .

# Copia o arquivo .csproj para que o dotnet-ef possa encontrá-lo
COPY Backend.csproj .

# Comando de entrada principal (ENTRYPOINT):
# Executa 4 comandos: Instalação do EF > Atualização do PATH > Migração > Início da API
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj && \
    exec dotnet Backend.dll"]