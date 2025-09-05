FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["IntelliInspectApi.csproj", "."]
RUN dotnet restore "IntelliInspectApi.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "IntelliInspectApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IntelliInspectApi.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IntelliInspectApi.dll"]