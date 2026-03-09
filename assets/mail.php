<?php

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    echo 'There was a problem with your submission, please try again.';
    exit;
}

$name = strip_tags(trim($_POST['name'] ?? ''));
$name = str_replace(["\r", "\n"], [' ', ' '], $name);
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$service = strip_tags(trim($_POST['service'] ?? ''));
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (empty($name) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo 'Please complete the form and try again.';
    exit;
}

// Gmail SMTP only
$config = [
    'host' => 'smtp.gmail.com',
    'port' => 465,
    'secure' => 'ssl',
    'username' => 'letsdoveera@gmail.com',
    'password' => getenv('GMAIL_APP_PASSWORD') ?: '',
    'from_email' => 'letsdoveera@gmail.com',
    'from_name' => 'Letsdo Creative',
    'recipient' => 'letsdoveera@gmail.com',
];

if (empty($config['password'])) {
    http_response_code(500);
    echo 'Mail service is not configured. Please set GMAIL_APP_PASSWORD.';
    exit;
}

$mailSubject = $subject !== '' ? $subject : 'Website Enquiry';

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->Port = $config['port'];

    if ($config['secure'] === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['recipient']);
    $mail->addReplyTo($email, $name);
    $mail->Subject = $mailSubject;
    $selectedService = $service !== '' ? $service : 'Not specified';
    $mail->Body = "Name: {$name}\nEmail: {$email}\nService: {$selectedService}\n\nMessage:\n{$message}\n";
    $mail->AltBody = $mail->Body;

    $mail->send();

    http_response_code(200);
    echo 'Thank You! Your message has been sent.';
} catch (Exception $e) {
    http_response_code(500);
    echo 'Oops! Something went wrong and we could not send your message.';
}
