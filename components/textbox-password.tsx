import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export interface TextboxPasswordProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  loading?: boolean;
}

const TextboxPassword = React.forwardRef<
  HTMLInputElement,
  TextboxPasswordProps
>(({ loading = false, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        placeholder="••••••••"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        disabled={loading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        disabled={loading}
      >
        {showPassword ? (
          <EyeOffIcon className="h-4 w-4" />
        ) : (
          <EyeIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

TextboxPassword.displayName = "TextboxPassword";

export { TextboxPassword };