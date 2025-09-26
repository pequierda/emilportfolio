<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Simple file-based storage for local development
$dataFile = __DIR__ . '/data/visitors.json';

// Ensure data directory exists
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Load existing data
$data = ['count' => 0, 'lastVisit' => null, 'lastLocation' => null];
if (file_exists($dataFile)) {
    $jsonData = file_get_contents($dataFile);
    $loadedData = json_decode($jsonData, true);
    if ($loadedData) {
        $data = $loadedData;
    }
}

if ($method === 'GET') {
    echo json_encode($data);
    exit();
}

if ($method === 'POST') {
    // Get visitor's IP address
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    
    // Get additional IP headers for better detection
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    }
    
    // Simple location detection (for local development)
    $location = [
        'ip' => $ip,
        'country' => 'Philippines',
        'countryCode' => 'PH',
        'city' => 'Manila',
        'region' => 'NCR',
        'timezone' => 'Asia/Manila'
    ];
    
    // Update visitor data
    $data['count'] = ($data['count'] ?? 0) + 1;
    $data['lastVisit'] = date('Y-m-d H:i:s');
    $data['lastLocation'] = $location;
    
    // Save updated data
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
    
    echo json_encode($data);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
