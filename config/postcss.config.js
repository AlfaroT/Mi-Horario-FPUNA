module.exports = {
  plugins: {
    tailwindcss: { config: './config/tailwind.config.js' },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}