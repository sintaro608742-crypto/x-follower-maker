# AI投稿プレビュー・編集ページ E2Eテスト仕様書

生成日: 2025-11-21
対象ページ: /posts
テストフレームワーク: Playwright
テスト構造: test.step()を活用した段階的テスト
実行モード: ヘッドレスモード（headless: true）
作成者: E2Eテスト仕様書作成エージェント

## テスト実行条件
- VITE_E2E_MODE=true（Sentry無効化）
- フロントエンド・バックエンドサーバー起動必須（フロント: http://localhost:3247）
- 実認証必須（認証スキップ機能禁止）
- モックサービス使用（PostsService.ts）

## 概要
- 総テスト項目数: 62
- 高優先度: 28項目
- 中優先度: 22項目
- 低優先度: 12項目

## テスト項目一覧

| No | テストID | テスト項目 | 依存テストID | 機能分類 | テスト分類 | 優先度 | 確認内容 | テストデータ/手順 | 期待結果 | 実施日 | 結果 | 備考 |
|----|---------|----------|------------|---------|-----------|--------|---------|------------------|----------|--------|------|------|
| 1 | E2E-POST-001 | ページ初期表示 | なし | 参照 | 正常系 | 高 | ページ読み込み成功 | /postsにアクセス | ページタイトル「AI投稿プレビュー・編集」表示 | | | |
| 2 | E2E-POST-002 | ローディング状態表示 | E2E-POST-001 | 参照 | 正常系 | 高 | データ取得中のローディング | ページアクセス直後 | CircularProgressが表示される | | | |
| 3 | E2E-POST-003 | 投稿一覧取得 | E2E-POST-001 | 参照 | 正常系 | 高 | 投稿リスト表示 | ローディング完了後 | 8件の投稿カードが表示される | | | |
| 4 | E2E-POST-004 | 日付グループ表示 | E2E-POST-003 | 参照 | 正常系 | 高 | 日付ごとのグループ化 | 投稿一覧確認 | 「今日」「明日」のグループが表示される | | | |
| 5 | E2E-POST-005 | フィルター初期値 | E2E-POST-003 | 参照 | 正常系 | 中 | デフォルトフィルター | ページ読み込み後 | 「今日」フィルターが選択状態 | | | |
| 6 | E2E-POST-006 | フィルター切り替え（明日） | E2E-POST-003 | フィルタ | 正常系 | 高 | 明日の投稿フィルタ | 「明日」チップをクリック | 明日の投稿4件のみ表示 | | | |
| 7 | E2E-POST-007 | フィルター切り替え（今週） | E2E-POST-003 | フィルタ | 正常系 | 高 | 今週の投稿フィルタ | 「今週」チップをクリック | 全8件の投稿が表示 | | | |
| 8 | E2E-POST-008 | フィルター切り替え（すべて） | E2E-POST-003 | フィルタ | 正常系 | 中 | すべての投稿フィルタ | 「すべて」チップをクリック | 全8件の投稿が表示 | | | |
| 9 | E2E-POST-009 | フィルター視覚フィードバック | E2E-POST-006 | フィルタ | 正常系 | 低 | 選択中のチップスタイル | フィルター選択時 | 青色グラデーション背景＋影＋白文字 | | | |
| 10 | E2E-POST-010 | 投稿ステータス表示（scheduled） | E2E-POST-003 | 参照 | 正常系 | 高 | 予約中ステータス | post-1を確認 | 「予約中」チップ＋説明「自動で投稿されます」 | | | |
| 11 | E2E-POST-011 | 投稿ステータス表示（posted） | E2E-POST-003 | 参照 | 正常系 | 高 | 投稿済みステータス | post-2を確認 | 「投稿済み」チップ＋説明「Xに投稿されました」 | | | |
| 12 | E2E-POST-012 | 投稿ステータス表示（unapproved） | E2E-POST-003 | 参照 | 正常系 | 高 | 承認待ちステータス | post-3を確認 | 「承認待ち」チップ＋説明「承認すると投稿されます」 | | | |
| 13 | E2E-POST-013 | 投稿ステータス表示（failed） | E2E-POST-003 | 参照 | 正常系 | 高 | 投稿エラーステータス | post-4を確認 | 「投稿エラー」チップ＋説明「投稿に失敗しました」 | | | |
| 14 | E2E-POST-014 | 投稿日時表示 | E2E-POST-003 | 参照 | 正常系 | 中 | 投稿予定日時の表示 | post-1を確認 | 「11月21日 09:00 に投稿予定」表示 | | | |
| 15 | E2E-POST-015 | 投稿内容表示 | E2E-POST-003 | 参照 | 正常系 | 高 | ツイート本文表示 | post-1を確認 | 「プログラミング初心者が...」全文表示 | | | |
| 16 | E2E-POST-016 | ハッシュタグハイライト | E2E-POST-003 | 参照 | 正常系 | 中 | ハッシュタグの色付け | post-1を確認 | #プログラミング初心者が青色表示 | | | |
| 17 | E2E-POST-017 | 文字数カウンター表示 | E2E-POST-003 | 参照 | 正常系 | 中 | 文字数カウント | post-1を確認 | 「234/280」と「残り XX文字」表示 | | | |
| 18 | E2E-POST-018 | エンゲージメント表示（投稿済み） | E2E-POST-003 | 参照 | 正常系 | 高 | いいね・リポスト・返信数 | post-2を確認 | いいね23、リポスト8、返信5が表示 | | | |
| 19 | E2E-POST-019 | エンゲージメント非表示（予約中） | E2E-POST-003 | 参照 | 正常系 | 中 | 予約中投稿にエンゲージなし | post-1を確認 | エンゲージメント統計が表示されない | | | |
| 20 | E2E-POST-020 | エラーメッセージ表示 | E2E-POST-003 | 参照 | 正常系 | 高 | 投稿失敗時のエラー | post-4を確認 | 「API認証エラーが発生しました」Alert表示 | | | |
| 21 | E2E-POST-021 | 投稿選択機能 | E2E-POST-003 | 操作 | 正常系 | 高 | 投稿カードクリック | post-1をクリック | カードに青枠ボーダーが表示される | | | |
| 22 | E2E-POST-022 | プレビューパネル更新 | E2E-POST-021 | 参照 | 正常系 | 高 | 選択投稿のプレビュー | post-1選択後 | 右パネルに投稿内容が表示される | | | |
| 23 | E2E-POST-023 | プレビューパネル内容 | E2E-POST-022 | 参照 | 正常系 | 中 | ツイート風UI表示 | プレビューパネル確認 | アバター、ユーザー名、本文、日時が表示 | | | |
| 24 | E2E-POST-024 | プレビューパネル未選択時 | E2E-POST-001 | 参照 | 正常系 | 中 | 未選択状態の表示 | 初期表示時 | 「投稿を選択してください」メッセージ | | | |
| 25 | E2E-POST-025 | 日付グループ折りたたみ | E2E-POST-004 | 操作 | 正常系 | 中 | グループの開閉 | 日付グループヘッダーをクリック | 投稿リストが非表示になる | | | |
| 26 | E2E-POST-026 | 日付グループ展開 | E2E-POST-025 | 操作 | 正常系 | 中 | 折りたたまれたグループを開く | 再度ヘッダーをクリック | 投稿リストが表示される | | | |
| 27 | E2E-POST-027 | 日付グループアイコン変化 | E2E-POST-025 | 参照 | 正常系 | 低 | 折りたたみアイコン | 開閉時 | ChevronUpとChevronDownが切り替わる | | | |
| 28 | E2E-POST-028 | 日付グループ投稿件数表示 | E2E-POST-004 | 参照 | 正常系 | 低 | 件数バッジ表示 | 日付グループヘッダー確認 | 「4件」チップが表示される | | | |
| 29 | E2E-POST-029 | 編集ボタン表示（予約中） | E2E-POST-003 | 参照 | 正常系 | 高 | 予約中投稿の編集ボタン | post-1を確認 | 「編集する」ボタンが表示される | | | |
| 30 | E2E-POST-030 | 編集ボタン非表示（投稿済み） | E2E-POST-003 | 参照 | 正常系 | 中 | 投稿済み投稿のボタン | post-2を確認 | 「編集する」ボタンが表示されない | | | |
| 31 | E2E-POST-031 | AIで再生成ボタン表示 | E2E-POST-003 | 参照 | 正常系 | 高 | 再生成ボタン表示 | post-1を確認 | 「AIで再生成」ボタンが表示される | | | |
| 32 | E2E-POST-032 | 削除ボタン表示 | E2E-POST-003 | 参照 | 正常系 | 高 | すべての投稿に削除ボタン | 全投稿を確認 | 「削除」ボタンが表示される | | | |
| 33 | E2E-POST-033 | 承認ボタン表示 | E2E-POST-003 | 参照 | 正常系 | 高 | 承認待ち投稿のボタン | post-3を確認 | 「承認する」ボタンが表示される | | | |
| 34 | E2E-POST-034 | 再試行ボタン表示 | E2E-POST-003 | 参照 | 正常系 | 高 | エラー投稿のボタン | post-4を確認 | 「再試行する」ボタンが表示される | | | |
| 35 | E2E-POST-035 | Xで見るボタン表示 | E2E-POST-003 | 参照 | 正常系 | 中 | 投稿済み投稿のボタン | post-2を確認 | 「Xで見る」ボタンが表示される | | | |
| 36 | E2E-POST-036 | 編集ダイアログ表示 | E2E-POST-029 | 更新 | 正常系 | 高 | 編集モーダルを開く | 「編集する」ボタンをクリック | ダイアログが表示される | | | |
| 37 | E2E-POST-037 | 編集ダイアログ内容 | E2E-POST-036 | 参照 | 正常系 | 高 | 編集フォーム表示 | ダイアログ確認 | タイトル「投稿を編集」、テキストフィールド、文字数表示 | | | |
| 38 | E2E-POST-038 | 編集ダイアログ初期値 | E2E-POST-036 | 参照 | 正常系 | 中 | 現在の投稿内容がセット | ダイアログ確認 | 選択した投稿の内容が表示される | | | |
| 39 | E2E-POST-039 | 編集内容変更 | E2E-POST-036 | 更新 | 正常系 | 高 | テキスト入力 | 「テスト編集内容」と入力 | テキストが更新される | | | |
| 40 | E2E-POST-040 | 編集文字数カウンター | E2E-POST-039 | 参照 | 正常系 | 中 | リアルタイム文字数表示 | 入力中 | 「XX/280文字」がリアルタイム更新 | | | |
| 41 | E2E-POST-041 | 編集保存成功 | E2E-POST-039 | 更新 | 正常系 | 高 | 投稿内容更新 | 「保存」ボタンをクリック | ダイアログが閉じて投稿が更新される | | | |
| 42 | E2E-POST-042 | 編集キャンセル | E2E-POST-036 | 操作 | 正常系 | 中 | 編集破棄 | 「キャンセル」ボタンをクリック | ダイアログが閉じて内容は変更されない | | | |
| 43 | E2E-POST-043 | AIで再生成実行 | E2E-POST-031 | 作成 | 正常系 | 高 | 投稿再生成 | 「AIで再生成」ボタンをクリック | ローディング→新しい内容に更新 | | | |
| 44 | E2E-POST-044 | 再生成ローディング表示 | E2E-POST-043 | 参照 | 正常系 | 中 | 再生成中のUI | 再生成実行中 | ボタン無効化、ローディング表示 | | | |
| 45 | E2E-POST-045 | 再生成後の内容更新 | E2E-POST-043 | 参照 | 正常系 | 高 | 新しい投稿内容 | 再生成完了後 | 「【再生成】」プレフィックス付きの内容 | | | |
| 46 | E2E-POST-046 | 再生成後のステータス変更 | E2E-POST-043 | 参照 | 正常系 | 高 | 承認待ちに変更 | 再生成完了後 | ステータスが「承認待ち」に変更 | | | |
| 47 | E2E-POST-047 | 承認実行 | E2E-POST-033 | 更新 | 正常系 | 高 | 投稿承認 | 「承認する」ボタンをクリック | ステータスが「予約中」に変更 | | | |
| 48 | E2E-POST-048 | 再試行実行 | E2E-POST-034 | 更新 | 正常系 | 高 | 投稿再試行 | 「再試行する」ボタンをクリック | ステータスが「予約中」、エラーメッセージ消去 | | | |
| 49 | E2E-POST-049 | 削除実行 | E2E-POST-032 | 削除 | 正常系 | 高 | 投稿削除 | 「削除」ボタンをクリック | 投稿が一覧から削除される | | | |
| 50 | E2E-POST-050 | 削除後の選択更新 | E2E-POST-049 | 参照 | 正常系 | 中 | 削除後の自動選択 | 選択中の投稿を削除 | 次の投稿が自動選択される | | | |
| 51 | E2E-POST-051 | Xで見るリンク | E2E-POST-035 | 操作 | 正常系 | 中 | 外部リンクを開く | 「Xで見る」ボタンをクリック | 新しいタブでXの投稿を開く | | | テスト環境では確認困難 |
| 52 | E2E-POST-052 | 手動投稿追加ボタン | E2E-POST-001 | 参照 | 正常系 | 中 | 手動投稿ボタン表示 | ページ上部確認 | 「手動投稿を追加」ボタンが表示される | | | Phase 2実装予定 |
| 53 | E2E-POST-053 | 編集文字数超過エラー | E2E-POST-036 | 異常系 | 異常系 | 高 | 280文字超過時の制御 | 281文字以上入力 | エラー表示＋保存ボタン無効化 | | | |
| 54 | E2E-POST-054 | 空の投稿一覧表示 | E2E-POST-001 | 異常系 | 異常系 | 中 | 投稿0件時のUI | フィルター調整で0件 | カレンダーアイコン＋「投稿がありません」メッセージ | | | モック調整が必要 |
| 55 | E2E-POST-055 | API取得エラー表示 | E2E-POST-001 | 異常系 | 異常系 | 高 | ネットワークエラー時 | APIエラーを発生させる | エラーAlert表示 | | | モック調整が必要 |
| 56 | E2E-POST-056 | 編集保存エラー | E2E-POST-039 | 異常系 | 異常系 | 中 | 更新失敗時の処理 | APIエラーを発生させる | エラーメッセージ表示 | | | モック調整が必要 |
| 57 | E2E-POST-057 | 再生成エラー | E2E-POST-043 | 異常系 | 異常系 | 中 | AI再生成失敗時 | APIエラーを発生させる | エラーメッセージ表示 | | | モック調整が必要 |
| 58 | E2E-POST-058 | 削除エラー | E2E-POST-049 | 異常系 | 異常系 | 中 | 削除失敗時の処理 | APIエラーを発生させる | エラーメッセージ表示 | | | モック調整が必要 |
| 59 | E2E-POST-059 | モバイル表示（375px） | E2E-POST-001 | レスポンシブ | レスポンシブ | 高 | モバイル画面表示 | ビューポート375x667 | 1カラム、プレビューパネル非表示 | | | |
| 60 | E2E-POST-060 | タブレット表示（768px） | E2E-POST-001 | レスポンシブ | レスポンシブ | 中 | タブレット画面表示 | ビューポート768x1024 | 1カラム、プレビューパネル非表示 | | | |
| 61 | E2E-POST-061 | デスクトップ表示（1920px） | E2E-POST-001 | レスポンシブ | レスポンシブ | 高 | デスクトップ画面表示 | ビューポート1920x1080 | 2カラム、右側にプレビューパネル表示 | | | |
| 62 | E2E-POST-062 | アニメーション動作確認 | E2E-POST-003 | UI/UX | 正常系 | 低 | Framer Motionアニメ | ページ読み込み時 | フェードイン＋スライドイン実行 | | | 視覚確認のみ |

## テスト分類別カバレッジ
- 正常系: 47項目（参照18、操作5、更新8、削除1、フィルタ4、作成1、UI/UX1、その他9）
- 異常系: 7項目（エラーハンドリング、バリデーション）
- レスポンシブ: 3項目（モバイル、タブレット、デスクトップ）
- セキュリティ: 5項目（認証確認は前提条件、XSS対策はハッシュタグハイライトで間接的に確認）

## API呼び出し一覧

| No | メソッド | エンドポイント | モック関数 | 用途 | テストID |
|----|---------|--------------|----------|------|----------|
| 1 | GET | /api/posts | PostsService.getList() | 投稿一覧取得 | E2E-POST-003 |
| 2 | PATCH | /api/posts/:id | PostsService.update() | 投稿内容編集 | E2E-POST-041 |
| 3 | DELETE | /api/posts/:id | PostsService.delete() | 投稿削除 | E2E-POST-049 |
| 4 | POST | /api/posts/:id/regenerate | PostsService.regenerate() | 投稿再生成 | E2E-POST-043 |
| 5 | POST | /api/posts/:id/approve | PostsService.approve() | 投稿承認 | E2E-POST-047 |
| 6 | POST | /api/posts/:id/retry | PostsService.retry() | 投稿再試行 | E2E-POST-048 |
| 7 | POST | /api/posts | PostsService.create() | 手動投稿追加 | E2E-POST-052 |

## 優先度別実施順序

### 高優先度（必須）: 28項目
**基本機能（依存なし）:**
- E2E-POST-001: ページ初期表示

**データ表示:**
- E2E-POST-002: ローディング状態表示
- E2E-POST-003: 投稿一覧取得
- E2E-POST-004: 日付グループ表示
- E2E-POST-010: 投稿ステータス表示（scheduled）
- E2E-POST-011: 投稿ステータス表示（posted）
- E2E-POST-012: 投稿ステータス表示（unapproved）
- E2E-POST-013: 投稿ステータス表示（failed）
- E2E-POST-015: 投稿内容表示
- E2E-POST-018: エンゲージメント表示（投稿済み）
- E2E-POST-020: エラーメッセージ表示

**フィルター操作:**
- E2E-POST-006: フィルター切り替え（明日）
- E2E-POST-007: フィルター切り替え（今週）

**投稿選択:**
- E2E-POST-021: 投稿選択機能
- E2E-POST-022: プレビューパネル更新

**ボタン表示確認:**
- E2E-POST-029: 編集ボタン表示（予約中）
- E2E-POST-031: AIで再生成ボタン表示
- E2E-POST-032: 削除ボタン表示
- E2E-POST-033: 承認ボタン表示
- E2E-POST-034: 再試行ボタン表示

**CRUD操作:**
- E2E-POST-036: 編集ダイアログ表示
- E2E-POST-037: 編集ダイアログ内容
- E2E-POST-039: 編集内容変更
- E2E-POST-041: 編集保存成功
- E2E-POST-043: AIで再生成実行
- E2E-POST-045: 再生成後の内容更新
- E2E-POST-046: 再生成後のステータス変更
- E2E-POST-047: 承認実行
- E2E-POST-048: 再試行実行
- E2E-POST-049: 削除実行

**異常系:**
- E2E-POST-053: 編集文字数超過エラー
- E2E-POST-055: API取得エラー表示

**レスポンシブ:**
- E2E-POST-059: モバイル表示（375px）
- E2E-POST-061: デスクトップ表示（1920px）

### 中優先度（推奨）: 22項目
**フィルター:**
- E2E-POST-005: フィルター初期値
- E2E-POST-008: フィルター切り替え（すべて）

**表示詳細:**
- E2E-POST-014: 投稿日時表示
- E2E-POST-016: ハッシュタグハイライト
- E2E-POST-017: 文字数カウンター表示
- E2E-POST-019: エンゲージメント非表示（予約中）
- E2E-POST-023: プレビューパネル内容
- E2E-POST-024: プレビューパネル未選択時

**日付グループ操作:**
- E2E-POST-025: 日付グループ折りたたみ
- E2E-POST-026: 日付グループ展開

**ボタン表示:**
- E2E-POST-030: 編集ボタン非表示（投稿済み）
- E2E-POST-035: Xで見るボタン表示
- E2E-POST-052: 手動投稿追加ボタン

**編集操作:**
- E2E-POST-038: 編集ダイアログ初期値
- E2E-POST-040: 編集文字数カウンター
- E2E-POST-042: 編集キャンセル
- E2E-POST-044: 再生成ローディング表示
- E2E-POST-050: 削除後の選択更新
- E2E-POST-051: Xで見るリンク

**異常系:**
- E2E-POST-054: 空の投稿一覧表示
- E2E-POST-056: 編集保存エラー
- E2E-POST-057: 再生成エラー
- E2E-POST-058: 削除エラー

**レスポンシブ:**
- E2E-POST-060: タブレット表示（768px）

### 低優先度（任意）: 12項目
**視覚的詳細:**
- E2E-POST-009: フィルター視覚フィードバック
- E2E-POST-027: 日付グループアイコン変化
- E2E-POST-028: 日付グループ投稿件数表示
- E2E-POST-062: アニメーション動作確認

## 前提条件

### テストアカウント
```yaml
ユーザー:
  email: test@xfollowermaker.local
  password: DevTest2025!Secure
  user_id: user-1
```

### モックデータ
- 投稿件数: 8件
- 今日の投稿: 4件（post-1, post-2, post-3, post-4）
- 明日の投稿: 4件（post-5, post-6, post-7, post-8）
- ステータス内訳: scheduled×5, posted×1, unapproved×1, failed×1

### 環境設定
```yaml
フロントエンドURL: http://localhost:3247
バックエンドURL: http://localhost:8432（モックのため未使用）
認証: 必須（ログイン済み前提）
```

## テスト実行手順

### 1. 環境準備
```bash
# 環境変数設定
export VITE_E2E_MODE=true

# フロントエンド起動
cd frontend
npm run dev
# http://localhost:3247 で起動確認
```

### 2. Playwrightテスト実行
```bash
# 全テスト実行（ヘッドレスモード）
npx playwright test tests/e2e/posts-page.spec.ts

# 特定のテストのみ実行
npx playwright test tests/e2e/posts-page.spec.ts -g "E2E-POST-001"

# UIモードで実行（デバッグ用）
npx playwright test tests/e2e/posts-page.spec.ts --ui

# ブラウザを表示して実行
npx playwright test tests/e2e/posts-page.spec.ts --headed
```

### 3. テストレポート確認
```bash
# HTMLレポート生成
npx playwright show-report
```

## テスト実装例

### 基本パターン
```typescript
import { test, expect } from '@playwright/test';

test.describe('AI投稿プレビュー・編集ページ', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理（セッション設定）
    await page.goto('http://localhost:3247/login');
    await page.fill('input[name="email"]', 'test@xfollowermaker.local');
    await page.fill('input[name="password"]', 'DevTest2025!Secure');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3247/dashboard');

    // 投稿ページへ遷移
    await page.goto('http://localhost:3247/posts');
  });

  test('E2E-POST-001: ページ初期表示', async ({ page }) => {
    await test.step('ページタイトル確認', async () => {
      const title = await page.locator('h1').textContent();
      expect(title).toContain('AI投稿プレビュー・編集');
    });

    await test.step('ページ説明確認', async () => {
      const description = await page.locator('text=AIが生成した投稿を確認・編集して').textContent();
      expect(description).toBeTruthy();
    });
  });

  test('E2E-POST-003: 投稿一覧取得', async ({ page }) => {
    await test.step('ローディング完了待機', async () => {
      await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });
    });

    await test.step('投稿件数確認', async () => {
      const postCards = await page.locator('[data-testid="post-card"]').count();
      expect(postCards).toBe(4); // 「今日」フィルター初期値で4件
    });
  });

  test('E2E-POST-041: 編集保存成功', async ({ page }) => {
    await test.step('投稿選択', async () => {
      await page.click('[data-testid="post-card"]:first-child');
    });

    await test.step('編集ボタンクリック', async () => {
      await page.click('button:has-text("編集する")');
      await page.waitForSelector('[role="dialog"]');
    });

    await test.step('内容編集', async () => {
      const textField = page.locator('textarea[label="投稿内容"]');
      await textField.clear();
      await textField.fill('テスト編集内容');
    });

    await test.step('保存実行', async () => {
      await page.click('button:has-text("保存")');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    });

    await test.step('更新確認', async () => {
      const content = await page.locator('[data-testid="post-card"]:first-child').textContent();
      expect(content).toContain('テスト編集内容');
    });
  });
});
```

### 異常系テストパターン
```typescript
test('E2E-POST-053: 編集文字数超過エラー', async ({ page }) => {
  await test.step('編集ダイアログを開く', async () => {
    await page.click('[data-testid="post-card"]:first-child');
    await page.click('button:has-text("編集する")');
  });

  await test.step('281文字入力', async () => {
    const longText = 'あ'.repeat(281);
    await page.fill('textarea[label="投稿内容"]', longText);
  });

  await test.step('エラー表示確認', async () => {
    const errorText = await page.locator('p.Mui-error').textContent();
    expect(errorText).toBeTruthy();
  });

  await test.step('保存ボタン無効化確認', async () => {
    const saveButton = page.locator('button:has-text("保存")');
    await expect(saveButton).toBeDisabled();
  });
});
```

### レスポンシブテストパターン
```typescript
test('E2E-POST-059: モバイル表示（375px）', async ({ page }) => {
  await test.step('ビューポート設定', async () => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  await test.step('1カラムレイアウト確認', async () => {
    const layout = await page.locator('main > div').first();
    const gridCols = await layout.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(gridCols).not.toContain('420px'); // 2カラムではない
  });

  await test.step('プレビューパネル非表示確認', async () => {
    const previewPanel = page.locator('text=ツイートプレビュー');
    await expect(previewPanel).not.toBeVisible();
  });
});
```

## 注意事項

### モックサービスの制約
- `PostsService.ts`はフロントエンド内でデータを保持
- ページリロードでデータがリセットされる
- エラーシミュレーションには追加実装が必要

### テストデータの依存関係
- 一部のテストは特定の投稿ID（post-1〜post-8）に依存
- モックデータの変更時はテスト内容も更新が必要

### 非同期処理の待機
- API呼び出しは人工的な遅延（500ms〜1500ms）あり
- `waitForSelector`や`waitForTimeout`を適切に使用

### XSS対策の確認
- ハッシュタグハイライト機能で`dangerouslySetInnerHTML`を使用
- テスト時は正規のハッシュタグのみ使用、スクリプト注入テストは別途実施

### Phase 2機能の扱い
- E2E-POST-052（手動投稿追加）は現在未実装
- テスト実装時はスキップまたはモック拡張が必要

## 補足情報

### テストカバレッジ目標
- 正常系: 100%（全47項目実施）
- 異常系: 80%以上（7項目中6項目以上）
- レスポンシブ: 100%（全3項目実施）

### 継続的改善
- 新機能追加時はテスト項目も同時追加
- バグ発見時は再発防止テストを追加
- モックデータは実際のAPIレスポンスに準拠

### パフォーマンス目標
- 全テスト実行時間: 10分以内
- 単一テスト実行時間: 30秒以内

---

**作成者**: E2Eテスト仕様書作成エージェント
**最終更新日**: 2025-11-21
**バージョン**: 1.0
