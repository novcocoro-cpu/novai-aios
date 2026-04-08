import { NextResponse } from "next/server";

const UTF8_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: UTF8_HEADERS });
}
