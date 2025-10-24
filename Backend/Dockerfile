# Etapa 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia apenas os arquivos de projeto primeiro (melhor cache)
COPY Backend/Backend.csproj Backend/
WORKDIR /src/Backend

# Restaura as dependências
RUN dotnet restore

# Copia o resto do código
COPY Backend/. .

# Publica a aplicação (gera binários prontos)
RUN dotnet publish -c Release -o /app/publish --no-restore

# Etapa 2: Runtime (imagem mais leve)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copia os arquivos publicados do build
COPY --from=build /app/publish .

# Copia arquivos de configuração necessários
COPY --from=build /src/Backend/appsettings.json .
COPY --from=build /src/Backend/appsettings.Development.json .

# Expõe a porta 80
EXPOSE 80

# Inicia a aplicação
ENTRYPOINT ["dotnet", "Backend.dll"]
