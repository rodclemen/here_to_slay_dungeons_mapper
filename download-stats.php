<?php

declare(strict_types=1);

const HTSD_STATS_FILE = __DIR__ . '/Download/.htsd_mapper_download_stats.json';

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
        return [];
    }

    $raw = file_get_contents(HTSD_STATS_FILE);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    $stats = htsd_load_stats();

    htsd_send_json([
        'count_mac' => max(0, (int)($stats['count_mac'] ?? 0)),
        'count_windows' => max(0, (int)($stats['count_windows'] ?? 0)),
    ]);
} catch (Throwable $error) {
    htsd_send_json([
        'error' => 'Could not load download stats.',
        'detail' => $error->getMessage(),
    ], 500);
}
