@echo off
chcp 65001 > nul

echo Verification de la sante des services MBolo...
echo.

echo === Infrastructure Services ===
docker ps --filter "name=mbolo-mongo-auth" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB Auth) || (echo [DOWN] MongoDB Auth)
docker ps --filter "name=mbolo-mongo-user" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB User) || (echo [DOWN] MongoDB User)
docker ps --filter "name=mbolo-mongo-chat" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB Chat) || (echo [DOWN] MongoDB Chat)
docker ps --filter "name=mbolo-mongo-post" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB Post) || (echo [DOWN] MongoDB Post)
docker ps --filter "name=mbolo-mongo-video" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB Video) || (echo [DOWN] MongoDB Video)
docker ps --filter "name=mbolo-mongo-moderation" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MongoDB Moderation) || (echo [DOWN] MongoDB Moderation)
docker ps --filter "name=mbolo-redis" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] Redis) || (echo [DOWN] Redis)
docker ps --filter "name=mbolo-minio" --format "{{.Status}}" | findstr "Up" > nul && (echo [OK] MinIO) || (echo [DOWN] MinIO)

echo.
echo === Backend Services ===
curl -s -f http://localhost:8080/actuator/health > nul 2>&1 && (echo [OK] API Gateway) || (echo [DOWN] API Gateway)
curl -s -f http://localhost:8081/actuator/health > nul 2>&1 && (echo [OK] Auth Service) || (echo [DOWN] Auth Service)
curl -s -f http://localhost:8082/actuator/health > nul 2>&1 && (echo [OK] User Service) || (echo [DOWN] User Service)
curl -s -f http://localhost:8083/actuator/health > nul 2>&1 && (echo [OK] Chat Service) || (echo [DOWN] Chat Service)
curl -s -f http://localhost:8084/actuator/health > nul 2>&1 && (echo [OK] Post Service) || (echo [DOWN] Post Service)
curl -s -f http://localhost:8085/actuator/health > nul 2>&1 && (echo [OK] Video Service) || (echo [DOWN] Video Service)
curl -s -f http://localhost:8086/actuator/health > nul 2>&1 && (echo [OK] Moderation Service) || (echo [DOWN] Moderation Service)

echo.
echo === Frontend ===
curl -s -f http://localhost:5173 > nul 2>&1 && (echo [OK] Frontend - http://localhost:5173) || (echo [NOT RUNNING] Frontend - run 'npm run dev')

echo.
echo === Storage ===
curl -s -f http://localhost:9001 > nul 2>&1 && (echo [OK] MinIO Console - http://localhost:9001) || (echo [DOWN] MinIO Console)

echo.
echo === Summary ===
echo Pour voir les logs: cd backend ^&^& docker-compose logs -f
echo Pour redemarrer: cd backend ^&^& docker-compose restart [service-name]
echo Pour arreter: cd backend ^&^& docker-compose down
echo.
pause
