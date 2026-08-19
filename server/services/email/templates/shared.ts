// Shared wrapper so every email template looks like it came from the same product instead of
// five unrelated snippets of HTML. Deliberately inline-styled — most email clients strip <style>
// tags entirely.
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="background:#0a0a0a;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" style="background:#111;border:2px solid #262626;border-radius:24px;overflow:hidden;">
          <tr><td style="background:#facc15;padding:20px 32px;">
            <span style="font-weight:900;font-size:18px;letter-spacing:-0.5px;color:#111;text-transform:uppercase;">UniHack Ledger</span>
          </td></tr>
          <tr><td style="padding:32px;color:#e5e5e5;font-size:14px;line-height:1.6;">
            <h1 style="font-size:18px;color:#fff;margin:0 0 16px;">${title}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #262626;color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:1px;">
            UniHack Ledger — automated notification
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#facc15;color:#111;font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:1px;text-decoration:none;border-radius:999px;">${label}</a>`;
}
