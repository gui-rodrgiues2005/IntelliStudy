# ETAPA 1: BUILD - Cria a aplicação (roda 'dotnet publish')
# Usamos a imagem SDK para ter o compilador do .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências
COPY Backend.csproj .
RUN dotnet restore

# Copia o resto do código e publica
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ETAPA 2: RUNTIME - Roda a aplicação (imagem mais leve e segura)
# Usamos a imagem ASPNET para rodar a aplicação
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Comando que será executado para iniciar a sua API
ENTRYPOINT ["dotnet", "Backend.dll"]