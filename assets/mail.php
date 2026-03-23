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
$countryCode = preg_replace('/[^0-9+]/', '', trim($_POST['country_code'] ?? ''));
$phoneRaw = trim($_POST['phone'] ?? '');
$phoneLocal = preg_replace('/[^0-9]/', '', $phoneRaw);
$phone = '';
$service = strip_tags(trim($_POST['service'] ?? ''));
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (empty($name) || empty($phoneRaw) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo 'Please complete the form and try again.';
    exit;
}

if ($countryCode !== '') {
    $phone = trim($countryCode . ' ' . $phoneLocal);
    if (!preg_match('/^\+[0-9]{1,4}$/', $countryCode) || !preg_match('/^[0-9]{6,14}$/', $phoneLocal)) {
        http_response_code(400);
        echo 'Please enter a valid mobile number.';
        exit;
    }
} else {
    $normalizedPhone = preg_replace('/[^0-9+]/', '', $phoneRaw);
    $phone = $normalizedPhone;
    if (!preg_match('/^\+?[0-9]{7,15}$/', $normalizedPhone)) {
        http_response_code(400);
        echo 'Please enter a valid mobile number.';
        exit;
    }
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
$selectedService = $service !== '' ? $service : 'Not specified';
$subjectLower = strtolower($mailSubject);
$source = 'Website';
if (strpos($subjectLower, 'home') !== false) {
    $source = 'Home Page';
} elseif (strpos($subjectLower, 'contact') !== false) {
    $source = 'Contact Page';
}
$submittedAt = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('M j, Y, g:i A') . ' IST';
$safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safePhone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$safeService = htmlspecialchars($selectedService, ENT_QUOTES, 'UTF-8');
$safeSource = htmlspecialchars($source, ENT_QUOTES, 'UTF-8');
$safeSubject = htmlspecialchars($mailSubject, ENT_QUOTES, 'UTF-8');
$safeSubmittedAt = htmlspecialchars($submittedAt, ENT_QUOTES, 'UTF-8');
$safeMessageHtml = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
$mailHtml = '<div style="margin:0;padding:24px;background:#f3f6fb;font-family:Arial,sans-serif;color:#1f2937;">'
    . '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
    . '<tr><td style="padding:18px 24px;background:#0f172a;color:#ffffff;">'
    . '<div style="font-size:20px;font-weight:700;">Letsdo Creative - New Enquiry</div>'
    . '<div style="font-size:13px;opacity:0.9;margin-top:4px;">' . $safeSubject . '</div>'
    . '</td></tr>'
    . '<tr><td style="padding:22px 24px;">'
    . '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">'
    . '<tr><td style="padding:0 0 10px;font-size:14px;"><strong>Name:</strong> ' . $safeName . '</td></tr>'
    . '<tr><td style="padding:0 0 10px;font-size:14px;"><strong>Email:</strong> ' . $safeEmail . '</td></tr>'
    . '<tr><td style="padding:0 0 10px;font-size:14px;"><strong>Mobile:</strong> ' . $safePhone . '</td></tr>'
    . '<tr><td style="padding:0 0 10px;font-size:14px;"><strong>Service:</strong> ' . $safeService . '</td></tr>'
    . '<tr><td style="padding:0 0 10px;font-size:14px;"><strong>Source:</strong> ' . $safeSource . '</td></tr>'
    . '<tr><td style="padding:0 0 16px;font-size:14px;"><strong>Submitted At:</strong> ' . $safeSubmittedAt . '</td></tr>'
    . '</table>'
    . '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Message</div>'
    . '<div style="font-size:14px;line-height:1.6;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">' . $safeMessageHtml . '</div>'
    . '<div style="margin-top:18px;font-size:13px;color:#4b5563;">Reply directly to this email to contact the lead.</div>'
    . '</td></tr></table></div>';
$mailText = "New Enquiry - Letsdo Creative\n"
    . "Subject: {$mailSubject}\n"
    . "Name: {$name}\n"
    . "Email: {$email}\n"
    . "Mobile: {$phone}\n"
    . "Service: {$selectedService}\n"
    . "Source: {$source}\n"
    . "Submitted At: {$submittedAt}\n\n"
    . "Message:\n{$message}\n";

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
    $mail->isHTML(true);
    $mail->Subject = "[Letsdo Lead] {$mailSubject} - {$selectedService}";
    $mail->Body = $mailHtml;
    $mail->AltBody = $mailText;

    $mail->send();

    http_response_code(200);
    echo 'Thank You! Your message has been sent.';
} catch (Exception $e) {
    http_response_code(500);
    echo 'Oops! Something went wrong and we could not send your message.';
}
