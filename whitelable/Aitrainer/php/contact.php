<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'type' => 'danger',
        'message' => 'Method not allowed.',
    ]);
    exit;
}

function clean_text($value) {
    $value = trim((string)$value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$name = clean_text($_POST['name'] ?? '');
$email = trim((string)($_POST['email'] ?? ''));
$subject = clean_text($_POST['subject'] ?? 'Contact Form Message');
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode([
        'type' => 'danger',
        'message' => 'Name, email, and message are required.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'type' => 'danger',
        'message' => 'Please enter a valid email address.',
    ]);
    exit;
}

$to = 'letsdoveera@gmail.com';
$safeSubject = $subject !== '' ? $subject : 'Contact Form Message';
$safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
$body = "New contact form submission:\n\n"
      . "Name: {$name}\n"
      . "Email: {$email}\n"
      . "Subject: {$safeSubject}\n\n"
      . "Message:\n{$safeMessage}\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: AI Teacher Contact <no-reply@letsdocreative.com>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = @mail($to, $safeSubject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode([
        'type' => 'success',
        'message' => 'Thanks! Your message has been sent successfully.',
    ]);
    exit;
}

http_response_code(500);
echo json_encode([
    'type' => 'danger',
    'message' => 'Could not send message. Please try again later.',
]);

