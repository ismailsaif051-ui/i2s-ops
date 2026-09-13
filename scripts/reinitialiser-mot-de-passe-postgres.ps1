<#
    Réinitialise le mot de passe du rôle « postgres » de PostgreSQL 18,
    puis renseigne DATABASE_URL dans le fichier .env du projet.

    À LANCER EN TANT QU'ADMINISTRATEUR.

    Ce que fait le script, dans l'ordre :
      1. sauvegarde pg_hba.conf (horodatée) ;
      2. autorise temporairement la connexion locale sans mot de passe ;
      3. redémarre PostgreSQL ;
      4. définit le nouveau mot de passe du rôle « postgres » ;
      5. RESTAURE pg_hba.conf dans son état d'origine ;
      6. redémarre PostgreSQL ;
      7. met à jour DATABASE_URL dans .env.

    L'étape 5 est exécutée dans un bloc « finally » : même en cas d'erreur,
    l'authentification par mot de passe est rétablie avant la sortie.

    Utilisation :
        .\scripts\reinitialiser-mot-de-passe-postgres.ps1
    ou, pour imposer un mot de passe précis :
        .\scripts\reinitialiser-mot-de-passe-postgres.ps1 -NouveauMotDePasse 'MonMotDePasse123'
#>

param(
    [string]$NouveauMotDePasse = '',
    [string]$VersionPostgres = '18'
)

$ErrorActionPreference = 'Stop'

# ── Vérification des droits ─────────────────────────────────────────
$identite = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identite)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host ''
    Write-Host '  Ce script doit etre lance en tant qu''Administrateur.' -ForegroundColor Red
    Write-Host '  Menu Demarrer > taper "PowerShell" > clic droit > "Executer en tant qu''administrateur"' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

# ── Chemins ─────────────────────────────────────────────────────────
$racineProjet = Split-Path -Parent $PSScriptRoot
$dossierPg    = "C:\Program Files\PostgreSQL\$VersionPostgres"
$pgHba        = Join-Path $dossierPg 'data\pg_hba.conf'
$psql         = Join-Path $dossierPg 'bin\psql.exe'
$service      = "postgresql-x64-$VersionPostgres"
$envFile      = Join-Path $racineProjet '.env'

foreach ($chemin in @($pgHba, $psql)) {
    if (-not (Test-Path $chemin)) {
        Write-Host "  Fichier introuvable : $chemin" -ForegroundColor Red
        Write-Host "  Ajustez le parametre -VersionPostgres si votre version differe." -ForegroundColor Yellow
        exit 1
    }
}

if (-not (Get-Service -Name $service -ErrorAction SilentlyContinue)) {
    Write-Host "  Service introuvable : $service" -ForegroundColor Red
    exit 1
}

# ── Mot de passe ────────────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($NouveauMotDePasse)) {
    # Genere un mot de passe robuste plutot que d'en demander un faible.
    $octets = New-Object byte[] 18
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($octets)
    $NouveauMotDePasse = ([Convert]::ToBase64String($octets) -replace '[^A-Za-z0-9]', '') + 'A1'
}

if ($NouveauMotDePasse -match "'") {
    Write-Host "  Le mot de passe ne doit pas contenir d'apostrophe." -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '  Reinitialisation du mot de passe PostgreSQL' -ForegroundColor Cyan
Write-Host '  ------------------------------------------------------------'

$sauvegarde = "$pgHba.sauvegarde-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$contenuOrigine = Get-Content $pgHba -Raw

try {
    Copy-Item $pgHba $sauvegarde -Force
    Write-Host "  1/7  Sauvegarde : $(Split-Path -Leaf $sauvegarde)"

    # Autorise temporairement les connexions locales sans mot de passe.
    $contenuTemporaire = $contenuOrigine `
        -replace '(?m)^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)\S+', '${1}trust' `
        -replace '(?m)^(host\s+all\s+all\s+::1/128\s+)\S+',        '${1}trust' `
        -replace '(?m)^(local\s+all\s+all\s+)\S+',                  '${1}trust'
    Set-Content -Path $pgHba -Value $contenuTemporaire -Encoding UTF8
    Write-Host '  2/7  Authentification locale ouverte temporairement'

    Restart-Service -Name $service -Force
    Start-Sleep -Seconds 3
    Write-Host '  3/7  PostgreSQL redemarre'

    $env:PGPASSWORD = ''
    & $psql -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$NouveauMotDePasse';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "La commande ALTER USER a echoue (code $LASTEXITCODE)." }
    Write-Host '  4/7  Nouveau mot de passe defini'
}
finally {
    # Retablit systematiquement l'authentification par mot de passe,
    # meme si une etape precedente a echoue.
    Set-Content -Path $pgHba -Value $contenuOrigine -Encoding UTF8
    Write-Host '  5/7  Configuration de securite restauree'

    Restart-Service -Name $service -Force
    Start-Sleep -Seconds 3
    Write-Host '  6/7  PostgreSQL redemarre'
}

# ── Mise a jour du fichier .env ─────────────────────────────────────
if (Test-Path $envFile) {
    $motDePasseUrl = [Uri]::EscapeDataString($NouveauMotDePasse)
    $nouvelleUrl = "DATABASE_URL=`"postgresql://postgres:$motDePasseUrl@localhost:5432/i2s_ops?schema=public`""
    $contenuEnv = Get-Content $envFile -Raw
    $contenuEnv = $contenuEnv -replace '(?m)^DATABASE_URL=.*$', $nouvelleUrl
    Set-Content -Path $envFile -Value $contenuEnv -Encoding UTF8 -NoNewline
    Write-Host '  7/7  DATABASE_URL mis a jour dans .env'
} else {
    Write-Host "  7/7  .env introuvable — reportez le mot de passe manuellement." -ForegroundColor Yellow
}

Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host '   Termine.' -ForegroundColor Green
Write-Host ''
Write-Host "   Nouveau mot de passe PostgreSQL : $NouveauMotDePasse"
Write-Host '   Notez-le : il est desormais celui du role « postgres ».'
Write-Host ''
Write-Host '   Etape suivante, dans le terminal du projet :'
Write-Host '       npm run db:setup'
Write-Host '       npm run db:demo'
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host ''
