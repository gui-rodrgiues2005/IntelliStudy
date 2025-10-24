# ETAPA 1: BUILD - Cria a aplicação
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o arquivo de projeto
# É crucial COPIAR SÓ o .csproj e rodar o restore antes de copiar o resto do código.
COPY Backend.csproj .

# Restaura as dependências (Limpo!)
# O Railway deve ter o .nuget/packages/ preenchido.
RUN dotnet restore

# Copia o resto do código
COPY . .

# Publica a aplicação sem restaurar de novo (sem o '--no-restore')
# Isso evita o erro do MSBuild
# Use o argumento --self-contained para garantir que todas as libs estejam na saída.
RUN dotnet publish -c Release -o /app/publish

# ETAPA 2: RUNTIME - Roda a aplicação (imagem mais leve e segura)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Backend.dll"]