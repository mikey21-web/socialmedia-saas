"use client";

import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.5 12.273c0-.818-.073-1.604-.209-2.364H12v4.475h5.893a5.038 5.038 0 0 1-2.184 3.304v2.741h3.532c2.067-1.902 3.259-4.705 3.259-8.156Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.955 0 5.434-.98 7.246-2.571l-3.532-2.741c-.98.657-2.233 1.046-3.714 1.046-2.856 0-5.276-1.928-6.14-4.518H2.2v2.84A10.996 10.996 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.86 14.216a6.62 6.62 0 0 1-.343-2.098c0-.728.124-1.435.343-2.098v-2.84H2.2A10.996 10.996 0 0 0 1 12.118c0 1.771.425 3.448 1.2 4.938l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.5c1.607 0 3.051.553 4.187 1.64l3.14-3.14C17.428 2.224 14.95 1 12 1 7.743 1 4.066 3.438 2.2 7.18l3.66 2.84C6.724 7.428 9.144 5.5 12 5.5Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        window.location.assign(`${apiBaseUrl}/auth/google`);
      }}
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}
