import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async ({ new_password }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset({
        uid: searchParams.get("uid"),
        token: searchParams.get("token"),
        new_password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input label="New password" type="password" required {...register("new_password")} />
        <Button type="submit" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
