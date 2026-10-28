import { useEffect, useState } from "react";
import { VehicleService } from "@royo/api";
import { getSharedApiClient } from "@royo/store";
import { createVehicleSchema } from "@royo/schemas";
import type {
  CreateVehicleDto,
  VehicleManufacturer,
  VehicleModel,
} from "@royo/types";
import { Dialog } from "./Dialog";

export function VehicleDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (dto: CreateVehicleDto) => Promise<unknown>;
}) {
  const [manufacturers, setManufacturers] = useState<VehicleManufacturer[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [manufacturer, setManufacturer] = useState("");
  const [modelId, setModel] = useState("");
  const [nickname, setNickname] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [odometer, setOdometer] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    new VehicleService(getSharedApiClient())
      .getManufacturers()
      .then((list) => {
        if (alive) {
          setManufacturers(list ?? []);
          setManufacturer(list?.[0]?.id ?? "");
        }
      })
      .catch((err) => {
        if (alive) setError(String(err.message));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [retry]);
  useEffect(() => {
    let alive = true;
    setModels([]);
    setModel("");
    if (manufacturer) {
      setLoading(true);
      new VehicleService(getSharedApiClient())
        .getModels(manufacturer)
        .then((list) => {
          if (alive) {
            setModels(list ?? []);
            setModel(list?.[0]?.id ?? "");
          }
        })
        .catch((err) => {
          if (alive) setError(String(err.message));
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }
    return () => {
      alive = false;
    };
  }, [manufacturer, retry]);
  return (
    <Dialog title="Make room in your garage." onClose={onClose}>
      <p className="form-intro">
        A few details help ROYO understand your motorcycle.
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const parsed = createVehicleSchema.safeParse({
            modelId,
            nickname,
            modelYear: Number(year),
            odometerKm: Number(odometer),
          });
          if (!parsed.success) {
            setError(parsed.error.issues.map((i) => i.message).join(". "));
            return;
          }
          setSaving(true);
          try {
            await onAdd(parsed.data);
            onClose();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not save motorcycle.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <label>
          Manufacturer
          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            disabled={loading || saving}
            required
          >
            <option value="">Select manufacturer</option>
            {manufacturers.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Model
          <select
            value={modelId}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading || saving}
            required
          >
            <option value="">Select model</option>
            {models.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Model year
            <input
              type="number"
              required
              min="1950"
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <label>
            Odometer (km)
            <input
              type="number"
              required
              min="0"
              max="999999"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </label>
        </div>
        <label>
          Nickname <span className="muted">(optional)</span>
          <input
            placeholder="e.g. Sunday companion"
            maxLength={50}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        {loading && (
          <p role="status" className="muted">
            Loading motorcycle catalogue…
          </p>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
            <button
              type="button"
              className="text-button"
              onClick={() => setRetry((v) => v + 1)}
            >
              Retry catalogue
            </button>
          </div>
        )}
        <button className="primary" disabled={loading || saving || !modelId}>
          {saving ? "Saving…" : "Add motorcycle"}
        </button>
      </form>
    </Dialog>
  );
}
