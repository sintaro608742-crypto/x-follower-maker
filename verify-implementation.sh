#!/bin/bash

# スライス2-B実装確認スクリプト

echo "=== スライス2-B: X連携管理 実装確認 ==="
echo ""

# 実装ファイルの確認
echo "1. 実装ファイル確認"
echo "-------------------"

files=(
  "src/app/api/twitter/auth/url/route.ts"
  "src/app/api/twitter/disconnect/route.ts"
  "src/lib/twitter/oauth.ts"
  "tests/integration/twitter/twitter-oauth.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (NOT FOUND)"
  fi
done

echo ""
echo "2. 統合テスト実行"
echo "-------------------"

# 統合テストを実行
npx jest --config jest.config.integration.js tests/integration/twitter/twitter-oauth.test.ts --runInBand --silent 2>&1 | grep -E "(PASS|FAIL|Tests:|Test Suites:)"

echo ""
echo "3. 実装完了確認"
echo "-------------------"

# SCOPE_PROGRESS.mdの確認
if grep -q "2B.1.*GET.*\[x\]" docs/SCOPE_PROGRESS.md && grep -q "2B.2.*POST.*\[x\]" docs/SCOPE_PROGRESS.md; then
  echo "✅ SCOPE_PROGRESS.md更新済み"
else
  echo "❌ SCOPE_PROGRESS.md未更新"
fi

echo ""
echo "=== 実装確認完了 ==="
