// ========================================
// 間違えた問題の保存
// ========================================

const STORAGE_KEY = "zenExamKnockMistakes";


// 保存されている間違い問題IDを取得する
export function getMistakeIds() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  return JSON.parse(savedData);
}


// 間違えた問題IDを保存する
export function addMistake(questionId) {
  const mistakeIds = getMistakeIds();

  // すでに保存済みなら重複して追加しない
  if (mistakeIds.includes(questionId)) {
    return;
  }

  mistakeIds.push(questionId);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(mistakeIds)
  );
}


// 間違いリストから問題IDを削除する
export function removeMistake(questionId) {
  const mistakeIds = getMistakeIds();

  const updatedIds = mistakeIds.filter(
    (id) => id !== questionId
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedIds)
  );
}
