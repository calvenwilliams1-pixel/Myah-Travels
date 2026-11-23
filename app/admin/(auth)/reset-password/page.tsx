import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getPasswordResetUserId } from "@/lib/auth/password-reset";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";
  const userId = token ? await getPasswordResetUserId(token) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Set a new password
        </h1>

        {userId === null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              This reset link isn&apos;t valid. It may have expired (links
              work for 1 hour) or already been used.
            </p>
            <p className="text-center">
              <Link
                href="/admin/forgot-password"
                className="text-sm text-gray-500 hover:underline"
              >
                Request a new reset link
              </Link>
            </p>
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </Card>
    </div>
  );
}
