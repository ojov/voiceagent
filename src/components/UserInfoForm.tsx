import { useState } from "react";
import { ArrowRight } from "lucide-react";

export interface UserInfo {
  name: string;
  email: string;
}

interface UserInfoFormProps {
  onSubmit: (info: UserInfo) => void;
}

export function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  function validate() {
    const e: { name?: string; email?: string } = {};
    if (!name.trim())                          e.name  = "Full name is required.";
    if (!email.trim())                         e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                               e.email = "Please enter a valid email address.";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSubmit({ name: name.trim(), email: email.trim().toLowerCase() });
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-rp-text mb-1">
          Before we connect you
        </h2>
        <p className="text-sm text-rp-muted">
          Please share your details so our agent can assist you properly.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label
            htmlFor="user-name"
            className="block text-xs font-medium text-rp-text mb-1.5"
          >
            Full name
          </label>
          <input
            id="user-name"
            type="text"
            autoComplete="name"
            placeholder="Amara Osei"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm text-rp-text bg-white
              placeholder:text-rp-subtle outline-none transition-colors
              focus:ring-2 focus:ring-rp-blue-500/30 focus:border-rp-blue-500
              ${errors.name ? "border-red-400" : "border-rp-border"}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="user-email"
            className="block text-xs font-medium text-rp-text mb-1.5"
          >
            Work email
          </label>
          <input
            id="user-email"
            type="email"
            autoComplete="email"
            placeholder="amara@startup.ng"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm text-rp-text bg-white
              placeholder:text-rp-subtle outline-none transition-colors
              focus:ring-2 focus:ring-rp-blue-500/30 focus:border-rp-blue-500
              ${errors.email ? "border-red-400" : "border-rp-border"}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-rp-blue-900 hover:bg-rp-blue-800
            text-white text-sm font-medium py-2.5 rounded-lg transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-rp-blue-500/50 mt-2"
        >
          Continue to voice support
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-rp-subtle">
          Your details are used only to assist with your support request.
        </p>
      </form>
    </div>
  );
}
