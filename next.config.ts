const nextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "**/contracts/**",
      "**/artifacts/**",
      "**/rebalancingbot/**",
      "**/monitoring/**",
      "**/docs/**",
      "**/test/**",
      "**/scripts/**",
      "**/*.md",
      "**/*.xlsx"
    ]
  }
};

export default nextConfig;
