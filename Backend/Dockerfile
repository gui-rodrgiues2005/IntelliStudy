# Dockerfile para a aplicação Backend (.NET 8)
# Esta versão final corrige o erro persistente de cache do Windows (C:\Program Files...)

# ETAPA 1: BUILD - Cria a aplicação usando a imagem SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# **CORREÇÃO: REMOVEMOS A VARIÁVEL DE AMBIENTE E SIMPLIFICAMOS O FLUXO**

# 1. COPIA OS ARQUIVOS DE PROJETO
COPY Backend.csproj .
COPY global.json .

# 2. RESTAURAÇÃO das dependências
# Apenas restaura, sem tentar limpar o NuGet.Config, pois a variável de ambiente não é mais necessária.
RUN dotnet restore

# 3. Copia o restante do código.
COPY . .

# 4. PUBLICA A APLICAÇÃO (Publish) - **ESTE PASSO FAZ O BUILD E PUBLICAÇÃO**
# O comando 'publish' faz o 'build' e resolve o problema de assets de forma mais limpa.
RUN dotnet publish -c Release -o /app/publish

# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (Necessário para o EF Core)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados e o .csproj para a migração funcionar
COPY --from=build /app/publish .
COPY Backend.csproj .

# Comando de entrada principal (ENTRYPOINT):
# 1. Instala EF
# 2. Atualiza PATH (para encontrar o EF)
# 3. Migra o Banco de Dados (usando a variável ConnectionStrings__DefaultConnection)
# 4. Inicia a API
ENTRYPOINT ["/bin/bash", "-c", "\
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    dotnet ef database update --project Backend.csproj && \
    exec dotnet Backend.dll"]
