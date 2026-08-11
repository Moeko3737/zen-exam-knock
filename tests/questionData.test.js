const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


// ========================================
// 設定
// ========================================

const pythonDataDirectory = path.join(
  __dirname,
  "../src/data/python"
);


// ========================================
// Pythonの問題ファイルを取得
// ========================================

const questionFiles = fs
  .readdirSync(pythonDataDirectory)
  .filter((fileName) =>
    /^lesson\d{2}\.json$/.test(fileName)
  )
  .sort();


// ========================================
// 問題ファイルが存在するか
// ========================================

test("Pythonの問題データが1ファイル以上存在する", () => {
  assert.ok(questionFiles.length > 0);
});


// ========================================
// 各授業回の問題データをテスト
// ========================================

questionFiles.forEach((fileName) => {
  const filePath = path.join(
    pythonDataDirectory,
    fileName
  );

  const questions = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  // lesson02.json → 2
  const lessonNumber = Number(
    fileName.match(/^lesson(\d{2})\.json$/)[1]
  );


  // ----------------------------------------
  // 問題数
  // ----------------------------------------

  test(
    `Python第${lessonNumber}回の問題が20問ある`,
    () => {
      assert.equal(questions.length, 20);
    }
  );


  // ----------------------------------------
  // 問題データの形式
  // ----------------------------------------

  test(
    `Python第${lessonNumber}回の問題データが正しい形式になっている`,
    () => {
      questions.forEach((question) => {

        // ID
        assert.equal(
          typeof question.id,
          "string"
        );

        assert.ok(
          question.id.length > 0
        );


        // 科目
        assert.equal(
          question.subject,
          "python"
        );


        // 授業回
        assert.equal(
          question.lesson,
          lessonNumber
        );


        // 問題文
        assert.equal(
          typeof question.question,
          "string"
        );

        assert.ok(
          question.question.length > 0
        );


        // 選択肢
        assert.ok(
          Array.isArray(question.choices)
        );

        assert.equal(
          question.choices.length,
          4
        );

        question.choices.forEach((choice) => {
          assert.equal(
            typeof choice,
            "string"
          );

          assert.ok(
            choice.length > 0
          );
        });


        // 正解番号
        assert.ok(
          Number.isInteger(question.answer)
        );

        assert.ok(
          question.answer >= 0 &&
          question.answer < question.choices.length
        );


        // 解説
        assert.equal(
          typeof question.explanation,
          "string"
        );

        assert.ok(
          question.explanation.length > 0
        );
      });
    }
  );
});


// ========================================
// 問題IDの重複チェック
// ========================================

test("Pythonの問題IDに重複がない", () => {
  const allIds = [];

  questionFiles.forEach((fileName) => {
    const filePath = path.join(
      pythonDataDirectory,
      fileName
    );

    const questions = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    questions.forEach((question) => {
      allIds.push(question.id);
    });
  });

  const uniqueIds = new Set(allIds);

  assert.equal(
    uniqueIds.size,
    allIds.length
  );
});
