@echo off
echo Initialisation des buckets MinIO...

REM Attendre que MinIO soit pret
timeout /t 5 /nobreak > nul

docker run --rm --network backend_mb-network --entrypoint sh minio/mc -c "mc alias set mbolo http://minio:9000 mbolo_admin mbolo_secret_2025; mc mb mbolo/mbolo-avatars --ignore-existing; mc mb mbolo/mbolo-videos --ignore-existing; mc mb mbolo/mbolo-posts --ignore-existing; mc anonymous set download mbolo/mbolo-avatars; mc anonymous set download mbolo/mbolo-videos; mc anonymous set download mbolo/mbolo-posts; echo MinIO buckets created successfully"

echo.
echo Buckets MinIO crees avec succes!
pause
