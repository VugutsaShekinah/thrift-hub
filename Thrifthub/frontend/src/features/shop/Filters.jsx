const GENDERS = ["men", "women", "unisex", "kids"];
const CONDITIONS = [
  ["new_with_tags", "New with tags"],
  ["excellent", "Excellent"],
  ["good", "Good"],
  ["fair", "Fair"],
];

export default function Filters({ categories, value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Category</h3>
        <select
          value={value.category || ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Gender</h3>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((gender) => (
            <button
              key={gender}
              onClick={() => update({ gender: value.gender === gender ? undefined : gender })}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                value.gender === gender
                  ? "bg-brand-500 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Condition</h3>
        <div className="flex flex-col gap-1">
          {CONDITIONS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="condition"
                checked={value.condition === key}
                onChange={() => update({ condition: key })}
              />
              {label}
            </label>
          ))}
          {value.condition && (
            <button onClick={() => update({ condition: undefined })} className="mt-1 text-left text-xs text-brand-600">
              Clear condition
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price range (KES)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={value.price_min || ""}
            onChange={(e) => update({ price_min: e.target.value || undefined })}
            className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={value.price_max || ""}
            onChange={(e) => update({ price_max: e.target.value || undefined })}
            className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>
    </div>
  );
}
