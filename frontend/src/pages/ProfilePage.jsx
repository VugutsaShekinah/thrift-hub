import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { authApi } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

function ProfileForm() {
  const { user, refreshMe } = useAuth();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
    },
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await authApi.updateMe(values);
      await refreshMe();
      setStatus({ type: "success", message: "Profile updated." });
    } catch (err) {
      setStatus({ type: "error", message: extractErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {status && (
        <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>{status.message}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" {...register("first_name")} />
        <Input label="Last name" {...register("last_name")} />
      </div>
      <Input label="Phone number" {...register("phone_number")} />
      <Input label="Email" value={user.email} disabled />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Save changes
      </Button>
    </form>
  );
}

function ChangePasswordForm() {
  const { register, handleSubmit, reset } = useForm();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await authApi.changePassword(values);
      reset();
      setStatus({ type: "success", message: "Password updated." });
    } catch (err) {
      setStatus({ type: "error", message: extractErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {status && (
        <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>{status.message}</p>
      )}
      <Input label="Current password" type="password" required {...register("current_password")} />
      <Input label="New password" type="password" required {...register("new_password")} />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Update password
      </Button>
    </form>
  );
}

function AddressBook() {
  const [addresses, setAddresses] = useState(null);

  const load = () => authApi.addresses().then((res) => setAddresses(res.data.results));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    await authApi.deleteAddress(id);
    load();
  };

  if (!addresses) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      {addresses.length === 0 && <p className="text-sm text-neutral-500">No saved addresses yet.</p>}
      {addresses.map((address) => (
        <div key={address.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          <div>
            <p className="font-medium">
              {address.label} — {address.recipient_name}
            </p>
            <p className="text-neutral-500">
              {address.street_address}, {address.town}, {address.county}
            </p>
          </div>
          <button onClick={() => handleDelete(address.id)} className="text-red-600 hover:underline">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return <Spinner full />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Personal Details</h2>
        <ProfileForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Saved Addresses</h2>
        <AddressBook />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
