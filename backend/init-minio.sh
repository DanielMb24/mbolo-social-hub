#!/bin/bash

echo "🪣 Initialisation des buckets MinIO..."

# Attendre que MinIO soit prêt
sleep 5

# Installer le client MinIO
docker run --rm --network backend_mb-network \
  --entrypoint sh \
  minio/mc -c "
    mc alias set mbolo http://minio:9000 mbolo_admin mbolo_secret_2025;
    mc mb mbolo/mbolo-avatars --ignore-existing;
    mc mb mbolo/mbolo-videos --ignore-existing;
    mc mb mbolo/mbolo-posts --ignore-existing;
    mc anonymous set download mbolo/mbolo-avatars;
    mc anonymous set download mbolo/mbolo-videos;
    mc anonymous set download mbolo/mbolo-posts;
    echo 'MinIO buckets created successfully';
  "

echo "✅ Buckets MinIO créés avec succès!"
