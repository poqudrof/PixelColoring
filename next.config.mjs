// The Pages project uses a custom domain and is served from its root.
// A path can still be supplied explicitly for forks hosted below a subfolder.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
