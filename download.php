<?php

declare(strict_types=1);

const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';

const HTSD_REPO = 'rodclemen/here_to_slay_dungeons_mapper';
const HTSD_ASSET_PATTERNS = [
    'mac' => '/\.dmg$/',
    'windows' => '/x64-setup\.exe$/',
];
const HTSD_RELEASE_CACHE = __DIR__ . '/Download/.htsd_release_cache.json';
const HTSD_CACHE_TTL = 300; // 5 minutes

function htsd_get_download_url(string $platform): string
{
    // Try cached release data first
    $cached = null;
    if (is_file(HTSD_RELEASE_CACHE)) {
        $raw = file_get_contents(HTSD_RELEASE_CACHE);
        $cached = $raw ? json_decode($raw, true) : null;
        if ($cached && ($cached['time'] ?? 0) > time() - HTSD_CACHE_TTL) {
            if (!empty($cached['urls'][$platform])) {
                return $cached['urls'][$platform];
            }
        }
    }

    // Fetch latest release from GitHub API
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
        // API failed — fall back to cached data if available
        if ($cached && !empty($cached['urls'][$platform])) {
            return $cached['urls'][$platform];
        }
        throw new RuntimeException('Could not fetch release info.');
    }

    $release = json_decode($json, true);
    $urls = [];
    foreach (HTSD_ASSET_PATTERNS as $plat => $pattern) {
        foreach ($release['assets'] ?? [] as $asset) {
            if (preg_match($pattern, $asset['name'])) {
                $urls[$plat] = $asset['browser_download_url'];
                break;
            }
        }
    }

    // Cache the result
    $dir = dirname(HTSD_RELEASE_CACHE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents(HTSD_RELEASE_CACHE, json_encode(['time' => time(), 'urls' => $urls]));

    if (empty($urls[$platform])) {
        throw new RuntimeException("No $platform asset found in latest release.");
    }
    return $urls[$platform];
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

$url = htsd_get_download_url($platform);

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
