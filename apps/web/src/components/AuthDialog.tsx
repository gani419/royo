import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLoginForm, useRegisterForm } from "@royo/features";
import { Dialog } from "./Dialog";

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const [register, setRegister] = useState(false);
  const login = useLoginForm(onClose);
  const signup = useRegisterForm(onClose);
  const form = register ? signup : login;
  return (
    <Dialog
      title={register ? "Your next ride starts here." : "Welcome back, rider."}
      onClose={onClose}
    >
      <p className="form-intro">
        Keep your motorcycles, conversations, and service history together.
      </p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void form.submit();
        }}
      >
        {register && (
          <label>
            Full name
            <input
              autoComplete="name"
              autoFocus
              value={signup.values.fullName}
              onChange={(e) => signup.setField("fullName", e.target.value)}
              required
              maxLength={100}
            />
            <span className="field-error">{signup.errors.fullName}</span>
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            autoFocus={!register}
            value={form.values.email}
            onChange={(e) =>
              register
                ? signup.setField("email", e.target.value)
                : login.setField("email", e.target.value)
            }
            required
            maxLength={255}
          />
          <span className="field-error">{form.errors.email}</span>
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            value={form.values.password}
            onChange={(e) =>
              register
                ? signup.setField("password", e.target.value)
                : login.setField("password", e.target.value)
            }
            required
            maxLength={128}
          />
          <span className="field-error">{form.errors.password}</span>
        </label>
        {register && (
          <>
            <p className="field-help">
              At least 8 characters, with uppercase, lowercase, and a number.
            </p>
            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={signup.values.confirmPassword}
                onChange={(e) =>
                  signup.setField("confirmPassword", e.target.value)
                }
                required
              />
              <span className="field-error">
                {signup.errors.confirmPassword}
              </span>
            </label>
          </>
        )}
        {form.formError && (
          <p role="alert" className="error">
            {form.formError}
          </p>
        )}
        <button className="primary" disabled={form.isLoading}>
          {form.isLoading
            ? "Please wait…"
            : register
              ? "Create account"
              : "Sign in"}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="form-footer">
        {register ? "Already riding with us?" : "New to ROYO?"}{" "}
        <button
          className="text-button"
          disabled={form.isLoading}
          onClick={() => setRegister(!register)}
        >
          {register ? "Sign in" : "Create an account"}
        </button>
      </div>
    </Dialog>
  );
}
