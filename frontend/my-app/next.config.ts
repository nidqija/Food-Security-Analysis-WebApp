import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet", "leaflet-defaulticon-compatibility"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // prevent leaflet (browser-only) from being bundled on the server
      config.externals = [...(config.externals ?? []), "leaflet", "leaflet-defaulticon-compatibility"];
    }
    return config;
  },
};

export default nextConfig;
