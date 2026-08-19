const BRAND_COLOR = "#4a7c59";
const SITE_NAME = "Myah Travels";
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

export function magicLinkEmail(
  memberName: string | null,
  portalName: string,
  magicLinkUrl: string
): { subject: string; html: string } {
  const displayName = escapeHtml(memberName || "there");
  const safePortalName = escapeHtml(portalName);

  const content = `
    <h2 style="color: #333; font-size: 20px;">Your Portal Access Link</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi ${displayName},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      You've been added to the <strong>${safePortalName}</strong> portal.
      Click the button below to access your trip information.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
        Access Portal
      </a>
    </div>
    <p style="color: #999; font-size: 14px;">
      This link expires in 7 days. If you need a new link, contact Myah.
    </p>
  `;

  return {
    subject: `Your ${safePortalName} Access Link`,
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
