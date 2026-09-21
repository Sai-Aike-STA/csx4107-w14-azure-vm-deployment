// src/proxy.js

import { NextResponse } from "next/server";
import { verifyJWT } from "./app/lib/auth";
import corsHeaders from "./app/lib/cors";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./app/lib/constant";

// the proxy runs before the matched routes and checks the login token
export function proxy(request) {
  // a preflight OPTIONS request carries no cookie so it must pass without a token check
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const user = verifyJWT(request);

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized Request",
      },
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }

  // forward the verified user data to the route through internal request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(X_HEADER_USER_ID, user.id);
  requestHeaders.set(X_HEADER_USER_EMAIL, user.email);
  requestHeaders.set(X_HEADER_USER_NAME, user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Week 14 note about basePath.
// The backend now runs behind basePath "/webdev/w14" on the course VM, but the
// matcher below stays on plain paths. Next strips the basePath from the request
// before it matches proxy paths, so a matcher written with the prefix never
// fires and the protected APIs become open. Verified by test on Next 16.3.2:
// the prefixed matcher let /webdev/w14/api/item through with no login, this
// plain matcher returns 401 as required.
// matcher: ["/webdev/w14/api/item/:path*", "/webdev/w14/api/user/:path*"], // does not work
export const config = {
  matcher: ["/api/item/:path*", "/api/user/:path*"],
};
