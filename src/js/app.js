// ========================================
// 科目情報
// ========================================

const SUBJECTS = {
  python: {
    name: "Pythonプログラミング",
    dataDirectory: "python",
  },

  webapp2: {
    name: "Webアプリケーション開発2",
    dataDirectory: "webapp2",
  },
};

const TOTAL_LESSONS = 15;


// ========================================
// HTML要素の取得
// ========================================

const subjectSection = document.querySelector("#subject-section");
const modeSection = document.querySelector("#mode-section");
const lessonSection = document.querySelector("#lesson-section");
const quizSection = document.querySelector("#quiz-section");
const resultSection = document.querySelector("#result-section");

const subjectCards = document.querySelectorAll(".subject-card");
const modeCards = document.querySelectorAll(".mode-card");

const selectedSubjectName = document.querySelector(
  "#selected-subject-name"
);

const lessonSubjectName = document.querySelector(
  "#lesson-subject-name"
);

const quizSubjectName = document.querySelector(
  "#quiz-subject-name"
);

const quizLessonName = document.querySelector(
  "#quiz-lesson-name"
);

const questionProgress = document.querySelector(
  "#question-progress"
);

const quizHeading = document.querySelector(
  "#quiz-heading"
);

const choiceList = document.querySelector(
  "#choice-list"
);

const answerFeedback = document.querySelector(
  "#answer-feedback"
);

const answerResult = document.querySelector(
  "#answer-result"
);

const answerExplanation = document.querySelector(
  "#answer-explanation"
);

const lessonList = document.querySelector(
  "#lesson-list"
);

const nextQuestionButton = document.querySelector(
  "#next-question"
);

const backToSubjectButton = document.querySelector(
  "#back-to-subject"
);

const backToModeButton = document.querySelector(
  "#back-to-mode"
);

const backToLessonButton = document.querySelector(
  "#back-to-lesson"
);

const resultSubjectName = document.querySelector(
  "#result-subject-name"
);

const resultLessonName = document.querySelector(
  "#result-lesson-name"
);

const resultScore = document.querySelector(
  "#result-score"
);

const resultRate = document.querySelector(
  "#result-rate"
);

const retryQuizButton = document.querySelector(
  "#retry-quiz"
);

const resultToLessonButton = document.querySelector(
  "#result-to-lesson"
);


// ========================================
// 現在の状態
// ========================================

let selectedSubject = "";
let selectedLesson = null;

let currentQuestions = [];
let currentQuestionIndex = 0;

let correctAnswerCount = 0;
let hasAnsweredCurrentQuestion = false;


// ========================================
// すべての画面を非表示
// ========================================

function hideAllSections() {
  subjectSection.hidden = true;
  modeSection.hidden = true;
  lessonSection.hidden = true;
  quizSection.hidden = true;
  resultSection.hidden = true;
}


// ========================================
// 科目選択画面
// ========================================

function showSubjectSection() {
  hideAllSections();

  selectedSubject = "";
  selectedLesson = null;

  subjectSection.hidden = false;
}


// ========================================
// 学習モード選択画面
// ========================================

function showModeSection(subject) {
  const subjectData = SUBJECTS[subject];

  if (!subjectData) {
    location.hash = "#/";
    return;
  }

  hideAllSections();

  selectedSubject = subject;

  selectedSubjectName.textContent = subjectData.name;

  modeSection.hidden = false;
}


// ========================================
// 授業回選択画面
// ========================================

function showLessonSection(subject) {
  const subjectData = SUBJECTS[subject];

  if (!subjectData) {
    location.hash = "#/";
    return;
  }

  hideAllSections();

  selectedSubject = subject;
  selectedLesson = null;

  lessonSubjectName.textContent = subjectData.name;

  lessonSection.hidden = false;
}


// ========================================
// 問題データを読み込む
// ========================================

async function loadQuestions(subject, lesson) {
  const subjectData = SUBJECTS[subject];

  if (!subjectData) {
    throw new Error("指定された科目が存在しません。");
  }

  // 1 → 01、2 → 02 のように2桁にそろえる
  const lessonNumber = String(lesson).padStart(2, "0");

  const filePath =
    `./src/data/${subjectData.dataDirectory}/lesson${lessonNumber}.json`;

  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `問題データの読み込みに失敗しました: ${filePath}`
    );
  }

  return response.json();
}


// ========================================
// 問題を表示する
// ========================================

function displayQuestion() {
  const question = currentQuestions[currentQuestionIndex];

  if (!question) {
    return;
  }

  // 新しい問題なので未回答状態に戻す
  hasAnsweredCurrentQuestion = false;

  // 前の問題の結果をリセット
  answerFeedback.hidden = true;
  answerResult.textContent = "";
  answerExplanation.textContent = "";

  // 回答するまでは次へ進めない
  nextQuestionButton.hidden = true;

  // 現在の問題番号
  questionProgress.textContent =
    `Q${currentQuestionIndex + 1} / ${currentQuestions.length}`;

  // 問題文
  quizHeading.textContent = question.question;

  // 前の選択肢を削除
  choiceList.replaceChildren();

  // 選択肢を作成
  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "choice-button";
    button.dataset.choice = index;
    button.textContent = choice;

    button.addEventListener("click", () => {
      checkAnswer(index);
    });

    choiceList.appendChild(button);
  });
}


// ========================================
// 正誤判定
// ========================================

function checkAnswer(selectedAnswer) {
  // 同じ問題への二重回答を防ぐ
  if (hasAnsweredCurrentQuestion) {
    return;
  }

  hasAnsweredCurrentQuestion = true;

  const question = currentQuestions[currentQuestionIndex];

  const isCorrect = selectedAnswer === question.answer;

  if (isCorrect) {
    correctAnswerCount++;

    answerResult.textContent = "○ 正解！";
  } else {
    answerResult.textContent = "× 不正解";
  }

  // 解説
  answerExplanation.textContent = question.explanation;

  answerFeedback.hidden = false;

  // 回答後は選択肢を押せないようにする
  const choiceButtons =
    document.querySelectorAll(".choice-button");

  choiceButtons.forEach((button) => {
    button.disabled = true;
  });

  // 最終問題ではボタンの文言を変更
  const isLastQuestion =
    currentQuestionIndex === currentQuestions.length - 1;

  if (isLastQuestion) {
    nextQuestionButton.textContent = "結果を見る";
  } else {
    nextQuestionButton.textContent = "次の問題へ";
  }

  nextQuestionButton.hidden = false;
}


// ========================================
// 問題画面
// ========================================

async function showQuizSection(subject, lesson) {
  const subjectData = SUBJECTS[subject];
  const lessonNumber = Number(lesson);

  if (
    !subjectData ||
    !Number.isInteger(lessonNumber) ||
    lessonNumber < 1 ||
    lessonNumber > TOTAL_LESSONS
  ) {
    location.hash = "#/";
    return;
  }

  hideAllSections();

  selectedSubject = subject;
  selectedLesson = lessonNumber;

  quizSubjectName.textContent = subjectData.name;
  quizLessonName.textContent = `第${lessonNumber}回`;

  quizSection.hidden = false;

  try {
    // 問題データを読み込む
    currentQuestions = await loadQuestions(
      subject,
      lessonNumber
    );

    // クイズ状態を初期化
    currentQuestionIndex = 0;
    correctAnswerCount = 0;

    displayQuestion();

  } catch (error) {
    console.error(error);

    questionProgress.textContent = "";

    quizHeading.textContent =
      "問題データを読み込めませんでした。";

    choiceList.replaceChildren();

    answerFeedback.hidden = true;
    nextQuestionButton.hidden = true;
  }
}


// ========================================
// 結果画面
// ========================================

function showResultSection(subject, lesson) {
  const subjectData = SUBJECTS[subject];
  const lessonNumber = Number(lesson);

  // 結果を表示できる状態でなければ授業回選択へ戻す
  if (
    !subjectData ||
    !Number.isInteger(lessonNumber) ||
    currentQuestions.length === 0
  ) {
    location.hash = `#/${subject}/lesson`;
    return;
  }

  hideAllSections();

  selectedSubject = subject;
  selectedLesson = lessonNumber;

  const totalQuestions = currentQuestions.length;

  const correctRate = Math.round(
    (correctAnswerCount / totalQuestions) * 100
  );

  resultSubjectName.textContent = subjectData.name;
  resultLessonName.textContent = `第${lessonNumber}回`;

  resultScore.textContent =
    `${correctAnswerCount} / ${totalQuestions}`;

  resultRate.textContent =
    `${correctRate}%`;

  resultSection.hidden = false;
}


// ========================================
// URLに応じた画面切り替え
// ========================================

function router() {
  const hash = location.hash || "#/";

  // トップ
  if (hash === "#/" || hash === "#") {
    showSubjectSection();
    return;
  }

  const parts = hash
    .replace("#/", "")
    .split("/");

  const subject = parts[0];
  const page = parts[1];
  const lesson = parts[2];
  const subPage = parts[3];

  // 学習モード選択
  if (page === "mode") {
    showModeSection(subject);
    return;
  }

  // 授業回選択
  if (page === "lesson" && !lesson) {
    showLessonSection(subject);
    return;
  }

  // 結果画面
  if (
    page === "lesson" &&
    lesson &&
    subPage === "result"
  ) {
    showResultSection(subject, lesson);
    return;
  }

  // 問題画面
  if (page === "lesson" && lesson) {
    showQuizSection(subject, lesson);
    return;
  }

  location.hash = "#/";
}


// ========================================
// 科目選択
// ========================================

subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    const subject = card.dataset.subject;

    location.hash = `#/${subject}/mode`;
  });
});


// ========================================
// 学習モード選択
// ========================================

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    const mode = card.dataset.mode;

    // 回を指定して20問
    if (mode === "lesson") {
      location.hash =
        `#/${selectedSubject}/lesson`;

      return;
    }

    // その他のモードは後で実装
    console.log(
      `選択された学習モード: ${mode}`
    );
  });
});


// ========================================
// 授業回ボタンを作成
// ========================================

function createLessonButtons() {
  for (
    let lesson = 1;
    lesson <= TOTAL_LESSONS;
    lesson++
  ) {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "lesson-card";
    button.dataset.lesson = lesson;
    button.textContent = `第${lesson}回`;

    button.addEventListener("click", () => {
      location.hash =
        `#/${selectedSubject}/lesson/${lesson}`;
    });

    lessonList.appendChild(button);
  }
}

createLessonButtons();


// ========================================
// 次の問題へ
// ========================================

nextQuestionButton.addEventListener("click", () => {
  const isLastQuestion =
    currentQuestionIndex === currentQuestions.length - 1;

  // 最後の問題なら結果画面へ
  if (isLastQuestion) {
    location.hash =
      `#/${selectedSubject}/lesson/${selectedLesson}/result`;

    return;
  }

  currentQuestionIndex++;

  displayQuestion();
});


// ========================================
// 結果画面のボタン
// ========================================

// 同じ授業回にもう一度挑戦
retryQuizButton.addEventListener("click", () => {
  location.hash =
    `#/${selectedSubject}/lesson/${selectedLesson}`;
});


// 授業回選択へ戻る
resultToLessonButton.addEventListener("click", () => {
  location.hash =
    `#/${selectedSubject}/lesson`;
});


// ========================================
// 戻るボタン
// ========================================

// 学習モード → 科目
backToSubjectButton.addEventListener(
  "click",
  () => {
    location.hash = "#/";
  }
);


// 授業回 → 学習モード
backToModeButton.addEventListener(
  "click",
  () => {
    location.hash =
      `#/${selectedSubject}/mode`;
  }
);


// 問題 → 授業回
backToLessonButton.addEventListener(
  "click",
  () => {
    location.hash =
      `#/${selectedSubject}/lesson`;
  }
);


// ========================================
// ブラウザの戻る・進む
// ========================================

window.addEventListener(
  "hashchange",
  router
);


// ========================================
// 初回表示
// ========================================

router();
