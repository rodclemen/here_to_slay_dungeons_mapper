<?php

declare(strict_types=1);

const HTSD_DOWNLOAD_FILE = __DIR__ . '/Download/HtSDMapper.dmg';
const HTSD_DOWNLOAD_PUBLIC_PATH = './Download/HtSDMapper.dmg';
const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';

function htsd_load_stats(): array
{
    if (!is_file(HTSD_STATS_FILE)) {
        return [
            'count' => 0,
            'fileDate' => null,
            'fileSize' => null,
            'lastChecked' => 0,
        ];
    }

    $raw = file_get_contents(HTSD_STATS_FILE);
    if ($raw === false || $raw === '') {
        return [
            'count' => 0,
            'fileDate' => null,
            'fileSize' => null,
            'lastChecked' => 0,
        ];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [
            'count' => 0,
            'fileDate' => null,
            'fileSize' => null,
            'lastChecked' => 0,
        ];
    }

    return [
        'count' => max(0, (int)($decoded['count'] ?? 0)),
        'fileDate' => isset($decoded['fileDate']) ? (string)$decoded['fileDate'] : null,
        'fileSize' => isset($decoded['fileSize']) ? (int)$decoded['fileSize'] : null,
        'lastChecked' => max(0, (int)($decoded['lastChecked'] ?? 0)),
    ];
}

function htsd_increment_download_count(): void
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

        $raw = stream_get_contents($handle);
        $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
        $stats = is_array($decoded) ? $decoded : [];
        $stats['count'] = max(0, (int)($stats['count'] ?? 0)) + 1;
        $stats['fileDate'] = isset($stats['fileDate']) ? (string)$stats['fileDate'] : null;
        $stats['fileSize'] = isset($stats['fileSize']) ? (int)$stats['fileSize'] : null;
        $stats['lastChecked'] = max(0, (int)($stats['lastChecked'] ?? 0));

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
}

if (!is_file(HTSD_DOWNLOAD_FILE)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Download file not found.';
    exit;
}

try {
    htsd_increment_download_count();
} catch (Throwable $error) {
    // Do not block the download if stats persistence fails.
}

header('Location: ' . HTSD_DOWNLOAD_PUBLIC_PATH, true, 302);
exit;
