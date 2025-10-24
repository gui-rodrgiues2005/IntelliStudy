# Dockerfile para a aplicação Backend (.NET 8)
# Esta versão garante que a migração do Entity Framework Core seja aplicada no deploy.

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. COPIA O PROJETO para garantir o cache do restore
COPY Backend.csproj .
# Copia o arquivo global.json, se existir
COPY global.json .

# 2. RESTAURA as dependências
RUN dotnet restore

# 3. Copia o restante do código.
COPY . .

# 4. PUBLICA A APLICAÇÃO
# Usamos a flag --no-restore para evitar erros de cache do MSBuild (erros de caminhos do Windows)
RUN dotnet publish Backend.csproj -c Release -o /app/publish --no-restore

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK
# Usamos o SDK na fase final para garantir que o 'dotnet ef' esteja disponível.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados da etapa de build
COPY --from=build /app/publish .

# Copia o arquivo .csproj para que o dotnet-ef possa encontrá-lo
COPY Backend.csproj .

# Comando de entrada principal (ENTRYPOINT):
# Executa 4 comandos em sequência: Instalação do EF > Atualização do PATH > Migração > Início da API
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj && \
    exec dotnet Backend.dll"]
