// 科目選択に必要な要素を取得する
const subjectCards = document.querySelectorAll(".subject-card");
const subjectSection = document.querySelector("#subject-section");
const modeSection = document.querySelector("#mode-section");
const selectedSubjectName = document.querySelector("#selected-subject-name");

// 選択された科目を保存する
let selectedSubject = "";

// 各科目カードがクリックされたときの処理
subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedSubject = card.dataset.subject;
    const subjectName = card.dataset.subjectName;

    // 選択した科目名を表示する
    selectedSubjectName.textContent = subjectName;

    // 科目選択を非表示にする
    subjectSection.hidden = true;

    // 学習モード選択を表示する
    modeSection.hidden = false;
  });
});


// 科目選択モードに戻る
const backToSubjectButton = document.querySelector("#back-to-subject");

backToSubjectButton.addEventListener("click", () => {
  modeSection.hidden = true;
  subjectSection.hidden = false;

  selectedSubject = "";
  selectedSubjectName.textContent = "";
});
