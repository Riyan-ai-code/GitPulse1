import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

export const redirectToGithub = (req, res) => {
  if (!CLIENT_ID) {
    return res.status(400).json({
      error: 'OAuth Not Configured',
      message: 'GitHub OAuth is not configured on this server. Please add GITHUB_CLIENT_ID to backend/.env'
    });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,read:user`;
  return res.redirect(githubAuthUrl);
};

export const githubCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('http://localhost:3000?auth_error=code_missing');
  }

  try {
    // Exchange temporary code for an access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token, error, error_description } = tokenResponse.data;

    if (error) {
      console.error('[OAuth] Callback token exchange failure:', error_description || error);
      return res.redirect(`http://localhost:3000?auth_error=${encodeURIComponent(error)}`);
    }

    // Set access token cookie (15 minutes)
    res.cookie('github_access_token', access_token, {
      httpOnly: true,
      secure: false, // SameSite cookie over http for local dev
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set refresh token cookie (24 hours)
    res.cookie('github_refresh_token', access_token, {
      httpOnly: true,
      secure: false, // SameSite cookie over http for local dev
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.redirect('http://localhost:3000?auth_success=true');
  } catch (error) {
    console.error('[OAuth] Token exchange network error:', error);
    return res.redirect('http://localhost:3000?auth_error=exchange_failed');
  }
};

export const getAuthenticatedUser = async (req, res) => {
  // Extract and parse cookie value manually
  const rawCookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    rawCookieHeader.split('; ').map(c => {
      const parts = c.split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );
  
  let token = cookies.github_access_token || null;
  if (!token && cookies.github_refresh_token) {
    token = cookies.github_refresh_token;
    res.cookie('github_access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
  }

  if (!token) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GitPulse-OAuth'
      }
    });

    return res.json({
      authenticated: true,
      user: {
        login: userRes.data.login,
        avatar_url: userRes.data.avatar_url,
        html_url: userRes.data.html_url
      }
    });
  } catch (error) {
    console.warn('[OAuth] Invalid or expired github oauth token, clearing:', error.message);
    res.clearCookie('github_access_token');
    res.clearCookie('github_refresh_token');
    return res.json({ authenticated: false, user: null });
  }
};

export const logout = (req, res) => {
  res.clearCookie('github_access_token');
  res.clearCookie('github_refresh_token');
  return res.json({ success: true, message: 'Logged out successfully' });
};
