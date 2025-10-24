# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. COPIA O PROJETO para restaurar e garantir que o NuGet use o cache do Docker, não do Windows.
COPY Backend.csproj .
# Copia o arquivo global.json, se existir, para controle da versão do SDK
COPY global.json .

# 2. RESTAURA as dependências
RUN dotnet restore

# 3. Copia o restante do código. O arquivo global.json já está copiado.
COPY . .

# 4. PUBLICA A APLICAÇÃO
# Removemos o '--no-restore' para que o publish use o cache do restore anterior (passo 2)
# E especificamos o projeto para evitar ambiguidade.
RUN dotnet publish Backend.csproj -c Release -o /app/publish

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (necessário para o EF Core e migração)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados da etapa de build
COPY --from=build /app/publish .

# Comando de entrada principal:
# Garante que o banco de dados seja atualizado antes de iniciar a API
ENTRYPOINT ["/bin/bash", "-c", "dotnet tool install --global dotnet-ef --version 8.0.6 && dotnet ef database update && dotnet Backend.dll"]
