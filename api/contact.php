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

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

// Validate required fields
$required = ['name', 'email', 'subject', 'message'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit();
    }
}

// Sanitize input
$name = htmlspecialchars(trim($data['name']));
$email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$subject = htmlspecialchars(trim($data['subject']));
$message = htmlspecialchars(trim($data['message']));

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit();
}

// Simple file-based storage for local development
$dataFile = __DIR__ . '/data/contacts.json';

// Ensure data directory exists
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Load existing contacts
$contacts = [];
if (file_exists($dataFile)) {
    $jsonData = file_get_contents($dataFile);
    $contacts = json_decode($jsonData, true) ?: [];
}

// Add new contact
$contact = [
    'id' => uniqid(),
    'name' => $name,
    'email' => $email,
    'subject' => $subject,
    'message' => $message,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
];

$contacts[] = $contact;

// Save contacts
file_put_contents($dataFile, json_encode($contacts, JSON_PRETTY_PRINT));

// For local development, also try to send email if mail() is available
$emailSent = false;
if (function_exists('mail')) {
    $to = 'e.pequierda@yahoo.com';
    $emailSubject = "Portfolio Contact: $subject";
    $emailBody = "Name: $name\nEmail: $email\nSubject: $subject\n\nMessage:\n$message\n\nIP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown');
    $headers = "From: $email\r\nReply-To: $email\r\n";
    
    $emailSent = mail($to, $emailSubject, $emailBody, $headers);
}

echo json_encode([
    'success' => true,
    'message' => 'Contact form submitted successfully',
    'emailSent' => $emailSent,
    'contactId' => $contact['id']
]);
?>
