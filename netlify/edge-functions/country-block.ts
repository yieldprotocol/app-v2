export default async (request: Request, context: any) => {
  const BLOCKED_COUNTRY_CODES = ['CU', 'SY', 'KP', 'IR', 'RU'] as string[];

  const BLOCKED_SUBDIVISION_CODES = new Map([
    ['UA', ['43', '14', '09']],
    /* ['PT', ['11']], // location for testing */
  ]);

  const countryCode = context.geo?.country?.code;
  const countryName = context.geo?.country?.name;

  const subdivisionCode = context.geo?.subdivision?.code;
  const subdivisionName = context.geo?.subdivision?.name;

  /* Case 1 : country is in the list but no listed sub-divisions > block entire country */
  if (
    BLOCKED_COUNTRY_CODES.includes(countryCode) &&
    !BLOCKED_SUBDIVISION_CODES.has(countryCode)
    ) {
    return new Response(`We're sorry, you can't access our content from ${countryCode}!`, {
      headers: { 'content-type': 'text/html' },
      status: 451,
    });
  }
  /* Case 2 : country IS/IS NOT in the list but sub-divisions is listed  > block the region */
  if (
    BLOCKED_SUBDIVISION_CODES.has(countryCode) &&
    BLOCKED_SUBDIVISION_CODES.get(countryCode)!.includes(subdivisionCode)   
    ) {
    return new Response(`You can't access our content from your current location within ${countryName} (${subdivisionName})!`, {
      headers: { 'content-type': 'text/html' },
      status: 451,
    });
  }

};
