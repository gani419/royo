import { useEffect, useState, type ReactNode } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  type TextInputProps,
} from "react-native";
import { useLoginForm, useRegisterForm } from "@royo/features";
import { VehicleService } from "@royo/api";
import { getSharedApiClient } from "@royo/store";
import type {
  CreateVehicleDto,
  VehicleManufacturer,
  VehicleModel,
  CreateMaintenanceRequest,
  Vehicle,
} from "@royo/types";
import { createVehicleSchema } from "@royo/schemas";
import { styles as s } from "../styles";

export function Action({
  children,
  onPress,
  disabled = false,
  secondary = false,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, disabled && s.disabled]}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}
function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={s.input} {...props} />
    </View>
  );
}
export function AuthForm({ onDone }: { onDone: () => void }) {
  const [register, setRegister] = useState(false);
  const login = useLoginForm(onDone);
  const signup = useRegisterForm(onDone);
  const form = register ? signup : login;
  return (
    <View style={s.form}>
      <Text style={s.heading}>
        {register ? "Your next ride starts here." : "Welcome back, rider."}
      </Text>
      <Text style={s.subtitle}>
        Your motorcycles, conversations, and service history together.
      </Text>
      {register && (
        <Field
          label="Full name"
          value={signup.values.fullName}
          onChangeText={(v) => signup.setField("fullName", v)}
          autoComplete="name"
        />
      )}
      <Field
        label="Email address"
        value={form.values.email}
        onChangeText={(v) =>
          register ? signup.setField("email", v) : login.setField("email", v)
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Password"
        secureTextEntry
        value={form.values.password}
        onChangeText={(v) =>
          register
            ? signup.setField("password", v)
            : login.setField("password", v)
        }
        autoCapitalize="none"
      />
      {register && (
        <>
          <Text style={s.small}>
            At least 8 characters, with uppercase, lowercase, and a number.
          </Text>
          <Field
            label="Confirm password"
            secureTextEntry
            value={signup.values.confirmPassword}
            onChangeText={(v) => signup.setField("confirmPassword", v)}
          />
        </>
      )}
      {Object.entries(form.errors).map(([key, error]) =>
        error ? (
          <Text key={key} style={s.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null,
      )}
      {form.formError && (
        <Text accessibilityRole="alert" style={s.error}>
          {form.formError}
        </Text>
      )}
      <Action disabled={form.isLoading} onPress={() => void form.submit()}>
        {form.isLoading
          ? "Please wait…"
          : register
            ? "Create account"
            : "Sign in"}
      </Action>
      <Action
        secondary
        disabled={form.isLoading}
        onPress={() => setRegister(!register)}
      >
        {register
          ? "Already have an account? Sign in"
          : "New to ROYO? Create account"}
      </Action>
    </View>
  );
}

export function VehicleForm({
  onAdd,
  onDone,
}: {
  onAdd: (dto: CreateVehicleDto) => Promise<unknown>;
  onDone: () => void;
}) {
  const [manufacturers, setManufacturers] = useState<VehicleManufacturer[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [manufacturer, setManufacturer] = useState("");
  const [modelId, setModel] = useState("");
  const [nickname, setNickname] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [odometer, setOdometer] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    new VehicleService(getSharedApiClient())
      .getManufacturers()
      .then((list) => {
        if (alive) {
          setManufacturers(list ?? []);
          setManufacturer(list?.[0]?.id ?? "");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [retry]);
  useEffect(() => {
    let alive = true;
    setModels([]);
    setModel("");
    if (manufacturer)
      new VehicleService(getSharedApiClient())
        .getModels(manufacturer)
        .then((list) => {
          if (alive) {
            setModels(list ?? []);
            setModel(list?.[0]?.id ?? "");
          }
        })
        .catch((err) => {
          if (alive) setError(err.message);
        });
    return () => {
      alive = false;
    };
  }, [manufacturer, retry]);
  return (
    <View style={s.form}>
      <Text style={s.heading}>Make room in your garage.</Text>
      <Text style={s.label}>Manufacturer</Text>
      <ScrollView horizontal contentContainerStyle={s.row}>
        {manufacturers.map((m) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: manufacturer === m.id }}
            key={m.id}
            onPress={() => setManufacturer(m.id)}
            style={[s.chip, manufacturer === m.id && s.chipSelected]}
          >
            <Text style={s.text}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={s.label}>Model</Text>
      {models.map((m) => (
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ checked: modelId === m.id }}
          key={m.id}
          onPress={() => setModel(m.id)}
          style={[s.chip, modelId === m.id && s.chipSelected]}
        >
          <Text style={s.text}>{m.name}</Text>
        </TouchableOpacity>
      ))}
      {!manufacturers.length && !error && <ActivityIndicator />}
      <Field
        label="Model year"
        keyboardType="number-pad"
        value={year}
        onChangeText={setYear}
      />
      <Field
        label="Odometer (km)"
        keyboardType="number-pad"
        value={odometer}
        onChangeText={setOdometer}
      />
      <Field
        label="Nickname (optional)"
        value={nickname}
        onChangeText={setNickname}
      />
      {error && (
        <>
          <Text style={s.error} accessibilityRole="alert">
            {error}
          </Text>
          <Action
            secondary
            onPress={() => {
              setError("");
              setRetry((v) => v + 1);
            }}
          >
            Retry catalogue
          </Action>
        </>
      )}
      <Action
        disabled={loading || !modelId}
        onPress={async () => {
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
          setLoading(true);
          try {
            await onAdd(parsed.data);
            onDone();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not save motorcycle",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Saving…" : "Add motorcycle"}
      </Action>
    </View>
  );
}

export function ServiceForm({
  vehicle,
  onSave,
  onDone,
}: {
  vehicle: Vehicle;
  onSave: (dto: CreateMaintenanceRequest) => Promise<boolean>;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [odometer, setOdometer] = useState(String(vehicle.odometerKm));
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <View style={s.form}>
      <Text style={s.heading}>A little care, recorded.</Text>
      <Field
        label="Service title"
        value={title}
        onChangeText={setTitle}
        maxLength={200}
      />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />
      <Field
        label="Odometer (km)"
        keyboardType="number-pad"
        value={odometer}
        onChangeText={setOdometer}
      />
      <Field
        label="Cost in INR (optional)"
        keyboardType="decimal-pad"
        value={cost}
        onChangeText={setCost}
      />
      {error && (
        <Text style={s.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <Action
        disabled={saving}
        onPress={async () => {
          if (
            !title.trim() ||
            !Number.isInteger(Number(odometer)) ||
            Number(odometer) < 0 ||
            (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0))
          ) {
            setError(
              "Enter a service title, valid mileage, and nonnegative cost.",
            );
            return;
          }
          setSaving(true);
          try {
            if (
              await onSave({
                title: title.trim(),
                description: notes.trim() || undefined,
                odometerAtService: Number(odometer),
                cost: cost ? Number(cost) : undefined,
                serviceDate: new Date().toISOString(),
              })
            )
              onDone();
            else
              setError(
                "Could not save service. Check your connection and try again.",
              );
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving…" : "Save service record"}
      </Action>
    </View>
  );
}
