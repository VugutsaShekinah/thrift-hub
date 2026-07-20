import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function AddressSelector({ addresses, selectedId, onSelect, onAddNew }) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState({
    recipient_name: "",
    phone_number: "",
    county: "",
    town: "",
    street_address: "",
  });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    onAddNew(form);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {addresses.map((address) => (
        <label
          key={address.id}
          className={`flex cursor-pointer flex-col rounded-lg border p-3 text-sm ${
            selectedId === address.id ? "border-brand-500 ring-1 ring-brand-500" : "border-neutral-300 dark:border-neutral-700"
          }`}
        >
          <div className="flex items-start gap-2">
            <input
              type="radio"
              name="address"
              checked={selectedId === address.id}
              onChange={() => onSelect(address.id)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">
                {address.label} — {address.recipient_name}
              </p>
              <p className="text-neutral-500">
                {address.street_address}, {address.town}, {address.county}
              </p>
              <p className="text-neutral-500">{address.phone_number}</p>
            </div>
          </div>
        </label>
      ))}

      {!showForm && (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)} className="self-start">
          + Add new address
        </Button>
      )}

      {showForm && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-300 p-4 dark:border-neutral-700">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Recipient name" value={form.recipient_name} onChange={handleChange("recipient_name")} />
            <Input label="Phone number" placeholder="+2547XXXXXXXX" value={form.phone_number} onChange={handleChange("phone_number")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="County" value={form.county} onChange={handleChange("county")} />
            <Input label="Town" value={form.town} onChange={handleChange("town")} />
          </div>
          <Input label="Street / building" value={form.street_address} onChange={handleChange("street_address")} />
          <Button size="sm" onClick={handleSave} className="self-start">
            Save address
          </Button>
        </div>
      )}
    </div>
  );
}
