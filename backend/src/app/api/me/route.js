// debug api to check the login/logout logic, simply returns the current logged-in user

import { verifyJWT } from "@/app/lib/auth";
import corsHeaders from "@/app/lib/cors";
import { errorResponse } from "@/app/lib/utils";
import { NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function GET(request) {
  const user = verifyJWT(request);

  if (!user) {return errorResponse("Unauthorized Request", 401)}

  // the token stores the id as "id" while the frontend reads "_id"
  return NextResponse.json(
    {
      user: {
        _id: user.id,
        email: user.email,
        username: user.username,
      },
    },
    {
      status: 201,
      headers: corsHeaders,
    },
  )
}
