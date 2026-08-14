import {
  getMistakeIds,
  addMistake,
  removeMistake,
} from "./storage/mistakeStorage.js";


/* ========================================
科目設定
======================================== */

const SUBJECTS = {
  python: {
    name: "Pythonプログラミング",
    dataDir: "python",
    lessonCount: 15,
    idPattern: /^py(\d{2})-\d{3}$/,
  },

  webapp2: {
    name: "Webアプリケーション開発2",
    dataDir: "webapp2",
    lessonCount: 15,
    idPattern: /^webapp2-(\d{2})-\d{3}$/,
  },

  ethics: {
    name: "情報倫理と法",
    dataDir: "ethics",
    lessonCount: 15,
    idPattern: /^ethics(\d{2})-\d{3}$/,
  },
};


const MIX_QUESTION_COUNT = 20;

const KNOCK_QUESTION_COUNT = 100;


/* ========================================
DOM取得
======================================== */

const sections = {
  subject: document.querySelector("#subject-section"),
  mode: document.querySelector("#mode-section"),
  lesson: document.querySelector("#lesson-section"),
  quiz: document.querySelector("#quiz-section"),
  result: document.querySelector("#result-section"),
};


/* 科目選択 */

const subjectCards =
  document.querySelectorAll(".subject-card");


/* 学習方法 */

const selectedSubjectName =
  document.querySelector("#selected-subject-name");

const modeCards =
  document.querySelectorAll(".mode-card");


/* 授業回選択 */

const lessonSubjectName =
  document.querySelector("#lesson-subject-name");

const lessonList =
  document.querySelector("#lesson-list");


/* 問題画面 */

const quizSubjectName =
  document.querySelector("#quiz-subject-name");

const quizLessonName =
  document.querySelector("#quiz-lesson-name");

const quizQuestionSource =
  document.querySelector("#quiz-question-source");

const questionProgress =
  document.querySelector("#question-progress");

const questionText =
  document.querySelector("#quiz-heading");

const choiceList =
  document.querySelector("#choice-list");

const answerFeedback =
  document.querySelector("#answer-feedback");

const answerResult =
  document.querySelector("#answer-result");

const answerExplanation =
  document.querySelector("#answer-explanation");

const nextQuestionButton =
  document.querySelector("#next-question");


/* 結果 */

const resultSubjectName =
  document.querySelector("#result-subject-name");

const resultLessonName =
  document.querySelector("#result-lesson-name");

const resultHeading =
  document.querySelector("#result-heading");

const resultScore =
  document.querySelector("#result-score");

const resultRate =
  document.querySelector("#result-rate");

const retryQuizButton =
  document.querySelector("#retry-quiz");

const resultBackButton =
  document.querySelector("#result-to-lesson");


/* 戻る */

const backToSubjectButton =
  document.querySelector("#back-to-subject");

const backToModeButton =
  document.querySelector("#back-to-mode");

const backToLessonButton =
  document.querySelector("#back-to-lesson");


/* ========================================
クイズの状態
======================================== */

let currentSubjectKey = null;

let currentLesson = null;

let currentQuestions = [];

let currentQuestionIndex = 0;

let correctCount = 0;

let answered = false;

/*
 * lesson
 * mix
 * knock100
 * mistakes
 */
let quizMode = "lesson";


/* ========================================
共通関数
======================================== */

function getSubject(subjectKey) {
  return SUBJECTS[subjectKey] ?? null;
}


function navigate(hash) {
  location.hash = hash;
}


function padLessonNumber(lesson) {
  return String(lesson).padStart(2, "0");
}


/*
 * 指定したsectionだけ表示する
 */
function showSection(sectionName) {
  Object.values(sections).forEach((section) => {
    section.hidden = true;
  });

  sections[sectionName].hidden = false;

  window.scrollTo(0, 0);
}


function shuffleArray(items) {
  const shuffled = [...items];

  for (
    let i = shuffled.length - 1;
    i > 0;
    i -= 1
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}


function getQuestionSourceLabel(question) {
  const idMatch =
    question.id.match(/-(\d{3})$/);

  const questionNumber =
    idMatch
      ? Number(idMatch[1])
      : null;

  if (
    Number.isInteger(question.lesson) &&
    Number.isInteger(questionNumber)
  ) {
    return `第${question.lesson}回・第${questionNumber}問`;
  }

  if (Number.isInteger(question.lesson)) {
    return `第${question.lesson}回`;
  }

  return "";
}


/* ========================================
問題JSON読み込み
======================================== */

async function loadLessonQuestions(
  subjectKey,
  lesson
) {
  const subject = getSubject(subjectKey);

  if (!subject) {
    throw new Error(
      `存在しない科目です: ${subjectKey}`
    );
  }

  const lessonNumber =
    padLessonNumber(lesson);

  const filePath =
    `./src/data/${subject.dataDir}/lesson${lessonNumber}.json`;

  const response =
    await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `${filePath} を読み込めませんでした`
    );
  }

  const questions =
    await response.json();

  if (!Array.isArray(questions)) {
    throw new Error(
      `${filePath} の形式が正しくありません`
    );
  }

  return questions;
}


async function loadAllAvailableQuestions(
  subjectKey
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    return [];
  }

  const lessonNumbers =
    Array.from(
      { length: subject.lessonCount },
      (_, index) => index + 1
    );

  const results =
    await Promise.allSettled(
      lessonNumbers.map(
        (lesson) =>
          loadLessonQuestions(
            subjectKey,
            lesson
          )
      )
    );

  return results
    .filter(
      (result) =>
        result.status ===
        "fulfilled"
    )
    .flatMap(
      (result) =>
        result.value
    );
}


function selectMixQuestions(
  allQuestions,
  count
) {
  const questionsByLesson =
    new Map();

  allQuestions.forEach(
    (question) => {
      const lesson =
        question.lesson;

      if (!questionsByLesson.has(lesson)) {
        questionsByLesson.set(
          lesson,
          []
        );
      }

      questionsByLesson
        .get(lesson)
        .push(question);
    }
  );

  const lessonGroups =
    shuffleArray(
      Array.from(
        questionsByLesson.values()
      )
    );

  const selected =
    lessonGroups
      .slice(0, count)
      .map(
        (group) =>
          shuffleArray(group)[0]
      );

  const selectedIds =
    new Set(
      selected.map(
        (question) => question.id
      )
    );

  const remaining =
    shuffleArray(
      allQuestions.filter(
        (question) =>
          !selectedIds.has(
            question.id
          )
      )
    );

  selected.push(
    ...remaining.slice(
      0,
      Math.max(
        0,
        count - selected.length
      )
    )
  );

  return shuffleArray(selected);
}


function selectRandomQuestions(
  allQuestions,
  count
) {
  return shuffleArray(
    allQuestions
  ).slice(0, count);
}


/* ========================================
科目選択
======================================== */

function renderSubjectSelection() {
  currentSubjectKey = null;

  document.title =
    "ZEN Exam Knock";

  showSection("subject");
}


/* ========================================
学習方法選択
======================================== */

function renderModeSelection(subjectKey) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }

  currentSubjectKey =
    subjectKey;

  selectedSubjectName.textContent =
    subject.name;

  document.title =
    `${subject.name} | ZEN Exam Knock`;

  showSection("mode");
}


/* ========================================
授業回選択
======================================== */

function renderLessonSelection(
  subjectKey
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }

  currentSubjectKey =
    subjectKey;

  lessonSubjectName.textContent =
    subject.name;

  /*
   * 前回のボタンを消す
   */
  lessonList.replaceChildren();

  /*
   * 第1回〜第15回を生成
   */
  for (
    let lesson = 1;
    lesson <= subject.lessonCount;
    lesson += 1
  ) {
    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "lesson-card";

    button.textContent =
      `第${lesson}回`;

    button.addEventListener(
      "click",
      () => {
        navigate(
          `#/${subjectKey}/lesson/${lesson}`
        );
      }
    );

    lessonList.append(button);
  }

  showSection("lesson");
}


/* ========================================
通常クイズ開始
======================================== */

async function startLessonQuiz(
  subjectKey,
  lesson
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }

  currentSubjectKey =
    subjectKey;

  currentLesson =
    lesson;

  quizMode =
    "lesson";

  try {
    currentQuestions =
      await loadLessonQuestions(
        subjectKey,
        lesson
      );
  } catch (error) {
    console.error(error);

    alert(
      `${subject.name} 第${lesson}回の問題は、まだ登録されていない可能性があります。`
    );

    navigate(
      `#/${subjectKey}/lesson`
    );

    return;
  }

  currentQuestionIndex = 0;

  correctCount = 0;

  answered = false;

  renderQuestion();
}


/* ========================================
全範囲クイズ開始
======================================== */

async function startRangeQuiz(
  subjectKey,
  mode
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }

  if (
    mode !== "mix" &&
    mode !== "knock100"
  ) {
    renderNotFound();
    return;
  }

  currentSubjectKey =
    subjectKey;

  currentLesson =
    null;

  quizMode =
    mode;

  const allQuestions =
    await loadAllAvailableQuestions(
      subjectKey
    );

  if (allQuestions.length === 0) {
    alert(
      `${subject.name}の問題がまだ登録されていません。`
    );

    navigate(
      `#/${subjectKey}/mode`
    );

    return;
  }

  if (mode === "mix") {
    currentQuestions =
      selectMixQuestions(
        allQuestions,
        MIX_QUESTION_COUNT
      );
  } else {
    currentQuestions =
      selectRandomQuestions(
        allQuestions,
        KNOCK_QUESTION_COUNT
      );
  }

  currentQuestionIndex = 0;

  correctCount = 0;

  answered = false;

  renderQuestion();
}


/* ========================================
問題表示
======================================== */

function renderQuestion() {
  const subject =
    getSubject(currentSubjectKey);

  const question =
    currentQuestions[
      currentQuestionIndex
    ];

  if (!subject || !question) {
    renderNotFound();
    return;
  }

  answered = false;

  /*
   * 上部情報
   */

  quizSubjectName.textContent =
    subject.name;

  if (quizMode === "mistakes") {
    quizLessonName.textContent =
      "間違えた問題";
  } else if (quizMode === "mix") {
    quizLessonName.textContent =
      `全範囲MIX ${MIX_QUESTION_COUNT}問`;
  } else if (quizMode === "knock100") {
    quizLessonName.textContent =
      "100問ノック";
  } else {
    quizLessonName.textContent =
      `第${currentLesson}回`;
  }

  if (quizMode === "lesson") {
    quizQuestionSource.textContent =
      "";

    quizQuestionSource.hidden =
      true;
  } else {
    quizQuestionSource.textContent =
      getQuestionSourceLabel(
        question
      );

    quizQuestionSource.hidden =
      quizQuestionSource.textContent ===
      "";
  }

  questionProgress.textContent =
    `Q${currentQuestionIndex + 1} / ${currentQuestions.length}`;


  /*
   * 問題文
   */

  questionText.textContent =
    question.question;


  /*
   * 選択肢をリセット
   */

  choiceList.replaceChildren();


  /*
   * 選択肢を作成
   */

  question.choices.forEach(
    (choice, index) => {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "choice-button";

      button.textContent =
        choice;

      button.dataset.choice =
        index;

      button.addEventListener(
        "click",
        () => {
          checkAnswer(index);
        }
      );

      choiceList.append(button);
    }
  );


  /*
   * 前の問題の回答表示を消す
   */

  answerFeedback.hidden = true;

  answerResult.textContent = "";

  answerExplanation.textContent = "";

  nextQuestionButton.hidden = true;


  document.title =
    `${subject.name} ${quizLessonName.textContent} | ZEN Exam Knock`;

  showSection("quiz");
}


/* ========================================
答え合わせ
======================================== */

function checkAnswer(
  selectedAnswer
) {
  /*
   * 二重回答防止
   */
  if (answered) {
    return;
  }

  answered = true;

  const question =
    currentQuestions[
      currentQuestionIndex
    ];

  const choiceButtons =
    choiceList.querySelectorAll(
      ".choice-button"
    );

  const isCorrect =
    selectedAnswer ===
    question.answer;


  /*
   * 全ボタンを無効化
   */

  choiceButtons.forEach(
    (button, index) => {
      button.disabled = true;

      /*
       * 正解
       */
      if (
        index ===
        question.answer
      ) {
        button.classList.add(
          "is-correct"
        );

        button.setAttribute(
          "aria-label",
          `${button.textContent} 正解`
        );
      }

      /*
       * 選択した不正解
       */
      if (
        !isCorrect &&
        index === selectedAnswer
      ) {
        button.classList.add(
          "is-wrong"
        );

        button.setAttribute(
          "aria-label",
          `${button.textContent} 不正解`
        );
      }
    }
  );


  /*
   * 正解
   */

  if (isCorrect) {
    correctCount += 1;

    answerResult.textContent =
      "○ 正解！";

    /*
     * 間違えた問題モードでは
     * 正解した問題を復習対象から削除
     */
    if (
      quizMode ===
      "mistakes"
    ) {
      removeMistake(
        question.id
      );
    }
  }


  /*
   * 不正解
   */

  else {
    answerResult.textContent =
      "× 不正解";

    /*
     * 間違えた問題として保存
     */
    addMistake(
      question.id
    );
  }


  /*
   * 解説
   */

  answerExplanation.textContent =
    question.explanation;


  /*
   * 回答欄表示
   */

  answerFeedback.hidden =
    false;

  nextQuestionButton.hidden =
    false;
}


/* ========================================
次の問題
======================================== */

function goToNextQuestion() {
  currentQuestionIndex += 1;

  /*
   * 全問終了
   */

  if (
    currentQuestionIndex >=
    currentQuestions.length
  ) {
    if (
      quizMode ===
      "mistakes"
    ) {
      navigate(
        `#/${currentSubjectKey}/mistakes/result`
      );
    } else if (quizMode === "mix") {
      navigate(
        `#/${currentSubjectKey}/mix/result`
      );
    } else if (
      quizMode ===
      "knock100"
    ) {
      navigate(
        `#/${currentSubjectKey}/knock100/result`
      );
    } else {
      navigate(
        `#/${currentSubjectKey}/lesson/${currentLesson}/result`
      );
    }

    return;
  }


  /*
   * 次の問題
   */

  renderQuestion();
}


/* ========================================
通常クイズ結果
======================================== */

function renderLessonResult(
  subjectKey,
  lesson
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }


  /*
   * リロードなどで
   * クイズ状態がなくなった場合
   */

  if (
    currentQuestions.length === 0 ||
    currentSubjectKey !==
      subjectKey ||
    currentLesson !==
      lesson
  ) {
    alert(
      "結果データがありません。もう一度問題に挑戦してください。"
    );

    navigate(
      `#/${subjectKey}/lesson/${lesson}`
    );

    return;
  }


  quizMode =
    "lesson";


  const total =
    currentQuestions.length;

  const percentage =
    Math.round(
      (
        correctCount /
        total
      ) * 100
    );


  /*
   * 結果表示
   */

  resultSubjectName.textContent =
    subject.name;

  resultLessonName.textContent =
    `第${lesson}回`;

  resultHeading.textContent =
    "結果";

  resultScore.textContent =
    `${correctCount} / ${total}`;

  resultRate.textContent =
    `${percentage}%`;


  /*
   * ボタン
   */

  retryQuizButton.textContent =
    "もう一度挑戦";

  resultBackButton.textContent =
    "← 授業回選択に戻る";


  document.title =
    `結果 | ${subject.name} | ZEN Exam Knock`;

  showSection("result");
}


/* ========================================
全範囲クイズ結果
======================================== */

function renderRangeResult(
  subjectKey,
  mode
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }

  if (
    mode !== "mix" &&
    mode !== "knock100"
  ) {
    renderNotFound();
    return;
  }

  if (
    currentQuestions.length === 0 ||
    currentSubjectKey !== subjectKey ||
    quizMode !== mode
  ) {
    alert(
      "結果データがありません。もう一度問題に挑戦してください。"
    );

    navigate(
      `#/${subjectKey}/${mode}`
    );

    return;
  }

  const total =
    currentQuestions.length;

  const percentage =
    Math.round(
      (
        correctCount /
        total
      ) * 100
    );

  const modeName =
    mode === "mix"
      ? `全範囲MIX ${MIX_QUESTION_COUNT}問`
      : "100問ノック";

  resultSubjectName.textContent =
    subject.name;

  resultLessonName.textContent =
    modeName;

  resultHeading.textContent =
    "結果";

  resultScore.textContent =
    `${correctCount} / ${total}`;

  resultRate.textContent =
    `${percentage}%`;

  retryQuizButton.textContent =
    mode === "mix"
      ? "もう一度20問に挑戦"
      : "もう一度100問に挑戦";

  resultBackButton.textContent =
    "← 学習方法に戻る";

  document.title =
    `${modeName} 結果 | ${subject.name} | ZEN Exam Knock`;

  showSection("result");
}


/* ========================================
間違えた問題読み込み
======================================== */

async function loadMistakeQuestions(
  subjectKey
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    return [];
  }


  /*
   * 保存されている
   * 全間違いID
   */

  const allMistakeIds =
    getMistakeIds();


  /*
   * 現在の科目だけ抽出
   */

  const subjectMistakeIds =
    allMistakeIds.filter(
      (id) =>
        subject.idPattern.test(id)
    );


  if (
    subjectMistakeIds.length ===
    0
  ) {
    return [];
  }


  /*
   * IDから必要な授業回を取得
   */

  const lessonNumbers = [
    ...new Set(
      subjectMistakeIds
        .map((id) => {
          const match =
            id.match(
              subject.idPattern
            );

          if (!match) {
            return null;
          }

          return Number(
            match[1]
          );
        })
        .filter(
          (lesson) =>
            Number.isInteger(
              lesson
            )
        )
    ),
  ];


  /*
   * 必要なlessonだけ読み込む
   */

  const results =
    await Promise.allSettled(
      lessonNumbers.map(
        (lesson) =>
          loadLessonQuestions(
            subjectKey,
            lesson
          )
      )
    );


  /*
   * 読み込めた問題だけ取得
   */

  const allQuestions =
    results
      .filter(
        (result) =>
          result.status ===
          "fulfilled"
      )
      .flatMap(
        (result) =>
          result.value
      );


  const mistakeIdSet =
    new Set(
      subjectMistakeIds
    );


  /*
   * 間違えた問題だけ返す
   */

  return allQuestions.filter(
    (question) =>
      mistakeIdSet.has(
        question.id
      )
  );
}


/* ========================================
間違えた問題モード開始
======================================== */

async function startMistakeQuiz(
  subjectKey
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }


  currentSubjectKey =
    subjectKey;

  currentLesson =
    null;

  quizMode =
    "mistakes";


  const questions =
    await loadMistakeQuestions(
      subjectKey
    );


  /*
   * 間違い問題なし
   */

  if (
    questions.length === 0
  ) {
    alert(
      "現在、復習する問題はありません！🎉"
    );

    navigate(
      `#/${subjectKey}/mode`
    );

    return;
  }


  currentQuestions =
    questions;

  currentQuestionIndex =
    0;

  correctCount =
    0;

  answered =
    false;


  renderQuestion();
}


/* ========================================
間違えた問題 結果
======================================== */

function renderMistakeResult(
  subjectKey
) {
  const subject =
    getSubject(subjectKey);

  if (!subject) {
    renderNotFound();
    return;
  }


  /*
   * 結果データがない
   */

  if (
    currentQuestions.length ===
      0 ||
    currentSubjectKey !==
      subjectKey
  ) {
    navigate(
      `#/${subjectKey}/mistakes`
    );

    return;
  }


  quizMode =
    "mistakes";


  const total =
    currentQuestions.length;

  const percentage =
    Math.round(
      (
        correctCount /
        total
      ) * 100
    );


  /*
   * 表示
   */

  resultSubjectName.textContent =
    subject.name;

  resultLessonName.textContent =
    "間違えた問題";

  resultHeading.textContent =
    "復習結果";

  resultScore.textContent =
    `${correctCount} / ${total}`;

  resultRate.textContent =
    `${percentage}%`;


  /*
   * ボタン
   */

  retryQuizButton.textContent =
    "残った問題をもう一度";

  resultBackButton.textContent =
    "← 学習方法に戻る";


  document.title =
    `復習結果 | ${subject.name} | ZEN Exam Knock`;

  showSection("result");
}


/* ========================================
404
======================================== */

function renderNotFound() {
  alert(
    "ページが見つかりません。"
  );

  navigate("#/");
}


/* ========================================
ルーター
======================================== */

function router() {
  const hash =
    location.hash || "#/";

  const path =
    hash
      .replace(/^#\//, "")
      .replace(/\/$/, "");


  /*
   * トップ
   */

  if (path === "") {
    renderSubjectSelection();

    return;
  }


  const parts =
    path.split("/");

  const subjectKey =
    parts[0];

  const subject =
    getSubject(subjectKey);


  if (!subject) {
    renderNotFound();

    return;
  }


  /*
   * 学習方法
   *
   * #/python/mode
   */

  if (
    parts.length === 2 &&
    parts[1] === "mode"
  ) {
    renderModeSelection(
      subjectKey
    );

    return;
  }


  /*
   * 授業回選択
   *
   * #/python/lesson
   */

  if (
    parts.length === 2 &&
    parts[1] === "lesson"
  ) {
    renderLessonSelection(
      subjectKey
    );

    return;
  }


  /*
   * 問題
   *
   * #/python/lesson/1
   */

  if (
    parts.length === 3 &&
    parts[1] === "lesson"
  ) {
    const lesson =
      Number(parts[2]);

    if (
      !Number.isInteger(
        lesson
      ) ||
      lesson < 1 ||
      lesson >
        subject.lessonCount
    ) {
      renderNotFound();

      return;
    }

    startLessonQuiz(
      subjectKey,
      lesson
    );

    return;
  }


  /*
   * 通常結果
   *
   * #/python/lesson/1/result
   */

  if (
    parts.length === 4 &&
    parts[1] === "lesson" &&
    parts[3] === "result"
  ) {
    const lesson =
      Number(parts[2]);

    if (
      !Number.isInteger(
        lesson
      )
    ) {
      renderNotFound();

      return;
    }

    renderLessonResult(
      subjectKey,
      lesson
    );

    return;
  }


  /*
   * 全範囲MIX
   *
   * #/python/mix
   */

  if (
    parts.length === 2 &&
    parts[1] === "mix"
  ) {
    startRangeQuiz(
      subjectKey,
      "mix"
    );

    return;
  }


  /*
   * 全範囲MIX 結果
   *
   * #/python/mix/result
   */

  if (
    parts.length === 3 &&
    parts[1] === "mix" &&
    parts[2] === "result"
  ) {
    renderRangeResult(
      subjectKey,
      "mix"
    );

    return;
  }


  /*
   * 100問ノック
   *
   * #/python/knock100
   */

  if (
    parts.length === 2 &&
    parts[1] === "knock100"
  ) {
    startRangeQuiz(
      subjectKey,
      "knock100"
    );

    return;
  }


  /*
   * 100問ノック 結果
   *
   * #/python/knock100/result
   */

  if (
    parts.length === 3 &&
    parts[1] === "knock100" &&
    parts[2] === "result"
  ) {
    renderRangeResult(
      subjectKey,
      "knock100"
    );

    return;
  }


  /*
   * 間違えた問題
   *
   * #/python/mistakes
   */

  if (
    parts.length === 2 &&
    parts[1] === "mistakes"
  ) {
    startMistakeQuiz(
      subjectKey
    );

    return;
  }


  /*
   * 間違えた問題結果
   *
   * #/python/mistakes/result
   */

  if (
    parts.length === 3 &&
    parts[1] === "mistakes" &&
    parts[2] === "result"
  ) {
    renderMistakeResult(
      subjectKey
    );

    return;
  }


  renderNotFound();
}


/* ========================================
固定ボタンのイベント
======================================== */


/*
 * 科目カード
 */

subjectCards.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        const subjectKey =
          button.dataset.subject;

        navigate(
          `#/${subjectKey}/mode`
        );
      }
    );
  }
);


/*
 * 学習方法
 */

modeCards.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        if (!currentSubjectKey) {
          return;
        }

        const mode =
          button.dataset.mode;


        /*
         * 回指定
         */

        if (mode === "lesson") {
          navigate(
            `#/${currentSubjectKey}/lesson`
          );

          return;
        }


        /*
         * 間違い復習
         */

        if (
          mode ===
          "mistakes"
        ) {
          navigate(
            `#/${currentSubjectKey}/mistakes`
          );

          return;
        }


        /*
         * MIX
         */

        if (mode === "mix") {
          navigate(
            `#/${currentSubjectKey}/mix`
          );

          return;
        }


        /*
         * 100問
         */

        if (
          mode ===
          "knock100"
        ) {
          navigate(
            `#/${currentSubjectKey}/knock100`
          );
        }
      }
    );
  }
);


/*
 * 科目選択へ戻る
 */

backToSubjectButton.addEventListener(
  "click",
  () => {
    navigate("#/");
  }
);


/*
 * 学習方法へ戻る
 */

backToModeButton.addEventListener(
  "click",
  () => {
    if (!currentSubjectKey) {
      navigate("#/");
      return;
    }

    navigate(
      `#/${currentSubjectKey}/mode`
    );
  }
);


/*
 * 問題画面から戻る
 */

backToLessonButton.addEventListener(
  "click",
  () => {
    if (!currentSubjectKey) {
      navigate("#/");
      return;
    }

    if (
      quizMode === "mistakes" ||
      quizMode === "mix" ||
      quizMode === "knock100"
    ) {
      navigate(
        `#/${currentSubjectKey}/mode`
      );

      return;
    }

    navigate(
      `#/${currentSubjectKey}/lesson`
    );
  }
);


/*
 * 次の問題
 */

nextQuestionButton.addEventListener(
  "click",
  goToNextQuestion
);


/*
 * 結果：再挑戦
 */

retryQuizButton.addEventListener(
  "click",
  () => {
    if (!currentSubjectKey) {
      navigate("#/");
      return;
    }

    if (
      quizMode ===
      "mistakes"
    ) {
      navigate(
        `#/${currentSubjectKey}/mistakes`
      );

      return;
    }

    if (quizMode === "mix") {
      navigate(
        `#/${currentSubjectKey}/mix`
      );

      return;
    }

    if (
      quizMode ===
      "knock100"
    ) {
      navigate(
        `#/${currentSubjectKey}/knock100`
      );

      return;
    }

    navigate(
      `#/${currentSubjectKey}/lesson/${currentLesson}`
    );
  }
);


/*
 * 結果：戻る
 */

resultBackButton.addEventListener(
  "click",
  () => {
    if (!currentSubjectKey) {
      navigate("#/");
      return;
    }

    if (
      quizMode === "mistakes" ||
      quizMode === "mix" ||
      quizMode === "knock100"
    ) {
      navigate(
        `#/${currentSubjectKey}/mode`
      );

      return;
    }

    navigate(
      `#/${currentSubjectKey}/lesson`
    );
  }
);


/* ========================================
URL変更
======================================== */

window.addEventListener(
  "hashchange",
  router
);


/* ========================================
起動
======================================== */

router();
