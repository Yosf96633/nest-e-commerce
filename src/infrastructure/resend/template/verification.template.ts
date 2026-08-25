export const getVerificationEmailTemplate = (verificationLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    /* Base styles */
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f6;
      margin: 0;
      padding: 0;
      color: #333333;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Layout */
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    
    .header {
      background-color: #000000;
      padding: 32px 40px;
      text-align: center;
    }
    
    .content {
      padding: 48px 40px;
      text-align: center;
    }
    
    .footer {
      background-color: #f9fafa;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #eaeaea;
    }

    /* Typography */
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .content h2 {
      color: #111111;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .content p {
      font-size: 16px;
      line-height: 1.6;
      color: #555555;
      margin-bottom: 32px;
    }
    
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #888888;
      line-height: 1.6;
    }
    
    .footer a {
      color: #000000;
      text-decoration: underline;
    }

    /* Elements */
    .btn {
      display: inline-block;
      padding: 16px 32px;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
    }
    
    .btn:hover {
      background-color: #333333;
    }
    
    .divider {
      height: 1px;
      background-color: #eaeaea;
      margin: 32px 0;
    }

    /* Import Inter font if supported */
    @media screen {
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        src: local(''), url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        src: local(''), url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKIFAZ9hiA.woff2') format('woff2');
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>E-Commerce</h1>
    </div>
    
    <div class="content">
      <h2>Welcome Aboard!</h2>
      <p>Thank you for joining us. To complete your registration and secure your account, please verify your email address by clicking the button below.</p>
      
      <a href="${verificationLink}" class="btn">Verify Email Address</a>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #777777; margin-bottom: 0;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} E-Commerce App. All rights reserved.</p>
      <p style="margin-top: 16px;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
      <p style="word-break: break-all; margin-top: 8px;">
        <a href="${verificationLink}">${verificationLink}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
