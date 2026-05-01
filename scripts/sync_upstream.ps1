# scripts/sync_upstream.ps1 — align hermes submodule with upstream, re-apply local patches
#
# Usage:
#   .\scripts\sync_upstream.ps1                  # full sync
#   .\scripts\sync_upstream.ps1 -DryRun           # check prerequisites only
#   .\scripts\sync_upstream.ps1 -Target v2024.5.1 # sync to a specific tag
#
# Prerequisites:
#   - HermesDesk working tree clean
#   - hermes submodule has exactly our 7 expected dirty files
#   - patches/hermesdesk-changes.patch exists

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$Target = "origin/main"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $root

$hermesDir = "hermes"
$patchFile = "patches\hermesdesk-changes.patch"

$expectedDirty = @(
    "gateway/config.py",
    "gateway/platforms/dingtalk.py",
    "gateway/platforms/feishu.py",
    "gateway/platforms/telegram.py",
    "gateway/platforms/webhook.py",
    "gateway/platforms/whatsapp.py",
    "gateway/run.py"
)

$checkFiles = @(
    "gateway/run.py",
    "gateway/config.py",
    "gateway/platforms/telegram.py",
    "gateway/platforms/whatsapp.py",
    "gateway/platforms/dingtalk.py",
    "gateway/platforms/feishu.py",
    "gateway/platforms/webhook.py"
)

function Write-Step([string]$msg) {
    Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "  OK  $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  WARN $msg" -ForegroundColor Yellow
}

function Write-Fail([string]$msg) {
    Write-Host "  FAIL $msg" -ForegroundColor Red
}

# ── Step 1: Export current patch ────────────────────────────────────────────

Write-Step "Exporting current patch"

$prePatch = & git -C $hermesDir diff
if (-not $prePatch) {
    Write-Fail "hermes submodule has no local modifications — nothing to export"
    exit 1
}
$prePatch | Out-File -FilePath $patchFile -Encoding utf8 -NoNewline
# git diff produces LF line endings; add trailing newline
Add-Content -Path $patchFile -Value ""
Write-OK "Patch exported to $patchFile ($($prePatch.Count) lines)"

# ── Step 2: Prerequisites check ─────────────────────────────────────────────

Write-Step "Checking prerequisites"

# 2a: Parent repo clean (except submodule which is expected to be dirty)
$parentStatus = & git status --porcelain
$parentDirty = $parentStatus | Where-Object { $_ -notmatch '^\s*m\s+hermes' }
if ($parentDirty) {
    Write-Fail "HermesDesk working tree is not clean:"
    $parentDirty | ForEach-Object { Write-Host "    $_" }
    Write-Host "  Please commit or stash changes before syncing."
    exit 1
}
Write-OK "HermesDesk working tree clean"

# 2b: hermes submodule has only expected dirty files
$hermesStatus = & git -C $hermesDir status --short
$hermesDirty = $hermesStatus | Where-Object { $_ -match '^\s*M\s+' } | ForEach-Object { $_ -replace '^\s*M\s+', '' } | Sort-Object
$hermesUnexpected = $hermesDirty | Where-Object { $_ -notin $expectedDirty }
$hermesMissing = $expectedDirty | Where-Object { $_ -notin $hermesDirty }

if ($hermesUnexpected) {
    Write-Fail "Unexpected dirty files in hermes submodule:"
    $hermesUnexpected | ForEach-Object { Write-Host "    $_" }
    Write-Host "  These files are not part of our patches. Review and either commit"
    Write-Host "  them to hermes or discard them (git -C hermes checkout -- <file>)."
    exit 1
}
if ($hermesMissing) {
    Write-Fail "Expected dirty files missing from hermes submodule:"
    $hermesMissing | ForEach-Object { Write-Host "    $_" }
    Write-Host "  Run: git -C hermes apply ..\patches\hermesdesk-changes.patch"
    exit 1
}
Write-OK "hermes submodule has exactly the 7 expected dirty files"

# 2c: Patch file exists
if (-not (Test-Path $patchFile)) {
    Write-Fail "Patch file not found: $patchFile"
    exit 1
}
Write-OK "Patch file present"

# 2d: Python available for syntax check
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Warn "python not found on PATH — syntax verification will be skipped"
}

if ($DryRun) {
    Write-Step "Dry run complete — all checks passed"
    Pop-Location
    exit 0
}

# ── Step 3: Fetch upstream ──────────────────────────────────────────────────

Write-Step "Fetching upstream"
& git -C $hermesDir fetch origin
Write-OK "Upstream fetched"

$oldCommit = & git -C $hermesDir rev-parse --short HEAD
Write-OK "Current hermes commit: $oldCommit"

# ── Step 4: Stamp pre-sync checkpoint ───────────────────────────────────────

Write-Step "Stamping checkpoint"

$checkpointMsg = "chore(hermes): refresh patch before upstream sync (pre-$($Target -replace '/','-'))"
git add $patchFile
git commit -m $checkpointMsg --allow-empty 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-OK "Checkpoint committed"
} else {
    Write-OK "Nothing to commit (patch unchanged)"
}

# ── Step 5: Update submodule ────────────────────────────────────────────────

Write-Step "Updating submodule to $Target"
& git -C $hermesDir checkout $Target
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to checkout $Target"
    exit 1
}
$newCommit = & git -C $hermesDir rev-parse --short HEAD
Write-OK "hermes updated: $oldCommit -> $newCommit"

# ── Step 6: Apply patch ─────────────────────────────────────────────────────

Write-Step "Applying patch"

# First do a dry-run to detect conflicts
$applyCheck = & git -C $hermesDir apply --check "..\$patchFile" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Patch does not apply cleanly — attempting with --reject"
    Write-Host "  $applyCheck"

    # Try with reject mode
    $rejectResult = & git -C $hermesDir apply --reject "..\$patchFile" 2>&1
    $rejFiles = Get-ChildItem -Path $hermesDir -Filter "*.rej" -Recurse -ErrorAction SilentlyContinue

    if ($rejFiles) {
        Write-Warn "Conflict: $($rejFiles.Count) rejected hunk(s) need manual merge:"
        $rejFiles | ForEach-Object { Write-Host "    $($_.FullName)" }
        Write-Host ""
        Write-Host "  1. Open each .rej file and manually apply the changes"
        Write-Host "  2. Delete the .rej file when done"
        Write-Host "  3. Re-run: .\scripts\sync_upstream.ps1 to verify and regenerate patch"
        Pop-Location
        exit 2
    }
    Write-OK "Patch applied with --reject (no .rej files generated)"
} else {
    & git -C $hermesDir apply "..\$patchFile"
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Patch application failed"
        Write-Host "  Try manual: git -C hermes apply --reject ..\$patchFile"
        Pop-Location
        exit 1
    }
    Write-OK "Patch applied cleanly"
}

# ── Step 7: Verify patches applied correctly ─────────────────────────────────

Write-Step "Verifying patch coverage"

$postStatus = & git -C $hermesDir status --short
$postDirty = $postStatus | Where-Object { $_ -match '^\s*M\s+' } | ForEach-Object { $_ -replace '^\s*M\s+', '' } | Sort-Object
$postMissing = $expectedDirty | Where-Object { $_ -notin $postDirty }

if ($postMissing) {
    Write-Fail "After patch: $($postMissing.Count) expected files are NOT modified:"
    $postMissing | ForEach-Object { Write-Host "    $_" }
    Write-Host "  The patch may have partially failed. Check .rej files."
    Pop-Location
    exit 1
}
$postUnexpected = $postDirty | Where-Object { $_ -notin $expectedDirty }
if ($postUnexpected) {
    Write-Warn "Additional dirty files after patch (may be upstream changes):"
    $postUnexpected | ForEach-Object { Write-Host "    $_" }
}
Write-OK "All 7 expected files have modifications"

# ── Step 8: Core module audit ────────────────────────────────────────────────

Write-Step "Core module audit"
Write-Host "  Checking for new upstream functions that may interact with our patches..."

$criticalModules = @(
    "gateway/status.py",        # lock system, PID management
    "gateway/run.py",           # gateway lifecycle, platform connections
    "hermes_cli/web_server.py", # API endpoints, desk chat
    "run_agent.py"              # AI agent loop, credential resolution
)

# Keywords that signal a function might need our attention
$auditPatterns = @(
    "def.*lock", "def.*pid", "def.*kill", "def.*clean",
    "def.*auth", "def.*token", "def.*secret",
    "def.*post|def.*get|def.*route|def.*endpoint",
    "class.*Lock|class.*Guard|class.*Auth"
)

foreach ($mod in $criticalModules) {
    $modPath = Join-Path $hermesDir $mod
    if (-not (Test-Path $modPath)) { continue }
    
    $matches = Select-String -Path $modPath -Pattern $auditPatterns -AllMatches | 
        Where-Object { $_.Line -notmatch '^\s*#' }  # skip comment-only lines
    
    if ($matches) {
        Write-Host "  [$mod] potential interaction points: $($matches.Count)" -ForegroundColor DarkGray
        foreach ($m in $matches | Select-Object -First 5) {
            $trimmed = $m.Line.Trim()
            if ($trimmed.Length -gt 100) { $trimmed = $trimmed.Substring(0, 100) + "..." }
            Write-Host "    L$($m.LineNumber): $trimmed" -ForegroundColor DarkGray
        }
        if ($matches.Count -gt 5) {
            Write-Host "    ... and $($matches.Count - 5) more" -ForegroundColor DarkGray
        }
    }
}

Write-Host "  Review the flagged lines above. If any handle locks, auth, or process"
Write-Host "  lifecycle, verify they don't conflict with our patches."
Write-Host ""

# ── Step 9: Syntax verification ─────────────────────────────────────────────

if ($py) {
    Write-Step "Syntax check"

    $pyScript = @"
import ast, sys
failed = []
for f in [$(($checkFiles | ForEach-Object { "'$_'" }) -join ',')]:
    try:
        with open(f'$hermesDir/{f}', 'r', encoding='utf-8') as fh:
            ast.parse(fh.read())
        print(f'OK: {f}')
    except SyntaxError as e:
        print(f'SYNTAX ERROR: {f} — {e}')
        failed.append(f)
if failed:
    sys.exit(1)
"@

    $pyResult = & python -c $pyScript 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Syntax errors detected:"
        $pyResult | ForEach-Object { Write-Host "    $_" }
        Pop-Location
        exit 1
    }
    $pyResult | ForEach-Object { Write-OK $_ }
} else {
    Write-Warn "Skipping syntax check (python not found)"
}

# ── Step 9: Regenerate patch and commit ──────────────────────────────────────

Write-Step "Regenerating patch for new upstream baseline"

$postPatch = & git -C $hermesDir diff
$postPatch | Out-File -FilePath $patchFile -Encoding utf8 -NoNewline
Add-Content -Path $patchFile -Value ""
Write-OK "Patch regenerated ($($postPatch.Count) lines)"

git add $hermesDir $patchFile
$commitMsg = "chore(hermes): upstream sync $oldCommit..$newCommit + re-apply security patches"
git commit -m $commitMsg 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-OK "Committed: $commitMsg"
} else {
    Write-OK "Changes staged (no new commit needed)"
}

# ── Done ─────────────────────────────────────────────────────────────────────

Write-Step "Sync complete"

Write-Host "Next steps:"
Write-Host "  1. Run smoke test: cargo tauri dev"
Write-Host "  2. Send a DM to your Telegram bot — verify pairing code response"
Write-Host "  3. If everything works: git push"
Write-Host ""
Write-Host "  If something is broken:"
Write-Host "    git -C hermes checkout $oldCommit"
Write-Host "    git -C hermes apply ..\patches\hermesdesk-changes.patch"

Pop-Location
