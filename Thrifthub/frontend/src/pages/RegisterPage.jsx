import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extractErrorMessage } from "../api/client";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await registerUser(values);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" required {...register("first_name")} />
          <Input label="Last name" required {...register("last_name")} />
        </div>
        <Input label="Email" type="email" required {...register("email")} />
        <Input
          label="Phone number"
          placeholder="+2547XXXXXXXX"
          required
          {...register("phone_number")}
        />
        <Input label="Password" type="password" required {...register("password")} />
        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
