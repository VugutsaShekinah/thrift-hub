import { useState } from "react";
import { useForm } from "react-hook-form";
import { authApi } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setStatus({ type: "success", message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
      setStatus({ type: "error", message: extractErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-neutral-500">Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {status && (
          <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {status.message}
          </p>
        )}
        <Input label="Email" type="email" required {...register("email")} />
        <Button type="submit" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
