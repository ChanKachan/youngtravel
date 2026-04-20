FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["WebServer/WebServer.csproj", "WebServer/"]
RUN dotnet restore "WebServer/WebServer.csproj"

COPY . .
WORKDIR /src/WebServer
RUN dotnet publish "WebServer.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:7071
EXPOSE 7071

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WebServer.dll"]
