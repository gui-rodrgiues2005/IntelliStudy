# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências
COPY Backend.csproj .
RUN dotnet restore

# Copia o resto do código da aplicação
COPY . .

# Publica a aplicação
# O /app/publish é o diretório que contém todos os binários
RUN dotnet publish -c Release -o /app/publish --no-restore

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (necessário para o EF Core)

# ATENÇÃO: Mudamos para a imagem 'sdk' AQUI para que o 'dotnet ef' funcione!
# Se quiséssemos a imagem mais leve, teríamos que usar um script shell separado.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados da etapa de build
COPY --from=build /app/publish .

# Comando de entrada principal:
# 1. Instala a ferramenta 'dotnet ef' globalmente (é a forma mais simples no Docker)
# 2. Roda a migração do banco de dados (database update)
# 3. Inicia o seu aplicativo Backend.dll
ENTRYPOINT ["/bin/bash", "-c", "dotnet tool install --global dotnet-ef --version 8.0.6 && dotnet ef database update && dotnet Backend.dll"]
