/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境压缩
  compress: true,
  // React 严格模式
  reactStrictMode: true,
  // powered-by 头
  poweredByHeader: false,
  // 图片优化（未来需要）
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 实验性优化
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
