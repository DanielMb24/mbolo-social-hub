Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CREATION DES PROFILS MANQUANTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Recuperer tous les utilisateurs depuis MongoDB auth
Write-Host "[1] Recuperation des utilisateurs depuis auth-service..." -ForegroundColor Yellow

$users = docker exec mbolo-mongo-auth mongosh --quiet --eval "JSON.stringify(db.userAuths.find({}).toArray())" | ConvertFrom-Json

Write-Host "Trouves: $($users.Count) utilisateurs" -ForegroundColor Green
Write-Host ""

# Pour chaque utilisateur, verifier si le profil existe et le creer si necessaire
Write-Host "[2] Creation des profils manquants..." -ForegroundColor Yellow
$created = 0
$skipped = 0
$errors = 0

foreach ($user in $users) {
    $userId = $user._id
    $username = $user.username
    $email = $user.email
    $fullName = if ($user.fullName) { $user.fullName } else { $username }
    
    Write-Host "Traitement: $username ($userId)..." -NoNewline
    
    try {
        # Verifier si le profil existe
        $checkResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/users/$userId" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
        
        if ($checkResponse.StatusCode -eq 200) {
            Write-Host " [EXISTE DEJA]" -ForegroundColor Gray
            $skipped++
        }
    } catch {
        # Le profil n'existe pas, le creer
        try {
            $body = @{
                username = $username
                email = $email
                fullname = $fullName
                bio = "Membre de MBolo 🇬🇦"
            } | ConvertTo-Json
            
            # Utiliser un token temporaire (on cree sans authentification via l'endpoint direct)
            $response = Invoke-WebRequest -Uri "http://localhost:8080/api/users/$userId" -Method PUT -Body $body -ContentType "application/json" -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Host " [CREE]" -ForegroundColor Green
                $created++
            }
        } catch {
            Write-Host " [ERREUR: $($_.Exception.Message)]" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Profils crees: $created" -ForegroundColor Green
Write-Host "Profils existants: $skipped" -ForegroundColor Gray
Write-Host "Erreurs: $errors" -ForegroundColor Red
Write-Host ""
