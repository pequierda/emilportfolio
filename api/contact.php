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

// Email configuration
$to = 'e.pequierda@yahoo.com';
$emailSubject = "Portfolio Contact: $subject";
$emailBody = "Name: $name\nEmail: $email\nSubject: $subject\n\nMessage:\n$message\n\nIP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\nTime: " . date('Y-m-d H:i:s');
$headers = "From: $email\r\nReply-To: $email\r\nX-Mailer: PHP/" . phpversion();

// Try to send email
$emailSent = false;
if (function_exists('mail')) {
    $emailSent = mail($to, $emailSubject, $emailBody, $headers);
}

// Also save to file for backup
$dataFile = __DIR__ . '/data/contacts.json';
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$contacts = [];
if (file_exists($dataFile)) {
    $jsonData = file_get_contents($dataFile);
    $contacts = json_decode($jsonData, true) ?: [];
}

$contact = [
    'id' => uniqid(),
    'name' => $name,
    'email' => $email,
    'subject' => $subject,
    'message' => $message,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
    'emailSent' => $emailSent
];

$contacts[] = $contact;
file_put_contents($dataFile, json_encode($contacts, JSON_PRETTY_PRINT));

// Response
if ($emailSent) {
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully! I will get back to you soon.',
        'contactId' => $contact['id']
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => 'Message received! (Email sending may be disabled on this server, but your message has been saved)',
        'contactId' => $contact['id']
    ]);
}
?>
