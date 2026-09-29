const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const isUserSite = repository.endsWith(".github.io");
const basePath = isGitHubPages && repository && !isUserSite ? `/${repository}` : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
