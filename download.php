<?php

declare(strict_types=1);

const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';

const HTSD_DOWNLOAD_URLS = [
    'mac' => 'https://drive.google.com/uc?id=1bkfwmAxLjzTs7wA_HEhVzNs-_92mqMkd&export=download',
    'windows' => 'https://drive.google.com/uc?id=1phr0PLfydEu3Gva4on2pzeWgWwvoXtYl&export=download',
];

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

$platform = isset($_GET['platform']) && array_key_exists($_GET['platform'], HTSD_DOWNLOAD_URLS)
    ? $_GET['platform']
    : 'mac';

$url = HTSD_DOWNLOAD_URLS[$platform];

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
