import { useState } from "react";
import { Plus, Wrench, X } from "lucide-react";
import type { Vehicle } from "@royo/types";
import type { useMaintenance } from "@royo/features";

export function Logbook({
  vehicle,
  maintenance,
  onSaved,
}: {
  vehicle: Vehicle;
  maintenance: ReturnType<typeof useMaintenance>;
  onSaved: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="page-content">
      <div className="section-heading">
        <div>
          <h2>A little care goes a long way.</h2>
          <p>Service history for {vehicle.nickname || vehicle.model.name}.</p>
        </div>
        <button className="primary" onClick={() => setAdding(!adding)}>
          {adding ? <X size={15} /> : <Plus size={15} />}{" "}
          {adding ? "Cancel" : "Log service"}
        </button>
      </div>
      {adding && (
        <form
          className="form-stack record-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const form = e.currentTarget;
            const data = new FormData(form);
            const title = String(data.get("title")).trim();
            const costText = String(data.get("cost"));
            const cost = costText ? Number(costText) : undefined;
            const odometerAtService = Number(data.get("odometer"));
            if (
              !title ||
              !Number.isInteger(odometerAtService) ||
              odometerAtService < 0 ||
              (cost !== undefined && (!Number.isFinite(cost) || cost < 0))
            ) {
              setError(
                "Enter a service title, valid mileage, and a nonnegative cost.",
              );
              return;
            }
            const saved = await maintenance.addRecord({
              title,
              description: String(data.get("notes")).trim() || undefined,
              cost,
              odometerAtService,
              serviceDate: new Date(
                `${data.get("date")}T12:00:00`,
              ).toISOString(),
            });
            if (saved) {
              setAdding(false);
              onSaved();
            }
          }}
        >
          <h3>New service entry</h3>
          <label>
            Service title
            <input
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Oil and filter change"
            />
          </label>
          <label>
            Notes
            <textarea
              name="notes"
              rows={2}
              maxLength={2000}
              placeholder="Parts, workshop, or anything to remember"
            />
          </label>
          <div className="form-row">
            <label>
              Odometer (km)
              <input
                type="number"
                name="odometer"
                min="0"
                max="999999"
                required
                defaultValue={vehicle.odometerKm}
              />
            </label>
            <label>
              Cost (INR)
              <input
                type="number"
                name="cost"
                min="0"
                step="0.01"
                placeholder="Optional"
              />
            </label>
          </div>
          <label>
            Service date
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toLocaleDateString("en-CA")}
              max={new Date().toLocaleDateString("en-CA")}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={maintenance.isLoading}>
            {maintenance.isLoading ? "Saving…" : "Save service record"}
          </button>
        </form>
      )}
      {maintenance.error && (
        <p className="error" role="alert">
          {maintenance.error}
          <button
            className="text-button"
            onClick={() => void maintenance.refreshRecords()}
          >
            Retry
          </button>
        </p>
      )}
      {maintenance.isLoading ? (
        <p role="status">Loading service history…</p>
      ) : maintenance.records.length ? (
        <div className="records">
          {maintenance.records.map((r) => (
            <article className="record" key={r.id}>
              <div>
                <small>
                  {new Date(r.serviceDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {r.odometerAtService.toLocaleString()} km
                </small>
                <h3>{r.title}</h3>
                {r.description && <p>{r.description}</p>}
              </div>
              {r.cost !== undefined && (
                <span className="record-cost">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  }).format(r.cost)}
                </span>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-icon">
            <Wrench size={28} />
          </div>
          <h2>A fresh service history.</h2>
          <p>
            Log the first service, repair, or small improvement you make to your
            ride.
          </p>
        </div>
      )}
    </div>
  );
}
