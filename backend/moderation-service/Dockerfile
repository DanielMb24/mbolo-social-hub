FROM openjdk:17-jdk-slim
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app
COPY target/*.jar app.jar
USER appuser
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
