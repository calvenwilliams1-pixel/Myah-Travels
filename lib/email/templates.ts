import {
  resolveInviteCopy,
  substituteTokens,
  type InviteCopy,
} from "@/lib/wording/registry";

const BRAND_COLOR = "#4a7c59";
const SITE_NAME = "MyCalTravels";
const SITE_URL = process.env.SITE_URL || "https://myahtravels.com";
// Used only when a caller does not pass the Settings values (tests,
// older call sites). Production sends pass the real settings, and an
// empty setting hides the link instead of rendering a dead one.
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/mycaltravels";
const DEFAULT_YOUTUBE_URL = "https://youtube.com/@mycaltravels";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Escape a wording string for HTML without touching quotes, so the
 * registry defaults (which contain apostrophes) render byte-for-byte
 * as the old hardcoded strings did. Token substitution happens after
 * this, with already-escaped values.
 */
function escapeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The site name from Settings when given, else the built-in name. */
function resolveSiteName(raw?: string | null): string {
  const value = (raw ?? "").trim();
  return value || SITE_NAME;
}

function baseTemplate(content: string, siteName?: string | null): string {
  const name = resolveSiteName(siteName);
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
        <h1 style="color: ${BRAND_COLOR}; font-size: 24px; margin: 0;">${name}</h1>
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} ${name}. All rights reserved.
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

interface MagicLinkShellOptions {
  siteName?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  /** Already rendered (escaped, tokens filled) by magicLinkEmail. */
  footerReason: string;
}

function magicLinkShell(
  content: string,
  brand: string,
  options: MagicLinkShellOptions
): string {
  const name = resolveSiteName(options.siteName);
  const heroUrl = `${SITE_URL}/images/welcome-banner.jpg`;
  // A social link renders only when its Settings URL is non-empty;
  // an empty handle hides the link instead of pointing nowhere.
  const socialLinks: string[] = [];
  const instagramUrl = (options.instagramUrl ?? "").trim();
  const youtubeUrl = (options.youtubeUrl ?? "").trim();
  if (instagramUrl) {
    socialLinks.push(
      `<a href="${escapeHtml(instagramUrl)}" style="color: ${brand}; text-decoration: none; font-weight: 600;">Instagram</a>`
    );
  }
  if (youtubeUrl) {
    socialLinks.push(
      `<a href="${escapeHtml(youtubeUrl)}" style="color: ${brand}; text-decoration: none; font-weight: 600;">YouTube</a>`
    );
  }
  const socialParagraph = socialLinks.length
    ? `
              <p style="margin: 0 0 6px; color: #666666; font-size: 13px;">
                Follow along:
                ${socialLinks.join("\n                &nbsp;·&nbsp;\n                ")}
              </p>`
    : "";
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
              <span style="color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; letter-spacing: 0.5px;">${name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 0; line-height: 0;">
              <img src="${heroUrl}" width="600" alt="Travel with ${name}" style="display: block; width: 100%; max-width: 600px; height: auto;">
            </td>
          </tr>
          ${content}
          <tr>
            <td style="padding: 22px 40px 30px; text-align: center; border-top: 1px solid #eeeeee;">${socialParagraph}
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                © ${new Date().getFullYear()} ${name}. ${options.footerReason}
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

export interface MagicLinkEmailOptions {
  /**
   * The invite wording (Settings overrides over registry defaults),
   * resolved by the caller. Omit it and the registry defaults render,
   * which is what the pre-R1 hardcoded email said, apart from the
   * plan's five deliberate day-one line changes.
   */
  copy?: InviteCopy;
  /** Settings site_name; the shell wears it instead of a constant. */
  siteName?: string | null;
  /** Settings social URLs; an empty one hides its footer link. */
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
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
  brandColor?: string | null,
  options?: MagicLinkEmailOptions
): { subject: string; html: string } {
  const brand = resolveBrandColor(brandColor);
  const copy = options?.copy ?? resolveInviteCopy({});
  const displayName = escapeHtml(memberName || "there");
  const safePortalName = escapeHtml(portalName);
  const isPromo = expiresOnLabel === null;

  // Wording renders the same way for the real send, the admin preview
  // and the test send, because all three call this one function: the
  // stored words are escaped as text, then the tokens are filled with
  // escaped values. In the body, the portal name renders bold, as it
  // did in the hardcoded email.
  const subs = {
    name: displayName,
    portal: safePortalName,
    date: expiresOnLabel ? escapeHtml(expiresOnLabel) : "",
  };
  const render = (text: string) => substituteTokens(escapeText(text), subs);
  const renderBody = (text: string) =>
    substituteTokens(escapeText(text), {
      ...subs,
      portal: `<strong>${safePortalName}</strong>`,
    });

  const expiryText = isPromo
    ? render(copy.expiryPromo)
    : render(copy.expiryTrip);
  const expiryParagraph = `<p style="color: #999999; font-size: 13px; line-height: 1.6; text-align: center; margin: 0;">
      ${expiryText}
    </p>`;

  const content = `
          <tr>
            <td style="padding: 36px 40px 30px;">
              <p style="color: ${brand}; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px;">
                ${render(copy.eyebrow)}
              </p>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; color: #222222; font-size: 27px; line-height: 1.25; margin: 0 0 16px;">
                ${safePortalName}
              </h1>
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                ${render(copy.greeting)}
              </p>
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0;">
                ${renderBody(isPromo ? copy.bodyPromo : copy.bodyTrip)}
              </p>
              <div style="text-align: center; margin: 30px 0 22px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background-color: ${brand}; color: #ffffff; padding: 15px 42px; border-radius: 999px; text-decoration: none; font-size: 16px; font-weight: 600;">
                  Access Portal
                </a>
              </div>
              <p style="color: #aaaaaa; font-size: 12px; line-height: 1.6; text-align: center; margin: 0 0 26px;">
                ${render(copy.fallbackHint)}<br>
                <a href="${magicLinkUrl}" style="color: ${brand}; word-break: break-all;">${magicLinkUrl}</a>
              </p>
              ${expiryParagraph}
            </td>
          </tr>`;

  // Subjects are plain text, not HTML: fill the tokens with the
  // escaped values (as the old template did), then strip CR/LF so a
  // portal name containing a newline can never inject a header.
  const subject = substituteTokens(copy.subject, subs).replace(/[\r\n]+/g, " ");

  return {
    subject,
    html: magicLinkShell(content, brand, {
      siteName: options?.siteName,
      instagramUrl:
        options?.instagramUrl === undefined ? DEFAULT_INSTAGRAM_URL : options.instagramUrl,
      youtubeUrl:
        options?.youtubeUrl === undefined ? DEFAULT_YOUTUBE_URL : options.youtubeUrl,
      footerReason: render(copy.footerReason),
    }),
  };
}

export function passwordResetEmail(
  username: string,
  resetUrl: string,
  siteName?: string | null
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
      ask for it, you can ignore this email. Your password won't change.
    </p>
  `;

  return {
    subject: "Reset your MyCalTravels password",
    html: baseTemplate(content, siteName),
  };
}

export function inquiryNotificationEmail(
  clientName: string,
  destination: string | null,
  clientEmail: string | null,
  clientPhone: string | null,
  siteName?: string | null
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
    html: baseTemplate(content, siteName),
  };
}

export function portalNoticeEmail(
  memberName: string | null,
  portalName: string,
  noticeTitle: string,
  noticeContent: string,
  portalUrl: string,
  siteName?: string | null
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
    html: baseTemplate(content, siteName),
  };
}

export function globalAnnouncementEmail(
  memberName: string | null,
  announcementTitle: string,
  announcementContent: string,
  siteName?: string | null
): { subject: string; html: string } {
  const name = resolveSiteName(siteName);
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
      You're receiving this because you're a member of a ${name} travel portal.
      <br>
      <a href="${SITE_URL}/unsubscribe" style="color: #999;">Unsubscribe from global announcements</a>
    </p>
  `;

  return {
    subject: `Important Update from ${name}`,
    html: baseTemplate(content, siteName),
  };
}
