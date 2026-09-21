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

export const config = {
  matcher: ["/api/item/:path*", "/api/user/:path*"],
};
