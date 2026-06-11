export function welcomeEmail({ display_name }: { display_name: string }) {
  const safeName = display_name.replace(/[<>&]/g, '')
  return {
    subject: 'Welcome to Edge Zone',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Edge Zone</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0e14;color:#fafafa;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#111720;border:1px solid #1f2937;border-radius:12px;padding:40px;">
    <h1 style="margin:0 0 16px;font-size:28px;color:#fafafa;">Welcome to Edge Zone, ${safeName}.</h1>
    <p style="margin:0 0 16px;color:#94a3b8;line-height:1.6;">
      You&rsquo;re in. Your account is ready, and we&rsquo;ll let you know as new modules come
      online &mdash; Marketplace, Brand Design, EPK, Talent Sites, Stores, Apps, and more.
    </p>
    <p style="margin:0;color:#94a3b8;line-height:1.6;">
      &mdash; The Edge Zone team
    </p>
  </div>
</body>
</html>`,
  }
}
