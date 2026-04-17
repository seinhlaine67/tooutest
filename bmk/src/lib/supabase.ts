import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// const { accessToken } = useAuth();

interface Options {
  method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  payload?: any;
  queryParams?: Record<string, any>;
  headers?: Record<string, any>;
}

// helper function to call edge functions
export async function callEdgeFunction<T>(
  functionName: string,
  options: Options = {},
): Promise<T> {
  //  get the current session to include access token for authentication
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  // console.log(
  //   `Calling edge function ${functionName} with access token:`,
  //   accessToken,
  // );

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  let url = functionName;
  if (options.queryParams) {
    const queryString = new URLSearchParams(options.queryParams).toString();
    url = `${functionName}?${queryString}`;
  }

  const optionDTO = { headers };
  if (options.payload) {
    optionDTO.body = options.payload;
  }
  if (options.method) {
    optionDTO.method = options.method || "POST";
  }

  // console.log(`Calling edge function ${url} with options:`, optionDTO);
  const { data: responseData, error } = await supabase.functions.invoke(
    url,
    optionDTO,
  );

  // To check json response
  console.log(`Edge function ${functionName} response:`, {
    responseData,
    error,
  });

  if (error) throw error;

  return responseData as T;
}
