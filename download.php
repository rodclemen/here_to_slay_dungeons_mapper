<?php

declare(strict_types=1);

const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';

const HTSD_REPO = 'rodclemen/here_to_slay_dungeons_mapper';
const HTSD_ASSET_PATTERNS = [
    'mac' => '/\.dmg$/',
    'windows' => '/x64-setup\.exe$/',
];
const HTSD_RELEASE_CACHE = __DIR__ . '/Download/.htsd_release_cache.json';
const HTSD_CACHE_TTL = 3600; // 1 hour

/**
 * Fetch (and cache) release metadata from the GitHub API. Returns:
 *   [ 'version' => 'v0.8.3',
 *     'assets' => [ 'mac' => ['url' =>, 'size' =>, 'date' =>], 'windows' => [...] ] ]
 *
 * The GitHub API is hit at most once per HTSD_CACHE_TTL; every other call — download
 * redirects and page metadata alike — is served from the on-disk cache, so normal
 * traffic does not keep pulling from GitHub.
 */
function htsd_get_release_data(): array
{
    // Serve a fresh cache without touching GitHub. The `assets` check also forces a
    // refresh of any pre-existing cache written in the older {time, urls} format.
    $cached = null;
    if (is_file(HTSD_RELEASE_CACHE)) {
        $raw = file_get_contents(HTSD_RELEASE_CACHE);
        $cached = $raw ? json_decode($raw, true) : null;
        if (is_array($cached) && isset($cached['assets'])
            && ($cached['time'] ?? 0) > time() - HTSD_CACHE_TTL) {
            return $cached;
        }
    }

    // Cache stale or missing — fetch the latest release from the GitHub API
    $ctx = stream_context_create(['http' => [
        'header' => "User-Agent: HtSDMapper-Download\r\n",
        'timeout' => 5,
    ]]);
    $json = @file_get_contents(
        'https://api.github.com/repos/' . HTSD_REPO . '/releases/latest',
        false,
        $ctx
    );

    if ($json === false) {
        // API failed — fall back to stale cache if we have one
        if (is_array($cached) && isset($cached['assets'])) {
            return $cached;
        }
        throw new RuntimeException('Could not fetch release info.');
    }

    $release = json_decode($json, true);
    $assets = [];
    foreach (HTSD_ASSET_PATTERNS as $plat => $pattern) {
        foreach ($release['assets'] ?? [] as $asset) {
            if (preg_match($pattern, $asset['name'])) {
                $assets[$plat] = [
                    'url'  => $asset['browser_download_url'],
                    'size' => (int)($asset['size'] ?? 0),
                    // When this asset was last uploaded/clobbered (release date as fallback)
                    'date' => $asset['updated_at'] ?? ($release['published_at'] ?? null),
                ];
                break;
            }
        }
    }

    $data = [
        'time'    => time(),
        'version' => $release['tag_name'] ?? null,
        'assets'  => $assets,
    ];

    // Cache the result
    $dir = dirname(HTSD_RELEASE_CACHE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents(HTSD_RELEASE_CACHE, json_encode($data));

    return $data;
}

function htsd_load_stats(): array
{
    if (!is_file(HTSD_STATS_FILE)) {
        return [];
    }

    $raw = file_get_contents(HTSD_STATS_FILE);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function htsd_save_stats(array $stats): void
{
    $dir = dirname(HTSD_STATS_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    $handle = fopen(HTSD_STATS_FILE, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Could not open stats file.');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Could not lock stats file.');
        }

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
}

$platform = isset($_GET['platform']) && array_key_exists($_GET['platform'], HTSD_ASSET_PATTERNS)
    ? $_GET['platform']
    : 'mac';

// Metadata mode: return release info as JSON instead of redirecting. The download
// page uses this to show the real version / size / date. The response is cacheable
// (max-age = cache TTL) so repeated page loads don't keep calling even this endpoint.
if (isset($_GET['meta'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=' . HTSD_CACHE_TTL);
    try {
        $data = htsd_get_release_data();
        $platforms = [];
        foreach ($data['assets'] ?? [] as $plat => $asset) {
            $platforms[$plat] = [
                'size' => $asset['size'] ?? null,
                'date' => $asset['date'] ?? null,
            ];
        }
        echo json_encode([
            'version'   => $data['version'] ?? null,
            'platforms' => $platforms,
        ], JSON_UNESCAPED_SLASHES);
    } catch (Throwable $error) {
        http_response_code(502);
        echo json_encode(['error' => 'Could not fetch release info.']);
    }
    exit;
}

$data = htsd_get_release_data();
$url = $data['assets'][$platform]['url'] ?? null;
if ($url === null) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Download temporarily unavailable — no ' . $platform . ' asset in the latest release.';
    exit;
}

try {
    $stats = htsd_load_stats();
    $key = 'count_' . $platform;
    $stats[$key] = max(0, (int)($stats[$key] ?? 0)) + 1;
    htsd_save_stats($stats);
} catch (Throwable $error) {
    // Do not block the download if stats persistence fails.
}

header('Location: ' . $url, true, 302);
exit;
