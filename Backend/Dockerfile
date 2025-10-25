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
# ETAPA 2: RUNTIME/FINAL - Roda a aplicação com o SDK (Necessário para o EF Core)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app

# 1. Copia o .csproj e os binários publicados
COPY --from=build /app/publish .
# O .csproj é necessário para o 'dotnet ef'
COPY Backend.csproj .

# 2. Otimiza o ENTRYPOINT
ENTRYPOINT ["/bin/bash", "-c", "\
    # Instala o EF Core localmente (se já não estiver instalado)
    dotnet tool install --global dotnet-ef --version 8.0.6 --no-cache && \
    export PATH=\"$PATH:/root/.dotnet/tools\" && \
    \
    # Executa a migração (usando o projeto atual como startup)
    # Garante que o dotnet ef consiga encontrar o projeto
    dotnet ef database update --project Backend.csproj --startup-project . && \
    \
    # Inicia a aplicação
    exec dotnet Backend.dll"]
