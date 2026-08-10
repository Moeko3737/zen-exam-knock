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

const lessonList = document.querySelector(
  "#lesson-list"
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

const answerFeedback = document.querySelector(
  "#answer-feedback"
);

const answerResult = document.querySelector(
  "#answer-result"
);

const answerExplanation = document.querySelector(
  "#answer-explanation"
);


// ========================================
// 現在の状態
// ========================================

let selectedSubject = "";

let currentQuestions = [];

let currentQuestionIndex = 0;


// ========================================
// すべての画面を非表示
// ========================================

function hideAllSections() {
  subjectSection.hidden = true;
  modeSection.hidden = true;
  lessonSection.hidden = true;
  quizSection.hidden = true;
}


// ========================================
// 科目選択画面
// ========================================

function showSubjectSection() {
  hideAllSections();

  selectedSubject = "";

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

  // 前の正誤結果をリセット
  answerFeedback.hidden = true;
  answerResult.textContent = "";
  answerExplanation.textContent = "";

  questionProgress.textContent =
    `Q${currentQuestionIndex + 1} / ${currentQuestions.length}`;

  quizHeading.textContent = question.question;

  choiceList.replaceChildren();

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
  const question = currentQuestions[currentQuestionIndex];

  const isCorrect = selectedAnswer === question.answer;

  if (isCorrect) {
    answerResult.textContent = "○ 正解！";
  } else {
    answerResult.textContent = "× 不正解";
  }

  answerExplanation.textContent = question.explanation;

  answerFeedback.hidden = false;

  // 一度回答したら選択肢を押せないようにする
  const choiceButtons =
    document.querySelectorAll(".choice-button");

  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
}


// ========================================
// 問題画面
// ========================================

async function showQuizSection(subject, lesson) {
  const subjectData = SUBJECTS[subject];
  const lessonNumber = Number(lesson);

  // 科目または授業回が不正な場合
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

  quizSubjectName.textContent = subjectData.name;
  quizLessonName.textContent = `第${lessonNumber}回`;

  quizSection.hidden = false;

  try {
    currentQuestions = await loadQuestions(
      subject,
      lessonNumber
    );

    currentQuestionIndex = 0;

    displayQuestion();
  } catch (error) {
    console.error(error);

    quizHeading.textContent =
      "問題データを読み込めませんでした。";

    questionProgress.textContent = "";

    choiceList.replaceChildren();
  }
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

  // 問題画面
  if (page === "lesson" && lesson) {
    showQuizSection(subject, lesson);
    return;
  }

  // 該当ページがない場合
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
