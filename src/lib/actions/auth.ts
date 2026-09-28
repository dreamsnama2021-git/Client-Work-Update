"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
};

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.",
      };
    }
    return { error: error.message };
  }

  redirect(redirectTo || "/");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");

  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      ...(origin ? { emailRedirectTo: `${origin}/auth/callback` } : {}),
    },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "Too many sign-up emails were sent. Please wait a few minutes and try again.",
      };
    }
    return { error: error.message };
  }

  // Supabase silently returns an empty identities list (and sends no email)
  // when the address is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  redirect("/login?confirm=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
