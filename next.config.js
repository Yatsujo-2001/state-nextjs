// GitHub Pages では https://<user>.github.io/<repo>/ 以下に置かれるため、
// ビルド時に PAGES_BASE_PATH（例: /state-nextjs）を渡すとそのパス以下で動くようにする。
// ローカル開発や独自ドメインでは未設定（＝ルート直下）のまま。
const basePath = process.env.PAGES_BASE_PATH || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
