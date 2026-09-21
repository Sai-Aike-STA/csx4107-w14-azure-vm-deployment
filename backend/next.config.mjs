/** @type {import('next').NextConfig} */
// standalone makes the build output a small self-contained server folder that the Docker image can run
// basePath must match the public path of the backend on the course VM
// the professor's example uses "/backend" on a fresh VM, but this deployment was approved
// to reuse the existing VM and host under a subpath instead
const nextConfig = {
  output: "standalone",
  basePath: "/webdev/w14",
};

export default nextConfig;
