const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "**/contracts/**",
        "**/artifacts/**",
        "**/rebalancingbot/**",
        "**/monitoring/**",
        "**/docs/**",
        "**/docsAgent/**",
        "**/test/**",
        "**/scripts/**",
        "**/*.md",
        "**/*.xlsx"
      ]
    }
  }
};

export default nextConfig;
