import { redirect } from 'next/navigation'

export default function HomePage() {
    // 認証チェック後、メインダッシュボードへリダイレクト
    // 未認証の場合はログインページへ
    redirect('/login')
}
