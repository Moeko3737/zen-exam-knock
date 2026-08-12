const test = require("node:test");
const assert = require("node:assert/strict");

const fs = require("node:fs");
const path = require("node:path");

/**
 * ========================================
 * パス設定
 * ========================================
 */

const DATA_ROOT = path.join(
  __dirname,
  "..",
  "src",
  "data"
);

/**
 * lesson01.json のような
 * 問題ファイルだけを対象にする
 */
const LESSON_FILE_PATTERN =
  /^lesson(\d{2})\.json$/;

/**
 * ========================================
 * 問題ファイル一覧を取得
 * ========================================
 */

function getQuestionFiles() {
  const subjectDirectories =
    fs
      .readdirSync(
        DATA_ROOT,
        {
          withFileTypes: true,
        }
      )
      .filter(
        (entry) =>
          entry.isDirectory()
      );

  const files = [];

  for (
    const subjectDirectory
    of subjectDirectories
  ) {
    const subjectName =
      subjectDirectory.name;

    const subjectPath =
      path.join(
        DATA_ROOT,
        subjectName
      );

    const lessonFiles =
      fs
        .readdirSync(subjectPath)
        .filter((fileName) =>
          LESSON_FILE_PATTERN.test(
            fileName
          )
        )
        .sort();

    for (
      const fileName
      of lessonFiles
    ) {
      files.push({
        subjectName,
        fileName,
        filePath: path.join(
          subjectPath,
          fileName
        ),
      });
    }
  }

  return files;
}

/**
 * ========================================
 * JSON読み込み
 * ========================================
 */

function loadQuestions(filePath) {
  const json =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  return JSON.parse(json);
}

/**
 * ========================================
 * 問題データ検証
 * ========================================
 */

test(
  "問題データファイルが1つ以上存在する",
  () => {
    const files =
      getQuestionFiles();

    assert.ok(
      files.length > 0,
      "問題データが見つかりません"
    );
  }
);

test(
  "すべての問題データが正しい形式になっている",
  () => {
    const files =
      getQuestionFiles();

    /*
     * 全科目共通で
     * ID重複をチェックするためのSet
     */
    const allQuestionIds =
      new Set();

    for (
      const file
      of files
    ) {
      const {
        subjectName,
        fileName,
        filePath,
      } = file;

      const match =
        fileName.match(
          LESSON_FILE_PATTERN
        );

      assert.ok(
        match,
        `${fileName} のファイル名が正しくありません`
      );

      const expectedLesson =
        Number(match[1]);

      const questions =
        loadQuestions(filePath);

      /**
       * ------------------------
       * 配列か
       * ------------------------
       */
      assert.ok(
        Array.isArray(questions),
        `${subjectName}/${fileName} は配列である必要があります`
      );

      /**
       * ------------------------
       * 最低20問あるか
       * ------------------------
       */
      assert.ok(
        questions.length >= 20,
        `${subjectName}/${fileName} は20問以上である必要があります`
      );

      /**
       * ------------------------
       * 各問題をチェック
       * ------------------------
       */
      questions.forEach(
        (question, index) => {
          const position =
            `${subjectName}/${fileName} の${index + 1}問目`;

          /**
           * ID
           */
          assert.equal(
            typeof question.id,
            "string",
            `${position}: id は文字列である必要があります`
          );

          assert.ok(
            question.id.trim()
              .length > 0,
            `${position}: id が空です`
          );

          /**
           * 全科目を通して
           * IDが重複していないか
           */
          assert.equal(
            allQuestionIds.has(
              question.id
            ),
            false,
            `問題ID「${question.id}」が重複しています`
          );

          allQuestionIds.add(
            question.id
          );

          /**
           * subject
           *
           * フォルダ名と一致するか
           */
          assert.equal(
            question.subject,
            subjectName,
            `${position}: subject は "${subjectName}" である必要があります`
          );

          /**
           * lesson
           *
           * ファイル名と一致するか
           */
          assert.equal(
            question.lesson,
            expectedLesson,
            `${position}: lesson は ${expectedLesson} である必要があります`
          );

          /**
           * question
           */
          assert.equal(
            typeof question.question,
            "string",
            `${position}: question は文字列である必要があります`
          );

          assert.ok(
            question.question.trim()
              .length > 0,
            `${position}: question が空です`
          );

          /**
           * choices
           */
          assert.ok(
            Array.isArray(
              question.choices
            ),
            `${position}: choices は配列である必要があります`
          );

          assert.equal(
            question.choices.length,
            4,
            `${position}: choices は4個必要です`
          );

          question.choices.forEach(
            (choice, choiceIndex) => {
              assert.equal(
                typeof choice,
                "string",
                `${position}: choices[${choiceIndex}] は文字列である必要があります`
              );

              assert.ok(
                choice.trim()
                  .length > 0,
                `${position}: choices[${choiceIndex}] が空です`
              );
            }
          );

          /**
           * 同じ選択肢が
           * 重複していないか
           */
          const uniqueChoices =
            new Set(
              question.choices
            );

          assert.equal(
            uniqueChoices.size,
            4,
            `${position}: 同じ選択肢が重複しています`
          );

          /**
           * answer
           */
          assert.ok(
            Number.isInteger(
              question.answer
            ),
            `${position}: answer は整数である必要があります`
          );

          assert.ok(
            question.answer >= 0 &&
              question.answer <= 3,
            `${position}: answer は0〜3である必要があります`
          );

          /**
           * explanation
           */
          assert.equal(
            typeof question.explanation,
            "string",
            `${position}: explanation は文字列である必要があります`
          );

          assert.ok(
            question.explanation.trim()
              .length > 0,
            `${position}: explanation が空です`
          );
        }
      );
    }
  }
);
