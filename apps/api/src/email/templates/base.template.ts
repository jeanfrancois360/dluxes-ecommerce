/**
 * Base Email Template - NextPik
 * Clean, modern design with black, white, and gold accents
 */

export const baseEmailTemplate = (
  content: string,
  options?: {
    unsubscribeUrl?: string;
    frontendUrl?: string;
    showUnsubscribe?: boolean;
  }
) => {
  const frontendUrl = options?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const showUnsubscribe = options?.showUnsubscribe !== false;
  const unsubscribeUrl = options?.unsubscribeUrl || `${frontendUrl}/account/notifications`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextPik</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center; border-bottom: 2px solid #CBB57B;">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODMwMiIgaGVpZ2h0PSIyMzUzIiB2aWV3Qm94PSIwIDAgODMwMiAyMzUzIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTI1MCAxOTcwLjAxSDk1MC4xOTVMNDEwLjE1NiAxMDQ4LjE0VjE5NzAuMDFIMTI5Ljg4M1Y1NjkuNjJINDI5LjY4OEw5NjkuNzI3IDE0OTIuNDdWNTY5LjYySDEyNTBWMTk3MC4wMVpNMTg4Mi44MSAxNzE0LjE1QzE4OTMuMjMgMTcxNy40MSAxOTAzLjY1IDE3MTkuNjkgMTkxNC4wNiAxNzIwLjk5QzE5MjQuNDggMTcyMS42NCAxOTM0LjkgMTcyMS45NiAxOTQ1LjMxIDE3MjEuOTZDMTk3MS4zNSAxNzIxLjk2IDE5OTYuNDIgMTcxOC4zOCAyMDIwLjUxIDE3MTEuMjJDMjA0NC42IDE3MDQuMDYgMjA2Ny4wNiAxNjkzLjk3IDIwODcuODkgMTY4MC45NUMyMTA5LjM4IDE2NjcuMjggMjEyOC4yNiAxNjUxIDIxNDQuNTMgMTYzMi4xMkMyMTYxLjQ2IDE2MTIuNTkgMjE3NS4xMyAxNTkxLjEgMjE4NS41NSAxNTY3LjY3TDIzODAuODYgMTc2My45NkMyMzU2LjEyIDE3OTkuMTEgMjMyNy40NyAxODMwLjY5IDIyOTQuOTIgMTg1OC42OEMyMjYzLjAyIDE4ODYuNjggMjIyOC4xOSAxOTEwLjQ0IDIxOTAuNDMgMTkyOS45N0MyMTUzLjMyIDE5NDkuNSAyMTEzLjkzIDE5NjQuMTUgMjA3Mi4yNyAxOTczLjkyQzIwMzEuMjUgMTk4NC4zMyAxOTg4LjkzIDE5ODkuNTQgMTk0NS4zMSAxOTg5LjU0QzE4NzEuNzQgMTk4OS41NCAxODAyLjQxIDE5NzUuODcgMTczNy4zIDE5NDguNTNDMTY3Mi44NSAxOTIxLjE4IDE2MTYuMjEgMTg4My4xIDE1NjcuMzggMTgzNC4yN0MxNTE5LjIxIDE3ODUuNDQgMTQ4MS4xMiAxNzI3LjUgMTQ1My4xMiAxNjYwLjQ0QzE0MjUuMTMgMTU5Mi43MyAxNDExLjEzIDE1MTguNTEgMTQxMS4xMyAxNDM3Ljc4QzE0MTEuMTMgMTM1NS4xIDE0MjUuMTMgMTI3OS41OCAxNDUzLjEyIDEyMTEuMjJDMTQ4MS4xMiAxMTQyLjg2IDE1MTkuMjEgMTA4NC41OSAxNTY3LjM4IDEwMzYuNDJDMTYxNi4yMSA5ODguMjQgMTY3Mi44NSA5NTAuODA1IDE3MzcuMyA5MjQuMTEyQzE4MDIuNDEgODk3LjQyIDE4NzEuNzQgODg0LjA3MyAxOTQ1LjMxIDg4NC4wNzNDMTk4OC45MyA4ODQuMDczIDIwMzEuNTggODg5LjI4MiAyMDczLjI0IDg5OS42OThDMjExNC45MSA5MTAuMTE1IDIxNTQuMyA5MjUuMDg5IDIxOTEuNDEgOTQ0LjYyQzIyMjkuMTcgOTY0LjE1MSAyMjY0LjMyIDk4OC4yNCAyMjk2Ljg4IDEwMTYuODlDMjMyOS40MyAxMDQ0Ljg4IDIzNTguMDcgMTA3Ni40NiAyMzgyLjgxIDExMTEuNjFMMTg4Mi44MSAxNzE0LjE1Wk0yMDE5LjUzIDExNjQuMzVDMjAwNy4xNiAxMTU5Ljc5IDE5OTQuNzkgMTE1Ni44NiAxOTgyLjQyIDExNTUuNTZDMTk3MC43IDExNTQuMjYgMTk1OC4zMyAxMTUzLjYgMTk0NS4zMSAxMTUzLjZDMTkwOC44NSAxMTUzLjYgMTg3NC4zNSAxMTYwLjQ0IDE4NDEuOCAxMTc0LjExQzE4MDkuOSAxMTg3LjEzIDE3ODEuOSAxMjA2LjAxIDE3NTcuODEgMTIzMC43NUMxNzM0LjM4IDEyNTUuNDkgMTcxNS44MiAxMjg1LjQ0IDE3MDIuMTUgMTMyMC42QzE2ODguNDggMTM1NS4xIDE2ODEuNjQgMTM5NC4xNiAxNjgxLjY0IDE0MzcuNzhDMTY4MS42NCAxNDQ3LjU1IDE2ODEuOTcgMTQ1OC42MiAxNjgyLjYyIDE0NzAuOTlDMTY4My45MiAxNDgzLjM2IDE2ODUuNTUgMTQ5Ni4wNSAxNjg3LjUgMTUwOS4wN0MxNjkwLjEgMTUyMS40NCAxNjkzLjAzIDE1MzMuNDkgMTY5Ni4yOSAxNTQ1LjIxQzE2OTkuNTQgMTU1Ni45MiAxNzAzLjc4IDE1NjcuMzQgMTcwOC45OCAxNTc2LjQ2TDIwMTkuNTMgMTE2NC4zNVpNMzQ3MC43IDE5NzAuMDFIMzE0NC41M0wyOTM2LjUyIDE2NDkuN0wyNzI2LjU2IDE5NzAuMDFIMjQwMC4zOUwyNzgyLjIzIDE0MzMuODhMMjQwMC4zOSA5MTguMjUzSDI3MjYuNTZMMjkzNi41MiAxMjE4LjA2TDMxNDQuNTMgOTE4LjI1M0gzNDcwLjdMMzA4Ny44OSAxNDMzLjg4TDM0NzAuNyAxOTcwLjAxWk00MDkwLjgyIDE5NzAuMDFDNDAyNi4zNyAxOTcwLjAxIDM5NjUuODIgMTk1Ny45NyAzOTA5LjE4IDE5MzMuODhDMzg1Mi41NCAxOTA5LjE0IDM4MDIuNzMgMTg3NS42MSAzNzU5Ljc3IDE4MzMuMjlDMzcxNy40NSAxNzkwLjMyIDM2ODMuOTIgMTc0MC41MiAzNjU5LjE4IDE2ODMuODhDMzYzNS4wOSAxNjI3LjI0IDM2MjMuMDUgMTU2Ni42OSAzNjIzLjA1IDE1MDIuMjRWMTE5MS42OUgzNDkzLjE2VjkyNi4wNjVIMzYyMy4wNVY1MDguMDk3SDM4ODguNjdWOTI2LjA2NUg0MjkyLjk3VjExOTEuNjlIMzg4OC42N1YxNTAyLjI0QzM4ODguNjcgMTUzMC4yMyAzODkzLjg4IDE1NTYuNiAzOTA0LjMgMTU4MS4zNEMzOTE0LjcxIDE2MDUuNDMgMzkyOS4wNCAxNjI2LjU5IDM5NDcuMjcgMTY0NC44MkMzOTY1LjQ5IDE2NjMuMDQgMzk4Ni45OCAxNjc3LjY5IDQwMTEuNzIgMTY4OC43NkM0MDM2LjQ2IDE2OTkuMTggNDA2Mi44MyAxNzA0LjM5IDQwOTAuODIgMTcwNC4zOUg0MjkyLjk3VjE5NzAuMDFINDA5MC44MlpNNDc1MS45NSA4NDkuODk0VjE0MTAuNDRINTAzMi4yM0M1MDcwLjY0IDE0MTAuNDQgNTEwNi43NyAxNDAzLjI4IDUxNDAuNjIgMTM4OC45NkM1MTc0LjQ4IDEzNzMuOTggNTIwNC4xIDEzNTMuOCA1MjI5LjQ5IDEzMjguNDFDNTI1NC44OCAxMzAzLjAyIDUyNzQuNzQgMTI3My40IDUyODkuMDYgMTIzOS41NEM1MzA0LjA0IDEyMDUuMDQgNTMxMS41MiAxMTY4LjU4IDUzMTEuNTIgMTEzMC4xN0M1MzExLjUyIDEwOTEuNzYgNTMwNC4wNCAxMDU1LjYyIDUyODkuMDYgMTAyMS43N0M1Mjc0Ljc0IDk4Ny4yNjMgNTI1NC44OCA5NTcuMzE1IDUyMjkuNDkgOTMxLjkyNUM1MjA0LjEgOTA2LjUzNCA1MTc0LjQ4IDg4Ni42NzcgNTE0MC42MiA4NzIuMzU0QzUxMDYuNzcgODU3LjM4MSA1MDcwLjY0IDg0OS44OTQgNTAzMi4yMyA4NDkuODk0SDQ3NTEuOTVaTTQ3NTEuOTUgMTk3MC4wMUg0NDcxLjY4VjU2OS42Mkg1MDMyLjIzQzUwODMuNjYgNTY5LjYyIDUxMzMuMTQgNTc2LjQ1NiA1MTgwLjY2IDU5MC4xMjhDNTIyOC4xOSA2MDMuMTQ5IDUyNzIuNDYgNjIyLjAyOSA1MzEzLjQ4IDY0Ni43NjlDNTM1NS4xNCA2NzAuODU3IDUzOTIuOSA3MDAuMTU0IDU0MjYuNzYgNzM0LjY1OUM1NDYxLjI2IDc2OC41MTMgNTQ5MC41NiA4MDYuMjc0IDU1MTQuNjUgODQ3Ljk0QzU1MzkuMzkgODg5LjYwNyA1NTU4LjI3IDkzNC4yMDMgNTU3MS4yOSA5ODEuNzI5QzU1ODQuOTYgMTAyOS4yNiA1NTkxLjggMTA3OC43MyA1NTkxLjggMTEzMC4xN0M1NTkxLjggMTIwNi45OSA1NTc3LjE1IDEyNzkuNTggNTU0Ny44NSAxMzQ3Ljk0QzU1MTguNTUgMTQxNS42NSA1NDc4LjUyIDE0NzQuODkgNTQyNy43MyAxNTI1LjY3QzUzNzYuOTUgMTU3Ni40NiA1MzE3LjM4IDE2MTYuNSA1MjQ5LjAyIDE2NDUuNzlDNTE4MS4zMiAxNjc1LjA5IDUxMDkuMDUgMTY4OS43NCA1MDMyLjIzIDE2ODkuNzRINDc1MS45NVYxOTcwLjAxWk02MDQyLjk3IDYzOS45MzNDNjA0Mi45NyA2NjQuNjcyIDYwMzguMDkgNjg3Ljc4NCA2MDI4LjMyIDcwOS4yNjlDNjAxOS4yMSA3MzAuNzUzIDYwMDYuNTEgNzQ5LjYzMyA1OTkwLjIzIDc2NS45MDlDNTk3My45NiA3ODEuNTM0IDU5NTQuNzUgNzk0LjIyOSA1OTMyLjYyIDgwMy45OTVDNTkxMS4xMyA4MTMuMTEgNTg4OC4wMiA4MTcuNjY3IDU4NjMuMjggODE3LjY2N0M1ODM4LjU0IDgxNy42NjcgNTgxNS4xIDgxMy4xMSA1NzkyLjk3IDgwMy45OTVDNTc3MS40OCA3OTQuMjI5IDU3NTIuNiA3ODEuNTM0IDU3MzYuMzMgNzY1LjkwOUM1NzIwLjcgNzQ5LjYzMyA1NzA4LjAxIDczMC43NTMgNTY5OC4yNCA3MDkuMjY5QzU2ODkuMTMgNjg3Ljc4NCA1Njg0LjU3IDY2NC42NzIgNTY4NC41NyA2MzkuOTMzQzU2ODQuNTcgNjE1Ljg0NCA1Njg5LjEzIDU5My4wNTggNTY5OC4yNCA1NzEuNTczQzU3MDguMDEgNTQ5LjQzOCA1NzIwLjcgNTMwLjU1OCA1NzM2LjMzIDUxNC45MzNDNTc1Mi42IDQ5OC42NTcgNTc3MS40OCA0ODUuOTYxIDU3OTIuOTcgNDc2Ljg0N0M1ODE1LjEgNDY3LjA4MSA1ODM4LjU0IDQ2Mi4xOTggNTg2My4yOCA0NjIuMTk4QzU4ODguMDIgNDYyLjE5OCA1OTExLjEzIDQ2Ny4wODEgNTkzMi42MiA0NzYuODQ3QzU5NTQuNzUgNDg1Ljk2MSA1OTczLjk2IDQ5OC42NTcgNTk5MC4yMyA1MTQuOTMzQzYwMDYuNTEgNTMwLjU1OCA2MDE5LjIxIDU0OS40MzggNjAyOC4zMiA1NzEuNTczQzYwMzguMDkgNTkzLjA1OCA2MDQyLjk3IDYxNS44NDQgNjA0Mi45NyA2MzkuOTMzWk01OTk3LjA3IDE5NzAuMDFINTcyOC41MlY5MjQuMTEySDU5OTcuMDdWMTk3MC4wMVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik03NTM2LjM1IDI1Ny41NDRMNzUxOC4zNiAxOTM4LjMzTDU4ODAuNjMgMzAwLjYwMUw3NTM2LjM1IDI1Ny41NDRaIiBmaWxsPSIjQ0JCNTdCIi8+CjxwYXRoIGQ9Ik02NDgyLjI4IDE5NjkuOTlINjIxMy43MlY1MDguMDc2SDY0ODIuMjhWMTQyOS45NUw2ODc5Ljc0IDkyNi4wNDRINzE4Ni4zOEw2ODM5LjcgMTM2MS41OUw3MTg2LjM4IDE5NjkuOTlINjg3OS43NEw2NjY3LjgyIDE1OTAuMTFMNjQ4Mi4yOCAxODM2LjJWMTk2OS45OVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=" alt="NextPik" style="height: 40px; width: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #737373; font-size: 12px; margin: 0 0 12px 0;">
                &copy; ${new Date().getFullYear()} NextPik. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${frontendUrl}" style="color: #000000; text-decoration: none; font-size: 12px;">Website</a>
                <span style="color: #d4d4d4; margin: 0 8px;">|</span>
                <a href="${frontendUrl}/support" style="color: #737373; text-decoration: none; font-size: 12px;">Support</a>
                <span style="color: #d4d4d4; margin: 0 8px;">|</span>
                <a href="${frontendUrl}/privacy" style="color: #737373; text-decoration: none; font-size: 12px;">Privacy</a>
              </p>
              ${
                showUnsubscribe
                  ? `<p style="margin: 16px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #a3a3a3; text-decoration: underline; font-size: 11px;">Unsubscribe</a>
              </p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
