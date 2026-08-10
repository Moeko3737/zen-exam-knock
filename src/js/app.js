// ========================================
// 要素の取得
// ========================================

const subjectCards = document.querySelectorAll(".subject-card");
const modeCards = document.querySelectorAll(".mode-card");

const subjectSection = document.querySelector("#subject-section");
const modeSection = document.querySelector("#mode-section");
const lessonSection = document.querySelector("#lesson-section");

const selectedSubjectName = document.querySelector("#selected-subject-name");
const lessonSubjectName = document.querySelector("#lesson-subject-name");

const backToSubjectButton = document.querySelector("#back-to-subject");
const backToModeButton = document.querySelector("#back-to-mode");

const lessonList = document.querySelector("#lesson-list");


// ========================================
// 設定
// ========================================

const TOTAL_LESSONS = 15;


// ========================================
// 選択状態
// ========================================

let selectedSubject = "";
let selectedSubjectDisplayName = "";
let selectedMode = "";


// ========================================
// 科目選択
// ========================================

subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedSubject = card.dataset.subject;
    selectedSubjectDisplayName = card.dataset.subjectName;

    // 選択した科目名を表示する
    selectedSubjectName.textContent = selectedSubjectDisplayName;

    // 科目選択から学習モード選択へ切り替える
    subjectSection.hidden = true;
    modeSection.hidden = false;
  });
});


// ========================================
// 学習モード選択
// ========================================

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedMode = card.dataset.mode;

    // 「回を指定して20問」が選ばれた場合
    if (selectedMode === "lesson") {
      lessonSubjectName.textContent = selectedSubjectDisplayName;

      modeSection.hidden = true;
      lessonSection.hidden = false;
    }
  });
});


// ========================================
// 授業回ボタンの生成
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
  modeSection.hidden = true;
  subjectSection.hidden = false;

  selectedSubject = "";
  selectedSubjectDisplayName = "";
  selectedMode = "";

  selectedSubjectName.textContent = "";
});

// 授業回選択 → 学習モード選択
backToModeButton.addEventListener("click", () => {
  lessonSection.hidden = true;
  modeSection.hidden = false;

  selectedMode = "";
});
