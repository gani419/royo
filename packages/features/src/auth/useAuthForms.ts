import { useState, useCallback } from "react";
import {
  loginSchema,
  registerSchema,
  LoginInput,
  RegisterInput,
} from "@royo/schemas";
import { useAuthSession } from "./useAuthSession";
import { getErrorMessage } from "@royo/utils";

export function useLoginForm(onSuccess?: () => void) {
  const { login, isLoading } = useAuthSession();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback((field: keyof LoginInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    setFormError(null);
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    try {
      await login(result.data);
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
      return false;
    }
  }, [values, login, onSuccess]);

  return {
    values,
    errors,
    formError,
    isLoading,
    setField,
    submit,
  };
}

export function useRegisterForm(onSuccess?: () => void) {
  const { register, isLoading } = useAuthSession();
  const [values, setValues] = useState<RegisterInput>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const setField = useCallback((field: keyof RegisterInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    setFormError(null);
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterInput;
        if (field) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    try {
      await register({
        fullName: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
      });
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      setFormError(getErrorMessage(err));
      return false;
    }
  }, [values, register, onSuccess]);

  return {
    values,
    errors,
    formError,
    isLoading,
    setField,
    submit,
  };
}
