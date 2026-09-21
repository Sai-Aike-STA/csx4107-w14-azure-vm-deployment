// src/app/api/user/route.js

import { isAdmin } from "@/app/lib/auth";
import { getClientPromise } from "@/app/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/app/lib/utils";

// returns one page of users, only the admin may call this endpoint
export async function GET(request) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  const searchParams = request.nextUrl.searchParams;
  const pageParam = searchParams.get("page") || "1";
  let page = Number(pageParam) - 1;
  page = page < 0 ? 0 : page;
  const size = 10;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);
    const result = await db
      .collection("user")
      .find({}, { projection: { password: 0 } })
      .skip(page * size)
      .limit(size)
      .toArray();

    return successResponse(
      {
        users: result,
        page: page,
        size: size,
      },
      201,
    );
  }

  catch (error) {
    printExceptionLog("GET users", error);
    return errorResponse("GET User Internal Error", 500);
  }
}
