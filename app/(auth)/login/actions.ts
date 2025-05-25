"use server";

import { loginSchema, LoginInput, LoginResponse } from "@/types/auth";
import { createClient } from "@/lib/supabase/server";

export async function login(params: LoginInput): Promise<LoginResponse> {
  const parsed = loginSchema.safeParse(params);
  const supabase = await createClient();

  if (!parsed.success) {
    return { error:"Data not valid!" };
  }

  const { email, password } = parsed.data

  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    return {error: error.message}
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || user?.email || 'User'

  return { userName: userName };
}
