param(
  [string]$PackFile = 'data/lexicon-import.json',
  [string]$ReportFile = 'data/analysis/lexicon-source-verification.json'
)

# Independent verification: use PowerShell's native CSV parser, not the builder's
# JavaScript state machine, candidate files, or previously calculated profiles.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$rootPath = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$packPath = Join-Path $rootPath $PackFile
$reportPath = Join-Path $rootPath $ReportFile
$csvPath = Join-Path $rootPath '.npm-cache/lexicon/ecdict.csv'
$pinnedCommit = '39cfb9672c0906b63569e0453c2e6abfb9ab182a'
$pinnedSha256 = 'd1ecbdf9ee2b920afb6f430ca6b6bb9f559588cf0dff86e04bd255f9390843cc'
$expectedUrl = "https://github.com/skywind3000/ECDICT/blob/$pinnedCommit/README.md"
$packHash = (Get-FileHash -LiteralPath $packPath -Algorithm SHA256).Hash.ToLowerInvariant()
$pack = [IO.File]::ReadAllText($packPath) | ConvertFrom-Json -AsHashtable -Depth 100
if ($pack.words.Count -lt 1700) { throw 'Final pack is not ready: at least 1700 imported words are required.' }
if ($pack.curatedEvidence.Count -ne 300) { throw 'Expected source evidence for exactly 300 authored cards.' }
$csvHash = (Get-FileHash -LiteralPath $csvPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($csvHash -cne $pinnedSha256) { throw 'ECDICT CSV does not match the independently pinned source SHA-256.' }
if ((Get-Item -LiteralPath $csvPath).Length -ne 66009548) { throw 'ECDICT byte length changed.' }

function Get-PositiveRank([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value) -or $Value -ceq '0') { return $null }
  $parsedRank = 0
  if (-not [int]::TryParse($Value, [ref]$parsedRank) -or $parsedRank -lt 1) {
    throw "Unexpected source rank: $Value"
  }
  return $parsedRank
}

$expected = [Collections.Generic.Dictionary[string, object]]::new([StringComparer]::Ordinal)
foreach ($word in $pack.curatedEvidence.Keys) {
  $expected.Add($word, @{ word = $word; group = 'curated'; evidence = $pack.curatedEvidence[$word] })
}
foreach ($card in $pack.words) {
  if ($card.id -cne $card.word) { throw "Different card ID and headword: $($card.id)" }
  if ($expected.ContainsKey($card.word)) { throw "Duplicate final headword: $($card.word)" }
  $expected.Add($card.word, @{ word = $card.word; group = 'imported'; evidence = $card.lexiconSource })
}

# Check that the evidence covers the actual 300 preserved authored headwords.
$authoredHeads = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
$plan = [IO.File]::ReadAllText((Join-Path $rootPath 'data/vocabulary-expansion-plan.json')) | ConvertFrom-Json -AsHashtable
foreach ($batch in $plan.batches.Values) { foreach ($word in $batch) { [void]$authoredHeads.Add($word) } }
foreach ($relative in @('src/lib/corpus.ts', 'src/lib/corpus-extra.ts')) {
  $text = [IO.File]::ReadAllText((Join-Path $rootPath $relative))
  foreach ($match in [regex]::Matches($text, "(?m)^  \['([^']+)',")) { [void]$authoredHeads.Add($match.Groups[1].Value) }
}
if ($authoredHeads.Count -ne 300) { throw 'Could not independently identify all 300 authored headwords.' }
foreach ($word in $authoredHeads) {
  if (-not $pack.curatedEvidence.Contains($word)) { throw "Missing authored evidence: $word" }
}

$sourceByWord = [Collections.Generic.Dictionary[string, object]]::new([StringComparer]::Ordinal)
$mismatches = [Collections.Generic.List[object]]::new()
$rawRowCount = 0
$rawIeltsCount = 0
Import-Csv -LiteralPath $csvPath -Encoding utf8 | ForEach-Object {
  $rawRowCount++
  $tagTokens = @($_.tag -split '\s+' | Where-Object { $_.Length -gt 0 })
  $isIelts = $tagTokens -ccontains 'ielts'
  if ($isIelts) { $rawIeltsCount++ }
  if ($expected.ContainsKey($_.word)) {
    if ($sourceByWord.ContainsKey($_.word)) { throw "Duplicate selected source headword: $($_.word)" }
    $sourceByWord.Add($_.word, @{
      word = $_.word
      group = $expected[$_.word].group
      raw = @{ tag = $_.tag; bnc = $_.bnc; frq = $_.frq }
      ieltsTagged = $isIelts
      bncRank = Get-PositiveRank $_.bnc
      contemporaryRank = Get-PositiveRank $_.frq
    })
  }
}
if ($rawRowCount -ne 770611 -or $rawIeltsCount -ne 5040) { throw 'Independent CSV source totals do not match the pinned release.' }

foreach ($word in $expected.Keys) {
  if (-not $sourceByWord.ContainsKey($word)) {
    $mismatches.Add(@{ word = $word; field = 'word'; issue = 'Headword missing from source CSV' })
    continue
  }
  $original = $sourceByWord[$word]
  $stored = $expected[$word].evidence
  foreach ($field in @('ieltsTagged', 'bncRank', 'contemporaryRank')) {
    if (-not $stored.Contains($field) -or $stored[$field] -cne $original[$field]) {
      $mismatches.Add(@{ word = $word; field = $field; stored = $stored[$field]; source = $original[$field] })
    }
  }
  if ($stored.provider -cne 'ECDICT' -or $stored.url -cne $expectedUrl) {
    $mismatches.Add(@{ word = $word; field = 'provenance'; storedProvider = $stored.provider; storedUrl = $stored.url; sourceUrl = $expectedUrl })
  }
}

function Get-Coverage([object[]]$Rows) {
  $bnc10k = 0; $contemporary10k = 0; $either10k = 0; $either20k = 0; $both20k = 0; $bncExclusive10k = 0; $ielts = 0
  foreach ($row in $Rows) {
    $inBnc10k = $null -ne $row.bncRank -and $row.bncRank -le 10000
    $inContemporary10k = $null -ne $row.contemporaryRank -and $row.contemporaryRank -le 10000
    $inBnc20k = $null -ne $row.bncRank -and $row.bncRank -le 20000
    $inContemporary20k = $null -ne $row.contemporaryRank -and $row.contemporaryRank -le 20000
    if ($row.ieltsTagged) { $ielts++ }
    if ($inBnc10k) { $bnc10k++ }
    if ($inContemporary10k) { $contemporary10k++ }
    if ($inBnc10k -or $inContemporary10k) { $either10k++ }
    if ($inBnc20k -or $inContemporary20k) { $either20k++ }
    if ($inBnc20k -and $inContemporary20k) { $both20k++ }
    if ($inBnc10k -and -not $inContemporary10k) { $bncExclusive10k++ }
  }
  return [ordered]@{
    totalWords = $Rows.Count; ieltsTagged = $ielts
    bncRankAtMost10000 = $bnc10k; contemporaryRankAtMost10000 = $contemporary10k
    eitherRankAtMost10000 = $either10k; eitherRankAtMost20000 = $either20k
    bothRanksAtMost20000 = $both20k; bncTop10000ButNotContemporaryTop10000 = $bncExclusive10k
  }
}
$allRows = @($sourceByWord.Values)
$coverage = Get-Coverage $allRows
foreach ($comparison in @(
  @('totalWords', 'totalWords'), @('ieltsTagged', 'ieltsTagged'),
  @('rankAtMost10000', 'eitherRankAtMost10000'), @('rankAtMost20000', 'eitherRankAtMost20000')
)) {
  if ($pack.summary[$comparison[0]] -ne $coverage[$comparison[1]]) {
    $mismatches.Add(@{ field = "summary.$($comparison[0])"; stored = $pack.summary[$comparison[0]]; source = $coverage[$comparison[1]] })
  }
}
if ((Get-FileHash -LiteralPath $packPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $packHash) {
  throw 'Final pack changed during verification; rerun against the completed pack.'
}
$report = [ordered]@{
  schemaVersion = 1; checkedAt = [DateTime]::UtcNow.ToString('o')
  status = $(if ($mismatches.Count -eq 0) { 'matched' } else { 'mismatch' })
  independentParser = 'PowerShell native Import-Csv with UTF-8; does not import or call the dictionary builder'
  source = @{ repository = 'https://github.com/skywind3000/ECDICT'; commit = $pinnedCommit; cacheFile = '.npm-cache/lexicon/ecdict.csv'; sha256 = $csvHash; bytes = 66009548; rawRows = $rawRowCount; rawIeltsTagged = $rawIeltsCount }
  pack = @{ path = $PackFile; sha256 = $packHash; curatedWords = $pack.curatedEvidence.Count; importedWords = $pack.words.Count }
  coverage = $coverage
  curatedCoverage = Get-Coverage @($allRows | Where-Object { $_.group -eq 'curated' })
  importedCoverage = Get-Coverage @($allRows | Where-Object { $_.group -eq 'imported' })
  mismatchCount = $mismatches.Count; mismatches = @($mismatches.ToArray())
  definitions = @{
    bncRankAtMost10000 = 'Uses only the positive source bnc rank, without substituting frq.'
    eitherRankAtMost10000 = 'A positive bnc or frq rank is at most 10000.'
    eitherRankAtMost20000 = 'A positive bnc or frq rank is at most 20000; all words are checked individually.'
    contemporaryRank = 'The source frq field; its corpus identity and measurement date are not independently established.'
    ieltsTagged = 'The source tag contains the separate exact token ielts; this is independent dictionary membership, not observed recent examination frequency.'
  }
  words = @($allRows | Sort-Object word)
}
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($reportPath)) | Out-Null
[IO.File]::WriteAllText($reportPath, (($report | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
[ordered]@{ status = $report.status; coverage = $coverage; mismatchCount = $mismatches.Count; report = $ReportFile } | ConvertTo-Json -Depth 5
if ($mismatches.Count -gt 0) { exit 1 }
