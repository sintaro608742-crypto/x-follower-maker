# DashboardページE2Eテスト仕様書

生成日: 2025-11-21
対象ページ: /dashboard
テストフレームワーク: Playwright
テスト構造: test.step()を活用した段階的テスト
実行モード: ヘッドレスモード（headless: true）
作成者: E2Eテスト仕様書作成エージェント

## テスト実行条件
- VITE_E2E_MODE=true（Sentry無効化）
- フロントエンド・バックエンドサーバー起動必須
- 実認証必須（認証スキップ機能禁止）
- ベースURL: http://localhost:3247

## 概要
- 総テスト項目数: 58
- 高優先度: 28項目
- 中優先度: 20項目
- 低優先度: 10項目

## テスト項目一覧

| No | テストID | テスト項目 | 依存テストID | 機能分類 | テスト分類 | 優先度 | 確認内容 | テストデータ/手順 | 期待結果 | 実施日 | 結果 | 備考 |
|----|---------|----------|------------|---------|-----------|--------|---------|------------------|----------|--------|------|------|
| 1 | E2E-DASH-001 | 認証済みユーザーのダッシュボードアクセス | なし | 認証 | 正常系 | 高 | ログイン後ダッシュボード表示 | 1. test@xfollowermaker.localでログイン<br/>2. /dashboardへ遷移 | ページタイトル「ダッシュボード」表示<br/>ローディングが完了し全コンポーネント表示 | | | |
| 2 | E2E-DASH-002 | 初期データ読み込み | E2E-DASH-001 | データ取得 | 正常系 | 高 | ダッシュボードデータ取得 | 1. ダッシュボードアクセス<br/>2. 500ms待機（API遅延） | ユーザー情報表示<br/>フォロワー統計表示<br/>投稿一覧表示 | | | |
| 3 | E2E-DASH-003 | ローディング状態表示 | E2E-DASH-001 | UI状態 | 正常系 | 中 | ローディングスピナー表示 | 1. ページアクセス時<br/>2. API呼び出し中 | CircularProgress表示<br/>データ取得後非表示 | | | |
| 4 | E2E-DASH-004 | X連携ステータス（未連携）表示 | E2E-DASH-002 | X連携 | 正常系 | 高 | 未連携状態の表示 | 1. twitter_user_idがnullのユーザー<br/>2. ステータスカード確認 | ステータス: disconnected<br/>黄色ボーダー表示<br/>「Xアカウントと連携」ボタン表示 | | | |
| 5 | E2E-DASH-005 | X連携ステータス（連携済み）表示 | E2E-DASH-002 | X連携 | 正常系 | 高 | 連携済み状態の表示 | 1. twitter_user_id存在するユーザー<br/>2. ステータスカード確認 | ステータス: connected<br/>緑色ボーダー表示<br/>@test_user表示<br/>「連携を解除」ボタン表示 | | | |
| 6 | E2E-DASH-006 | X連携開始 | E2E-DASH-004 | X連携 | 正常系 | 高 | OAuth認証フロー開始 | 1. 「Xアカウントと連携」クリック<br/>2. 認証URL取得 | 200ms遅延後<br/>authUrl取得<br/>window.location.href遷移 | | | |
| 7 | E2E-DASH-007 | X連携解除 | E2E-DASH-005 | X連携 | 正常系 | 高 | 連携解除処理 | 1. 「連携を解除」クリック<br/>2. API呼び出し確認 | 300ms遅延後<br/>twitter_user_id削除<br/>「X連携を解除しました」スナックバー表示<br/>未連携状態に変更 | | | |
| 8 | E2E-DASH-008 | キーワード初期表示 | E2E-DASH-002 | キーワード | 正常系 | 高 | 選択済みキーワード表示 | 1. ダッシュボードアクセス<br/>2. KeywordSelectorコンポーネント確認 | 「興味関心キーワード」カード表示<br/>プリセット6個表示<br/>選択済みキーワード青色表示 | | | |
| 9 | E2E-DASH-009 | キーワード選択（1個目） | E2E-DASH-002 | キーワード | 正常系 | 高 | キーワード追加 | 1. 未選択キーワードをクリック<br/>2. API呼び出し確認 | 300ms遅延後<br/>キーワード青色に変化<br/>「キーワード設定を更新しました」スナックバー表示<br/>データ再取得 | | | |
| 10 | E2E-DASH-010 | キーワード選択（2個目） | E2E-DASH-009 | キーワード | 正常系 | 高 | キーワード追加（複数） | 1. 2個目のキーワードをクリック<br/>2. 選択状態確認 | 2個選択状態<br/>両方青色表示 | | | |
| 11 | E2E-DASH-011 | キーワード選択（3個目・上限） | E2E-DASH-010 | キーワード | 正常系 | 高 | 最大選択数到達 | 1. 3個目のキーワードをクリック<br/>2. 選択状態確認 | 3個選択状態<br/>全て青色表示<br/>最大選択数到達 | | | |
| 12 | E2E-DASH-012 | キーワード選択解除 | E2E-DASH-011 | キーワード | 正常系 | 中 | 選択済みキーワード解除 | 1. 選択済みキーワードをクリック<br/>2. 解除確認 | キーワード白色に変化<br/>「キーワード設定を更新しました」スナックバー表示<br/>選択数減少 | | | |
| 13 | E2E-DASH-013 | キーワード4個目選択エラー | E2E-DASH-011 | キーワード | 異常系 | 高 | 最大選択数超過エラー | 1. 3個選択済み状態<br/>2. 4個目をクリック | 「キーワードは最大3つまで選択できます」エラースナックバー表示<br/>選択されない | | | |
| 14 | E2E-DASH-014 | キーワードアニメーション | E2E-DASH-008 | UI/UX | 正常系 | 低 | Framer Motionアニメーション | 1. ページアクセス<br/>2. カード表示確認 | カードフェードイン（0.5s、delay 0.1s）<br/>チップ順次表示（index * 0.05s） | | | |
| 15 | E2E-DASH-015 | 投稿頻度スライダー初期表示 | E2E-DASH-002 | 投稿設定 | 正常系 | 高 | スライダー初期値表示 | 1. ダッシュボードアクセス<br/>2. PostScheduleSettingsコンポーネント確認 | 「投稿頻度設定」カード表示<br/>現在の頻度値表示（例: 4回/日）<br/>スライダー範囲: 3-5 | | | |
| 16 | E2E-DASH-016 | 投稿頻度変更（スライダー操作） | E2E-DASH-015 | 投稿設定 | 正常系 | 高 | スライダーで頻度変更 | 1. スライダーをドラッグ<br/>2. 値を3に変更<br/>3. ドロップ（onChangeCommitted） | ローカル値即座に更新<br/>300ms遅延後API呼び出し<br/>「投稿スケジュールを更新しました」スナックバー表示<br/>データ再取得 | | | |
| 17 | E2E-DASH-017 | 投稿頻度変更（最小値3） | E2E-DASH-015 | 投稿設定 | 正常系 | 中 | 最小値設定 | 1. スライダーを3に設定<br/>2. 更新確認 | 3回/日表示<br/>正常に更新 | | | |
| 18 | E2E-DASH-018 | 投稿頻度変更（最大値5） | E2E-DASH-015 | 投稿設定 | 正常系 | 中 | 最大値設定 | 1. スライダーを5に設定<br/>2. 更新確認 | 5回/日表示<br/>正常に更新 | | | |
| 19 | E2E-DASH-019 | 投稿時間帯初期表示 | E2E-DASH-002 | 投稿設定 | 正常系 | 高 | 時間帯チップ表示 | 1. ダッシュボードアクセス<br/>2. 時間帯セクション確認 | 7個の時間帯チップ表示<br/>選択済み時間帯青色表示<br/>未選択時間帯白色表示 | | | |
| 20 | E2E-DASH-020 | 投稿時間帯追加 | E2E-DASH-019 | 投稿設定 | 正常系 | 高 | 時間帯選択 | 1. 未選択時間帯をクリック<br/>2. 選択確認 | 300ms遅延後<br/>時間帯青色に変化<br/>「投稿スケジュールを更新しました」スナックバー表示<br/>ソート後のpost_times配列更新 | | | |
| 21 | E2E-DASH-021 | 投稿時間帯解除 | E2E-DASH-020 | 投稿設定 | 正常系 | 高 | 時間帯選択解除 | 1. 選択済み時間帯をクリック<br/>2. 解除確認 | 時間帯白色に変化<br/>「投稿スケジュールを更新しました」スナックバー表示<br/>post_times配列から削除 | | | |
| 22 | E2E-DASH-022 | 投稿時間帯複数選択 | E2E-DASH-019 | 投稿設定 | 正常系 | 中 | 複数時間帯選択 | 1. 複数の時間帯を順次選択<br/>2. 全選択確認 | 各時間帯が青色表示<br/>post_times配列に全て追加<br/>自動ソート適用 | | | |
| 23 | E2E-DASH-023 | フォロワー統計カード表示 | E2E-DASH-002 | 統計表示 | 正常系 | 高 | フォロワー数と成長率表示 | 1. ダッシュボードアクセス<br/>2. FollowerStatsCardコンポーネント確認 | 現在のフォロワー数表示<br/>成長数・成長率表示<br/>折れ線グラフ表示（30日分） | | | |
| 24 | E2E-DASH-024 | フォロワー数カウントアップアニメーション | E2E-DASH-023 | UI/UX | 正常系 | 低 | 数値アニメーション | 1. ページ読み込み時<br/>2. フォロワー数表示確認 | 0から現在値までカウントアップ<br/>SF Monoフォント使用 | | | |
| 25 | E2E-DASH-025 | フォロワー成長率（正の値）表示 | E2E-DASH-023 | 統計表示 | 正常系 | 中 | 成長率プラス表示 | 1. 成長がある場合<br/>2. 成長率確認 | 緑色で「+X%」表示<br/>上向き矢印アイコン | | | |
| 26 | E2E-DASH-026 | フォロワー成長率（0）表示 | E2E-DASH-023 | 統計表示 | 正常系 | 低 | 成長率ゼロ表示 | 1. 成長がない場合<br/>2. 成長率確認 | 「0%」表示<br/>矢印なし | | | |
| 27 | E2E-DASH-027 | フォロワー成長率（負の値）表示 | E2E-DASH-023 | 統計表示 | 正常系 | 低 | 成長率マイナス表示 | 1. フォロワー減少の場合<br/>2. 成長率確認 | 赤色で「-X%」表示<br/>下向き矢印アイコン | | | |
| 28 | E2E-DASH-028 | フォロワーグラフ描画 | E2E-DASH-023 | 統計表示 | 正常系 | 中 | Rechartsグラフ表示 | 1. ダッシュボードアクセス<br/>2. グラフ確認 | 折れ線グラフ表示<br/>30日分のデータポイント<br/>X軸: 日付、Y軸: フォロワー数 | | | |
| 29 | E2E-DASH-029 | グラフアニメーション | E2E-DASH-023 | UI/UX | 正常系 | 低 | グラフ描画アニメーション | 1. ページ読み込み時<br/>2. グラフ描画確認 | 左から右へ線が描画<br/>スムーズなアニメーション | | | |
| 30 | E2E-DASH-030 | 今日の投稿予定一覧表示 | E2E-DASH-002 | 投稿一覧 | 正常系 | 高 | 本日予定投稿表示 | 1. ダッシュボードアクセス<br/>2. PostsListコンポーネント確認 | 「今日の投稿予定」カード表示<br/>予定投稿2件表示<br/>scheduled_atで時刻表示<br/>エンゲージメント非表示 | | | |
| 31 | E2E-DASH-031 | 最近の投稿履歴一覧表示 | E2E-DASH-002 | 投稿一覧 | 正常系 | 高 | 過去の投稿表示 | 1. ダッシュボードアクセス<br/>2. PostsListコンポーネント確認 | 「最近の投稿履歴」カード表示<br/>過去投稿2件表示<br/>エンゲージメント表示（いいね・RT・返信数） | | | |
| 32 | E2E-DASH-032 | 投稿内容プレビュー | E2E-DASH-030 | 投稿一覧 | 正常系 | 中 | 投稿テキスト表示 | 1. 投稿カード確認<br/>2. 内容表示確認 | 投稿内容280文字以内表示<br/>適切な改行・折り返し | | | |
| 33 | E2E-DASH-033 | 投稿時刻フォーマット | E2E-DASH-030 | 投稿一覧 | 正常系 | 低 | 時刻表示形式 | 1. 投稿一覧確認<br/>2. 時刻表示確認 | HH:MM形式（例: 09:00）<br/>24時間表記 | | | |
| 34 | E2E-DASH-034 | カウントダウンタイマー初期表示 | E2E-DASH-002 | タイマー | 正常系 | 高 | 次回投稿までの時間表示 | 1. ダッシュボードアクセス<br/>2. CountdownTimerコンポーネント確認 | 「次の投稿まで」表示<br/>時:分:秒フォーマット<br/>SF Monoフォント | | | |
| 35 | E2E-DASH-035 | カウントダウンタイマー動作 | E2E-DASH-034 | タイマー | 正常系 | 高 | タイマーカウントダウン | 1. 初期値確認<br/>2. 1秒待機<br/>3. 値確認 | 1秒ごとに秒数減少<br/>リアルタイム更新 | | | |
| 36 | E2E-DASH-036 | カウントダウン0秒到達 | E2E-DASH-034 | タイマー | 正常系 | 中 | タイマー終了時の挙動 | 1. タイマーが0に到達<br/>2. 次の投稿時刻に更新 | 次の投稿時刻に自動リセット<br/>継続的にカウントダウン | | | |
| 37 | E2E-DASH-037 | 更新中オーバーレイ表示 | E2E-DASH-009 | UI状態 | 正常系 | 中 | ローディングオーバーレイ | 1. 設定変更操作<br/>2. API呼び出し中 | 画面全体に半透明オーバーレイ<br/>中央にCircularProgress<br/>z-index: 9999 | | | |
| 38 | E2E-DASH-038 | スナックバー表示（成功） | E2E-DASH-009 | UI状態 | 正常系 | 中 | 成功メッセージ表示 | 1. 設定更新成功<br/>2. スナックバー確認 | 画面下部中央に表示<br/>緑色背景<br/>3秒後自動非表示 | | | |
| 39 | E2E-DASH-039 | スナックバー表示（エラー） | E2E-DASH-013 | UI状態 | 正常系 | 中 | エラーメッセージ表示 | 1. 操作エラー発生<br/>2. スナックバー確認 | 画面下部中央に表示<br/>赤色背景<br/>3秒後自動非表示 | | | |
| 40 | E2E-DASH-040 | スナックバー手動クローズ | E2E-DASH-038 | UI状態 | 正常系 | 低 | 手動でスナックバー閉じる | 1. スナックバー表示中<br/>2. 閉じるボタンクリック | 即座にスナックバー非表示 | | | |
| 41 | E2E-DASH-041 | データ取得エラー表示 | なし | エラー処理 | 異常系 | 高 | API接続エラー | 1. バックエンドサーバー停止<br/>2. ダッシュボードアクセス | 赤色Alertコンポーネント表示<br/>エラーメッセージ表示 | | | |
| 42 | E2E-DASH-042 | データ取得失敗（null） | なし | エラー処理 | 異常系 | 中 | データ取得失敗 | 1. APIがnull返却<br/>2. エラー表示確認 | 黄色Alertコンポーネント<br/>「データを読み込めませんでした」表示 | | | |
| 43 | E2E-DASH-043 | キーワード更新APIエラー | E2E-DASH-009 | エラー処理 | 異常系 | 高 | キーワード更新失敗 | 1. キーワード変更<br/>2. API500エラー | 「キーワード更新に失敗しました」エラースナックバー<br/>元の選択状態維持 | | | |
| 44 | E2E-DASH-044 | 投稿頻度範囲外エラー | E2E-DASH-016 | エラー処理 | 異常系 | 中 | バリデーションエラー（頻度2） | 1. post_frequency=2でAPI呼び出し<br/>2. エラー確認 | 「投稿頻度は3〜5回/日の範囲で設定してください」エラー | | | |
| 45 | E2E-DASH-045 | 投稿頻度範囲外エラー | E2E-DASH-016 | エラー処理 | 異常系 | 中 | バリデーションエラー（頻度6） | 1. post_frequency=6でAPI呼び出し<br/>2. エラー確認 | 「投稿頻度は3〜5回/日の範囲で設定してください」エラー | | | |
| 46 | E2E-DASH-046 | 投稿スケジュール更新APIエラー | E2E-DASH-016 | エラー処理 | 異常系 | 高 | 投稿設定更新失敗 | 1. 投稿設定変更<br/>2. API500エラー | 「投稿頻度の更新に失敗しました」または<br/>「投稿時間帯の更新に失敗しました」エラースナックバー | | | |
| 47 | E2E-DASH-047 | X連携APIエラー | E2E-DASH-006 | エラー処理 | 異常系 | 高 | X連携開始失敗 | 1. 連携ボタンクリック<br/>2. API500エラー | 「X連携に失敗しました」エラースナックバー<br/>未連携状態維持 | | | |
| 48 | E2E-DASH-048 | X連携解除APIエラー | E2E-DASH-007 | エラー処理 | 異常系 | 高 | X連携解除失敗 | 1. 解除ボタンクリック<br/>2. API500エラー | 「X連携解除に失敗しました」エラースナックバー<br/>連携状態維持 | | | |
| 49 | E2E-DASH-049 | デスクトップ表示（1920x1080） | E2E-DASH-002 | レスポンシブ | 正常系 | 中 | 大画面レイアウト | 1. viewport: 1920x1080設定<br/>2. レイアウト確認 | Grid 2カラムレイアウト<br/>全コンポーネント横並び表示<br/>適切な余白 | | | |
| 50 | E2E-DASH-050 | タブレット表示（768x1024） | E2E-DASH-002 | レスポンシブ | 正常系 | 中 | 中画面レイアウト | 1. viewport: 768x1024設定<br/>2. レイアウト確認 | 一部1カラムに変更<br/>カードサイズ調整<br/>スクロール可能 | | | |
| 51 | E2E-DASH-051 | モバイル表示（375x667） | E2E-DASH-002 | レスポンシブ | 正常系 | 高 | 小画面レイアウト | 1. viewport: 375x667設定<br/>2. レイアウト確認 | 完全1カラムレイアウト<br/>フォントサイズ調整<br/>タッチフレンドリーなボタン | | | |
| 52 | E2E-DASH-052 | 未認証ユーザーのアクセス | なし | セキュリティ | 正常系 | 高 | 認証リダイレクト | 1. ログアウト状態<br/>2. /dashboardへ直接アクセス | /loginへリダイレクト<br/>ダッシュボード表示されない | | | |
| 53 | E2E-DASH-053 | カードホバーエフェクト | E2E-DASH-002 | UI/UX | 正常系 | 低 | ホバー時アニメーション | 1. カードにマウスホバー<br/>2. エフェクト確認 | translateY(-2px)変換<br/>影が濃くなる<br/>スムーズな遷移 | | | |
| 54 | E2E-DASH-054 | キーワードチップホバーエフェクト | E2E-DASH-008 | UI/UX | 正常系 | 低 | ホバー時視覚フィードバック | 1. チップにマウスホバー<br/>2. エフェクト確認 | translateY(-2px)変換<br/>ボーダー色変更<br/>影強調 | | | |
| 55 | E2E-DASH-055 | ボタンホバーエフェクト | E2E-DASH-004 | UI/UX | 正常系 | 低 | ホバー時ボタン変化 | 1. 「Xアカウントと連携」ボタンにホバー<br/>2. エフェクト確認 | translateY(-3px) + scale(1.02)<br/>影強調 | | | |
| 56 | E2E-DASH-056 | ページ遷移アニメーション | E2E-DASH-001 | UI/UX | 正常系 | 低 | Framer Motionフェードイン | 1. ダッシュボードアクセス<br/>2. アニメーション確認 | opacity: 0→1（0.3s）<br/>全体がフェードイン | | | |
| 57 | E2E-DASH-057 | コンポーネント順次表示 | E2E-DASH-002 | UI/UX | 正常系 | 低 | スタガードアニメーション | 1. ページ読み込み<br/>2. 各カード確認 | 各カード順次表示<br/>delay設定（0.1s, 0.2s, ...） | | | |
| 58 | E2E-DASH-058 | ログ出力確認 | E2E-DASH-001 | 開発 | 正常系 | 低 | logger動作確認 | 1. ブラウザコンソール確認<br/>2. 各操作時のログ | debug/info/errorレベルログ<br/>適切なコンテキスト情報 | | | |

## テスト分類別カバレッジ
- 正常系: 45項目（78%）
- 異常系: 8項目（14%）
- セキュリティ: 1項目（2%）
- レスポンシブ: 3項目（5%）
- UI/UX: 12項目（21%）

## API呼び出し一覧

| No | メソッド | エンドポイント | 用途 | テストID | モックサービスメソッド |
|----|---------|--------------|------|----------|----------------------|
| 1 | GET | /api/dashboard | ダッシュボードデータ一括取得 | E2E-DASH-002 | getDashboardData() |
| 2 | PUT | /api/settings/keywords | キーワード更新 | E2E-DASH-009 | updateKeywords() |
| 3 | PUT | /api/settings/post-schedule | 投稿スケジュール更新 | E2E-DASH-016 | updatePostSchedule() |
| 4 | GET | /api/twitter/auth/url | X OAuth認証URL取得 | E2E-DASH-006 | connectTwitter() |
| 5 | POST | /api/twitter/disconnect | X連携解除 | E2E-DASH-007 | disconnectTwitter() |

## 優先度別実施順序

### 高優先度（必須）: 28項目
E2E-DASH-001（認証アクセス）, E2E-DASH-002（初期データ）, E2E-DASH-004（X未連携表示）, E2E-DASH-005（X連携済み表示）, E2E-DASH-006（X連携開始）, E2E-DASH-007（X連携解除）, E2E-DASH-008（キーワード初期表示）, E2E-DASH-009（キーワード選択1個目）, E2E-DASH-010（キーワード選択2個目）, E2E-DASH-011（キーワード選択3個目）, E2E-DASH-013（キーワード4個目エラー）, E2E-DASH-015（投稿頻度初期表示）, E2E-DASH-016（投稿頻度変更）, E2E-DASH-019（投稿時間帯初期表示）, E2E-DASH-020（投稿時間帯追加）, E2E-DASH-021（投稿時間帯解除）, E2E-DASH-023（フォロワー統計表示）, E2E-DASH-030（今日の投稿予定）, E2E-DASH-031（最近の投稿履歴）, E2E-DASH-034（カウントダウン初期表示）, E2E-DASH-035（カウントダウン動作）, E2E-DASH-041（データ取得エラー）, E2E-DASH-043（キーワード更新エラー）, E2E-DASH-046（投稿設定更新エラー）, E2E-DASH-047（X連携エラー）, E2E-DASH-048（X連携解除エラー）, E2E-DASH-051（モバイル表示）, E2E-DASH-052（未認証アクセス）

### 中優先度（推奨）: 20項目
E2E-DASH-003（ローディング状態）, E2E-DASH-012（キーワード解除）, E2E-DASH-017（投稿頻度最小値）, E2E-DASH-018（投稿頻度最大値）, E2E-DASH-022（投稿時間帯複数選択）, E2E-DASH-025（成長率プラス表示）, E2E-DASH-028（フォロワーグラフ）, E2E-DASH-032（投稿内容プレビュー）, E2E-DASH-036（カウントダウン0秒到達）, E2E-DASH-037（更新中オーバーレイ）, E2E-DASH-038（スナックバー成功）, E2E-DASH-039（スナックバーエラー）, E2E-DASH-042（データ取得失敗null）, E2E-DASH-044（投稿頻度範囲外エラー2）, E2E-DASH-045（投稿頻度範囲外エラー6）, E2E-DASH-049（デスクトップ表示）, E2E-DASH-050（タブレット表示）

### 低優先度（任意）: 10項目
E2E-DASH-014（キーワードアニメーション）, E2E-DASH-024（カウントアップアニメーション）, E2E-DASH-026（成長率ゼロ表示）, E2E-DASH-027（成長率マイナス表示）, E2E-DASH-029（グラフアニメーション）, E2E-DASH-033（投稿時刻フォーマット）, E2E-DASH-040（スナックバー手動クローズ）, E2E-DASH-053〜058（各種UI/UXエフェクト、ログ確認）

## 前提条件

### テストアカウント
- メール: test@xfollowermaker.local
- パスワード: DevTest2025!Secure
- ユーザーID: user-001

### モックデータ
- フォロワー数: 1234〜1500（30日間の成長データ）
- 選択済みキーワード: ["ビジネス・起業"]
- 投稿頻度: 4回/日
- 投稿時間帯: ["09:00", "12:00", "18:00", "21:00"]
- 今日の投稿: 2件
- 最近の投稿: 2件（エンゲージメント付き）

### 環境設定
- フロントエンド: http://localhost:3247
- バックエンド: http://localhost:8432
- データベース: PostgreSQL (Port 5433)
- Node.js環境変数: VITE_E2E_MODE=true

## 依存関係マップ

```
基本フロー:
E2E-DASH-001（認証アクセス）
  └─ E2E-DASH-002（初期データ取得）
      ├─ E2E-DASH-003（ローディング状態）
      ├─ E2E-DASH-004（X未連携表示）
      │   └─ E2E-DASH-006（X連携開始）
      ├─ E2E-DASH-005（X連携済み表示）
      │   └─ E2E-DASH-007（X連携解除）
      ├─ E2E-DASH-008（キーワード初期表示）
      │   ├─ E2E-DASH-009（キーワード選択1個目）
      │   │   └─ E2E-DASH-010（キーワード選択2個目）
      │   │       └─ E2E-DASH-011（キーワード選択3個目）
      │   │           ├─ E2E-DASH-012（キーワード解除）
      │   │           └─ E2E-DASH-013（キーワード4個目エラー）
      │   └─ E2E-DASH-014（キーワードアニメーション）
      ├─ E2E-DASH-015（投稿頻度初期表示）
      │   ├─ E2E-DASH-016（投稿頻度変更）
      │   ├─ E2E-DASH-017（投稿頻度最小値）
      │   └─ E2E-DASH-018（投稿頻度最大値）
      ├─ E2E-DASH-019（投稿時間帯初期表示）
      │   ├─ E2E-DASH-020（投稿時間帯追加）
      │   ├─ E2E-DASH-021（投稿時間帯解除）
      │   └─ E2E-DASH-022（投稿時間帯複数選択）
      ├─ E2E-DASH-023（フォロワー統計表示）
      │   ├─ E2E-DASH-024〜027（成長率表示バリエーション）
      │   ├─ E2E-DASH-028（フォロワーグラフ）
      │   └─ E2E-DASH-029（グラフアニメーション）
      ├─ E2E-DASH-030（今日の投稿予定）
      │   ├─ E2E-DASH-032（投稿内容プレビュー）
      │   └─ E2E-DASH-033（投稿時刻フォーマット）
      ├─ E2E-DASH-031（最近の投稿履歴）
      ├─ E2E-DASH-034（カウントダウン初期表示）
      │   ├─ E2E-DASH-035（カウントダウン動作）
      │   └─ E2E-DASH-036（カウントダウン0秒到達）
      └─ E2E-DASH-049〜051（レスポンシブ表示）

独立フロー:
E2E-DASH-041（データ取得エラー）
E2E-DASH-042（データ取得失敗null）
E2E-DASH-052（未認証アクセス）
```

## テスト実装例（Playwright）

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // E2E-DASH-001: 認証済みユーザーでログイン
    await page.goto('http://localhost:3247/login');
    await page.fill('input[name="email"]', 'test@xfollowermaker.local');
    await page.fill('input[name="password"]', 'DevTest2025!Secure');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('E2E-DASH-002: 初期データ読み込み', async ({ page }) => {
    await test.step('ページタイトル確認', async () => {
      await expect(page.locator('h1')).toContainText('ダッシュボード');
    });

    await test.step('ローディング完了待機', async () => {
      await page.waitForSelector('[data-testid="dashboard-loaded"]', {
        timeout: 2000
      });
    });

    await test.step('全コンポーネント表示確認', async () => {
      await expect(page.locator('[data-testid="twitter-status-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="keyword-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="post-schedule-settings"]')).toBeVisible();
      await expect(page.locator('[data-testid="follower-stats-card"]')).toBeVisible();
    });
  });

  test('E2E-DASH-009: キーワード選択（1個目）', async ({ page }) => {
    await test.step('未選択キーワードをクリック', async () => {
      const unselectedChip = page.locator('[data-testid^="keyword-chip-"]').filter({
        hasNot: page.locator('.selected')
      }).first();
      await unselectedChip.click();
    });

    await test.step('スナックバー確認', async () => {
      await expect(page.locator('[role="alert"]')).toContainText('キーワード設定を更新しました');
    });

    await test.step('キーワード選択状態確認', async () => {
      await page.waitForTimeout(500); // データ再取得待機
      const selectedChips = page.locator('[data-testid^="keyword-chip-"].selected');
      await expect(selectedChips).toHaveCount(2); // 元々1個 + 新規1個
    });
  });

  test('E2E-DASH-013: キーワード4個目選択エラー', async ({ page }) => {
    await test.step('3個のキーワードを選択', async () => {
      // 既に1個選択済みと仮定、さらに2個選択
      const unselectedChips = page.locator('[data-testid^="keyword-chip-"]').filter({
        hasNot: page.locator('.selected')
      });
      await unselectedChips.nth(0).click();
      await page.waitForTimeout(500);
      await unselectedChips.nth(1).click();
      await page.waitForTimeout(500);
    });

    await test.step('4個目をクリック', async () => {
      const fourthChip = page.locator('[data-testid^="keyword-chip-"]').filter({
        hasNot: page.locator('.selected')
      }).first();
      await fourthChip.click();
    });

    await test.step('エラースナックバー確認', async () => {
      await expect(page.locator('[role="alert"].error')).toContainText(
        'キーワードは最大3つまで選択できます'
      );
    });
  });

  test('E2E-DASH-016: 投稿頻度変更（スライダー操作）', async ({ page }) => {
    await test.step('スライダーを3に変更', async () => {
      const slider = page.locator('[data-testid="frequency-slider"]');
      await slider.click(); // フォーカス
      await slider.press('ArrowLeft'); // 値を減らす
    });

    await test.step('頻度表示確認', async () => {
      await expect(page.locator('[data-testid="frequency-display"]')).toContainText('3回/日');
    });

    await test.step('スナックバー確認', async () => {
      await expect(page.locator('[role="alert"]')).toContainText('投稿スケジュールを更新しました');
    });
  });

  test('E2E-DASH-035: カウントダウンタイマー動作', async ({ page }) => {
    await test.step('初期値取得', async () => {
      const initialSeconds = await page.locator('[data-testid="countdown-seconds"]').textContent();
      await page.waitForTimeout(1000);
      const afterSeconds = await page.locator('[data-testid="countdown-seconds"]').textContent();
      expect(parseInt(afterSeconds!)).toBeLessThan(parseInt(initialSeconds!));
    });
  });

  test('E2E-DASH-051: モバイル表示（375x667）', async ({ page }) => {
    await test.step('ビューポート設定', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('1カラムレイアウト確認', async () => {
      const cards = page.locator('[data-testid^="dashboard-card-"]');
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      // 縦並びを確認（2枚目のカードのY座標が1枚目より大きい）
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
    });
  });

  test('E2E-DASH-052: 未認証ユーザーのアクセス', async ({ page }) => {
    await test.step('ログアウト', async () => {
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => sessionStorage.clear());
    });

    await test.step('ダッシュボードへ直接アクセス', async () => {
      await page.goto('http://localhost:3247/dashboard');
    });

    await test.step('ログインページへリダイレクト確認', async () => {
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/.*login/);
    });
  });
});
```

## 注意事項

### テストデータの準備
- モックサービスは固定データを返すため、テスト間の状態管理に注意
- 実際のE2E環境では、テスト前にDBをクリーンアップ
- シードデータを投入してテスト実行

### タイムアウト設定
- API呼び出し遅延: 200-500ms（モック）
- ページ読み込み: 最大2秒
- アニメーション完了待機: 500ms-1秒

### 並列実行
- 同一ユーザーでの並列実行は避ける（データ競合）
- 異なるテストユーザーを使用して並列化可能

### CI/CD統合
- GitHub Actions推奨
- ヘッドレスモード必須
- スクリーンショット・動画記録有効化
- 失敗時のデバッグ情報保存

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-21 | 1.0 | 初版作成 - 58テスト項目定義 |
