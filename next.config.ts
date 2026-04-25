import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acesso de outros dispositivos na mesma rede WiFi (ex: Pelo seu Celular ou IP local)
  allowedDevOrigins: [
    "192.168.0.25",
    "localhost"
  ]
} as any; // Usando 'as any' porque a tipagem do Next Config às vezes não cobre features de Dev

export default nextConfig;
