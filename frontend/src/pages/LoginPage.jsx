import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extractErrorMessage } from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async ({ email, password }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input label="Email" type="email" required {...register("email")} />
        <Input label="Password" type="password" required {...register("password")} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        New to ThriftHub KE?{" "}
        <Link to="/register" className="text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
