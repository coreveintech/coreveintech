/**
 * Cloudflare Pages Function — GitHub OAuth 授权入口
 * GET /oauth/auth
 * 
 * Decap CMS 点击 "Login with GitHub" 后重定向到这里，
 * 我们再把用户重定向到 GitHub OAuth 授权页面。
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const clientId = env.OAUTH_CLIENT_ID;
  const origin = env.OAUTH_ORIGIN || url.origin;

  if (!clientId) {
    return new Response('OAUTH_CLIENT_ID not configured', { status: 500 });
  }

  // 构建 GitHub OAuth 授权 URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/oauth/callback`,
    scope: 'repo,user',
  });

  // 保留 CMS 传递的 provider 参数
  const provider = url.searchParams.get('provider');
  if (provider) {
    params.set('state', provider);
  }

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
    302
  );
}
