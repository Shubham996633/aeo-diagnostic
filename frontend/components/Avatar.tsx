"use client";

import clsx from "clsx";
import { initials, avatarColor } from "@/lib/session";

export default function Avatar({
  name,
  email,
  size = 32,
  className,
}: {
  name: string;
  email: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-grid place-items-center rounded-full font-semibold text-white shrink-0 select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: avatarColor(email),
        fontSize: Math.max(10, Math.floor(size * 0.4)),
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
