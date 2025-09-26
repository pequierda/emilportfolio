<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
$project = isset($_GET['project']) ? strtolower(trim($_GET['project'])) : '';

if (empty($project)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing project parameter']);
    exit();
}

// Simple file-based storage for local development
$dataFile = __DIR__ . '/data/likes.json';

// Ensure data directory exists
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Load existing data
$data = [];
if (file_exists($dataFile)) {
    $jsonData = file_get_contents($dataFile);
    $data = json_decode($jsonData, true) ?: [];
}

if ($method === 'GET') {
    $count = isset($data[$project]) ? (int)$data[$project] : 0;
    echo json_encode(['project' => $project, 'count' => $count]);
    exit();
}

if ($method === 'POST') {
    $currentCount = isset($data[$project]) ? (int)$data[$project] : 0;
    $newCount = $currentCount + 1;
    $data[$project] = $newCount;
    
    // Save updated data
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
    
    echo json_encode(['project' => $project, 'count' => $newCount]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
