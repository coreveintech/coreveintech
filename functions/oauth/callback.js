/**
 * Cloudflare Pages Function — GitHub OAuth 回调处理
 * GET /oauth/callback
 * 
 * GitHub 授权完成后回调到这里，我们用 code 换取 access_token，
 * 然后返回给 Decap CMS。
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const clientId = env.OAUTH_CLIENT_ID;
  const clientSecret = env.OAUTH_CLIENT_SECRET;
  const origin = env.OAUTH_ORIGIN || url.origin;

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  if (!clientId || !clientSecret) {
    return new Response('OAuth credentials not configured', { status: 500 });
  }

  try {
    // 用 code 换取 access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${origin}/oauth/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 返回 Decap CMS 需要的格式
    // Decap CMS 期望收到 { token, provider } 的 postMessage
    const html = `<!DOCTYPE html>
<html>
<head>
  <script>
    (function() {
      window.opener.postMessage(
        ${JSON.stringify({
          token: tokenData.access_token,
          provider: 'github',
          backendName: 'github',
        })},
        window.location.origin
      );
      window.close();
    })();
  </script>
</head>
<body>
  <p>Authentication successful. You may close this window.</p>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Token exchange failed', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
