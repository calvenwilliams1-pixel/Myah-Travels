const BRAND_COLOR = "#4a7c59";
const SITE_NAME = "MyCalTravels";
const SITE_URL = process.env.SITE_URL || "https://myahtravels.com";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Inter', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${BRAND_COLOR}; font-size: 24px; margin: 0;">${SITE_NAME}</h1>
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * The magic-link email gets its own shell (the other emails keep the
 * shared baseTemplate): a brand bar, the site's welcome photo as a
 * hero, and a social footer. Table-based with inline styles, like
 * everything here, so it holds up in real mail clients. If the hero
 * image is blocked by the client, the layout still reads cleanly.
 */
/** The site's brand colour when it's a plain hex value, else the default. */
function resolveBrandColor(raw?: string | null): string {
  const value = (raw ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : BRAND_COLOR;
}

function magicLinkShell(content: string, brand: string): string {
  const heroUrl = `${SITE_URL}/images/welcome-banner.jpg`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: ${brand}; padding: 18px 40px; text-align: center;">
              <span style="color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; letter-spacing: 0.5px;">${SITE_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0; line-height: 0;">
              <img src="${heroUrl}" width="600" alt="Travel with ${SITE_NAME}" style="display: block; width: 100%; max-width: 600px; height: auto;">
            </td>
          </tr>
          ${content}
          <tr>
            <td style="padding: 22px 40px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 6px; color: #666666; font-size: 13px;">
                Follow along:
                <a href="https://www.instagram.com/mycaltravels" style="color: ${brand}; text-decoration: none; font-weight: 600;">Instagram</a>
                &nbsp;·&nbsp;
                <a href="https://youtube.com/@mycaltravels" style="color: ${brand}; text-decoration: none; font-weight: 600;">YouTube</a>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                © ${new Date().getFullYear()} ${SITE_NAME}. You're receiving this because Myah added you to a client portal.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function magicLinkEmail(
  memberName: string | null,
  portalName: string,
  magicLinkUrl: string,
  // null = the link never expires (the promo portal); the email says
  // so instead of naming a date.
  expiresOnLabel: string | null,
  // The site's current primary colour (Settings), so the email
  // follows the site's theme. Falls back to the default brand green.
  brandColor?: string | null
): { subject: string; html: string } {
  const brand = resolveBrandColor(brandColor);
  const displayName = escapeHtml(memberName || "there");
  const safePortalName = escapeHtml(portalName);
  const expiryParagraph =
    expiresOnLabel === null
      ? `<p style="color: #999999; font-size: 13px; line-height: 1.6; text-align: center; margin: 0;">
      This link doesn't expire — save it and come back any time. If you lose it, contact Myah for a new one.
    </p>`
      : `<p style="color: #999999; font-size: 13px; line-height: 1.6; text-align: center; margin: 0;">
      This link expires on ${escapeHtml(expiresOnLabel)}. If you need a new link, contact Myah.
    </p>`;

  const content = `
          <tr>
            <td style="padding: 36px 40px 30px;">
              <p style="color: ${brand}; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px;">
                Your portal is ready
              </p>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; color: #222222; font-size: 27px; line-height: 1.25; margin: 0 0 16px;">
                ${safePortalName}
              </h1>
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Hi ${displayName},
              </p>
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0;">
                You've been added to the <strong>${safePortalName}</strong> portal — ${
                  expiresOnLabel === null
                    ? "that's where Myah shares sample itineraries, travel ideas and offers, just for you."
                    : "that's where your trip information, documents and updates live."
                } Click below to step inside.
              </p>
              <div style="text-align: center; margin: 30px 0 22px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background-color: ${brand}; color: #ffffff; padding: 15px 42px; border-radius: 999px; text-decoration: none; font-size: 16px; font-weight: 600;">
                  Access Portal
                </a>
              </div>
              <p style="color: #aaaaaa; font-size: 12px; line-height: 1.6; text-align: center; margin: 0 0 26px;">
                Button not working? Copy this link into your browser:<br>
                <a href="${magicLinkUrl}" style="color: ${brand}; word-break: break-all;">${magicLinkUrl}</a>
              </p>
              ${expiryParagraph}
            </td>
          </tr>`;

  return {
    subject: `Your ${safePortalName} Access Link`,
    html: magicLinkShell(content, brand),
  };
}

export function passwordResetEmail(
  username: string,
  resetUrl: string
): { subject: string; html: string } {
  const safeUsername = escapeHtml(username);

  const content = `
    <h2 style="color: #333; font-size: 20px;">Reset Your Password</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi ${safeUsername},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Someone asked to reset the password for your MyCalTravels admin
      account. Click the button below to choose a new one.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    <p style="color: #999; font-size: 14px;">
      This link works for 1 hour and can only be used once. If you didn't
      ask for it, you can ignore this email — your password won't change.
    </p>
  `;

  return {
    subject: "Reset your MyCalTravels password",
    html: baseTemplate(content),
  };
}

export function inquiryNotificationEmail(
  clientName: string,
  destination: string | null,
  clientEmail: string | null,
  clientPhone: string | null
): { subject: string; html: string } {
  const safeName = escapeHtml(clientName);
  const safeDest = escapeHtml(destination || "Not specified");
  const safeContact = escapeHtml(clientEmail || clientPhone || "No contact info provided");

  const content = `
    <h2 style="color: #333; font-size: 20px;">New Client Inquiry</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      A new inquiry has been submitted.
    </p>
    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; font-weight: 600; color: #666;">Name:</td>
        <td style="padding: 8px; color: #333;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: 600; color: #666;">Destination:</td>
        <td style="padding: 8px; color: #333;">${safeDest}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: 600; color: #666;">Contact:</td>
        <td style="padding: 8px; color: #333;">${safeContact}</td>
      </tr>
    </table>
    <p style="color: #999; font-size: 14px;">
      Log in to the admin dashboard to view the full inquiry.
    </p>
  `;

  return {
    subject: `New Client Inquiry: ${safeName}`,
    html: baseTemplate(content),
  };
}

export function portalNoticeEmail(
  memberName: string | null,
  portalName: string,
  noticeTitle: string,
  noticeContent: string,
  portalUrl: string
): { subject: string; html: string } {
  const safeName = escapeHtml(memberName || "there");
  const safePortalName = escapeHtml(portalName);
  const safeTitle = escapeHtml(noticeTitle);
  const safeContent = escapeHtml(noticeContent);

  const content = `
    <h2 style="color: #333; font-size: 20px;">${safeTitle}</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi ${safeName},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      A new notice has been posted to the <strong>${safePortalName}</strong> portal.
    </p>
    <div style="background-color: #f9f9f9; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #333; font-size: 16px; margin: 0;">${safeContent}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
        View Portal
      </a>
    </div>
  `;

  return {
    subject: `[${safePortalName}] ${safeTitle}`,
    html: baseTemplate(content),
  };
}

export function globalAnnouncementEmail(
  memberName: string | null,
  announcementTitle: string,
  announcementContent: string
): { subject: string; html: string } {
  const safeName = escapeHtml(memberName || "there");
  const safeTitle = escapeHtml(announcementTitle);
  const safeContent = escapeHtml(announcementContent);

  const content = `
    <h2 style="color: #333; font-size: 20px;">${safeTitle}</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi ${safeName},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      ${safeContent}
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 30px;">
      You're receiving this because you're a member of a ${SITE_NAME} travel portal.
      <br>
      <a href="${SITE_URL}/unsubscribe" style="color: #999;">Unsubscribe from global announcements</a>
    </p>
  `;

  return {
    subject: `Important Update from ${SITE_NAME}`,
    html: baseTemplate(content),
  };
}
