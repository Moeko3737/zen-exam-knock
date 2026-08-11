const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


// ========================================
// Python第1回の問題データを読み込む
// ========================================

const filePath = path.join(
  __dirname,
  "../src/data/python/lesson01.json"
);

const questions = JSON.parse(
  fs.readFileSync(filePath, "utf8")
);


// ========================================
// 問題数のテスト
// ========================================

test("Python第1回の問題が20問ある", () => {
  assert.equal(questions.length, 20);
});


// ========================================
// 問題データの形式を確認
// ========================================

test("すべての問題に必要なデータが揃っている", () => {
  questions.forEach((question) => {
    assert.equal(typeof question.id, "string");
    assert.equal(typeof question.question, "string");

    assert.ok(Array.isArray(question.choices));
    assert.equal(question.choices.length, 4);

    assert.ok(Number.isInteger(question.answer));

    assert.ok(
      question.answer >= 0 &&
      question.answer < question.choices.length
    );

    assert.equal(typeof question.explanation, "string");
  });
});
