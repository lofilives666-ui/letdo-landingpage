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
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (empty($name) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo 'Please complete the form and try again.';
    exit;
}

$defaultConfig = [
    'host' => 'smtp.titan.email',
    'port' => 587,
    'secure' => 'tls',
    'username' => 'info@letesdocreative.com',
    'password' => '',
    'from_email' => 'info@letesdocreative.com',
    'from_name' => 'Letsdo Creative',
    'recipient' => 'info@letesdocreative.com',
];

$fileConfig = [];
$configPaths = [
    __DIR__ . '/titan-smtp-config.local.php',
    __DIR__ . '/titan-smtp-config.php',
    __DIR__ . '/titan-smtp-config.example.php',
];
foreach ($configPaths as $configPath) {
    if (!file_exists($configPath)) {
        continue;
    }
    $loaded = require $configPath;
    if (is_array($loaded)) {
        $fileConfig = $loaded;
        break;
    }
}

$config = array_merge($defaultConfig, $fileConfig);

$config['host'] = getenv('TITAN_SMTP_HOST') ?: $config['host'];
$config['port'] = (int) (getenv('TITAN_SMTP_PORT') ?: $config['port']);
$config['secure'] = getenv('TITAN_SMTP_SECURE') ?: $config['secure'];
$config['username'] = getenv('TITAN_SMTP_USER') ?: $config['username'];
$config['password'] = getenv('TITAN_SMTP_PASS') ?: $config['password'];
$config['from_email'] = getenv('MAIL_FROM_EMAIL') ?: $config['from_email'];
$config['from_name'] = getenv('MAIL_FROM_NAME') ?: $config['from_name'];
$config['recipient'] = getenv('MAIL_TO_EMAIL') ?: $config['recipient'];

if (empty($config['password'])) {
    http_response_code(500);
    echo 'Mail service is not configured. Please set Titan SMTP password.';
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
    $mail->Body = "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}\n";
    $mail->AltBody = $mail->Body;

    $mail->send();

    http_response_code(200);
    echo 'Thank You! Your message has been sent.';
} catch (Exception $e) {
    http_response_code(500);
    echo 'Oops! Something went wrong and we could not send your message.';
}
