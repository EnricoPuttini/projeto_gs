# Build com o REPOSITORIO INTEIRO como contexto (docker build -f backend/Dockerfile .):
# o pom copia database/02_dml.sql para o classpath (reset do modo demo), entao o build precisa enxergar ../database.

# ---- estagio 1: compila e empacota ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Primeiro so o pom: a camada de dependencias fica em cache enquanto o pom nao mudar.
COPY backend/pom.xml backend/pom.xml
RUN mvn -B -q -f backend/pom.xml dependency:go-offline
COPY database database
COPY backend/src backend/src
RUN mvn -B -q -f backend/pom.xml -DskipTests package

# ---- estagio 2: so o JRE e o jar ----
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 1001 zelo
WORKDIR /app
COPY --from=build /app/backend/target/zelo-backend-*.jar app.jar
USER zelo
# Render free tem 512 MB: limita a heap a 70% e derruba o processo (o Render reinicia) se faltar memoria.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+ExitOnOutOfMemoryError"
# A porta vem de PORT (o Render define); 8080 e so o padrao local.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
