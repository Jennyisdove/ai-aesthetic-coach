# AI Aesthetic Coach

AI 穿搭顾问网站 — 帮助用户根据身材特征、审美偏好与灵感图片，找到属于自己的个人风格。

## 技术栈

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) — 计划后续引入

## 项目结构

```
ai-aesthetic-coach/
├── app/
│   ├── layout.tsx
│   ├── page.tsx          # 首页（Hero + 风格档案表单 + 示例结果）
│   └── globals.css
├── components/
│   ├── hero.tsx
│   ├── footer.tsx
│   ├── style-intake.tsx  # 用户信息填写与生成按钮（客户端）
│   └── style-dna-result.tsx
├── lib/
│   ├── design-tokens.ts
│   ├── types.ts
│   └── style-engine.ts
└── user_profile.json     # 示例用户画像
```

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 开发进度

- [x] **Day 1** — 项目脚手架、Tailwind、基础目录、首页、README
- [x] **Day 2** — 产品化首页：通用 Hero、风格档案表单、示例 Style DNA 展示
- [x] **Day 3** — Style DNA 规则引擎（根据表单输入动态生成）
- [ ] Day 4 — 灵感上传与今日 Look 推荐
- [ ] Day 5 — Pinterest 瀑布流与参照物宇宙
- [ ] Day 6 — 用户档案编辑页
- [ ] Day 7 — 响应式、动效与视觉打磨
