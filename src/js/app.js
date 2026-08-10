// ========================================
// 科目情報
// ========================================

const SUBJECTS = {
  python: {
    name: "Pythonプログラミング",
  },

  webapp2: {
    name: "Webアプリケーション開発2",
  },
};

const TOTAL_LESSONS = 15;


// ========================================
// HTML要素の取得
// ========================================

const subjectSection = document.querySelector("#subject-section");
const modeSection = document.querySelector("#mode-section");
const lessonSection = document.querySelector("#lesson-section");

const subjectCards = document.querySelectorAll(".subject-card");
const modeCards = document.querySelectorAll(".mode-card");

const selectedSubjectName = document.querySelector(
  "#selected-subject-name"
);

const lessonSubjectName = document.querySelector(
  "#lesson-subject-name"
);

const lessonList = document.querySelector("#lesson-list");

const backToSubjectButton = document.querySelector(
  "#back-to-subject"
);

const backToModeButton = document.querySelector(
  "#back-to-mode"
);


// ========================================
// 現在選択されている科目
// ========================================

let selectedSubject = "";


// ========================================
// すべての画面を非表示にする
// ========================================

function hideAllSections() {
  subjectSection.hidden = true;
  modeSection.hidden = true;
  lessonSection.hidden = true;
}


// ========================================
// 科目選択画面を表示
// ========================================

function showSubjectSection() {
  hideAllSections();

  selectedSubject = "";

  subjectSection.hidden = false;
}


// ========================================
// 学習モード選択画面を表示
// ========================================

function showModeSection(subject) {
  const subjectData = SUBJECTS[subject];

  // 存在しない科目が指定された場合はトップへ戻す
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
// 授業回選択画面を表示
// ========================================

function showLessonSection(subject) {
  const subjectData = SUBJECTS[subject];

  // 存在しない科目が指定された場合はトップへ戻す
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
// URLに応じて表示する画面を切り替える
// ========================================

function router() {
  const hash = location.hash || "#/";

  // トップページ
  if (hash === "#/" || hash === "#") {
    showSubjectSection();
    return;
  }

  // #/python/mode のようなURLを分解する
  const parts = hash.replace("#/", "").split("/");

  const subject = parts[0];
  const page = parts[1];

  // 学習モード選択
  if (page === "mode") {
    showModeSection(subject);
    return;
  }

  // 授業回選択
  if (page === "lesson") {
    showLessonSection(subject);
    return;
  }

  // 該当する画面がない場合はトップへ戻す
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

    // 回指定モード
    if (mode === "lesson") {
      location.hash = `#/${selectedSubject}/lesson`;
      return;
    }

    // その他のモードは後で実装する
    console.log(`選択された学習モード: ${mode}`);
  });
});


// ========================================
// 授業回ボタンを作成
// ========================================

function createLessonButtons() {
  for (let lesson = 1; lesson <= TOTAL_LESSONS; lesson++) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "lesson-card";
    button.dataset.lesson = lesson;
    button.textContent = `第${lesson}回`;

    button.addEventListener("click", () => {
      console.log(`選択された科目: ${selectedSubject}`);
      console.log(`選択された授業回: 第${lesson}回`);
    });

    lessonList.appendChild(button);
  }
}

createLessonButtons();


// ========================================
// 戻るボタン
// ========================================

// 学習モード選択 → 科目選択
backToSubjectButton.addEventListener("click", () => {
  location.hash = "#/";
});


// 授業回選択 → 学習モード選択
backToModeButton.addEventListener("click", () => {
  location.hash = `#/${selectedSubject}/mode`;
});


// ========================================
// ブラウザの戻る・進むへの対応
// ========================================

window.addEventListener("hashchange", router);


// ========================================
// ページを最初に開いたときの表示
// ========================================

router();
