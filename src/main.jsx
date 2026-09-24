import{StrictMode}from"react";import{createRoot}from"react-dom/client";import{createClient}from"@supabase/supabase-js";import App from"./App";import"./styles.css";

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase=createClient(supabaseUrl,supabasePublishableKey);

createRoot(document.getElementById("root")).render(<StrictMode><App/></StrictMode>);
