<?php

declare(strict_types=1);

const HTSD_DOWNLOAD_FILE = __DIR__ . '/Download/HtSDMapper.dmg';
const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';
const HTSD_METADATA_TTL = 86400;

function htsd_send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

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

function htsd_save_stats(array $stats): void
{
    $dir = dirname(HTSD_STATS_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    $handle = fopen(HTSD_STATS_FILE, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Could not open stats file for writing.');
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

function htsd_refresh_metadata_if_needed(array $stats): array
{
    $now = time();
    $needsRefresh = ($now - (int)($stats['lastChecked'] ?? 0)) >= HTSD_METADATA_TTL
        || empty($stats['fileDate'])
        || empty($stats['fileSize']);

    if (!$needsRefresh) {
        return $stats;
    }

    if (!is_file(HTSD_DOWNLOAD_FILE)) {
        $stats['fileDate'] = null;
        $stats['fileSize'] = null;
        $stats['lastChecked'] = $now;
        return $stats;
    }

    $mtime = filemtime(HTSD_DOWNLOAD_FILE);
    $size = filesize(HTSD_DOWNLOAD_FILE);

    $stats['fileDate'] = $mtime !== false ? gmdate('c', $mtime) : null;
    $stats['fileSize'] = $size !== false ? (int)$size : null;
    $stats['lastChecked'] = $now;
    return $stats;
}

try {
    $stats = htsd_load_stats();
    $stats = htsd_refresh_metadata_if_needed($stats);
    htsd_save_stats($stats);

    htsd_send_json([
        'count' => (int)$stats['count'],
        'fileDate' => $stats['fileDate'],
        'fileSize' => $stats['fileSize'],
        'lastChecked' => (int)$stats['lastChecked'],
    ]);
} catch (Throwable $error) {
    htsd_send_json([
        'error' => 'Could not load download stats.',
        'detail' => $error->getMessage(),
    ], 500);
}
